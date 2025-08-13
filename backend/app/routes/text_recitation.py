from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.text_recitation import TextRecitation
from app.services.ocr_service import ocr_service
from app.services.recitation_service import calculate_similarity, recitation_analysis_service
from app.services.speech_service import speech_service
from app import db
import tempfile
import os
import logging
import wave
from app.models.practice import Practice
import oss2
import uuid
import json
import re
from datetime import datetime
import threading

logger = logging.getLogger(__name__)

bp = Blueprint('text_recitation', __name__)

# OSS配置（建议用环境变量管理）
OSS_ACCESS_KEY_ID = os.environ.get('OSS_ACCESS_KEY_ID', '你的AccessKeyId')
OSS_ACCESS_KEY_SECRET = os.environ.get('OSS_ACCESS_KEY_SECRET', '你的AccessKeySecret')
OSS_BUCKET_NAME = os.environ.get('OSS_BUCKET_NAME', '你的Bucket名称')
OSS_ENDPOINT = os.environ.get('OSS_ENDPOINT', 'https://oss-cn-shanghai.aliyuncs.com')

def is_valid_wav_file(file_path):
    """检查文件是否为有效的WAV格式"""
    try:
        with wave.open(file_path, 'rb') as wf:
            # 检查基本参数
            if wf.getnchannels() != 1:
                return False, "音频必须是单声道"
            if wf.getsampwidth() != 2:
                return False, "采样宽度必须是16位"
            if wf.getcomptype() != "NONE":
                return False, "必须是PCM编码"
            return True, None
    except wave.Error as e:
        return False, f"不是有效的WAV文件: {str(e)}"
    except Exception as e:
        return False, f"检查WAV文件时出错: {str(e)}"

def upload_to_oss(local_file_path):
    oss_file_name = f"audio/{uuid.uuid4().hex}.wav"
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)
    with open(local_file_path, 'rb') as fileobj:
        bucket.put_object(oss_file_name, fileobj)
    return f"https://{OSS_BUCKET_NAME}.oss-cn-shanghai.aliyuncs.com/{oss_file_name}"


def _clean_text_content(raw: str) -> str:
    """清理课文/识别文本中的特殊符号和注音，保留中英文与常用标点。
    - 去除半角/全角括号中的注音或说明，如 (di)、（yi）
    - 去除不常见控制字符
    - 规范空白
    """
    if not raw:
        return ''
    text = str(raw)
    # 去除括号内的内容（常见为拼音或注释），长度限制避免误删整段
    text = re.sub(r"\([^)]{1,12}\)", "", text)
    text = re.sub(r"（[^）]{1,12}）", "", text)
    # 去除不可见控制字符
    text = re.sub(r"[\u0000-\u001F\u007F]", "", text)
    # 统一换行与空白
    text = text.replace('\r', ' ').replace('\n', ' ')
    text = re.sub(r"\s+", " ", text).strip()
    return text

@bp.route('/api/text-recitation', methods=['POST'])
@jwt_required()
def create_text_recitation():
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
            
        image = request.files['image']
        user_id = get_jwt_identity()
        
        # 检查图片文件
        if image.filename == '':
            return jsonify({'error': '没有选择图片文件'}), 400
        
        # 识别文字
        try:
            ocr_result = ocr_service.recognize_text(image)
            logger.info(f"OCR原始结果: {type(ocr_result)} - {ocr_result}")
            
            # 更健壮的OCR结果处理，兼容字符串化的字典
            if isinstance(ocr_result, str):
                # 尝试解析为字典
                try:
                    parsed = json.loads(ocr_result.replace("'", '"'))
                    if isinstance(parsed, dict):
                        content = parsed.get('text', '') or parsed.get('content', '')
                    else:
                        content = ocr_result
                except Exception:
                    content = ocr_result
            elif isinstance(ocr_result, dict):
                content = ocr_result.get('text', '') or ocr_result.get('content', '')
            elif isinstance(ocr_result, list):
                content = ' '.join(str(item) for item in ocr_result)
            else:
                content = ""
            # 确保content是字符串并清理格式 + 去特殊符号/注音
            content = _clean_text_content(str(content))
            
            logger.info(f"处理后的内容: {content}")
            
            if not content:
                content = "未能识别到文字内容，请重新上传图片"
                
        except Exception as ocr_error:
            logger.error(f"OCR识别失败: {str(ocr_error)}")
            # 即使OCR失败，也创建一个包含错误信息的记录
            content = f"Simulated text content (OCR temporarily unavailable): Spring has arrived, and everything is coming back to life. The grass is sprouting from the soil, tender and green. Peach blossoms are blushing, and willow trees are swaying their long green braids. Please note: This is simulated content, actual recognition requires OCR service configuration."
        
        # 预计算分段并缓存
        # 先保存文本，分段放到后台线程处理，避免上传阻塞超时
        text_recitation = TextRecitation(
            user_id=user_id,
            content=content,
            segments_cache=None,
            segment_count=0,
            segments_cached_at=None
        )
        db.session.add(text_recitation)
        db.session.commit()

        # 启动后台线程预计算分段并写回缓存
        try:
            app_obj = current_app._get_current_object()

            def _segment_and_update(text_id: int, text_content: str):
                try:
                    segments_local = recitation_analysis_service.segment_text(text_content)
                    with app_obj.app_context():
                        tr = TextRecitation.query.get(text_id)
                        if tr:
                            tr.segments_cache = segments_local
                            tr.segment_count = len(segments_local) if segments_local else 0
                            tr.segments_cached_at = datetime.utcnow()
                            db.session.commit()
                except Exception:
                    with app_obj.app_context():
                        tr = TextRecitation.query.get(text_id)
                        if tr:
                            tr.segments_cache = tr.segments_cache or []
                            tr.segment_count = len(tr.segments_cache)
                            tr.segments_cached_at = datetime.utcnow()
                            db.session.commit()

            threading.Thread(
                target=_segment_and_update,
                args=(text_recitation.id, content),
                daemon=True
            ).start()
        except Exception as e:
            logger.warning(f"启动后台分段线程失败: {e}")
        
        data = text_recitation.to_dict()
        data.update({"segmentationStatus": "processing"})
        return jsonify(data), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建文本朗诵记录失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/text-recitation', methods=['GET'])
