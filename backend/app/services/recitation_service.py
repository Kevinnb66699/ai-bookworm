from difflib import SequenceMatcher
import jieba
import re
import os
import json
import requests
import logging

jieba.initialize()  # 预热分词模型，避免首次请求慢
logger = logging.getLogger(__name__)

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
        # 去除所有空白（避免ASR在中文中插入空格影响评分）
        text = re.sub(r'\s+', '', text)
        # 去除常见的标点符号
        text = re.sub(r'[，。！？：；""''（）【】、]', '', text)
        return text.strip().lower()
    
    # 预处理文本
    processed_text1 = preprocess_text(text1)
    processed_text2 = preprocess_text(text2)
    
    # 如果预处理后的文本为空，返回0
    if not processed_text1 or not processed_text2:
        return 0.0
    
    # 精确/近似满分保护：两端文本非常接近时直接给满分
    if processed_text1 == processed_text2:
        return 1.0

    # 方法1：字符级别相似度（基础相似度）
    seq_char = SequenceMatcher(None, processed_text1, processed_text2)
    char_similarity = seq_char.ratio()
    
    # 方法2：分词后的相似度（中文更稳）
    word_similarity = 0.0
    try:
        words1 = list(jieba.cut(processed_text1))
        words2 = list(jieba.cut(processed_text2))
        word_similarity = SequenceMatcher(None, words1, words2).ratio()
    except Exception:
        pass
    
    base_similarity = max(char_similarity, word_similarity)
    
    # 方法3：覆盖度惩罚（防止只背少量内容拿高分）
    matching_len = sum(block.size for block in seq_char.get_matching_blocks())
    coverage_original = matching_len / max(1, len(processed_text1))
    coverage_recited = matching_len / max(1, len(processed_text2))
    coverage_penalty = min(coverage_original, coverage_recited)
    
    # 组合：基础相似度 × 覆盖度（都需要高才高分）
    # 额外：基于分段的覆盖度平均（按2-3句一段，提升“背了部分内容”时的合理得分）
    def simple_sent_split(text: str) -> list[str]:
        sentences_local = re.split(r'[。！？；.!?;]+', text)
        return [s for s in sentences_local if s]

    processed_text1_sentences = simple_sent_split(processed_text1)
    # 组段（每最多3句）
    segment_coverages: list[float] = []
    for i in range(0, len(processed_text1_sentences), 3):
        seg = ' '.join(processed_text1_sentences[i:i+3])
        if not seg:
            continue
        seg_seq = SequenceMatcher(None, seg, processed_text2)
        matching_len_seg = sum(b.size for b in seg_seq.get_matching_blocks())
        coverage_seg = matching_len_seg / max(1, len(seg))
        segment_coverages.append(coverage_seg)

    avg_segment_coverage = sum(segment_coverages) / len(segment_coverages) if segment_coverages else 0.0

    # 近似满分保护：相似度和覆盖度都很高
    if char_similarity >= 0.99 and coverage_original >= 0.98 and coverage_recited >= 0.98:
        return 1.0

    # 组合：70% 严格版整体相似度 × 覆盖度，30% 分段平均覆盖度（更贴合“背了多段但不完整”的场景）
    overall = max(0.0, min(1.0, base_similarity * coverage_penalty))
    final_similarity = 0.7 * overall + 0.3 * avg_segment_coverage
    final_similarity = max(0.0, min(1.0, final_similarity))

    return final_similarity


