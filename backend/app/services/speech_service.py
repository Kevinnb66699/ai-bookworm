import os
import base64
import json
import requests
import logging
import time
import uuid
import re


logger = logging.getLogger(__name__)

class SpeechService:
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
        self.access_key_id = os.environ.get('ALIYUN_ACCESS_KEY_ID')
        self.access_key_secret = os.environ.get('ALIYUN_ACCESS_KEY_SECRET')
        
        logger.info(f"DashScope API Key配置状态: {'已配置' if self.api_key else '未配置'}")
        logger.info(f"阿里云AccessKey配置状态: {'已配置' if self.access_key_id else '未配置'}")
        
        if not self.api_key:
            logger.warning("未配置DASHSCOPE_API_KEY，将尝试使用阿里云智能语音交互API")

    def recognize(self, audio_path):
        """
        识别音频文件中的语音内容
        优先使用DashScope API，如果失败则使用阿里云智能语音交互API
        """
        try:
            # 读取音频文件
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
            
            logger.info(f"开始语音识别，音频文件大小: {len(audio_data)} bytes")
            
            # 方法1：使用DashScope多模态API（作为备选）
            if self.api_key:
                try:
                    result = self._dashscope_multimodal_recognize(audio_data)
                    logger.info(f"DashScope多模态API原始返回: {result}, 类型: {type(result)}")
                    if result and result.strip():
                        logger.info(f"DashScope多模态识别成功: {result}")
                        final_text = self._extract_final_text(result)
                        logger.info(f"最终提取的文本: {final_text}")
                        return final_text
                except Exception as e:
                    logger.warning(f"DashScope多模态识别失败: {str(e)}")
            # 方法2：使用DashScope语音识别API
            elif self.api_key:
                try:
                    result = self._dashscope_recognize(audio_data)
                    if result and result.strip():
                        logger.info(f"DashScope识别成功: {result}")
                        return self._extract_final_text(result)
                except Exception as e:
                    logger.warning(f"DashScope识别失败: {str(e)}")
            else:
                pass
            # 方法3：使用阿里云智能语音交互API
            '''elif self.access_key_id and self.access_key_secret:
                try:
                    result = self._aliyun_nls_recognize(audio_data)
                    if result and result.strip():
                        logger.info(f"阿里云NLS识别成功: {result}")
                        return self._extract_final_text(result)
                except Exception as e:
                    logger.warning(f"阿里云NLS识别失败: {str(e)}")'''
            
            
            
            # 如果所有方法都失败，返回提示
            return "语音识别服务暂时不可用，请检查API配置或稍后重试"
            
        except Exception as e:
            logger.error(f"语音识别过程中发生错误: {str(e)}")
            return f"语音识别失败: {str(e)}"

    def _extract_final_text(self, result):
        """从各种格式的结果中提取最终的纯文本"""
        if not result:
            return "未能识别到语音内容"
        
        # 如果是字符串，优先通用提取引号内内容
        if isinstance(result, str):
            # 通用匹配：找第一个单/双引号包裹的内容
            match = re.search(r"['\"]([^'\"]+)['\"]", result)
            if match:
                return match.group(1).strip()
            if result.startswith("{'text':") or result.startswith('{"text":'):
                try:
                    # 尝试解析为Python字典
                    import ast
                    parsed = ast.literal_eval(result)
                    if isinstance(parsed, dict) and 'text' in parsed:
                        return str(parsed['text']).strip()
                except:
                    # 如果解析失败，使用字符串替换方法
                    text = result.replace("{'text': '", "").replace("'}", "")
                    text = text.replace('{"text": "', "").replace('"}', "")
                    text = text.replace("{'text':'", "").replace("'}", "")
                    text = text.replace('{"text":"', "").replace('"}', "")
                    return text.strip()
            else:
                # 去掉两端引号
                return result.strip().strip("'\"")
        
        # 如果是字典，尝试提取text字段
        if isinstance(result, dict):
            if 'text' in result:
                return str(result['text']).strip()
            else:
                # 如果没有text字段，转换为字符串并去掉字典格式
                text = str(result)
                # 去掉字典的大括号和引号
                text = text.replace("{'text': '", "").replace("'}", "").replace("{", "").replace("}", "")
                return text.strip()
        
        # 如果是列表，合并文本
        if isinstance(result, list):
            return ' '.join(str(item) for item in result).strip()
        
        # 其他情况，转为字符串
        return str(result).strip()

    def _dashscope_recognize(self, audio_data):
        """使用阿里云NLS实时语音识别API"""
        # 将音频转换为base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # 使用阿里云NLS一句话识别API
        url = "https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr"
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "appkey": "nls-service",
            "format": "wav",
            "sample_rate": 16000,
            "audio": audio_base64,
            "enable_punctuation_prediction": True,
            "enable_inverse_text_normalization": True,
            "enable_voice_detection": True,
            "language": "zh-CN"
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"阿里云NLS API原始响应: {result}")
            
            # 处理响应格式
            if 'message' in result and result['message'] == 'SUCCESS':
                if 'result' in result and result['result']:
                    return result['result']
            elif 'output' in result:
                if 'text' in result['output']:
                    return result['output']['text']
                elif 'choices' in result['output']:
                    # 处理choices格式
                    text = result['output']['choices'][0]['message']['content']
                    return text if isinstance(text, str) else str(text)
                else:
                    # 尝试从output中提取文本
                    output_text = str(result['output'])
                    if output_text and output_text != "{}":
                        return output_text
            
            logger.warning(f"阿里云NLS API响应格式异常: {result}")
            return None
        else:
            logger.error(f"阿里云NLS API调用失败: {response.status_code}, {response.text}")
            return None

    '''def _aliyun_nls_recognize(self, audio_data):
        """使用阿里云智能语音交互API"""
        try:
            # 动态导入阿里云NLS SDK，避免模块加载时的导入错误
            from alibabacloud_nls_filetrans20180817.client import Client as NlsClient
            from alibabacloud_tea_openapi import models as open_api_models
            from alibabacloud_nls_filetrans20180817 import models as nls_models
            
            # 创建配置
            config = open_api_models.Config(
                access_key_id=self.access_key_id,
                access_key_secret=self.access_key_secret,
                region_id='cn-shanghai'
            )
            
            # 创建客户端
            client = NlsClient(config)
            
            # 将音频数据转换为base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # 创建请求
            request = nls_models.SubmitTaskRequest(
                app_key='nls-service',
                file_url=f'data:audio/wav;base64,{audio_base64}',
                version='4.0',
                enable_words=True
            )
            
            # 提交任务
            response = client.submit_task(request)
            
            if response.body.status_code == 21050000:
                task_id = response.body.task_id
                
                # 轮询获取结果
                for i in range(30):  # 最多等待30秒
                    time.sleep(1)
                    
                    query_request = nls_models.GetTaskResultRequest(task_id=task_id)
                    query_response = client.get_task_result(query_request)
                    
                    if query_response.body.status_code == 21050002:  # 任务完成
                        result = query_response.body.result
                        if result and hasattr(result, 'sentences') and result.sentences:
                            texts = [sentence.text for sentence in result.sentences]
                            return ' '.join(texts)
                    elif query_response.body.status_code == 21050001:  # 任务进行中
                        continue
                    else:  # 任务失败
                        logger.error(f"阿里云NLS任务失败: {query_response.body.status_code}")
                        return None
                
                logger.warning("阿里云NLS任务超时")
                return None
            else:
                logger.error(f"阿里云NLS提交任务失败: {response.body.status_code}")
                return None
                
        except ImportError:
            logger.info("阿里云NLS SDK未安装，跳过此方法")
            return None
        except Exception as e:
            logger.error(f"阿里云NLS识别异常: {str(e)}")
            return None
    '''
    def _dashscope_multimodal_recognize(self, audio_data):
        """使用DashScope多模态API进行语音识别"""
        # 将音频转换为base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "model": "qwen-audio-turbo",
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "audio": f"data:audio/wav;base64,{audio_base64}"
                            },
                            {
                                "text": "Please recognize the English content in this audio and return only the recognized text without any explanation."
                            }
                        ]
                    }
                ]
            },
            "parameters": {
                "result_format": "message"
            }
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if 'output' in result and 'choices' in result['output']:
                text = result['output']['choices'][0]['message']['content']
                
                # 添加调试日志
                logger.info(f"DashScope多模态API原始content: {text}, 类型: {type(text)}")
                
                # 处理返回值，确保提取纯文本
                if isinstance(text, str):
                    return text.strip()
                elif isinstance(text, dict):
                    # 如果返回的是字典格式，提取text字段
                    if 'text' in text:
                        extracted_text = text['text'].strip()
                        logger.info(f"从字典提取的文本: {extracted_text}")
                        return extracted_text
                    else:
                        return str(text).strip()
                elif isinstance(text, list):
                    return ' '.join(str(item) for item in text).strip()
                else:
                    return str(text).strip() if text else None
            else:
                logger.warning(f"DashScope多模态API响应格式异常: {result}")
                return None
        else:
            logger.error(f"DashScope多模态API调用失败: {response.status_code}, {response.text}")
            return None

speech_service = SpeechService() 