import { request } from './request';

export interface ReviewPlan {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'overdue';
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  averageScore: number;
  dailyStats: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
}

export const reviewService = {
  getReviewPlans: async (): Promise<ReviewPlan[]> => {
    const response = await request.get('/api/review/plans');
    return response.data;
  },

  getReviewStats: async (): Promise<ReviewStats> => {
    const response = await request.get('/api/review/stats');
    return response.data;
  },

  createReviewPlan: async (data: {
    title: string;
    description: string;
    reviewTime: [string, string];
  }): Promise<ReviewPlan> => {
    const [startTime, endTime] = data.reviewTime;
    const response = await request.post('/api/review/plans', {
      title: data.title,
      description: data.description,
      startTime,
      endTime,
    });
    return response.data;
  },

  completeReview: async (id: number): Promise<void> => {
    await request.post(`/api/review/plans/${id}/complete`);
  },

  deleteReviewPlan: async (id: number): Promise<void> => {
    await request.delete(`/api/review/plans/${id}`);
  },

  updateReviewPlan: async (
    id: number,
    data: Partial<ReviewPlan>
  ): Promise<ReviewPlan> => {
    const response = await request.put(`/api/review/plans/${id}`, data);
    return response.data;
  },
}; 