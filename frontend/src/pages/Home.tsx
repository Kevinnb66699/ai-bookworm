import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Typography, Card, Space, Button, Progress, message, Select } from 'antd';
import ReviewCalendar from '../components/Calendar/ReviewCalendar';
import { Course, getCourses } from '../services/courseService';
import { getPracticeProgress } from '../services/wordService';

const { Title, Text } = Typography;
const { Option } = Select;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseProgress, setCourseProgress] = useState<Record<number, any>>({});
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showPracticeButton, setShowPracticeButton] = useState(true);

  const fetchProgress = async (courseId: number) => {
    try {
      const data = await getPracticeProgress(courseId);
      setCourseProgress(prev => ({
        ...prev,
        [courseId]: data
      }));
    } catch (error) {
      console.error('获取练习进度失败:', error);
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0].id);
        data.forEach(course => {
          fetchProgress(course.id);
        });
      }
    } catch (error) {
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handlePractice = (courseId: number) => {
    setShowPracticeButton(false);
    navigate(`/courses/${courseId}?tab=practice`);
  };

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    setShowPracticeButton(true);
  };

  const selectedCourse = courses.find(course => course.id === selectedCourseId);
  const selectedProgress = selectedCourseId ? courseProgress[selectedCourseId] : null;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={1}>欢迎使用 AI 书童</Title>
              <Text>这是一个智能的学习助手，帮助你更好地学习和记忆知识。</Text>
            </div>

            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ marginRight: '16px' }}>选择课程：</Text>
                  <Select
                    style={{ width: 200 }}
                    value={selectedCourseId}
                    onChange={handleCourseChange}
                    loading={loading}
                  >
                    {courses.map(course => (
                      <Option key={course.id} value={course.id}>{course.name}</Option>
                    ))}
                  </Select>
                </div>

                {selectedCourse && selectedProgress && (
                  <>
                    <div>
                      <strong>单词总数：</strong>{selectedCourse.word_count || 0}
                    </div>
                    <div>
                      <strong>练习进度：</strong>
                      <Progress
                        percent={Math.round((selectedProgress.practiced_words / selectedProgress.total_words) * 100)}
                        status={selectedProgress.accuracy === 100 ? 'success' : 'active'}
                      />
                      <div style={{ marginTop: 8 }}>
                        已练习: {selectedProgress.practiced_words}/{selectedProgress.total_words} | 
                        正确率: {selectedProgress.accuracy.toFixed(1)}%
                      </div>
                    </div>
                    {showPracticeButton && (
                      <Button type="primary" onClick={() => handlePractice(selectedCourse.id)}>
                        开始练习
                      </Button>
                    )}
                  </>
                )}
              </Space>
            </Card>
          </Space>
        </Col>
        <Col span={8}>
          <ReviewCalendar courseId={selectedCourseId || 1} />
        </Col>
      </Row>
    </div>
  );
};

export default Home; 