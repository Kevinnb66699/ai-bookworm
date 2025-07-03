import apiClient from './apiClient';
import { requestManager } from './requestManager';

export interface Word {
  id: number;
  word: string;
  meanings: string[];
  pronunciation?: string;
  example?: string;
  course_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWordData {
  word: string;
  meanings: string[];
  pronunciation?: string;
  example?: string;
  course_id: number;
}

export interface PracticeResult {
  total_words: number;
  correct_count: number;
  accuracy: number;
}

export interface PracticeResponse {
  is_correct: boolean;
  correct_meaning: string;
}

export interface PracticeCompleteResponse {
  status: string;
  message: string;
}

export interface PracticeProgress {
  total_words: number;
  practiced_words: number;
  correct_count: number;
  accuracy: number;
}

export const getWords = async (courseId: number): Promise<Word[]> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.get(`/api/courses/${courseId}/words`, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/courses/${courseId}/words`,
    'GET'
  );
};

export const getWord = async (id: number): Promise<Word> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.get(`/api/words/${id}`, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/words/${id}`,
    'GET'
  );
};

export const createWord = async (data: CreateWordData): Promise<Word> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.post('/api/words', data, { 
        signal: abortSignal 
      });
      return response.data;
    },
    '/api/words',
    'POST',
    data
  );
};

export const updateWord = async (id: number, data: Partial<CreateWordData>): Promise<Word> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.put(`/api/words/${id}`, data, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/words/${id}`,
    'PUT',
    data
  );
};

export const deleteWord = async (id: number): Promise<void> => {
  await requestManager.executeRequest(
    async (abortSignal) => {
      await apiClient.delete(`/api/words/${id}`, { 
        signal: abortSignal 
      });
    },
    `/api/words/${id}`,
    'DELETE'
  );
};

export const getWordPractice = async (courseId: number): Promise<Word> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.get(`/api/courses/${courseId}/words/practice`, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/courses/${courseId}/words/practice`,
    'GET'
  );
};

export const submitWordPractice = async (wordId: number, answer: string, isEnglishToChinese: boolean = true): Promise<PracticeResponse> => {
  const data = { 
    answer,
    is_english_to_chinese: isEnglishToChinese
  };
  
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.post(`/api/words/${wordId}/practice`, data, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/words/${wordId}/practice`,
    'POST',
    data
  );
};

export const getPracticeResult = async (courseId: number): Promise<PracticeResult> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.get(`/api/courses/${courseId}/words/practice/result`, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/courses/${courseId}/words/practice/result`,
    'GET'
  );
};

export const getPracticeProgress = async (courseId: number): Promise<PracticeProgress> => {
  return await requestManager.executeRequest(
    async (abortSignal) => {
      const response = await apiClient.get(`/api/courses/${courseId}/words/practice/progress`, { 
        signal: abortSignal 
      });
      return response.data;
    },
    `/api/courses/${courseId}/words/practice/progress`,
    'GET'
  );
};

export const resetPracticeProgress = async (courseId: number, reviewIncorrect: boolean = false): Promise<void> => {
  try {
    const data = {
      review_incorrect: reviewIncorrect
    };
    
    await requestManager.executeRequest(
      async (abortSignal) => {
        const response = await apiClient.post(`/api/courses/${courseId}/words/practice/reset`, data, {
          signal: abortSignal
        });
        return response.data;
      },
      `/api/courses/${courseId}/words/practice/reset`,
      'POST',
      data
    );
  } catch (error) {
    console.error('重置进度失败:', error);
    throw error;
  }
}; 