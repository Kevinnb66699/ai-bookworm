import React, { useEffect, useState } from 'react';
import { List, Card, Space, Button, Popconfirm, message } from 'antd';
import { Link } from 'react-router-dom';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Course, getCourses, deleteCourse } from '../../services/courseService';

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      console.error('获取课程列表失败:', error);
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteCourse(id);
      message.success('删除成功');
      fetchCourses();
    } catch (error) {
      console.error('删除课程失败:', error);
      message.error('删除失败');
    }
  };

  return (
    <List
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
      dataSource={courses}
      loading={loading}
      renderItem={(course) => (
        <List.Item>
          <Card
            title={
              <Link to={`/courses/${course.id}`}>
                {course.name}
              </Link>
            }
            actions={[
              <Link to={`/courses/${course.id}/edit`} key="edit">
                <EditOutlined /> 编辑
              </Link>,
              <Popconfirm
                title="确定要删除这个课程吗？"
                onConfirm={() => handleDelete(course.id)}
                okText="确定"
                cancelText="取消"
                key="delete"
              >
                <DeleteOutlined /> 删除
              </Popconfirm>
            ]}
          >
            <p>{course.description}</p>
            <Space>
              <span>单词: {course.word_count || 0}</span>
              <span>课文: {course.text_count || 0}</span>
            </Space>
            <div style={{ marginTop: '8px', color: '#999' }}>
              创建于: {new Date(course.created_at).toLocaleDateString()}
            </div>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default CourseList; 