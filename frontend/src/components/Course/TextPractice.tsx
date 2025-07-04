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
  translation: string;
}

const TextPractice: React.FC<TextPracticeProps> = ({ courseId }) => {
  const [currentText, setCurrentText] = useState<Text | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctTranslation, setCorrectTranslation] = useState('');
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchNextText = async () => {
    try {
      setLoading(true);
      setError(null);
      setSubmitError(null);
      
      const text = await getTextPractice(courseId);
      setCurrentText(text);
      setAnswer('');
      setShowResult(false);
    } catch (error: any) {
      console.error('Error fetching text practice:', error);
      const errorMessage = error.response?.data?.error || error.message || '获取练习文本失败';
      setError(`加载失败: ${errorMessage}`);
      setCurrentText(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextText();
  }, [courseId]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setSubmitError('请输入翻译');
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);
      
      const result = await submitTextPractice(currentText!.id, answer);
      setIsCorrect(result.is_correct);
      setCorrectTranslation(result.correct_translation);
      setShowResult(true);
      setProgress(prev => prev + 1);
    } catch (error: any) {
      console.error('Error submitting text practice:', error);
      const errorMessage = error.response?.data?.error || error.message || '提交答案失败';
      setSubmitError(`提交失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    fetchNextText();
  };

  const handleRetry = () => {
    fetchNextText();
  };

  // 错误状态显示
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', padding: '2rem' }}>
        <Card style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ borderLeft: '4px solid #ff4d4f', paddingLeft: '1rem' }}>
            <h2 style={{ color: '#ff4d4f', marginBottom: '1rem' }}>出现错误</h2>
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>{error}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button type="primary" onClick={handleRetry}>
                重新加载
              </Button>
              <Button onClick={() => window.history.back()}>
                返回课程
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 加载状态显示
  if (loading && !currentText) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', padding: '2rem' }}>
        <Card style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #1890ff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
            <p style={{ color: '#666', fontSize: '1.1rem', margin: 0 }}>正在加载练习文本...</p>
          </div>
        </Card>
      </div>
    );
  }

  // 没有练习文本时显示
  if (!currentText) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', padding: '2rem' }}>
        <Card style={{ maxWidth: '500px', textAlign: 'center' }}>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>没有找到练习文本</p>
          <Button type="primary" onClick={handleRetry}>
            重新加载
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card title="文本翻译练习" style={{ marginBottom: 16 }}>
        <Progress percent={progress} status="active" />
      </Card>
      
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2>{currentText.title}</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>{currentText.content}</p>
        </div>

        {!showResult ? (
          <>
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="请输入中文翻译"
              rows={6}
              style={{ marginBottom: 16 }}
            />
            
            {submitError && (
              <div style={{ 
                background: '#fff5f5', 
                border: '1px solid #fecaca', 
                borderRadius: '4px', 
                padding: '1rem', 
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <p style={{ color: '#ff4d4f', margin: 0, fontSize: '0.9rem', flex: 1 }}>{submitError}</p>
                <Button size="small" onClick={() => setSubmitError(null)}>
                  重试
                </Button>
              </div>
            )}
            
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              提交答案
            </Button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <p>你的翻译：{answer}</p>
              <p style={{ color: isCorrect ? '#52c41a' : '#f5222d' }}>
                {isCorrect ? '翻译正确！' : '翻译有误'}
              </p>
              {!isCorrect && (
                <p>正确答案：{correctTranslation}</p>
              )}
            </div>
            <Button type="primary" onClick={handleNext}>
              下一个
            </Button>
          </>
        )}
      </Card>
      
      {/* 添加旋转动画的CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TextPractice; 