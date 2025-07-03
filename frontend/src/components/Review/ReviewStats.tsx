import React from 'react';
import { Card, Row, Col, Typography, Progress } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ReviewStats.css';
import { ReviewStats as ReviewStatsType } from '../../services/review';

const { Title, Text } = Typography;

interface ReviewStatsProps {
  stats: ReviewStatsType | null;
}

const ReviewStats: React.FC<ReviewStatsProps> = ({ stats }) => {
  if (!stats) return null;

  const chartData = stats.dailyStats.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    completed: item.completed,
    total: item.total,
  }));

  return (
    <div className="review-stats">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4}>完成率</Title>
            <Progress
              percent={stats.completionRate}
              status={stats.completionRate >= 80 ? 'success' : 'normal'}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card>
            <Title level={4}>平均得分</Title>
            <Text strong style={{ fontSize: '24px' }}>
              {stats.averageScore.toFixed(1)}
            </Text>
          </Card>
        </Col>
        <Col span={24}>
          <Card>
            <Title level={4}>每日复习统计</Title>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#52c41a" name="已完成" />
                  <Bar dataKey="total" fill="#1890ff" name="总数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewStats; 