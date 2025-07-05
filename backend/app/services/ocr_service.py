import os
import base64
import json
from PIL import Image
import io
import requests

class OCRService:
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
        if not self.api_key:
            raise ValueError("未配置DASHSCOPE_API_KEY环境变量，OCR功能不可用")

    def recognize_text(self, image_data):
        """
        识别图片中的文字
        使用云端OCR API
        """
        try:
            # 处理图片数据
            if hasattr(image_data, 'read'):
                image_bytes = image_data.read()
            elif isinstance(image_data, bytes):
                image_bytes = image_data
            else:
                raise ValueError("不支持的图片格式")

            # 使用云端OCR
            return self._cloud_ocr(image_bytes)
            
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
                                "text": "请识别图片中的所有文字内容，将所有文字连接成一段连贯的文本。"
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
                
                # 处理不同格式的返回值
                if isinstance(text, list):
                    # 如果是列表，合并为字符串
                    text = ' '.join(str(item) for item in text)
                elif text is None:
                    text = ""
                else:
                    # 确保是字符串
                    text = str(text)
                
                # 去掉所有换行符，替换为空格，然后去掉多余的空格
                if text:
                    text = text.replace('\n', ' ').replace('\r', ' ')
                    # 去掉多余的空格
                    text = ' '.join(text.split())
                
                return text.strip() if text else "未识别到文字"
            else:
                raise Exception("API响应格式错误")
        else:
            raise Exception(f"API调用失败: {response.status_code}")



ocr_service = OCRService() 