@jwt_required()
def get_text_recitations():
    try:
        user_id = get_jwt_identity()
        texts = TextRecitation.query.filter_by(user_id=user_id).order_by(TextRecitation.create_time.desc()).all()
        return jsonify([text.to_dict() for text in texts]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/text-recitation/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_text_recitation(id):
    try:
        user_id = get_jwt_identity()
        text = TextRecitation.query.filter_by(id=id, user_id=user_id).first()
        
        if not text:
            return jsonify({'error': '课文不存在'}), 404
            
        db.session.delete(text)
        db.session.commit()
        
        return jsonify({'message': '删除成功'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/text-recitation/<int:id>', methods=['PUT'])
@jwt_required()
def update_text_recitation(id):
    try:
        user_id = get_jwt_identity()
        text = TextRecitation.query.filter_by(id=id, user_id=user_id).first()
        
        if not text:
            return jsonify({'error': '课文不存在'}), 404
            
        content = request.json.get('content')
        if not content:
            return jsonify({'error': '内容不能为空'}), 400
            
        text.content = content
        db.session.commit()
        
        return jsonify(text.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/text-recitation/<int:id>/recite', methods=['POST'])
@jwt_required()
def recite_text(id):
    try:
        logger.info(f"开始处理朗诵请求，ID: {id}")
        user_id = get_jwt_identity()
        logger.info(f"用户ID: {user_id}")
        text = TextRecitation.query.filter_by(id=id, user_id=user_id).first()
        if not text:
            logger.error(f"未找到ID为 {id} 的文本朗诵记录")
            return jsonify({'error': '课文不存在'}), 404
        if 'audio' not in request.files:
            logger.error("请求中没有音频文件")
            return jsonify({'error': '没有上传音频'}), 400
        audio_file = request.files['audio']
        logger.info(f"收到音频文件: {audio_file.filename}")
        if not audio_file.filename.lower().endswith('.wav'):
            logger.error("文件不是WAV格式")
            return jsonify({'error': '请上传WAV格式的音频文件'}), 400
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, 'temp.wav')
        audio_file.save(temp_path)
        logger.info(f"音频文件已保存到: {temp_path}")
        is_valid, error_msg = is_valid_wav_file(temp_path)
        if not is_valid:
            logger.error(f"音频文件验证失败: {error_msg}")
            return jsonify({'error': error_msg}), 400
        try:
            # 直接本地识别
            recited_text = speech_service.recognize(temp_path)
            logger.info(f"识别结果: {recited_text}")
            
            # 确保识别结果不为None
            if recited_text is None:
                recited_text = "语音识别失败，无法获取识别结果"
                logger.warning("语音识别返回None")
            
            # 检查识别结果是否为空或无效
            if not recited_text or recited_text.strip() == "":
                recited_text = "未能识别到语音内容"
                logger.warning("语音识别返回空字符串")
            
            logger.info(f"最终识别文本: {recited_text}")
            logger.info(f"原文内容: {text.content}")
            
            # 清理特殊符号后再评分，避免注音/括号影响
            original_clean = _clean_text_content(text.content)
            recited_clean = _clean_text_content(recited_text)
            # 3. 计算相似度和评分
            similarity = calculate_similarity(original_clean, recited_clean)
            score = int(similarity * 100)
            logger.info(f"相似度: {similarity}, 得分: {score}")

            # 记录一次背诵练习到历史（用于成绩统计）
            try:
                practice = Practice(
                    user_id=user_id,
                    practice_type='text_recitation',
                    score=float(score),
                    mistakes={
                        'recitation_id': id,
                        'similarity': similarity
                    },
                    text_id=None,  # 避免与 texts 表的外键冲突
                    text_recitation_id=id
                )
                db.session.add(practice)
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f"保存背诵成绩历史失败（不影响前端显示）：{e}")
            
            # 如果得分为0，但识别到了内容，给出提示
            if score == 0 and recited_text not in ["未能识别到语音内容", "语音识别失败，无法获取识别结果"]:
                logger.info(f"得分为0但识别到内容，可能是内容不匹配")
            
            return jsonify({
                'recited_text': recited_clean,
                'original_text': original_clean,
                'score': score,
                'similarity': similarity
            }), 200
        except Exception as e:
            logger.error(f"语音识别或评分过程中发生错误: {str(e)}", exc_info=True)
            return jsonify({
                'error': '语音识别失败',
                'recited_text': '语音识别过程中发生错误',
                'original_text': _clean_text_content(text.content),
                'score': 0,
                'similarity': 0.0
            }), 200
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            if os.path.exists(temp_dir):
                os.rmdir(temp_dir)
            logger.info("临时文件已清理")
    except Exception as e:
        logger.error(f"处理朗诵请求时发生错误: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/api/text-recitation/<int:id>/scores', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_recitation_scores(id):
    """获取课文背诵的成绩历史"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        user_id = get_jwt_identity()
        text = TextRecitation.query.filter_by(id=id, user_id=user_id).first()
        
        if not text:
            return jsonify({'error': '课文不存在'}), 404
            
        # 获取该课文（text_recitation_id 维度）的所有背诵记录
        practices = Practice.query.filter_by(
            user_id=user_id,
            practice_type='text_recitation',
            text_recitation_id=id
        ).order_by(Practice.created_at.desc()).all()
        
        if not practices:
            return jsonify({
                'current_score': None,
                'best_score': None,
                'history': []
            })
            
        # 获取当前成绩和最好成绩
        current_score = practices[0].score if practices else None
        best_score = max(p.score for p in practices)
        
        # 格式化历史记录
        history = [{
            'score': p.score,
            'date': p.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for p in practices]
        
        return jsonify({
            'current_score': current_score,
            'best_score': best_score,
            'history': history
        })
    except Exception as e:
        logger.error(f"获取背诵成绩历史失败: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@bp.route('/api/text-recitation/<int:id>/analyze', methods=['POST'])
@jwt_required()
def analyze_recitation(id):
    """智能分析背诵并生成个性化评价"""
    try:
        user_id = get_jwt_identity()
        text = TextRecitation.query.filter_by(id=id, user_id=user_id).first()
        
        if not text:
            return jsonify({'error': '课文不存在'}), 404
        
        # 检查请求数据
        data = request.get_json()
        if not data or 'recited_text' not in data:
            return jsonify({'error': '缺少背诵文本'}), 400
        
        recited_text = data['recited_text']
        if not recited_text or not recited_text.strip():
            return jsonify({'error': '背诵文本不能为空'}), 400
        
        logger.info(f"开始智能分析背诵，课文ID: {id}")
        
        # 获取用户家长音色风格（如果存在）
        # 由于我们还没有实现音色功能，暂时传入None
        user_voice_style = None
        
        # 取缓存的分段，确保与“查看分段”一致
        preset_segments = text.segments_cache if hasattr(text, 'segments_cache') else None

        # 调用智能分析服务（传入预分段）
        analysis_result = recitation_analysis_service.analyze_recitation(
            original_text=text.content,
            recited_text=recited_text,
            user_voice_style=user_voice_style,
            preset_segments=preset_segments
        )
        
        # 可以选择保存分析结果到数据库
        # 这里暂时只返回结果，稍后可以添加数据库保存逻辑
        
        logger.info(f"智能分析完成，得分: {analysis_result['score']}")
        
        return jsonify({
            'analysis': analysis_result,
            'text_id': id,
            'original_text': text.content,
            'analyzed_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"智能分析背诵失败: {str(e)}", exc_info=True)
        return jsonify({'error': f'分析失败: {str(e)}'}), 500

@bp.route('/api/text-recitation/<int:id>/segments', methods=['GET'])
@jwt_required()
def get_text_segments(id):
    """获取课文分段信息"""
    try:
        user_id = get_jwt_identity()
        text = TextRecitation.query.filter_by(id=id, user_id=user_id).first()
        
        if not text:
            return jsonify({'error': '课文不存在'}), 404
        
        logger.info(f"获取课文分段，课文ID: {id}")
        
        # 优先返回缓存
        segments = text.segments_cache
        if not segments:
            segments = recitation_analysis_service.segment_text(text.content)
            # 异步/延后更新缓存：此处直接写入，保证后续更快
            try:
                text.segments_cache = segments
                text.segment_count = len(segments) if segments else 0
                text.segments_cached_at = datetime.utcnow()
                db.session.commit()
            except Exception as _:
                db.session.rollback()
        
        logger.info(f"课文分段完成，共{len(segments)}段")
        
        return jsonify({
            'text_id': id,
            'original_text': text.content,
            'segments': segments,
            'segment_count': len(segments),
            'generated_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"获取课文分段失败: {str(e)}", exc_info=True)
        return jsonify({'error': f'分段失败: {str(e)}'}), 500 