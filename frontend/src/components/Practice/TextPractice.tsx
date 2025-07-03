import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message, Progress } from 'antd';
import { getTextPractice, submitTextPractice } from '../../services/textService';

interface TextPracticeProps {
  courseId: number;
}

interface Text {
  id: number;
  title: string;
  content: string;
}

const TextPractice: React.FC<TextPracticeProps> = ({ courseId }) => {
  const [currentText, setCurrentText] = useState<Text | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctTranslation, setCorrectTranslation] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchNextText = async () => {
    try {
      setLoading(true);
      const text = await getTextPractice(courseId);
      setCurrentText(text);
      setAnswer('');
      setShowResult(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取练习文本失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextText();
  }, [courseId]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      message.warning('请输入翻译');
      return;
    }

    try {
      setLoading(true);
      const result = await submitTextPractice(currentText!.id, answer);
      setIsCorrect(result.is_correct);
      setCorrectTranslation(result.correct_translation);
      setShowResult(true);
      setProgress(prev => prev + 1);
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交答案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    fetchNextText();
  };

  if (!currentText) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Card title="文本练习" style={{ marginBottom: 16 }}>
        <Progress percent={progress} status="active" />
      </Card>
      
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2>{currentText.title}</h2>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{currentText.content}</p>
          </div>
        </div>

        {!showResult ? (
          <>
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="请输入翻译"
              rows={6}
              style={{ marginBottom: 16 }}
            />
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              提交答案
            </Button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <p>你的翻译：</p>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                marginBottom: '8px'
              }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
              </div>
              <p style={{ color: isCorrect ? '#52c41a' : '#f5222d' }}>
                {isCorrect ? '翻译正确！' : '翻译有误'}
              </p>
              {!isCorrect && (
                <>
                  <p>正确答案：</p>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px'
                  }}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{correctTranslation}</p>
                  </div>
                </>
              )}
            </div>
            <Button type="primary" onClick={handleNext}>
              下一个
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default TextPractice; 