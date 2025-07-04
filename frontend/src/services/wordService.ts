import apiClient from './apiClient';

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
  const response = await apiClient.get(`/api/courses/${courseId}/words`);
  return response.data;
};

export const getWord = async (id: number): Promise<Word> => {
  const response = await apiClient.get(`/api/words/${id}`);
  return response.data;
};

export const createWord = async (data: CreateWordData): Promise<Word> => {
  const response = await apiClient.post('/api/words', data);
  return response.data;
};

export const updateWord = async (id: number, data: Partial<CreateWordData>): Promise<Word> => {
  const response = await apiClient.put(`/api/words/${id}`, data);
  return response.data;
};

export const deleteWord = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/words/${id}`);
};

export const getWordPractice = async (courseId: number): Promise<Word> => {
  const response = await apiClient.get(`/api/courses/${courseId}/words/practice`);
  return response.data;
};

export const submitWordPractice = async (wordId: number, answer: string, isEnglishToChinese: boolean = true): Promise<PracticeResponse> => {
  const data = { 
    answer,
    is_english_to_chinese: isEnglishToChinese
  };
  
  const response = await apiClient.post(`/api/words/${wordId}/practice`, data);
  return response.data;
};

export const getPracticeResult = async (courseId: number): Promise<PracticeResult> => {
  const response = await apiClient.get(`/api/courses/${courseId}/words/practice/result`);
  return response.data;
};

export const getPracticeProgress = async (courseId: number): Promise<PracticeProgress> => {
  const response = await apiClient.get(`/api/courses/${courseId}/words/practice/progress`);
  return response.data;
};

export const resetPracticeProgress = async (courseId: number, reviewIncorrect: boolean = false): Promise<void> => {
  try {
    const data = {
      review_incorrect: reviewIncorrect
    };
    
    const response = await apiClient.post(`/api/courses/${courseId}/words/practice/reset`, data);
    return response.data;
  } catch (error) {
    console.error('重置进度失败:', error);
    throw error;
  }
}; 