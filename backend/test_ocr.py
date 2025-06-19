import os
from dotenv import load_dotenv
from app.ocr_service import OCRService

def main():
    # 加载环境变量
    load_dotenv()
    
    # 初始化OCR服务
    ocr_service = OCRService()
    
    # 测试图片路径
    test_image_path = "https://i.postimg.cc/t47X8YXp/test-image.png"
    
    # 检查图片是否存在
    '''if not os.path.exists(test_image_path):
        print(f"错误：图片不存在: {test_image_path}")
        return'''
    
    print(f"正在识别图片: {test_image_path}")
    
    # 识别文字
    result = ocr_service.recognize_text(test_image_path)
    
    # 打印结果
    if result['success']:
        print("\n识别成功！")
        print("\n识别文本：")
        print(result['text'])
        
        if result['prism_wordsInfo']:
            print("\n详细信息：")
            for word_info in result['prism_wordsInfo']:
                print(f"文字: {word_info.get('word', '')}")
                print(f"位置: {word_info.get('pos', [])}")
                print(f"置信度: {word_info.get('prob', 0)}")
                print("---")
    else:
        print(f"\n识别失败：{result['error']}")
        if 'details' in result:
            print("\n错误详情：")
            print(result['details'])

if __name__ == "__main__":
    main() 