# 语音识别配置说明

## 概述

新的语音识别服务支持多种阿里云API，按优先级依次尝试：
1. 阿里云NLS实时语音识别API
2. 阿里云智能语音交互API
3. DashScope多模态API

## 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 必需：DashScope API Key
DASHSCOPE_API_KEY=your_dashscope_api_key

# 可选：阿里云AccessKey（推荐配置以获得更好的识别效果）
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
```

## 获取API Key

### 1. DashScope API Key
1. 访问 [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. 创建应用并获取API Key
3. 确保开通了语音识别服务

### 2. 阿里云AccessKey（可选但推荐）
1. 访问 [阿里云AccessKey管理](https://usercenter.console.aliyun.com/)
2. 创建AccessKey
3. 确保开通了智能语音交互服务

## 安装依赖

运行以下命令安装新的依赖：

```bash
pip install -r requirements.txt
```

## 测试语音识别

可以使用以下代码测试语音识别是否正常工作：

```python
from app.services.speech_service import speech_service

# 测试音频文件路径
audio_path = "path/to/your/audio.wav"

# 进行语音识别
result = speech_service.recognize(audio_path)
print(f"识别结果: {result}")
```

## 故障排除

### 1. API配置问题
- 检查 `.env` 文件是否正确配置
- 确认API Key是否有效
- 检查阿里云账户是否开通相关服务

### 2. 音频格式问题
- 确保音频文件是WAV格式
- 采样率建议16000Hz
- 声道建议单声道

### 3. 网络连接问题
- 确保服务器能够访问阿里云API
- 检查防火墙设置

## 日志查看

语音识别服务会输出详细的日志信息，可以通过以下方式查看：

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 或直接查看控制台输出
python app.py
```

## 性能优化建议

1. **录音质量**：使用清晰的录音设备，避免背景噪音
2. **发音标准**：使用标准普通话发音
3. **录音时长**：建议3-10秒的录音时长
4. **网络环境**：确保良好的网络连接

## 支持的语言

目前主要支持中文识别，配置为 "zh-CN"。 