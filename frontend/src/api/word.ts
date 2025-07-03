import axios from 'axios';

// 获取复习计划
export const getReviewPlans = async () => {
  try {
    const response = await axios.get('/api/words/review-plans');
    return response.data;
  } catch (error) {
    console.error('获取复习计划失败:', error);
    throw error;
  }
}; 