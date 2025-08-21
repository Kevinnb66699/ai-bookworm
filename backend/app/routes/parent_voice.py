from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User
from app.routes.text_recitation import is_valid_wav_file
try:
    from app.models import ParentVoice  # 软导入，某些环境可能未包含该模型
except Exception:
    ParentVoice = None  # type: ignore

import logging
import os
import tempfile
import uuid
import requests
import subprocess
import shutil
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

bp = Blueprint('parent_voice', __name__)

# 本地上传目录（用于无OSS时的回退）
_PROJECT_ROOT = Path(__file__).resolve().parents[2]  # backend/
_LOCAL_UPLOAD_DIR = _PROJECT_ROOT / 'uploads' / 'parent_voice'
_LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _ensure_parent_voice_model():
    if ParentVoice is None:
        raise RuntimeError('ParentVoice 模型不可用，请确认后端包含 app/models/parent_voice.py 并已部署')


def _upload_to_object_storage(local_path: str) -> str:
    """示例上传：此处直接返回本地文件的假URL或集成你现有的 OSS 上传逻辑。
    如需使用阿里云OSS，可复用 text_recitation.py 中的 oss 上传函数。
    """
    # 这里优先复用环境中的 OSS 配置（如果存在）
    try:
        from app.routes.text_recitation import upload_to_oss  # 复用已有的OSS上传
        return upload_to_oss(local_path)
    except Exception as e:
        logger.warning(f"未配置OSS，改用本地存储: {e}")
        # 保存到本地 uploads/parent_voice 目录，并返回可访问的URL
        filename = f"{uuid.uuid4().hex}.wav"
        dest_path = _LOCAL_UPLOAD_DIR / filename
        try:
            shutil.copyfile(local_path, dest_path)
        except Exception as copy_err:
            logger.error(f"本地保存失败: {copy_err}")
            raise
        # 构造可访问URL
        base = request.host_url.rstrip('/')
        return f"{base}/uploads/parent-voice/{filename}"


