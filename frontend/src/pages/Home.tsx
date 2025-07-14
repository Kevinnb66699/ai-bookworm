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
      console.error('Failed to get practice progress:', error);
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
      message.error('Failed to get course list');
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
              <Title level={1}>Welcome to AI Bookworm</Title>
              <Text>This is an intelligent learning assistant that helps you learn and memorize knowledge better.</Text>
            </div>

            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ marginRight: '16px' }}>Select Course:</Text>
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
                      <strong>Total Words:</strong> {selectedCourse.word_count || 0}
                    </div>
                    <div>
                      <strong>Practice Progress:</strong>
                      <Progress
                        percent={Math.round((selectedProgress.practiced_words / selectedProgress.total_words) * 100)}
                        status={selectedProgress.accuracy === 100 ? 'success' : 'active'}
                      />
                      <div style={{ marginTop: 8 }}>
                        Practiced: {selectedProgress.practiced_words}/{selectedProgress.total_words} | 
                        Accuracy: {selectedProgress.accuracy.toFixed(1)}%
                      </div>
                    </div>
                    {showPracticeButton && (
                      <Button type="primary" onClick={() => handlePractice(selectedCourse.id)}>
                        Start Practice
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