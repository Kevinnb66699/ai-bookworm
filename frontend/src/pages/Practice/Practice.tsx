import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Word } from '../../types';
import { words } from '../../services/api';
import './Practice.css';

type PracticeMode = 'word' | 'text_fill' | 'text_full';

const Practice: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [answer, setAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [practiceMode, setPracticeMode] = useState<PracticeMode>('word');
    const [completed, setCompleted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<{
        isCorrect: boolean;
        userAnswer: string;
        correctAnswer?: string;
    } | null>(null);

    useEffect(() => {
        loadNextWord();
    }, [courseId, practiceMode]);

    const loadNextWord = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await words.practice(Number(courseId!), 'word');
            
            if (response.data && response.data.length > 0) {
                setCurrentWord(response.data[0]);
                setAnswer('');
                setShowResult(false);
                setSubmitError(null);
                setLastResult(null);
            } else {
                setCompleted(true);
            }
        } catch (error: any) {
            console.error('Error loading practice word:', error);
            const errorMessage = error.response?.data?.message || error.message || '加载练习题失败';
            setError(`加载失败: ${errorMessage}`);
            setCurrentWord(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWord) return;

        try {
            setSubmitError(null);
            console.log('Submitting practice:', {
                word_id: currentWord.id,
                answer: answer,
                course_id: Number(courseId!)
            });
            
            const response = await words.submitPractice({
                word_id: currentWord.id,
                answer: answer,
                course_id: Number(courseId!)
            });
            
            console.log('Practice response:', response);
            
            setShowResult(true);
            setTotalQuestions(prev => prev + 1);
            
            // 检查响应结构
            if (response.data && typeof response.data.is_correct === 'boolean') {
                const isCorrect = response.data.is_correct;
                setLastResult({
                    isCorrect,
                    userAnswer: answer,
                    correctAnswer: response.data.correct_meaning
                });
                
                if (isCorrect) {
                    setScore(prev => prev + 1);
                    console.log('Answer is correct!');
                } else {
                    console.log('Answer is incorrect. Correct answer:', response.data.correct_meaning);
                }
            } else {
                console.warn('Unexpected response structure:', response.data);
                // 如果响应结构不符合预期，但没有错误，假设提交成功
                setLastResult({
                    isCorrect: true, // 假设正确
                    userAnswer: answer
                });
                console.log('Response received but structure is unexpected, assuming success');
            }
        } catch (error: any) {
            console.error('Error checking practice:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            let errorMessage = '';
            
            if (error.response?.status === 404) {
                errorMessage = '单词不存在，请刷新页面重试';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.error || '请求参数错误';
            } else if (error.response?.status >= 500) {
                errorMessage = '服务器错误，请稍后重试';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = `网络错误: ${error.message}`;
            } else {
                errorMessage = '提交答案失败，请重试';
            }
            
            setSubmitError(errorMessage);
        }
    };

    const handleNext = () => {
        loadNextWord();
    };

    const handleRetry = () => {
        loadNextWord();
    };

    // 错误状态显示
    if (error) {
        return (
            <div className="practice-error">
                <div className="error-message">
                    <h2>出现错误</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button className="btn btn-primary" onClick={handleRetry}>
                            重新加载
                        </button>
                        <button className="btn btn-secondary" onClick={() => window.history.back()}>
                            返回课程
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 加载状态
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>正在加载练习题...</p>
                </div>
            </div>
        );
    }

    // 完成状态
    if (completed) {
        return (
            <div className="practice-completed">
                <h2>练习完成！</h2>
                <p>得分: {score}/{totalQuestions}</p>
                <p>正确率: {totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(1) : 0}%</p>
                <div className="completed-actions">
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        重新开始
                    </button>
                    <button className="btn btn-secondary" onClick={() => window.history.back()}>
                        返回课程
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="practice">
            <div className="practice-header">
                <h1>单词练习</h1>
                <div className="practice-mode-selector">
                    <button
                        className={`btn ${practiceMode === 'word' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setPracticeMode('word')}
                    >
                        单词练习
                    </button>
                    <button
                        className={`btn ${practiceMode === 'text_fill' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setPracticeMode('text_fill')}
                    >
                        填空练习
                    </button>
                    <button
                        className={`btn ${practiceMode === 'text_full' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setPracticeMode('text_full')}
                    >
                        全文练习
                    </button>
                </div>
                <div className="practice-progress">
                    得分: {score}/{totalQuestions}
                </div>
            </div>

            {currentWord ? (
                <div className="practice-card">
                    <div className="word-display">
                        <h2>{currentWord.word}</h2>
                        <p className="pronunciation">{currentWord.pronunciation}</p>
                        <p className="example">{currentWord.example}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="practice-form">
                        <div className="form-group">
                            <label htmlFor="answer">请输入单词含义：</label>
                            <input
                                type="text"
                                id="answer"
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                disabled={showResult}
                                required
                            />
                        </div>

                        {submitError && (
                            <div className="submit-error">
                                <p className="error-text">{submitError}</p>
                                <button 
                                    type="button" 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setSubmitError(null)}
                                >
                                    重试
                                </button>
                            </div>
                        )}

                        {showResult ? (
                            <div className="result-display">
                                <div className={`result-status ${lastResult?.isCorrect ? 'correct' : 'incorrect'}`}>
                                    {lastResult?.isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
                                </div>
                                <div className="answer-comparison">
                                    <p><strong>你的答案：</strong>{lastResult?.userAnswer}</p>
                                    {lastResult?.correctAnswer && (
                                        <p><strong>正确答案：</strong>{lastResult.correctAnswer}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleNext}
                                >
                                    下一个
                                </button>
                            </div>
                        ) : (
                            <button type="submit" className="btn btn-primary">
                                提交
                            </button>
                        )}
                    </form>
                </div>
            ) : (
                <div className="no-word">
                    <p>没有找到练习题</p>
                    <button className="btn btn-primary" onClick={handleRetry}>
                        重新加载
                    </button>
                </div>
            )}
        </div>
    );
};

export default Practice; 