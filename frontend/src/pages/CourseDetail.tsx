import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, message, Space, Typography, Popconfirm } from 'antd';
import { getCourse, deleteCourse } from '../services/courseService';
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
          message.error('Failed to get course details');
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
          message.error('Failed to get word list');
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
      message.error('Failed to refresh word list');
    } finally {
      setWordsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(courseId);
      message.success('Course deleted successfully');
      navigate('/courses');
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      message.error('Failed to delete course');
    }
  };

  if (courseLoading && !course) {
    return <div>Loading course information...</div>;
  }

  if (!course) {
    return <div>Course does not exist</div>;
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
              Edit Course
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this course?"
              description="This action cannot be undone, including all words and texts."
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="Cancel"
            >
              <Button danger>
                Delete Course
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <p>{course.description}</p>
      </Card>
      <Tabs defaultActiveKey="words" style={{ marginTop: 16 }}>
        <TabPane tab="Word List" key="words">
          {wordsLoading ? (
            <div>Loading words...</div>
          ) : (
            <WordList 
              courseId={courseId}
              words={words}
              onWordChange={handleWordChange}
            />
          )}
        </TabPane>
        <TabPane tab="Word Practice" key="word-practice">
          <WordPractice courseId={courseId} />
        </TabPane>
        <TabPane tab="Text List" key="texts">
          <TextList courseId={courseId} />
        </TabPane>
        <TabPane tab="Text Practice" key="text-practice">
          <TextPractice courseId={courseId} />
        </TabPane>
        <TabPane tab="Progress" key="progress">
          <ProgressComponent courseId={courseId} />
        </TabPane>
        {/* <TabPane tab="Review Reminder" key="reminder">
          <ReviewReminder courseId={courseId} />
        </TabPane> */}
      </Tabs>
    </div>
  );
};

export default CourseDetail;