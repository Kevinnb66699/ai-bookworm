import React, { useState, useEffect } from 'react';
import { Calendar, Card, List, Typography, Tag, Space, message } from 'antd';
import { getReminders } from '../../services/reminderService';
import type { Reminder } from '../../services/reminderService';
import dayjs from 'dayjs';

const { Title } = Typography;

interface ReviewCalendarProps {
  courseId: number;
}

const ReviewCalendar: React.FC<ReviewCalendarProps> = ({ courseId }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [courseId]);

  const fetchReminders = async () => {
    try {
      const data = await getReminders(courseId);
      setReminders(data);
    } catch (error) {
      message.error('获取复习提醒失败！');
    } finally {
      setLoading(false);
    }
  };

  const dateCellRender = (value: dayjs.Dayjs) => {
    const date = value.format('YYYY-MM-DD');
    const dayReminders = reminders.filter(
      reminder => reminder.next_review_date === date
    );

    return (
      <List
        size="small"
        dataSource={dayReminders}
        renderItem={item => (
          <List.Item>
            <Space direction="vertical" size={0}>
              <Tag color={item.type === 'word' ? 'blue' : 'green'}>
                {item.type === 'word' ? '单词' : '课文'}
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {item.item_id}
              </Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    );
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3}>复习日历</Title>
        <Calendar
          dateCellRender={dateCellRender}
          fullscreen={false}
          style={{ background: '#fff' }}
        />
      </Space>
    </Card>
  );
};

export default ReviewCalendar; 