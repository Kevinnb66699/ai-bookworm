import os
import base64
import json
from PIL import Image
import io
import requests

class OCRService:
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
        self.use_cloud_ocr = bool(self.api_key)  # 如果有API Key就使用云端OCR
        
        # 本地OCR配置（仅开发环境）
        if not self.use_cloud_ocr:
            try:
                import pytesseract
                # 尝试设置Tesseract路径
                if os.name == 'nt':  # Windows
                    pytesseract.pytesseract.tesseract_cmd = r'D:\Tesseract OCR\tesseract.exe'
                self.pytesseract = pytesseract
            except ImportError:
                print("警告：pytesseract未安装，OCR功能将不可用")
                self.pytesseract = None

    def recognize_text(self, image_data):
        """
        识别图片中的文字
        优先使用云端OCR API，失败时回退到本地OCR
        """
        try:
            # 处理图片数据
            if hasattr(image_data, 'read'):
                image_bytes = image_data.read()
                image = Image.open(io.BytesIO(image_bytes))
            elif isinstance(image_data, bytes):
                image_bytes = image_data
                image = Image.open(io.BytesIO(image_bytes))
            else:
                raise ValueError("不支持的图片格式")

            # 优先使用云端OCR
            if self.use_cloud_ocr:
                try:
                    return self._cloud_ocr(image_bytes)
                except Exception as e:
                    print(f"云端OCR失败，尝试本地OCR: {str(e)}")
            
            # 回退到本地OCR
            return self._local_ocr(image)
            
        except Exception as e:
            raise Exception(f"文字识别失败: {str(e)}")

    def _cloud_ocr(self, image_bytes):
        """使用阿里云OCR API"""
        if not self.api_key:
            raise Exception("未配置DASHSCOPE_API_KEY")
        
        # 将图片转换为base64
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # 调用阿里云OCR API
        url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "model": "qwen-vl-ocr",
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": f"data:image/jpeg;base64,{image_base64}"
                            },
                            {
                                "text": "请识别图片中的所有文字内容，保持原有的格式和换行。"
                            }
                        ]
                    }
                ]
            }
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if 'output' in result and 'choices' in result['output']:
                text = result['output']['choices'][0]['message']['content']
                return text.strip() if text else "未识别到文字"
            else:
                raise Exception("API响应格式错误")
        else:
            raise Exception(f"API调用失败: {response.status_code}")

    def _local_ocr(self, image):
        """本地OCR识别（开发环境备用）"""
        if not self.pytesseract:
            raise Exception("本地OCR不可用：pytesseract未安装")
        
        try:
            # 使用中文和英文语言包
            text = self.pytesseract.image_to_string(image, lang='chi_sim+eng')
            text = text.strip()
            
            if not text:
                raise Exception("未能识别出文字")
                
            return text
        except Exception as e:
            raise Exception(f"本地OCR失败: {str(e)}")

ocr_service = OCRService() 