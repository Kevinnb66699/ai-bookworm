import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Space, message, Typography, Progress, Alert } from 'antd';
import { 
  getWordPractice, 
  Word, 
  submitWordPractice,
  getPracticeProgress,
  PracticeProgress,
  resetPracticeProgress
} from '../../services/wordService';

const { Text } = Typography;

interface WordPracticeProps {
  courseId: number;
}

const WordPractice: React.FC<WordPracticeProps> = ({ courseId }) => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [hasStarted, setHasStarted] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [isPracticeComplete, setIsPracticeComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isEnglishToChinese, setIsEnglishToChinese] = useState(true);
  const inputRef = useRef<any>(null);

  const fetchProgress = async () => {
    try {
      const data = await getPracticeProgress(courseId);
      setProgress(data);
      // 检查是否完成当前轮次的所有单词练习
      if (data && data.practiced_words >= data.total_words) {
        if (currentRound === 1) {
          // 第一轮完成，准备进入第二轮
          setCurrentRound(2);
          setIsEnglishToChinese(false);
          // 等待状态更新
          await new Promise(resolve => setTimeout(resolve, 100));
          await resetPracticeProgress(courseId, false);
          // 等待状态更新
          await new Promise(resolve => setTimeout(resolve, 100));
          const newData = await getPracticeProgress(courseId);
          setProgress(newData);
          setCurrentWord(null);
          setUserAnswer('');
          setIsCorrect(null);
          setIsPracticeComplete(false);
          setHasStarted(true); // 确保第二轮开始时 hasStarted 为 true
          message.success('第一轮练习完成，开始第二轮练习（中译英）');
          // 等待状态更新后再获取下一个单词
          await new Promise(resolve => setTimeout(resolve, 100));
          await fetchNextWord();
        } else {
          // 第二轮完成
          setIsPracticeComplete(true);
          message.success('恭喜你完成所有练习！');
        }
      }
    } catch (error) {
      console.error('获取进度失败:', error);
    }
  };

  const fetchNextWord = async () => {
    try {
      setLoading(true);
      const word = await getWordPractice(courseId);
      setCurrentWord(word);
      setUserAnswer('');
      setIsCorrect(null);
      // 只在已经开始练习后更新进度
      if (hasStarted) {
        await fetchProgress();
      }
    } catch (error) {
      console.error('获取单词失败:', error);
      message.error('获取练习单词失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 重置所有状态
    setCurrentWord(null);
    setUserAnswer('');
    setIsCorrect(null);
    setProgress(null);
    setHasStarted(true);
    setIsPracticeComplete(false);
    setCurrentRound(1);
    setIsEnglishToChinese(true);
    // 获取新单词
    fetchNextWord();
  }, [courseId]);

  // 添加自动聚焦效果
  useEffect(() => {
    if (currentWord && !isCorrect) {
      inputRef.current?.focus();
    }
  }, [currentWord, isCorrect]);

  const handleSubmit = async () => {
    if (!currentWord || !userAnswer.trim()) return;

    try {
      setLoading(true);
      const isAnswerCorrect = isEnglishToChinese
        ? (Array.isArray(currentWord.meanings) ? currentWord.meanings : []).some(meaning => 
            meaning.toLowerCase().trim() === userAnswer.toLowerCase().trim()
          )
        : currentWord.word.toLowerCase().trim() === userAnswer.toLowerCase().trim();

      setIsCorrect(isAnswerCorrect);
      
      await submitWordPractice(currentWord.id, userAnswer, isEnglishToChinese);
      
      const updatedProgress = await getPracticeProgress(courseId);
      setProgress(updatedProgress);

      if (updatedProgress && updatedProgress.practiced_words >= updatedProgress.total_words) {
        if (currentRound === 1) {
          setTimeout(async () => {
            setCurrentRound(2);
            setIsEnglishToChinese(false);
            setHasStarted(true);
            const newData = await getPracticeProgress(courseId);
            setProgress(newData);
            setCurrentWord(null);
            setUserAnswer('');
            setIsCorrect(null);
            setIsPracticeComplete(false);
            message.success('第一轮练习完成，开始第二轮练习（中译英）');
            await fetchNextWord();
          }, 2000);
        } else {
          setTimeout(() => {
            setIsPracticeComplete(true);
            message.success('恭喜你完成所有练习！');
          }, 2000);
        }
      } else {
        setTimeout(() => {
          setUserAnswer('');
          setIsCorrect(null);
          fetchNextWord();
        }, 2000);
      }
    } catch (error) {
      message.error('提交答案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      setUserAnswer('');
      setIsCorrect(null);
      await fetchNextWord();
    } catch (error) {
      console.error('获取下一个单词失败:', error);
      message.error('获取下一个单词失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await resetPracticeProgress(courseId);
      setProgress(null);
      setHasStarted(true);
      setCurrentWord(null);
      setUserAnswer('');
      setIsCorrect(null);
      setIsPracticeComplete(false);
      setCurrentRound(1);
      setIsEnglishToChinese(true);
      message.success('进度已重置');
      fetchNextWord();
    } catch (error) {
      console.error('重置进度失败:', error);
      message.error('重置进度失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      setLoading(true);
      await resetPracticeProgress(courseId, true);
      setProgress(null);
      setHasStarted(true);
      setCurrentWord(null);
      setUserAnswer('');
      setIsCorrect(null);
      setIsPracticeComplete(false);
      message.success('开始复习错误单词');
      await fetchProgress();
      await fetchNextWord();
    } catch (error) {
      console.error('开始复习失败:', error);
      message.error('开始复习失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = (answer: string) => {
    if (!currentWord) return;
    
    // 检查答案是否匹配任何一个释义
    const isCorrect = (Array.isArray(currentWord.meanings) ? currentWord.meanings : []).some(meaning => 
      answer.trim().toLowerCase() === meaning.trim().toLowerCase()
    );

    setIsAnswerCorrect(isCorrect);
    setShowAnswer(true);

    // 提交练习结果
    submitWordPractice(currentWord.id, answer, isEnglishToChinese).then(() => {
      // 延迟2秒后加载下一个单词
      setTimeout(() => {
        setShowAnswer(false);
        setUserAnswer('');
        fetchNextWord();
      }, 2000);
    });
  };

  const handleStart = () => {
    setHasStarted(true);
    fetchNextWord();
  };

  if (!currentWord) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Card title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>单词练习</span>
          <Space>
            {isPracticeComplete && progress && progress.accuracy < 100 && (
              <Button 
                type="primary"
                onClick={handleReview}
                style={{ marginRight: 8 }}
              >
                巩固错误单词
              </Button>
            )}
            <Button 
              size="small" 
              onClick={handleReset}
              type="link"
            >
              重置进度
            </Button>
          </Space>
        </Space>
      } loading={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ marginBottom: 16 }}>
            <Progress
              percent={progress ? Math.round((progress.practiced_words / progress.total_words) * 100) : 0}
              status={progress?.accuracy === 100 ? 'success' : 'active'}
            />
            <div style={{ marginTop: 8 }}>
              进度: {progress?.practiced_words || 0}/{progress?.total_words || 0} | 
              正确率: {(progress?.accuracy || 0).toFixed(1)}% | 
              第{currentRound}轮 | 
              {isEnglishToChinese ? '英译中' : '中译英'}
            </div>
          </div>

          {isPracticeComplete ? (
            <Alert
              message="练习完成"
              description={`恭喜你完成所有练习！正确率：${progress?.accuracy || 0}%`}
              type="success"
              showIcon
            />
          ) : currentWord ? (
            <div>
              <div style={{ marginBottom: 16, fontSize: '18px' }}>
                {isEnglishToChinese ? currentWord.word : (Array.isArray(currentWord.meanings) ? currentWord.meanings : []).join('、')}
              </div>
              <Input.Group compact>
              <Input
                ref={inputRef}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={isEnglishToChinese ? '请输入中文含义' : '请输入英文单词'}
                onPressEnter={handleSubmit}
                disabled={loading || isCorrect !== null}
                autoFocus
                  style={{ width: 'calc(100% - 80px)' }}
                />
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  disabled={loading || isCorrect !== null || !userAnswer.trim()}
                  loading={loading}
                  style={{ width: '80px' }}
                >
                  提交
                </Button>
              </Input.Group>
              {isCorrect !== null && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ color: isCorrect ? 'green' : 'red' }}>
                    {isCorrect ? '回答正确！' : '回答错误'}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {isEnglishToChinese ? (
                      <>
                        正确答案：{(Array.isArray(currentWord.meanings) ? currentWord.meanings : []).join('、')}
                        {currentWord.pronunciation && (
                          <div>发音：{currentWord.pronunciation}</div>
                        )}
                      </>
                    ) : (
                      <>
                        正确答案：{currentWord.word}
                        {currentWord.pronunciation && (
                          <div>发音：{currentWord.pronunciation}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>加载中...</div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default WordPractice; 