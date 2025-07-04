from dashscope.audio.asr import Recognition
import os

class SpeechService:
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
    
    def recognize(self, audio_path):
        # 回调函数来处理识别结果
        def callback(result):
            if result.status_code == 200:
                return result.get_sentence()
            else:
                raise Exception(f"识别失败: {result.message}")
        
        recognition = Recognition(
            callback=callback,
            api_key=self.api_key,
            model="paraformer-realtime-v2",
            format="wav",
            sample_rate=16000,
            language_hints=["zh", "en"]
        )
        
        # 使用同步方式调用
        try:
            result = recognition.call(audio_path)
            if hasattr(result, 'status_code') and result.status_code == 200:
                return result.get_sentence()
            else:
                # 尝试直接返回结果文本
                return str(result) if result else "识别失败"
        except Exception as e:
            # 如果API调用失败，返回简单的占位文本
            print(f"语音识别API调用失败: {str(e)}")
            return "语音识别暂时不可用，请稍后重试"

speech_service = SpeechService() 