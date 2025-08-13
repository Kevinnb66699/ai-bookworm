import apiClient from './apiClient';

export interface TextRecitation {
  id: number;
  content: string;
  createTime: string;
}

export interface RecitationResult {
  recited_text: string;
  original_text: string;
  score: number;
  similarity: number;
}

export interface TextSegment {
  index: number;
  content: string;
  sentences: string[];
}

export interface ErrorSegment {
  segment_index: number;
  error_type: string;
  suggestion: string;
  original_content: string;
}

export interface AnalysisResult {
  score: number;
  similarity: number;
  evaluation_text: string;
  segments: TextSegment[];
  error_segments: ErrorSegment[];
  dashscope_analysis: any;
}

export interface SegmentResponse {
  text_id: number;
  original_text: string;
  segments: TextSegment[];
  segment_count: number;
  generated_at: string;
}

export const textRecitationService = {
  // 上传图片并识别文字
  uploadImage: async (file: File): Promise<TextRecitation> => {
    // 调试信息
    console.log('textRecitationService: 准备上传图片');
    console.log('textRecitationService: apiClient baseURL =', (apiClient as any).defaults.baseURL);
    console.log('textRecitationService: localStorage token =', localStorage.getItem('token') ? '存在' : '不存在');
    console.log('textRecitationService: 完整请求URL =', (apiClient as any).defaults.baseURL + '/api/text-recitation');
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post('/api/text-recitation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 获取课文列表
  getTextList: async (): Promise<TextRecitation[]> => {
    const response = await apiClient.get('/api/text-recitation');
    return response.data;
  },

  // 删除课文
  deleteText: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/text-recitation/${id}`);
  },

  // 更新课文
  updateText: async (id: number, content: string): Promise<TextRecitation> => {
    const response = await apiClient.put(`/api/text-recitation/${id}`, { content });
    return response.data;
  },

  // 提交语音背诵
  submitRecitation: async (id: number, audioBlob: Blob): Promise<RecitationResult> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recitation.wav');
    
    const response = await apiClient.post(`/api/text-recitation/${id}/recite`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 智能分析背诵
  analyzeRecitation: async (id: number, recitedText: string): Promise<AnalysisResult> => {
    const response = await apiClient.post(`/api/text-recitation/${id}/analyze`, {
      recited_text: recitedText
    });
    return response.data.analysis;
  },

  // 获取课文分段
  getTextSegments: async (id: number): Promise<SegmentResponse> => {
    const response = await apiClient.get(`/api/text-recitation/${id}/segments`);
    return response.data;
  },
}; 