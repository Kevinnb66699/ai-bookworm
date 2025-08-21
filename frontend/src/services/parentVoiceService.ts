import apiClient from './apiClient';

export interface ParentVoiceUploadResponse {
  message: string;
  audio_sample_url: string;
}

export interface ParentVoiceAnalyzeResponse {
  message: string;
  voice_style: {
    tone_style?: string;
    speaking_speed?: number | string;
    vocabulary_style?: string;
    [key: string]: any;
  };
}

export const parentVoiceService = {
  upload: async (file: Blob | File, filename: string = 'parent_voice.wav'): Promise<ParentVoiceUploadResponse> => {
    const form = new FormData();
    // 确保后端接收到有文件名的字段
    if (file instanceof File) {
      form.append('audio', file);
    } else {
      form.append('audio', file, filename);
    }
    const resp = await apiClient.post('/api/parent-voice/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  },

  analyze: async (): Promise<ParentVoiceAnalyzeResponse> => {
    const resp = await apiClient.post('/api/parent-voice/analyze', {});
    return resp.data;
  },

  getStatus: async () => {
    const resp = await apiClient.get('/api/parent-voice');
    return resp.data as {
      exists: boolean;
      has_voice_style: boolean;
      audio_sample_url?: string | null;
      voice_style?: any;
      updated_at?: string | null;
    };
  }
};


