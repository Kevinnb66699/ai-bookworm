import apiClient from './apiClient';

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
    const response = await apiClient.get('/api/courses');
    console.log('获取课程列表成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('获取课程列表失败:', error.response?.data || error);
    throw error;
  }
};

export const getCourse = async (id: number): Promise<Course> => {
  try {
    console.log('获取课程详情:', id);
    const response = await apiClient.get(`/api/courses/${id}`);
    console.log('获取课程详情成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('获取课程详情失败:', error.response?.data || error);
    throw error;
  }
};

export const createCourse = async (data: CreateCourseData): Promise<Course> => {
  try {
    console.log('创建课程:', data);
    const response = await apiClient.post('/api/courses', data);
    console.log('创建课程成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('创建课程失败:', error.response?.data || error);
    throw error;
  }
};

export const updateCourse = async (id: number, data: Partial<CreateCourseData>): Promise<Course> => {
  try {
    console.log('更新课程:', id, data);
    const response = await apiClient.put(`/api/courses/${id}`, data);
    console.log('更新课程成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('更新课程失败:', error.response?.data || error);
    throw error;
  }
};

export const deleteCourse = async (id: number): Promise<void> => {
  try {
    console.log('删除课程:', id);
    await apiClient.delete(`/api/courses/${id}`);
    console.log('删除课程成功');
  } catch (error: any) {
    console.error('删除课程失败:', error.response?.data || error);
    throw error;
  }
}; 