import os
import base64
from typing import Union, Dict, List
from PIL import Image
import io
import requests
import json
import time
import uuid
import hmac
import hashlib
from urllib.parse import quote_plus

class OCRService:
    def __init__(self):
        """初始化OCR服务"""
        self.access_key_id = os.getenv('ALIYUN_ACCESS_KEY_ID')
        self.access_key_secret = os.getenv('ALIYUN_ACCESS_KEY_SECRET')
        self.endpoint = 'ocr-api.cn-hangzhou.aliyuncs.com'  # 使用正确的公网接入地址
        
        if not all([self.access_key_id, self.access_key_secret]):
            raise ValueError("请设置阿里云访问密钥环境变量：ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET")

    def _generate_signature(self, parameters: Dict) -> str:
        """生成签名字符串"""
        # 对参数按照字典顺序排序
        sorted_parameters = sorted(parameters.items(), key=lambda x: x[0])
        # 构造规范化的查询字符串
        canonicalized_query_string = "&".join(f"{quote_plus(k)}={quote_plus(str(v))}" for k, v in sorted_parameters)
        # 构造待签名字符串
        string_to_sign = f"POST&{quote_plus('/')}&{quote_plus(canonicalized_query_string)}"
        # 使用HMAC-SHA1算法生成签名
        h = hmac.new((self.access_key_secret + "&").encode("utf-8"), string_to_sign.encode("utf-8"), hashlib.sha1)
        signature = base64.b64encode(h.digest()).decode("utf-8")
        return signature

    def _validate_image(self, image_data: bytes) -> bytes:
        """验证并优化图片数据"""
        try:
            # 打开图片
            img = Image.open(io.BytesIO(image_data))
            
            # 检查图片大小
            if img.size[0] > 4096 or img.size[1] > 4096:
                # 如果图片太大，进行缩放
                ratio = min(4096/img.size[0], 4096/img.size[1])
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # 转换为RGB模式（如果是RGBA）
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # 保存优化后的图片
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=95)
            return output.getvalue()
            
        except Exception as e:
            raise ValueError(f"图片处理失败: {str(e)}")

    def recognize_text(self, image_source: Union[str, bytes]) -> Dict:
        """
        识别图片中的文字
        
        Args:
            image_source: 图片源，可以是本地文件路径、图片二进制数据或公网图片URL
            
        Returns:
            Dict: 包含识别结果的字典
        """
        try:
            use_url = False
            if isinstance(image_source, str):
                if image_source.startswith('http://') or image_source.startswith('https://'):
                    # 直接用公网URL
                    image_url = image_source
                    print("使用公网url")
                    use_url = True
                elif os.path.isfile(image_source):
                    with open(image_source, 'rb') as f:
                        image_data = f.read()
                else:
                    raise ValueError(f"文件不存在: {image_source}")
            else:
                # 如果是二进制数据
                image_data = image_source

            if use_url:
                parameters = {
                    "Action": "RecognizeGeneral",
                    "Version": "2021-07-07",
                    "Format": "JSON",
                    "AccessKeyId": self.access_key_id,
                    "SignatureMethod": "HMAC-SHA1",
                    "SignatureVersion": "1.0",
                    "SignatureNonce": str(uuid.uuid4()),
                    "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "Url": image_url
                }
            else:
                # 验证和优化图片
                image_data = self._validate_image(image_data)
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                parameters = {
                    "Action": "RecognizeGeneral",
                    "Version": "2021-07-07",
                    "Format": "JSON",
                    "AccessKeyId": self.access_key_id,
                    "SignatureMethod": "HMAC-SHA1",
                    "SignatureVersion": "1.0",
                    "SignatureNonce": str(uuid.uuid4()),
                    "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "ImageBase64": image_base64
                }

            # 生成签名
            signature = self._generate_signature(parameters)
            parameters["Signature"] = signature

            # 发送请求
            response = requests.post(
                f"https://{self.endpoint}/",
                data=parameters,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                }
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                except Exception:
                    return {
                        'success': False,
                        'error': '响应内容不是JSON',
                        'details': response.text
                    }
                if isinstance(result, dict) and 'Data' in result:
                    data = result['Data']
                    if isinstance(data, dict):
                        return {
                            'success': True,
                            'text': data.get('Content', ''),
                            'prism_wordsInfo': data.get('prism_wordsInfo', [])
                        }
                    else:
                        # Data 不是字典，直接返回内容
                        return {
                            'success': True,
                            'text': data,
                            'prism_wordsInfo': []
                        }
                else:
                    return {
                        'success': False,
                        'error': '识别失败，返回内容异常',
                        'details': result
                    }
            else:
                return {
                    'success': False,
                    'error': f'API调用失败，状态码：{response.status_code}，响应内容：{response.text}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'未知错误: {str(e)}'
            }

    def batch_recognize(self, image_sources: List[Union[str, bytes]]) -> List[Dict]:
        """
        批量识别多张图片
        
        Args:
            image_sources: 图片源列表
            
        Returns:
            List[Dict]: 识别结果列表
        """
        results = []
        for image_source in image_sources:
            result = self.recognize_text(image_source)
            results.append(result)
        return results 