class RecitationAnalysisService:
    """智能背诵分析服务"""
    
    def __init__(self):
        self.api_key = os.environ.get('DASHSCOPE_API_KEY')
        if not self.api_key:
            logger.warning("DASHSCOPE_API_KEY未配置，智能评价功能将不可用")
    
    def segment_text(self, text: str) -> list:
        """
        将课文按逻辑分段（每段2-3句）
        
        Args:
            text: 原文文本
            
        Returns:
            list: 分段结果 [{"index": 1, "content": "段落内容", "sentences": ["句子1", "句子2"]}]
        """
        if not self.api_key:
            # 如果没有API Key，使用简单的句子分割
            return self._simple_segment_text(text)
        
        try:
            url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            prompt = f"""请将以下课文（可能为中文或英文）按逻辑分段，每段包含2-3个句子。
严格要求：
1. 保持语义完整；
2. 每段2-3句话；
3. 仅返回一个JSON数组，不要包含任何解释或代码块标记；
4. JSON数组元素格式：{{"index": 段落序号(从1开始的整数), "content": "该段完整文本", "sentences": ["句子1", "句子2"]}}

课文内容：
{text}

请仅返回JSON数组。"""
            
            data = {
                "model": "qwen-turbo",
                "input": {
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
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
                    raw_content = result['output']['choices'][0]['message']['content']

                    # 统一提取文本内容（content 可能为 str/list/dict）
                    content_text = self._extract_text_from_dashscope_content(raw_content)

                    # 解析JSON，兼容带代码块/额外文字的情况
                    segments = self._parse_segments_from_text(content_text)
                    if segments:
                        return segments
                    else:
                        logger.warning("DashScope分段结果解析失败，使用简单分段")

            logger.warning("DashScope分段失败，使用简单分段")
            return self._simple_segment_text(text)
            
        except Exception as e:
            logger.error(f"DashScope分段出错: {str(e)}")
            return self._simple_segment_text(text)
    
    def _simple_segment_text(self, text: str) -> list:
        """简单的文本分段方法（备用）"""
        # 支持中英文标点的分句：中文（。！？；）与英文（.!?;）
        sentences = re.split(r'[。！？；.!?;]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        segments = []
        segment_index = 1
        
        # 每2-3句组成一段
        for i in range(0, len(sentences), 3):
            segment_sentences = sentences[i:i+3]
            # 按文本内容选择拼接标点：中文优先使用 '。'
            use_cn_punct = any('\u4e00' <= ch <= '\u9fff' for ch in text)
            joiner = '。' if use_cn_punct else '. '
            content = joiner.join(segment_sentences)
            if content:
                if use_cn_punct:
                    if not content.endswith('。'):
                        content += '。'
                else:
                    if not content.endswith('.'):
                        content += '.'
                
                segments.append({
                    "index": segment_index,
                    "content": content,
                    "sentences": segment_sentences
                })
                segment_index += 1
        
        return segments

    def _extract_text_from_dashscope_content(self, content_obj) -> str:
        """将DashScope的content字段统一提取为纯文本"""
        if isinstance(content_obj, str):
            return content_obj
        if isinstance(content_obj, list):
            # content 可能是若干段，有{text: ...}
            pieces = []
            for item in content_obj:
                if isinstance(item, dict) and 'text' in item:
                    pieces.append(str(item.get('text', '')))
        else:
                    pieces.append(str(item))
            return "\n".join(pieces)
        if isinstance(content_obj, dict):
            return content_obj.get('text') or json.dumps(content_obj, ensure_ascii=False)
        return str(content_obj) if content_obj is not None else ""

    def _parse_segments_from_text(self, content_text: str) -> list:
        """从返回的文本中解析JSON数组（容错处理代码块/前后缀）"""
        if not content_text:
            return []
        text = content_text.strip()
        # 去掉可能的代码块标记 ```json ... ```
        text = re.sub(r"^```(json)?", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"```$", "", text).strip()
        # 直接尝试解析
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        # 从文本中提取第一个JSON数组片段
        m = re.search(r"\[([\s\S]*?)\]", text)
        if m:
            candidate = f"[{m.group(1)}]"
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return []
        return []
    
    def analyze_recitation(self, original_text: str, recited_text: str, user_voice_style: dict = None, preset_segments: list | None = None) -> dict:
        """
        智能分析背诵并生成个性化评价
        
        Args:
            original_text: 原文
            recited_text: 背诵文本
            user_voice_style: 用户家长音色风格（可选）
            
        Returns:
            dict: 分析结果
        """
        # 1. 计算基础相似度
        similarity = calculate_similarity(original_text, recited_text)
        score = int(similarity * 100)
        
        # 2. 分段分析（优先使用外部传入的预分段，确保与列表页一致）
        segments = preset_segments if preset_segments else self.segment_text(original_text)
        
        # 3. 识别错误段落（先得到用于后续评价的依据）
        error_segments = self._identify_error_segments(segments, recited_text)

        # 4. 使用DashScope/本地规则生成智能评价（与错误段落严格一致）
        evaluation = self._generate_evaluation(
            original_text=original_text,
            recited_text=recited_text,
            score=score,
            segments=segments,
            error_segments=error_segments,
            voice_style=user_voice_style,
        )
        
        return {
            'score': score,
            'similarity': similarity,
            'evaluation_text': evaluation,
            'segments': segments,
            'error_segments': error_segments,
            'dashscope_analysis': {
                'original_segments': segments,
                'recited_analysis': {
                    'text': recited_text,
                    'length': len(recited_text),
                    'word_count': len(recited_text.split())
                }
            }
        }
    
    def _generate_evaluation(self, original_text: str, recited_text: str, score: int, segments: list, error_segments: list, voice_style: dict = None) -> str:
        """生成个性化鼓励评价语句"""
        # 先基于确定性的规则形成“锚点信息”，避免与错误段落不一致
        error_indices = [str(seg['segment_index']) for seg in (error_segments or [])]
        has_errors = len(error_indices) > 0
        if not self.api_key:
            return self._generate_simple_evaluation(score, error_indices)
        
        try:
            # 根据家长音色风格调整评价语句
            style_prompt = ""
            if voice_style:
                tone_style = voice_style.get('tone_style', '温和')
                vocabulary_style = voice_style.get('vocabulary_style', '口语化')
                style_prompt = f"请使用{tone_style}的语调，{vocabulary_style}的表达方式，"
            
            url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # 确定错误段落信息（使用已计算的error_segments，避免前后不一致）
            error_info = ""
            if has_errors:
                error_info = f"重点复习第{','.join(error_indices)}段。"
            
            prompt = f"""{style_prompt}根据孩子的背诵表现生成一段50字以内的个性化鼓励评价。要求：
1. 语言亲切温暖，富有鼓励性
2. 根据得分给出具体优点
3. 如有需复习的段落，只能提及以下这些段落编号：{','.join(error_indices) if has_errors else '无'}；不得出现与此相反或冲突的描述
4. 保持正面积极的态度
5. 字数控制在50字以内

背诵得分：{score}分
{error_info}

请直接返回评价语句，不要包含其他内容："""
            
            data = {
                "model": "qwen-turbo",
                "input": {
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
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
                    evaluation = result['output']['choices'][0]['message']['content'].strip()
                    
                    # 安全约束：长度与一致性校验，不通过则回退本地规则
                    if len(evaluation) > 50:
                        evaluation = evaluation[:47] + "..."
                    # 若大模型输出出现与错误段信息矛盾的说法，回退本地规则
                    if has_errors:
                        # 简单判断：若包含“都很熟练/非常棒/没有问题”等全局肯定而却存在错误段，则回退
                        contradictory_keywords = ["都很熟练", "没有问题", "全部正确", "完全掌握"]
                        if any(k in evaluation for k in contradictory_keywords):
                            return self._generate_simple_evaluation(score, error_indices)
                    return evaluation
            
            logger.warning("DashScope评价生成失败，使用简单评价")
            return self._generate_simple_evaluation(score, error_indices)
            
        except Exception as e:
            logger.error(f"DashScope评价生成出错: {str(e)}")
            return self._generate_simple_evaluation(score, error_indices)
    
    def _generate_simple_evaluation(self, score: int, error_indices: list[str] | None = None) -> str:
        """简单的评价生成（备用）"""
        error_indices = error_indices or []
        if score >= 90:
            return "太棒了！背诵非常流利准确，继续保持这种优秀的表现！"
        elif score >= 80:
            return "很不错！背诵基本准确，再加强练习就能更完美了！"
        elif score >= 60:
            return "有进步！继续努力练习，注意准确性，你一定能做得更好！"
        else:
            if error_indices:
                return f"背诵需加强，重点复习第{','.join(error_indices)}段，相信你会更棒！"
            return "加油！多读几遍，熟悉内容后再背诵，相信你能行！"
    
    def _identify_error_segments(self, segments: list, recited_text: str) -> list:
        """识别可能有错误的段落
        规则：计算“段落在背诵文本中的覆盖度”，覆盖度低于阈值则判为需重点练习。
        注：与整篇相似度不同，这里对每一段单独做部分匹配，避免“整段背得好但因全文过长被冲淡”。
        """
        error_segments = []

        # 预处理函数（与整体相似度一致的清洗规则）
        def preprocess(text: str) -> str:
            text = re.sub(r'\s+', ' ', str(text))
            # 移除常见中英文标点（包含引号和中文括号）
            text = re.sub(r"[，。！？：；“”\"'（）【】、]", '', text)
            return text.strip().lower()

        processed_recited = preprocess(recited_text)

        for segment in segments:
            segment_content = segment['content']
            processed_segment = preprocess(segment_content)

            # 若背诵为空，直接标为错误
            if not processed_segment or not processed_recited:
                error_segments.append({
                    'segment_index': segment['index'],
                    'error_type': 'missing_or_incorrect',
                    'suggestion': f'请重点练习第{segment["index"]}段内容',
                    'original_content': segment_content
                })
                continue

            # 使用匹配块长度作为“覆盖度”的近似计算
            seq = SequenceMatcher(None, processed_segment, processed_recited)
            matching_len = sum(block.size for block in seq.get_matching_blocks())
            coverage = matching_len / max(1, len(processed_segment))

            # 短段落要求更高覆盖度，长段略放宽
            threshold = 0.85 if len(processed_segment) < 30 else 0.75

            if coverage < threshold:
                error_segments.append({
                    'segment_index': segment['index'],
                    'error_type': 'missing_or_incorrect',
                    'suggestion': f'请重点练习第{segment["index"]}段内容',
                    'original_content': segment_content,
                })

        return error_segments


# 创建服务实例
recitation_analysis_service = RecitationAnalysisService() 