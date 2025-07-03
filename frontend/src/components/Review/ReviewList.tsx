import React from 'react';
import { List, Button, Tag, Space, Typography, Progress } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ReviewPlan } from '../../services/review';
import './ReviewList.css';

const { Text } = Typography;

interface ReviewListProps {
  data: ReviewPlan[];
  onComplete: (id: number) => Promise<void>;
  loading: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ data, onComplete, loading }) => {
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待复习</Tag>;
      case 'completed':
        return <Tag color="green">已完成</Tag>;
      case 'overdue':
        return <Tag color="red">已过期</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getProgress = (reviewPlan: ReviewPlan) => {
    if (reviewPlan.status === 'completed') return 100;
    const now = new Date().getTime();
    const start = new Date(reviewPlan.startTime).getTime();
    const end = new Date(reviewPlan.endTime).getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <List
      loading={loading}
      dataSource={data}
      renderItem={(item) => (
        <List.Item
          actions={[
            item.status === 'pending' && (
              <Button
                type="primary"
                onClick={() => onComplete(item.id)}
                icon={<CheckCircleOutlined />}
              >
                完成复习
              </Button>
            ),
          ]}
        >
          <List.Item.Meta
            title={
              <Space>
                <Text strong>{item.title}</Text>
                {getStatusTag(item.status)}
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                <Text type="secondary">{item.description}</Text>
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary">
                    {new Date(item.startTime).toLocaleString()} -{' '}
                    {new Date(item.endTime).toLocaleString()}
                  </Text>
                </Space>
                <Progress
                  percent={getProgress(item)}
                  status={item.status === 'overdue' ? 'exception' : 'active'}
                  size="small"
                />
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default ReviewList; 