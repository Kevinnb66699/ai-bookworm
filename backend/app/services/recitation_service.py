from difflib import SequenceMatcher
import jieba
import re
jieba.initialize()  # 预热分词模型，避免首次请求慢

def calculate_similarity(text1: str, text2: str) -> float:
    """
    计算两段文本的相似度
    
    Args:
        text1: 原文
        text2: 背诵的文本
    
    Returns:
        float: 相似度得分 (0-1)
    """
    # 处理空值情况
    if not text1 or not text2:
        return 0.0
    
    # 确保输入是字符串
    text1 = str(text1).strip()
    text2 = str(text2).strip()
    
    if not text1 or not text2:
        return 0.0
    
    # 文本预处理：去除多余的空格、标点符号等
    def preprocess_text(text):
        # 去除多余的空格
        text = re.sub(r'\s+', ' ', text)
        # 去除常见的标点符号
        text = re.sub(r'[，。！？：；""''（）【】、]', '', text)
        return text.strip().lower()
    
    # 预处理文本
    processed_text1 = preprocess_text(text1)
    processed_text2 = preprocess_text(text2)
    
    # 如果预处理后的文本为空，返回0
    if not processed_text1 or not processed_text2:
        return 0.0
    
    # 使用多种方法计算相似度，取最高值
    similarities = []
    
    # 方法1：字符级别相似度
    char_similarity = SequenceMatcher(None, processed_text1, processed_text2).ratio()
    similarities.append(char_similarity)
    
    # 方法2：分词后的相似度
    try:
        words1 = list(jieba.cut(processed_text1))
        words2 = list(jieba.cut(processed_text2))
        word_similarity = SequenceMatcher(None, words1, words2).ratio()
        similarities.append(word_similarity)
    except:
        # 如果分词失败，使用字符级别的相似度
        pass
    
    # 方法3：包含关系检查（如果一个文本包含另一个文本的大部分内容）
    if len(processed_text1) > 0 and len(processed_text2) > 0:
        # 计算较短文本在较长文本中的匹配程度
        if len(processed_text1) > len(processed_text2):
            longer_text, shorter_text = processed_text1, processed_text2
        else:
            longer_text, shorter_text = processed_text2, processed_text1
        
        # 检查较短文本的字符在较长文本中的匹配程度
        matched_chars = 0
        for char in shorter_text:
            if char in longer_text:
                matched_chars += 1
        
        if len(shorter_text) > 0:
            contain_similarity = matched_chars / len(shorter_text)
            similarities.append(contain_similarity)
    
    # 返回最高的相似度
    final_similarity = max(similarities) if similarities else 0.0
    
    return final_similarity 