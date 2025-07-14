import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCourses, Course } from '../services/courseService';

const { Title } = Typography;

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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
      console.error('Failed to get course list:', error);
      message.error('Failed to get course list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    navigate('/courses/create');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>My Courses</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCourse}>
            Create Course
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {courses.map(course => (
            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
              <Card
                hoverable
                title={course.name}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <p>{course.description}</p>
                <Space>
                  <span>Words: {course.word_count}</span>
                  <span>Texts: {course.text_count}</span>
                </Space>
                <div style={{ marginTop: '8px', color: '#999' }}>
                  Created: {new Date(course.created_at).toLocaleDateString()}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Space>
    </div>
  );
};

export default CourseList; 