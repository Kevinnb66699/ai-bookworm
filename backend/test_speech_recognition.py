#!/usr/bin/env python3
"""
语音识别测试脚本
用于测试重写后的语音识别服务是否正常工作
"""

import os
import sys
import logging
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# 添加应用路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.services.speech_service import speech_service
    print("✅ 语音识别服务导入成功")
except ImportError as e:
    print(f"❌ 语音识别服务导入失败: {e}")
    sys.exit(1)

def test_api_configuration():
    """测试API配置"""
    print("\n🔧 检查API配置...")
    
    dashscope_key = os.environ.get('DASHSCOPE_API_KEY')
    access_key_id = os.environ.get('ALIYUN_ACCESS_KEY_ID')
    access_key_secret = os.environ.get('ALIYUN_ACCESS_KEY_SECRET')
    
    print(f"DashScope API Key: {'✅ 已配置' if dashscope_key else '❌ 未配置'}")
    print(f"阿里云AccessKey ID: {'✅ 已配置' if access_key_id else '❌ 未配置'}")
    print(f"阿里云AccessKey Secret: {'✅ 已配置' if access_key_secret else '❌ 未配置'}")
    
    if not dashscope_key and not (access_key_id and access_key_secret):
        print("⚠️  警告：未配置任何API密钥，语音识别功能将不可用")
        return False
    
    return True

def test_audio_file(audio_path):
    """测试音频文件识别"""
    if not os.path.exists(audio_path):
        print(f"❌ 音频文件不存在: {audio_path}")
        return False
    
    print(f"\n🎤 测试音频文件: {audio_path}")
    print("正在进行语音识别...")
    
    try:
        result = speech_service.recognize(audio_path)
        print(f"✅ 识别结果: {result}")
        return True
    except Exception as e:
        print(f"❌ 识别失败: {e}")
        return False

def main():
    """主函数"""
    print("🎯 语音识别服务测试")
    print("=" * 50)
    
    # 测试API配置
    if not test_api_configuration():
        print("\n❌ API配置测试失败，请检查环境变量配置")
        return
    
    # 查找测试音频文件
    test_audio_files = [
        "test_image.jpg",  # 如果有测试音频文件
        "test_audio.wav",
        "sample.wav"
    ]
    
    found_audio = False
    for audio_file in test_audio_files:
        if os.path.exists(audio_file):
            found_audio = True
            test_audio_file(audio_file)
            break
    
    if not found_audio:
        print(f"\n⚠️  未找到测试音频文件")
        print("请将测试音频文件放置在以下位置之一:")
        for audio_file in test_audio_files:
            print(f"  - {audio_file}")
    
    print("\n" + "=" * 50)
    print("✅ 测试完成")
    print("\n📖 使用说明:")
    print("1. 确保已安装所有依赖: pip install -r requirements.txt")
    print("2. 配置环境变量（参考 SPEECH_RECOGNITION_CONFIG.md）")
    print("3. 使用清晰的中文录音，WAV格式，16000Hz采样率")

if __name__ == "__main__":
    main() 