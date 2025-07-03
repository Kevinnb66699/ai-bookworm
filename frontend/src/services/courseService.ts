import apiClient from './apiClient';
import { requestManager } from './requestManager';

export interface Course {
  id: number;
  name: string;
  description: string;
  creator_id: number;
  created_at: string;
  updated_at: string;
  word_count: number;
  text_count: number;
}

export interface CourseFormData {
  name: string;
  description: string;
}

export interface CreateCourseData {
  name: string;
  description: string;
}

export interface UpdateCourseData {
  name?: string;
  description?: string;
}

export const getCourses = async (): Promise<Course[]> => {
  try {
    console.log('获取课程列表');
    
    return await requestManager.executeRequest(
      async (abortSignal) => {
        const response = await apiClient.get('/api/courses', { 
          signal: abortSignal 
        });
        console.log('获取课程列表成功:', response.data);
        return response.data;
      },
      '/api/courses',
      'GET'
    );
  } catch (error: any) {
    console.error('获取课程列表失败:', error.response?.data || error);
    throw error;
  }
};

export const getCourse = async (id: number): Promise<Course> => {
  try {
    console.log('获取课程详情:', id);
    
    return await requestManager.executeRequest(
      async (abortSignal) => {
        const response = await apiClient.get(`/api/courses/${id}`, { 
          signal: abortSignal 
        });
        console.log('获取课程详情成功:', response.data);
        return response.data;
      },
      `/api/courses/${id}`,
      'GET'
    );
  } catch (error: any) {
    console.error('获取课程详情失败:', error.response?.data || error);
    throw error;
  }
};

export const createCourse = async (data: CreateCourseData): Promise<Course> => {
  try {
    console.log('创建课程:', data);
    
    return await requestManager.executeRequest(
      async (abortSignal) => {
        const response = await apiClient.post('/api/courses', data, { 
          signal: abortSignal 
        });
        console.log('创建课程成功:', response.data);
        return response.data;
      },
      '/api/courses',
      'POST',
      data
    );
  } catch (error: any) {
    console.error('创建课程失败:', error.response?.data || error);
    throw error;
  }
};

export const updateCourse = async (id: number, data: Partial<CreateCourseData>): Promise<Course> => {
  try {
    console.log('更新课程:', id, data);
    
    return await requestManager.executeRequest(
      async (abortSignal) => {
        const response = await apiClient.put(`/api/courses/${id}`, data, { 
          signal: abortSignal 
        });
        console.log('更新课程成功:', response.data);
        return response.data;
      },
      `/api/courses/${id}`,
      'PUT',
      data
    );
  } catch (error: any) {
    console.error('更新课程失败:', error.response?.data || error);
    throw error;
  }
};

export const deleteCourse = async (id: number): Promise<void> => {
  try {
    console.log('删除课程:', id);
    
    await requestManager.executeRequest(
      async (abortSignal) => {
        await apiClient.delete(`/api/courses/${id}`, { 
          signal: abortSignal 
        });
        console.log('删除课程成功');
      },
      `/api/courses/${id}`,
      'DELETE'
    );
  } catch (error: any) {
    console.error('删除课程失败:', error.response?.data || error);
    throw error;
  }
}; 