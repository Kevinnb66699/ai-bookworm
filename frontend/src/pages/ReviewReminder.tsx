import React, { useState, useEffect } from 'react';
import { Card, List, Statistic, Row, Col, Button, message, Typography, Progress, Space, Modal, Form, Input, DatePicker } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { reviewService, ReviewPlan, ReviewStats as ReviewStatsType } from '../services/review';
import ReviewList from '../components/Review/ReviewList';
import ReviewStats from '../components/Review/ReviewStats';
import './ReviewReminder.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ReviewReminder: React.FC = () => {
  const [reviewPlans, setReviewPlans] = useState<ReviewPlan[]>([]);
  const [stats, setStats] = useState<ReviewStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchReviewData();
    // 设置定时刷新
    const timer = setInterval(fetchReviewData, 60000); // 每分钟刷新一次
    return () => clearInterval(timer);
  }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const [plans, statistics] = await Promise.all([
        reviewService.getReviewPlans(),
        reviewService.getReviewStats()
      ]);
      setReviewPlans(plans);
      setStats(statistics);
    } catch (error) {
      message.error('获取复习数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (values: any) => {
    try {
      await reviewService.createReviewPlan(values);
      message.success('添加复习计划成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchReviewData();
    } catch (error) {
      message.error('添加复习计划失败');
    }
  };

  const handleCompleteReview = async (id: number) => {
    try {
      await reviewService.completeReview(id);
      message.success('完成复习');
      fetchReviewData();
    } catch (error) {
      message.error('完成复习失败');
    }
  };

  return (
    <div className="review-reminder">
      <Title level={2}>复习提醒</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总复习项"
              value={stats?.total || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats?.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待复习"
              value={stats?.pending || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={stats?.completionRate || 0}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title="复习计划"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                添加复习计划
              </Button>
            }
          >
            <ReviewList
              data={reviewPlans}
              onComplete={handleCompleteReview}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="复习统计">
            <ReviewStats stats={stats} />
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加复习计划"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddReview}
        >
          <Form.Item
            name="title"
            label="复习内容"
            rules={[{ required: true, message: '请输入复习内容' }]}
          >
            <Input placeholder="请输入复习内容" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入复习描述" />
          </Form.Item>
          <Form.Item
            name="reviewTime"
            label="复习时间"
            rules={[{ required: true, message: '请选择复习时间' }]}
          >
            <RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewReminder; 