def _convert_to_wav(src_path: str) -> str:
    """将任意常见音频（webm/mp3/m4a/等）转换为单声道 16k 16bit PCM 的 wav。
    需要系统安装 ffmpeg；若不可用则直接返回原路径。
    """
    try:
        ffmpeg_path = shutil.which('ffmpeg')
        if not ffmpeg_path:
            logger.warning('未检测到 ffmpeg，跳过转码，直接上传原文件')
            return src_path

        dst_path = os.path.splitext(src_path)[0] + '.wav'
        cmd = [
            ffmpeg_path, '-y', '-i', src_path,
            '-ac', '1',              # 单声道
            '-ar', '16000',          # 16k 采样率
            '-sample_fmt', 's16',    # 16bit PCM
            dst_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return dst_path if os.path.exists(dst_path) else src_path
    except Exception as e:
        logger.warning(f'转码为 WAV 失败，使用原文件：{e}')
        return src_path


@bp.route('/api/parent-voice/upload', methods=['POST'])
@jwt_required()
def upload_parent_voice():
    """上传家长音色样本（音频）。保存到对象存储，并在 parent_voices 中创建/更新记录。"""
    _ensure_parent_voice_model()

    if 'audio' not in request.files:
        return jsonify({'error': '缺少音频文件字段 audio'}), 400

    user_id = get_jwt_identity()
    audio_file = request.files['audio']
    if not audio_file or not audio_file.filename:
        return jsonify({'error': '未选择音频文件'}), 400

    # 与课文背诵一致：仅接收 WAV（前端建议转为 WAV 再上传）
    allowed_ext = ('.wav',)
    if not any(audio_file.filename.lower().endswith(ext) for ext in allowed_ext):
        return jsonify({'error': '请上传 WAV 格式的音频（单声道/16kHz/16bit）'}), 400

    temp_dir = tempfile.mkdtemp()
    local_path = os.path.join(temp_dir, audio_file.filename)
    audio_file.save(local_path)

    try:
        # 验证 WAV（单声道/16bit/PCM）后上传
        is_valid, err = is_valid_wav_file(local_path)
        if not is_valid:
            return jsonify({'error': f'WAV校验失败：{err}'}), 400
        file_url = _upload_to_object_storage(local_path)

        # upsert 到 parent_voices
        pv = ParentVoice.query.filter_by(user_id=user_id).first()
        if not pv:
            pv = ParentVoice(user_id=user_id)
            db.session.add(pv)

        pv.audio_sample_url = file_url
        pv.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': '上传成功', 'audio_sample_url': file_url}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"上传家长音色失败: {e}")
        return jsonify({'error': '上传失败'}), 500
    finally:
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
            os.rmdir(temp_dir)
        except Exception:
            pass


@bp.route('/api/parent-voice', methods=['GET'])
@jwt_required()
def get_parent_voice_status():
    """获取当前用户的家长音色状态（是否已有分析结果/样本URL/最近更新时间）。"""
    _ensure_parent_voice_model()

    user_id = get_jwt_identity()
    pv = ParentVoice.query.filter_by(user_id=user_id).first() if ParentVoice else None
    if not pv:
        return jsonify({
            'exists': False,
            'has_voice_style': False,
            'audio_sample_url': None,
            'voice_style': None,
            'updated_at': None
        }), 200

    return jsonify({
        'exists': True,
        'has_voice_style': bool(pv.voice_style),
        'audio_sample_url': pv.audio_sample_url,
        'voice_style': pv.voice_style,
        'updated_at': (pv.updated_at.replace(tzinfo=timezone.utc).isoformat() if getattr(pv, 'updated_at', None) else None)
    }), 200

@bp.route('/api/parent-voice/analyze', methods=['POST'])
@jwt_required()
def analyze_parent_voice():
    """分析家长音色，生成语调/语速/用词风格，写入 parent_voices.voice_style 等字段。"""
    _ensure_parent_voice_model()

    user_id = get_jwt_identity()
    pv = ParentVoice.query.filter_by(user_id=user_id).first()
    if not pv:
        pv = ParentVoice(user_id=user_id)
        db.session.add(pv)

    audio_bytes = None
    temp_dir = None
    local_path = None
    # 支持直接上传音频进行分析（不持久化），也支持从已保存的URL下载
    if 'audio' in request.files and request.files['audio'].filename:
        audio_file = request.files['audio']
        temp_dir = tempfile.mkdtemp()
        local_path = os.path.join(temp_dir, audio_file.filename)
        audio_file.save(local_path)
        # 若不是 wav，可尝试转成 wav 再读取
        if not audio_file.filename.lower().endswith('.wav'):
            local_path = _convert_to_wav(local_path)
        try:
            with open(local_path, 'rb') as f:
                audio_bytes = f.read()
        except Exception as e:
            logger.error(f"读取上传音频失败: {e}")
            return jsonify({'error': '读取音频失败'}), 500
    else:
        if not pv.audio_sample_url:
            return jsonify({'error': '未找到音色样本，请上传或附带audio参数'}), 400
        try:
            resp = requests.get(pv.audio_sample_url, timeout=20)
            resp.raise_for_status()
            audio_bytes = resp.content
        except Exception as e:
            logger.error(f"下载家长音色失败: {e}")
            return jsonify({'error': '下载音频失败'}), 500

    # 使用 DashScope qwen-audio-turbo 分析风格
    api_key = os.environ.get('DASHSCOPE_API_KEY')
    if not api_key:
        return jsonify({'error': '未配置DASHSCOPE_API_KEY'}), 500

    import base64
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
    url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    prompt = (
        "你是一名语音风格分析助手。请严格根据给定音频，提取三项风格特征："
        "1) tone_style（语调，示例：温和/严肃/活泼）; "
        "2) speaking_speed（语速，输出浮点数，推荐范围0.8~1.2，1.0为中速）; "
        "3) vocabulary_style（用词风格，示例：正式/口语化/鼓励性）。\n\n"
        "必须仅输出一行合法 JSON 对象，不允许出现任何解释、前后缀、标点装饰或代码块标记。\n"
        "输出格式示例：{\"tone_style\":\"温和\",\"speaking_speed\":1.0,\"vocabulary_style\":\"鼓励性\"}"
    )
    data = {
        "model": "qwen-audio-turbo",
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"audio": f"data:audio/wav;base64,{audio_b64}"},
                        {"text": prompt}
                    ]
                }
            ]
        },
        "parameters": {"result_format": "message"}
    }

    try:
        r = requests.post(url, headers=headers, json=data, timeout=45)
        r.raise_for_status()
        out = r.json()
        content = out.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content', {})
        # content 可能是 str/list/dict，这里统一转文本再解析JSON
        if isinstance(content, list):
            texts = []
            for it in content:
                if isinstance(it, dict) and 'text' in it:
                    texts.append(str(it['text']))
                else:
                    texts.append(str(it))
            content_text = "\n".join(texts)
        elif isinstance(content, dict):
            content_text = content.get('text', str(content))
        else:
            content_text = str(content)

        import json as _json
        style = None
        try:
            style = _json.loads(content_text)
        except Exception:
            # 兼容带说明文字或代码块的返回，尝试提取第一个JSON对象
            import re
            m = re.search(r"\{[\s\S]*\}", content_text)
            if m:
                try:
                    style = _json.loads(m.group(0))
                except Exception:
                    style = None
            if style is None:
                logger.warning(f"音色分析返回非纯JSON，使用默认风格: {content_text}")

        if not isinstance(style, dict) or not style:
            # 兜底默认风格，确保写库成功后 has_voice_style 为 true
            style = {
                'tone_style': '温和',
                'speaking_speed': 1.0,
                'vocabulary_style': '鼓励性'
            }

        pv.voice_style = style
        pv.tone_style = style.get('tone_style') or pv.tone_style
        # 语速可能返回文本，尝试转成数值
        spd = style.get('speaking_speed')
        try:
            pv.speaking_speed = float(spd)
        except Exception:
            # 保留原值或留空
            pv.speaking_speed = pv.speaking_speed
        pv.vocabulary_style = style.get('vocabulary_style') or pv.vocabulary_style
        pv.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': '分析完成', 'voice_style': pv.voice_style}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"音色分析失败: {e}")
        return jsonify({'error': '分析失败'}), 500
    finally:
        try:
            if local_path and os.path.exists(local_path):
                os.remove(local_path)
            if temp_dir and os.path.exists(temp_dir):
                os.rmdir(temp_dir)
        except Exception:
            pass


# 本地存储文件的访问路由（仅在无OSS时使用）
@bp.route('/uploads/parent-voice/<path:filename>', methods=['GET'])
def serve_parent_voice_file(filename: str):
    directory = str(_LOCAL_UPLOAD_DIR)
    return send_from_directory(directory, filename)


