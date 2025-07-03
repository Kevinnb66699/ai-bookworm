import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message, Progress } from 'antd';
import { getWordPractice, submitWordPractice } from '../../services/wordService';

interface WordPracticeProps {
  courseId: number;
}

interface Word {
  id: number;
  word: string;
  pronunciation?: string;
}

const WordPractice: React.FC<WordPracticeProps> = ({ courseId }) => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctMeaning, setCorrectMeaning] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchNextWord = async () => {
    try {
      setLoading(true);
      const word = await getWordPractice(courseId);
      setCurrentWord(word);
      setAnswer('');
      setShowResult(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取练习单词失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextWord();
  }, [courseId]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      message.warning('请输入答案');
      return;
    }

    try {
      setLoading(true);
      const result = await submitWordPractice(currentWord!.id, answer);
      setIsCorrect(result.is_correct);
      setCorrectMeaning(result.correct_meaning);
      setShowResult(true);
      setProgress(prev => prev + 1);
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交答案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    fetchNextWord();
  };

  if (!currentWord) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Card title="单词练习" style={{ marginBottom: 16 }}>
        <Progress percent={progress} status="active" />
      </Card>
      
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2>{currentWord.word}</h2>
          {currentWord.pronunciation && (
            <p style={{ color: '#666' }}>{currentWord.pronunciation}</p>
          )}
        </div>

        {!showResult ? (
          <>
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="请输入单词含义"
              rows={4}
              style={{ marginBottom: 16 }}
            />
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              提交答案
            </Button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <p>你的答案：{answer}</p>
              <p style={{ color: isCorrect ? '#52c41a' : '#f5222d' }}>
                {isCorrect ? '回答正确！' : '回答错误'}
              </p>
              {!isCorrect && (
                <p>正确答案：{correctMeaning}</p>
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

export default WordPractice; 