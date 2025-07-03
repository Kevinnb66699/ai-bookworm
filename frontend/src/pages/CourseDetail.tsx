import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, message, Space, Drawer, Badge, Typography } from 'antd';
import { getCourse } from '../services/courseService';
import WordList from '../components/Course/WordList';
import TextList from '../components/Text/TextList';
import ProgressComponent from '../components/Course/Progress';
import WordPractice from '../components/Practice/WordPractice';
import TextPractice from '../components/Practice/TextPractice';
import { getWords } from '../services/wordService';
import { Course } from '../services/courseService';
import { Word } from '../services/wordService';
import { requestManager } from '../services/requestManager';
import { REQUEST_MANAGER_CONFIG } from '../config';

const { TabPane } = Tabs;
const { Text } = Typography;

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(true);
  const [debugDrawerVisible, setDebugDrawerVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // 使用ref跟踪请求状态，防止重复请求
  const fetchingCourse = useRef(false);
  const fetchingWords = useRef(false);
  
  // 使用ref保存AbortController，用于取消请求
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 稳定的courseId值，避免每次渲染时重新计算
  const courseId = useMemo(() => Number(id), [id]);

  // 定时更新调试信息
  useEffect(() => {
    if (REQUEST_MANAGER_CONFIG.enableDebug) {
      const interval = setInterval(() => {
        setDebugInfo(requestManager.getDebugInfo());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchCourse = useCallback(async () => {
    if (fetchingCourse.current) {
      console.log('Course fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingCourse.current = true;
      setCourseLoading(true);
      
      console.log('Fetching course:', courseId);
      const data = await getCourse(courseId);
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
  }, [courseId, navigate]);

  const fetchWords = useCallback(async () => {
    if (fetchingWords.current) {
      console.log('Words fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingWords.current = true;
      setWordsLoading(true);
      
      console.log('Fetching words for course:', courseId);
      const data = await getWords(courseId);
      setWords(data);
      console.log('Words fetched successfully:', data.length, 'words');
    } catch (error: any) {
      console.error('Failed to fetch words:', error);
      message.error('获取单词列表失败');
    } finally {
      setWordsLoading(false);
      fetchingWords.current = false;
    }
  }, [courseId]);

  useEffect(() => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    
    if (courseId) {
      console.log('CourseDetail useEffect triggered for courseId:', courseId);
      
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
  }, [courseId, fetchCourse, fetchWords]);

  // 稳定的handleWordChange函数，避免每次渲染时重新创建
  const handleWordChange = useCallback(async () => {
    console.log('handleWordChange called');
    // 添加防抖，避免快速连续调用
    if (!fetchingWords.current) {
      await fetchWords();
    } else {
      console.log('Words refresh skipped - already in progress');
    }
  }, [fetchWords]);

  const handleDelete = useCallback(() => {
    // Implement the delete logic here
  }, []);

  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
      <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
        <Text strong>正在进行的请求 ({debugInfo.pendingRequests.length}):</Text>
        <ul>
          {debugInfo.pendingRequests.map((key: string, index: number) => (
            <li key={index}>{key}</li>
          ))}
        </ul>
        
        <Text strong>组件调用次数:</Text>
        <ul>
          {debugInfo.componentCallCounts.map(([component, count]: [string, number]) => (
            <li key={component}>{component}: {count}次</li>
          ))}
        </ul>
        
        <Text strong>最近调用时间:</Text>
        <ul>
          {debugInfo.callTimestamps.map((item: any) => (
            <li key={item.key}>
              {item.key.split(':')[1]}: {item.count}次调用, 最后: {new Date(item.lastCall).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </div>
    );
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
            {REQUEST_MANAGER_CONFIG.enableDebug && (
              <Badge count={debugInfo?.pendingRequests.length || 0}>
                <Button 
                  size="small" 
                  onClick={() => setDebugDrawerVisible(true)}
                >
                  调试
                </Button>
              </Badge>
            )}
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

      <Drawer
        title="RequestManager 调试信息"
        placement="right"
        onClose={() => setDebugDrawerVisible(false)}
        open={debugDrawerVisible}
        width={400}
      >
        {renderDebugInfo()}
      </Drawer>

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