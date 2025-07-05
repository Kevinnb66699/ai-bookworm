import { request } from '../utils/request';

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

export const textRecitationService = {
  // 上传图片并识别文字
  uploadImage: async (file: File): Promise<TextRecitation> => {
    // 调试信息
    console.log('textRecitationService: 准备上传图片');
    console.log('textRecitationService: request baseURL =', (request as any).defaults.baseURL);
    console.log('textRecitationService: localStorage token =', localStorage.getItem('token') ? '存在' : '不存在');
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await request.post('/text-recitation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 获取课文列表
  getTextList: async (): Promise<TextRecitation[]> => {
    const response = await request.get('/text-recitation');
    return response.data;
  },

  // 删除课文
  deleteText: async (id: number): Promise<void> => {
    await request.delete(`/text-recitation/${id}`);
  },

  // 更新课文
  updateText: async (id: number, content: string): Promise<TextRecitation> => {
    const response = await request.put(`/text-recitation/${id}`, { content });
    return response.data;
  },

  // 提交语音背诵
  submitRecitation: async (id: number, audioBlob: Blob): Promise<RecitationResult> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recitation.wav');
    
    const response = await request.post(`/text-recitation/${id}/recite`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
}; 