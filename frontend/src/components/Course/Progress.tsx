import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table } from 'antd';
import { getProgress } from '../../services/progressService';
import type { ProgressData } from '../../services/progressService';

interface ProgressProps {
  courseId: number;
}

const ProgressComponent: React.FC<ProgressProps> = ({ courseId }) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [courseId]);

  const fetchProgress = async () => {
    try {
      const data = await getProgress(courseId);
      setProgress(data);
    } catch (error) {
      console.error('获取学习进度失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progress) {
    return <div>加载中...</div>;
  }

  const wordColumns = [
    {
      title: '单词',
      dataIndex: 'word',
      key: 'word',
    },
    {
      title: '掌握度',
      dataIndex: 'mastery',
      key: 'mastery',
      render: (mastery: number) => (
        <Progress percent={mastery} size="small" />
      ),
    },
    {
      title: '下次复习',
      dataIndex: 'next_review',
      key: 'next_review',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const textColumns = [
    {
      title: '课文',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '掌握度',
      dataIndex: 'mastery',
      key: 'mastery',
      render: (mastery: number) => (
        <Progress percent={mastery} size="small" />
      ),
    },
    {
      title: '下次复习',
      dataIndex: 'next_review',
      key: 'next_review',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="单词掌握率"
              value={progress.word_mastery}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="课文掌握率"
              value={progress.text_mastery}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="学习天数"
              value={progress.study_days}
              suffix="天"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="单词学习进度" style={{ marginTop: 16 }}>
        <Table
          columns={wordColumns}
          dataSource={progress.word_progress}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="课文学习进度" style={{ marginTop: 16 }}>
        <Table
          columns={textColumns}
          dataSource={progress.text_progress}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default ProgressComponent; 