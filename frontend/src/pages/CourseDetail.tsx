import React, { useState, useEffect, useRef } from 'react';
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
  const [courseLoading, setCourseLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(true);
  
  // 使用ref跟踪请求状态，防止重复请求
  const fetchingCourse = useRef(false);
  const fetchingWords = useRef(false);
  
  // 使用ref保存AbortController，用于取消请求
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCourse = async () => {
    if (fetchingCourse.current) {
      console.log('Course fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingCourse.current = true;
      setCourseLoading(true);
      
      console.log('Fetching course:', id);
      const data = await getCourse(Number(id));
      setCourse(data);
      console.log('Course fetched successfully:', data.name);
    } catch (error: any) {
      console.error('Failed to fetch course:', error);
      message.error(error.response?.data?.error || '获取课程信息失败');
      navigate('/courses');
    } finally {
      setCourseLoading(false);
      fetchingCourse.current = false;
    }
  };

  const fetchWords = async () => {
    if (fetchingWords.current) {
      console.log('Words fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingWords.current = true;
      setWordsLoading(true);
      
      console.log('Fetching words for course:', id);
      const data = await getWords(Number(id));
      setWords(data);
      console.log('Words fetched successfully:', data.length, 'words');
    } catch (error: any) {
      console.error('Failed to fetch words:', error);
      message.error('获取单词列表失败');
    } finally {
      setWordsLoading(false);
      fetchingWords.current = false;
    }
  };

  useEffect(() => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    
    if (id) {
      console.log('CourseDetail useEffect triggered for id:', id);
      
      // 重置状态
      setCourse(null);
      setWords([]);
      fetchingCourse.current = false;
      fetchingWords.current = false;
      
      // 并行获取数据，但各自管理loading状态
      fetchCourse();
      fetchWords();
    }
    
    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id]);

  const handleWordChange = async () => {
    console.log('handleWordChange called');
    // 添加防抖，避免快速连续调用
    if (!fetchingWords.current) {
      await fetchWords();
    } else {
      console.log('Words refresh skipped - already in progress');
    }
  };

  const handleDelete = () => {
    // Implement the delete logic here
  };

  // 分别处理loading状态
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
          {wordsLoading ? (
            <div>加载单词中...</div>
          ) : (
            <WordList 
              courseId={Number(id)} 
              words={words}
              onWordChange={handleWordChange}
            />
          )}
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