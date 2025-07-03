import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Progress, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Course, getCourses } from '../../services/courseService';
import { getPracticeProgress } from '../../services/wordService';

const { Title, Text } = Typography;

const Home: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      console.error('获取课程列表失败:', error);
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (courseId: number) => {
    try {
      const data = await getPracticeProgress(courseId);
      setProgress(data);
    } catch (error) {
      console.error('获取练习进度失败:', error);
    }
  };

  const handlePractice = (courseId: number) => {
    navigate(`/practice/${courseId}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
        <Title>欢迎使用 AI 书童</Title>
        <Text>这是一个智能的学习助手，帮助你更好地学习和记忆知识。</Text>
      </Space>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {courses.map(course => (
          <Card
            key={course.id}
            title={course.name}
            extra={
              <Space>
                <Button type="primary" onClick={() => handlePractice(course.id)}>
                  开始练习
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>单词总数：</strong>{course.word_count || 0}
              </div>
              {progress && (
                <div>
                  <strong>练习进度：</strong>
                  <Progress
                    percent={Math.round((progress.practiced_words / progress.total_words) * 100)}
                    status={progress.accuracy === 100 ? 'success' : 'active'}
                  />
                  <div style={{ marginTop: 8 }}>
                    已练习: {progress.practiced_words}/{progress.total_words} | 
                    正确率: {progress.accuracy.toFixed(1)}%
                  </div>
                </div>
              )}
            </Space>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default Home; 