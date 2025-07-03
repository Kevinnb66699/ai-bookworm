import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Tabs, Button, message, Space } from 'antd';
import { BookOutlined, FormOutlined } from '@ant-design/icons';
import { Course, getCourse } from '../services/courseService';
import WordList from '../components/Course/WordList';
import WordPractice from '../components/Practice/WordPractice';
import TextPractice from '../components/Practice/TextPractice';
import { getWords, Word } from '../services/wordService';

const { TabPane } = Tabs;

const CoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('words');
  const [course, setCourse] = useState<Course | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'practice') {
      setActiveTab('word-practice');
    } else if (tab === 'words') {
      setActiveTab('words');
    }
  }, [searchParams]);

  const fetchCourse = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCourse(parseInt(id));
      setCourse(data);
    } catch (error) {
      console.error('获取课程详情失败:', error);
      message.error('获取课程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async () => {
    try {
      setLoading(true);
      const data = await getWords(parseInt(id!));
      setWords(data);
    } catch (error) {
      message.error('获取单词列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchWords();
  }, [fetchCourse, fetchWords]);

  const handleWordChange = () => {
    fetchWords();
  };

  if (!course) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={course.name}
        loading={loading}
      >
        <div className="course-content">
          <div className="course-header">
            <h1>{course.name}</h1>
            <Space>
              {/* 删除开始练习按钮 */}
            </Space>
          </div>
          <p>{course.description}</p>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            tabBarExtraContent={
              activeTab === 'words' ? (
                <Button 
                  type="primary" 
                  icon={<FormOutlined />}
                  onClick={() => setActiveTab('word-practice')}
                >
                  开始练习
                </Button>
              ) : (
                <Button 
                  icon={<BookOutlined />}
                  onClick={() => setActiveTab('words')}
                >
                  返回列表
                </Button>
              )
            }
          >
            <TabPane tab="单词列表" key="words">
              <WordList 
                courseId={parseInt(id!)} 
                words={words}
                onWordChange={handleWordChange}
              />
            </TabPane>
            <TabPane tab="单词练习" key="word-practice">
              <WordPractice courseId={parseInt(id!)} />
            </TabPane>
            <TabPane tab="文本列表" key="texts">
              <div>文本列表（开发中）</div>
            </TabPane>
            <TabPane tab="文本练习" key="text-practice">
              <TextPractice courseId={parseInt(id!)} />
            </TabPane>
            <TabPane tab="学习进度" key="progress">
              <div>学习进度（开发中）</div>
            </TabPane>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default CoursePage; 