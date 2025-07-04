import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, message, Space, Typography } from 'antd';
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
const { Text } = Typography;

const CourseDetail: React.FC = () => {
  console.log('CourseDetail组件渲染', Date.now());
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(true);

  const courseId = useMemo(() => Number(id), [id]);

  useEffect(() => {
    let isMounted = true;
    setCourseLoading(true);
    setWordsLoading(true);
    setCourse(null);
    setWords([]);

    if (!courseId || isNaN(courseId)) {
      setCourseLoading(false);
      setWordsLoading(false);
      return;
    }

    getCourse(courseId)
      .then(data => {
        if (isMounted) setCourse(data && typeof data === 'object' ? data : null);
      })
      .catch(() => {
        if (isMounted) {
          setCourse(null);
          message.error('获取课程详情失败');
        }
      })
      .finally(() => {
        if (isMounted) setCourseLoading(false);
      });

    getWords(courseId)
      .then(data => {
        if (isMounted) setWords(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) {
          setWords([]);
          message.error('获取单词列表失败');
        }
      })
      .finally(() => {
        if (isMounted) setWordsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handleWordChange = async () => {
    setWordsLoading(true);
    try {
      const data = await getWords(courseId);
      setWords(Array.isArray(data) ? data : []);
    } catch {
      setWords([]);
      message.error('刷新单词列表失败');
    } finally {
      setWordsLoading(false);
    }
  };

  const handleDelete = () => {
    // Implement the delete logic here
  };

  if (courseLoading && !course) {
    return <div>加载课程信息中...</div>;
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
              onClick={() => navigate(`/courses/${courseId}/edit`)}
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
          {wordsLoading ? (
            <div>加载单词中...</div>
          ) : (
            <WordList 
              courseId={courseId}
              words={words}
              onWordChange={handleWordChange}
            />
          )}
        </TabPane>
        <TabPane tab="文本列表" key="texts">
          <TextList courseId={courseId} />
        </TabPane>
        <TabPane tab="单词练习" key="word-practice">
          <WordPractice courseId={courseId} />
        </TabPane>
        <TabPane tab="文本练习" key="text-practice">
          <TextPractice courseId={courseId} />
        </TabPane>
        <TabPane tab="学习进度" key="progress">
          <ProgressComponent courseId={courseId} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CourseDetail;