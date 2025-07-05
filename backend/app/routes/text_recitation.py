from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.text_recitation import TextRecitation
from app.services.ocr_service import ocr_service
from app.services.recitation_service import calculate_similarity
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
        
        # 检查文件类型
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'}
        if not ('.' in image.filename and image.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': '不支持的图片格式，请上传 PNG、JPG、JPEG、GIF、BMP、WebP 或 TIFF 格式的图片'}), 400
        
        # 识别文字
        try:
            ocr_result = ocr_service.recognize_text(image)
            logger.info(f"OCR原始结果: {type(ocr_result)} - {ocr_result}")
            
            # 处理不同格式的OCR返回值
            if isinstance(ocr_result, dict):
                # 如果返回字典格式（如阿里云OCR API）
                content = ocr_result.get('text', '') or ocr_result.get('content', '')
            elif isinstance(ocr_result, list):
                # 如果返回列表格式
                content = ' '.join(str(item) for item in ocr_result)
            elif isinstance(ocr_result, str):
                # 如果返回字符串格式
                content = ocr_result
                # 尝试解析JSON格式的字符串
                try:
                    import json
                    parsed = json.loads(ocr_result)
                    if isinstance(parsed, dict):
                        content = parsed.get('text', '') or parsed.get('content', '') or ocr_result
                except (json.JSONDecodeError, ValueError):
                    # 如果不是JSON格式，检查是否是字典格式的字符串
                    if ocr_result.startswith("{") and "'text':" in ocr_result:
                        # 尝试提取text字段的内容
                        try:
                            # 找到'text': '的位置
                            text_start = ocr_result.find("'text': '")
                            if text_start != -1:
                                # 找到内容开始位置
                                content_start = text_start + len("'text': '")
                                # 找到结束的单引号位置，从后往前找
                                content_end = ocr_result.rfind("'")
                                if content_end > content_start:
                                    content = ocr_result[content_start:content_end]
                                else:
                                    content = ocr_result
                            else:
                                content = ocr_result
                        except:
                            content = ocr_result
                    else:
                        content = ocr_result
            else:
                # 其他格式，转为字符串
                content = str(ocr_result) if ocr_result else ""
            
            # 确保content是字符串并检查是否为空
            content = str(content).strip()
            
            # 去掉所有换行符，替换为空格，然后去掉多余的空格
            if content:
                content = content.replace('\\n', ' ').replace('\n', ' ').replace('\r', ' ')
                # 去掉多余的空格
                content = ' '.join(content.split())
            
            logger.info(f"处理后的内容: {content}")
            
            if not content:
                content = "未能识别到文字内容，请重新上传图片"
                
        except Exception as ocr_error:
            logger.error(f"OCR识别失败: {str(ocr_error)}")
            content = f"文字识别失败: {str(ocr_error)}"
        
        # 保存到数据库
        text_recitation = TextRecitation(
            user_id=user_id,
            content=content
        )
        db.session.add(text_recitation)
        db.session.commit()
        
        return jsonify(text_recitation.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"创建文本朗诵记录失败: {str(e)}")
        response = jsonify({'error': str(e)})
        response.status_code = 500
        # 确保错误响应也包含CORS头部
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

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
            
            # 3. 计算相似度和评分
            similarity = calculate_similarity(text.content, recited_text)
            score = int(similarity * 100)
            logger.info(f"相似度: {similarity}, 得分: {score}")
            
            # 如果得分为0，但识别到了内容，给出提示
            if score == 0 and recited_text not in ["未能识别到语音内容", "语音识别失败，无法获取识别结果"]:
                logger.info(f"得分为0但识别到内容，可能是内容不匹配")
            
            return jsonify({
                'recited_text': recited_text,
                'original_text': text.content,
                'score': score,
                'similarity': similarity
            }), 200
        except Exception as e:
            logger.error(f"语音识别或评分过程中发生错误: {str(e)}", exc_info=True)
            return jsonify({
                'error': '语音识别失败',
                'recited_text': '语音识别过程中发生错误',
                'original_text': text.content,
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
            
        # 获取所有背诵记录
        practices = Practice.query.filter_by(
            user_id=user_id,
            text_id=id,
            practice_type='text_recitation'
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

# 添加健康检查端点
@bp.route('/api/text-recitation/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'ok',
        'message': '课文背诵服务运行正常',
        'ocr_available': bool(os.environ.get('DASHSCOPE_API_KEY')),
        'upload_limit': '1MB'
    }), 200 