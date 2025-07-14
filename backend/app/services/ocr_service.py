import os
import base64
import json
from PIL import Image
import io
import requests

class OCRService:
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
        self.mock_mode = not self.api_key
        if self.mock_mode:
            print("警告：未配置DASHSCOPE_API_KEY环境变量，将使用模拟OCR功能")

    def recognize_text(self, image_data):
        """
        识别图片中的文字
        使用云端OCR API（如果有API Key）或模拟识别
        """
        try:
            # 处理图片数据
            if hasattr(image_data, 'read'):
                image_bytes = image_data.read()
            elif isinstance(image_data, bytes):
                image_bytes = image_data
            else:
                raise ValueError("不支持的图片格式")

            # 如果没有API Key，使用模拟OCR
            if self.mock_mode:
                return self._mock_ocr(image_bytes)
            else:
            # 使用云端OCR
                return self._cloud_ocr(image_bytes)
            
        except Exception as e:
            # 如果云端OCR失败，回退到模拟OCR
            if not self.mock_mode:
                print(f"云端OCR失败，回退到模拟模式: {str(e)}")
                try:
                    return self._mock_ocr(image_bytes if 'image_bytes' in locals() else b'')
                except:
                    pass
            raise Exception(f"文字识别失败: {str(e)}")

    def _mock_ocr(self, image_bytes):
        """模拟OCR功能（用于测试和开发）"""
        import time
        from datetime import datetime
        
        # 模拟处理时间
        time.sleep(0.5)
        
        # 根据图片大小生成不同的模拟文本
        size = len(image_bytes)
        timestamp = datetime.now().strftime("%Y年%m月%d日 %H:%M")
        
        if size < 10000:
            return f"这是一段模拟识别的课文内容（小图片）。当前时间：{timestamp}。请注意这是模拟OCR结果，用于测试目的。要使用真实的OCR功能，请配置DASHSCOPE_API_KEY环境变量。"
        elif size < 100000:
            return f"这是一段模拟识别的中等长度课文内容。当前时间：{timestamp}。春天来了，万物复苏。小草从土里钻出来，嫩嫩的，绿绿的。桃花笑红了脸，柳树摇着绿色的长辫子。这是模拟OCR结果，用于测试目的。"
        else:
            return f"这是一段模拟识别的长课文内容。当前时间：{timestamp}。春天来了，万物复苏，大地呈现出一派生机勃勃的景象。小草从土里钻出来，嫩嫩的，绿绿的，园子里，田野里，瞧去，一大片一大片满是的。桃花笑红了脸，柳树摇着绿色的长辫子，小燕子从南方飞回来了。这是模拟OCR结果，用于测试目的。要使用真实的OCR功能，请配置DASHSCOPE_API_KEY环境变量。"

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