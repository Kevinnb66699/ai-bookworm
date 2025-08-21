import os
import base64
import requests
import logging

logger = logging.getLogger(__name__)


class TTSService:
    """阿里云 DashScope TTS 封装。
    返回 data URI（data:audio/mpeg;base64,...），便于前端直接播放。
    若失败，返回 None。
    
    优先使用参考音频（家长音色样本）进行合成；
    若参考音频不可用或失败，则回退到风格映射的通用音色。
    """

    def __init__(self) -> None:
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')

    def synthesize_to_data_uri(self, text: str, voice_style: dict | None = None, reference_audio_url: str | None = None) -> str | None:
        if not text or not self.api_key:
            return None

        # 根据家长音色风格设置合成参数（简单映射）
        tone_style = (voice_style or {}).get('tone_style') if voice_style else None
        speaking_speed = (voice_style or {}).get('speaking_speed') if voice_style else None
        vocabulary_style = (voice_style or {}).get('vocabulary_style') if voice_style else None

        # 经验参数映射
        speed = 1.0
        if isinstance(speaking_speed, (int, float)):
            # 0.5 ~ 1.5 之间
            speed = max(0.5, min(1.5, float(speaking_speed)))
        elif isinstance(speaking_speed, str):
            if '慢' in speaking_speed:
                speed = 0.85
            elif '快' in speaking_speed:
                speed = 1.15

        # 选择音色/音库（DashScope TTS 可能支持多音色，这里用占位）
        voice = 'female' if (tone_style and '温和' in tone_style) else 'neutral'

        url = 'https://dashscope.aliyuncs.com/api/v1/services/audio/text-to-speech/synthesis'
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        payload = {
            'model': 'qwen-tts',  # 具体可用模型以账号为准
            'input': {
                'text': text
            },
            'parameters': {
                'voice': voice,
                'format': 'mp3',
                'rate': speed
            }
        }

        # 若提供参考音频，则尝试走“参考音频合成”
        ref_data_uri = None
        use_public_url_directly = False
        try:
            if reference_audio_url:
                # 若是内网/本机地址，DashScope 无法直接拉取，改为本地下载再尝试其它方式；
                # 若是公网可访问 URL，优先尝试直接把 URL 作为参考音频参数（不同版本字段名不同，稍后多方案回退）。
                import re as _re
                if _re.match(r'^https?://(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)', reference_audio_url):
                    logger.warning('参考音频为内网地址，DashScope 无法直接访问，将尝试本地下载-内嵌/或最终回退')
                else:
                    use_public_url_directly = True
        except Exception:
            pass

        if not use_public_url_directly and reference_audio_url:
            try:
                r = requests.get(reference_audio_url, timeout=20)
                if r.status_code == 200 and r.content:
                    b64 = base64.b64encode(r.content).decode('utf-8')
                    ref_data_uri = f'data:audio/wav;base64,{b64}'
                    # 注意：很多 TTS 接口并不接受 data URI，这里仅作为占位记录，实际发送时优先尝试 URL 方式
                    logger.info(f'TTS 已在本地读取参考音频（大小: {len(b64)} base64 chars）')
                else:
                    logger.warning(f'TTS 参考音频下载失败或空响应: {getattr(r, "status_code", "-")}')
            except Exception as e:
                logger.warning(f'下载参考音频失败，将使用普通音色：{e}')

        try:
            logger.info(f'TTS 请求: voice={voice}, rate={speed}, use_ref={"url" if use_public_url_directly else ("inline" if ref_data_uri else "no")}, text_len={len(text)}')

            # 优先尝试：直接传公网 URL（不同版本字段名不一，依次尝试）
            tried_with_public_url = False
            if use_public_url_directly and reference_audio_url:
                for field in ['reference_audio_url', 'reference_url', 'reference_audio']:
                    tried_with_public_url = True
                    payload_try = payload.copy()
                    payload_try['parameters'] = dict(payload['parameters'])
                    payload_try['parameters'][field] = reference_audio_url
                    logger.info(f'TTS 尝试使用参考音频URL参数：{field}')
                    resp = requests.post(url, headers=headers, json=payload_try, timeout=45)
                    if resp.status_code == 200:
                        data0 = resp.json()
                        audio_b64_0 = (
                            data0.get('output', {}).get('audio')
                            or data0.get('audio')
                            or ''
                        )
                        if not audio_b64_0:
                            content0 = data0.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content')
                            if isinstance(content0, list):
                                for it in content0:
                                    if isinstance(it, dict) and 'audio' in it:
                                        audio_b64_0 = it.get('audio')
                                        break
                        if audio_b64_0:
                            logger.info('TTS 公网URL参考音频合成成功')
                            return f'data:audio/mpeg;base64,{audio_b64_0}'
                        else:
                            logger.warning('TTS 公网URL方式响应无音频，继续尝试其它方式')
                    else:
                        logger.warning(f'TTS 使用 {field} 失败: {resp.status_code} {resp.text[:200]}')

            # 次选：尝试内嵌 data:（大概率不被支持）
            if ref_data_uri and not tried_with_public_url:
                payload_inline = payload.copy()
                payload_inline['parameters'] = dict(payload['parameters'])
                payload_inline['parameters']['reference_audio'] = ref_data_uri
                logger.info('TTS 尝试使用内嵌 data:audio 作为参考音频')
                resp = requests.post(url, headers=headers, json=payload_inline, timeout=45)
            else:
                resp = requests.post(url, headers=headers, json=payload, timeout=45)
            if resp.status_code != 200:
                logger.error(f'DashScope TTS 调用失败: {resp.status_code} {resp.text}')
                # 回退：如果携带了参考音频导致失败，尝试移除参考音频后再请求一次
                if 'parameters' in payload and 'reference_audio' in payload['parameters']:
                    logger.info('TTS 回退：去除参考音频后重试')
                    try:
                        payload_fallback = payload.copy()
                        payload_fallback['parameters'] = dict(payload['parameters'])
                        payload_fallback['parameters'].pop('reference_audio', None)
                        resp2 = requests.post(url, headers=headers, json=payload_fallback, timeout=45)
                        if resp2.status_code != 200:
                            logger.error(f'DashScope TTS 回退也失败: {resp2.status_code} {resp2.text}')
                            return None
                        data2 = resp2.json()
                        audio_b64_2 = (
                            data2.get('output', {}).get('audio')
                            or data2.get('audio')
                            or ''
                        )
                        if not audio_b64_2:
                            content2 = data2.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content')
                            if isinstance(content2, list):
                                for it in content2:
                                    if isinstance(it, dict) and 'audio' in it:
                                        audio_b64_2 = it.get('audio')
                                        break
                        if not audio_b64_2:
                            logger.error('DashScope TTS 回退未返回音频')
                            return None
                        logger.info('TTS 回退成功，已获得音频数据')
                        return f'data:audio/mpeg;base64,{audio_b64_2}'
                    except Exception as e2:
                        logger.error(f'TTS 回退异常: {e2}')
                        return None
                return None
            data = resp.json()
            # 预期返回音频base64（不同接口结构可能不同，做容错）
            audio_b64 = (
                data.get('output', {}).get('audio')
                or data.get('audio')
                or ''
            )
            if not audio_b64:
                # 有些接口可能返回 url，或者 content 数组
                # 简单尝试从 content 中提取
                content = data.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content')
                if isinstance(content, list):
                    for it in content:
                        if isinstance(it, dict) and 'audio' in it:
                            audio_b64 = it.get('audio')
                            break
            if not audio_b64:
                logger.error('DashScope TTS 未返回音频')
                return None
            logger.info('TTS 合成成功，已获得音频数据')
            return f'data:audio/mpeg;base64,{audio_b64}'
        except Exception as e:
            logger.error(f'TTS 合成异常: {e}')
            return None


tts_service = TTSService()


