import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, message, Space } from 'antd';
import { getCourse } from '../services/courseService';
import WordList from '../components/Course/WordList';
import TextList from '../components/Text/TextList';
import ProgressComponent from '../components/Course/Progress';
import WordPractice from '../components/Practice/WordPractice';
import TextPractice from '../components/Practice/TextPractice';
import { getWords } from '../services/wordService';
import { Course } from '../services/courseService';
import { Word } from '../services/wordService';

const { TabPane } = Tabs;

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchWords();
    }
  }, [id, navigate]);

  const handleWordChange = () => {
    fetchWords();
  };

  const handleDelete = () => {
    // Implement the delete logic here
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!course) {
    return <div>课程不存在</div>;
  }

  return (
    <div>
      <Card
        title={course.name}
        extra={
          <Space>
            <Button 
              type="primary" 
              onClick={() => navigate(`/courses/${id}/edit`)}
            >
              编辑课程
            </Button>
            <Button 
              danger
              onClick={handleDelete}
            >
              删除课程
            </Button>
          </Space>
        }
      >
        <p>{course.description}</p>
      </Card>

      <Tabs defaultActiveKey="words" style={{ marginTop: 16 }}>
        <TabPane tab="单词列表" key="words">
          <WordList 
            courseId={Number(id)} 
            words={words}
            onWordChange={handleWordChange}
          />
        </TabPane>
        <TabPane tab="文本列表" key="texts">
          <TextList courseId={Number(id)} />
        </TabPane>
        <TabPane tab="单词练习" key="word-practice">
          <WordPractice courseId={Number(id)} />
        </TabPane>
        <TabPane tab="文本练习" key="text-practice">
          <TextPractice courseId={Number(id)} />
        </TabPane>
        <TabPane tab="学习进度" key="progress">
          <ProgressComponent courseId={Number(id)} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CourseDetail; 