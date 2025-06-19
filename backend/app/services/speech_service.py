from dashscope.audio.asr import Recognition
import os

class SpeechService:
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
    
    def recognize(self, audio_path):
        recognition = Recognition(
            api_key=self.api_key,
            model="paraformer-realtime-v2",
            format="wav",
            sample_rate=16000,
            language_hints=["zh", "en"]
        )
        result = recognition.call(audio_path)
        if result.status_code == 200:
            return result.get_sentence()
        else:
            raise Exception(f"识别失败: {result.message}")

speech_service = SpeechService() 