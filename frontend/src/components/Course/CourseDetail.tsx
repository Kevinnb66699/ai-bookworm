import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Button, Space, Typography, message } from 'antd';
import { EditOutlined, DeleteOutlined, ReadOutlined, BellOutlined } from '@ant-design/icons';
import { getCourse, deleteCourse } from '../../services/courseService';
import type { Course } from '../../services/courseService';
import WordList from '../Course/WordList';
import TextList from '../Text/TextList';
import ProgressComponent from './Progress';
import WordPractice from './WordPractice';
import TextPractice from './TextPractice';
import ReminderComponent from './Reminder';
import { getWords, Word } from '../../services/wordService';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('words');

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchWords();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const data = await getCourse(Number(id));
      setCourse(data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取课程信息失败');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async () => {
    try {
      setLoading(true);
      const data = await getWords(Number(id));
      setWords(data);
    } catch (error: any) {
      message.error('获取单词列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCourse(parseInt(id));
      message.success('课程删除成功！');
      navigate('/courses');
    } catch (error) {
      message.error('删除失败，请重试！');
    }
  };

  const handleWordChange = () => {
    fetchWords();
  };

  if (loading || !course) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={2}>{course.name}</Title>
              <Paragraph>{course.description}</Paragraph>
            </div>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/courses/${id}/edit`)}
              >
                编辑
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Space>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="单词列表" key="words">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<ReadOutlined />}
                  onClick={() => setActiveTab('wordPractice')}
                >
                  开始单词练习
                </Button>
                <WordList 
                  courseId={course.id} 
                  words={words}
                  onWordChange={handleWordChange}
                />
              </Space>
            </TabPane>
            <TabPane tab="课文列表" key="texts">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<ReadOutlined />}
                  onClick={() => setActiveTab('textPractice')}
                >
                  开始课文练习
                </Button>
                <TextList courseId={course.id} />
              </Space>
            </TabPane>
            <TabPane tab="学习进度" key="progress">
              <ProgressComponent courseId={course.id} />
            </TabPane>
            <TabPane tab="单词练习" key="wordPractice">
              <WordPractice courseId={course.id} />
            </TabPane>
            <TabPane tab="课文练习" key="textPractice">
              <TextPractice courseId={course.id} />
            </TabPane>
            <TabPane tab="复习提醒" key="reminder">
              <ReminderComponent courseId={course.id} />
            </TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  );
};

export default CourseDetail; 