import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    
    // 新增：请求控制相关状态
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const submitAbortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (courseId) {
            loadNextWord();
        }
        // 清理函数：组件卸载时取消所有请求
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (submitAbortControllerRef.current) {
                submitAbortControllerRef.current.abort();
            }
        };
    }, [courseId]);

    // 使用 useCallback 避免函数重复创建
    const loadNextWord = useCallback(async () => {
        // 防止重复请求
        if (isLoadingNext) {
            console.log('正在加载中，忽略重复请求');
            return;
        }

        try {
            setIsLoadingNext(true);
            setLoading(true);
            setError(null);
            
            // 取消之前的请求
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            
            // 创建新的 AbortController
            abortControllerRef.current = new AbortController();
            
            console.log('开始加载下一个单词...');
            const response = await words.practice(Number(courseId!), practiceMode, abortControllerRef.current.signal);
            
            // 检查请求是否被取消
            if (abortControllerRef.current.signal.aborted) {
                console.log('请求被取消');
                return;
            }
            
            if (response.data && response.data.length > 0) {
                setCurrentWord(response.data[0]);
                setAnswer('');
                setShowResult(false);
                setSubmitError(null);
                setLastResult(null);
                console.log('成功加载单词:', response.data[0]);
            } else {
                setCompleted(true);
                console.log('练习完成');
            }
        } catch (error: any) {
            // 如果是取消请求，不显示错误
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                console.log('请求被取消');
                return;
            }
            
            console.error('Error loading practice word:', error);
            setError('加载练习题失败，请手动刷新页面');
            setCurrentWord(null);
        } finally {
            setLoading(false);
            setIsLoadingNext(false);
        }
    }, [courseId, practiceMode, isLoadingNext]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWord || isSubmitting) {
            console.log('提交被阻止：', { currentWord: !!currentWord, isSubmitting });
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError(null);
            
            // 取消之前的提交请求
            if (submitAbortControllerRef.current) {
                submitAbortControllerRef.current.abort();
            }
            
            // 创建新的 AbortController
            submitAbortControllerRef.current = new AbortController();
            
            console.log('提交答案:', {
                word_id: currentWord.id,
                answer: answer,
                course_id: Number(courseId!)
            });
            
            const response = await words.submitPractice({
                word_id: currentWord.id,
                answer: answer,
                course_id: Number(courseId!)
            }, submitAbortControllerRef.current.signal);
            
            // 检查请求是否被取消
            if (submitAbortControllerRef.current.signal.aborted) {
                console.log('提交请求被取消');
                return;
            }
            
            console.log('提交成功:', response);
            
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
                    console.log('答案正确！');
                } else {
                    console.log('答案错误，正确答案:', response.data.correct_meaning);
                }
            } else {
                console.warn('响应结构异常:', response.data);
                setLastResult({
                    isCorrect: true,
                    userAnswer: answer
                });
            }
        } catch (error: any) {
            // 如果是取消请求，不显示错误
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                console.log('提交请求被取消');
                return;
            }
            
            console.error('提交失败:', error);
            const errorMessage = error.response?.data?.error || '提交答案失败，请稍后重试';
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 防抖处理：防止快速连续点击
    const handleNext = useCallback(() => {
        if (isLoadingNext || isSubmitting) {
            console.log('操作被阻止：正在处理中');
            return;
        }
        loadNextWord();
    }, [loadNextWord, isLoadingNext, isSubmitting]);

    // 练习模式切换处理
    const handleModeChange = useCallback((mode: PracticeMode) => {
        if (isLoadingNext || isSubmitting) {
            console.log('模式切换被阻止：正在处理中');
            return;
        }
        
        console.log('切换练习模式:', mode);
        setPracticeMode(mode);
        
        // 延迟加载新模式的内容，避免竞态条件
        setTimeout(() => {
            if (!isLoadingNext && !isSubmitting) {
                loadNextWord();
            }
        }, 100);
    }, [isLoadingNext, isSubmitting, loadNextWord]);

    // 错误状态显示
    if (error) {
        return (
            <div className="practice-error">
                <div className="error-message">
                    <h2>出现错误</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                            刷新页面
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
                        onClick={() => handleModeChange('word')}
                        disabled={isLoadingNext || isSubmitting}
                    >
                        单词练习
                    </button>
                    <button
                        className={`btn ${practiceMode === 'text_fill' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleModeChange('text_fill')}
                        disabled={isLoadingNext || isSubmitting}
                    >
                        填空练习
                    </button>
                    <button
                        className={`btn ${practiceMode === 'text_full' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleModeChange('text_full')}
                        disabled={isLoadingNext || isSubmitting}
                    >
                        全文练习
                    </button>
                </div>
                <div className="practice-progress">
                    得分: {score}/{totalQuestions}
                    {(isLoadingNext || isSubmitting) && <span className="processing"> (处理中...)</span>}
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
                                disabled={showResult || isSubmitting}
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
                                    关闭
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
                                    disabled={isLoadingNext || isSubmitting}
                                >
                                    {isLoadingNext ? '加载中...' : '下一个'}
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? '提交中...' : '提交'}
                            </button>
                        )}
                    </form>
                </div>
            ) : (
                <div className="no-word">
                    <p>没有找到练习题</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => window.location.reload()}
                        disabled={isLoadingNext || isSubmitting}
                    >
                        刷新页面
                    </button>
                </div>
            )}
        </div>
    );
};

export default Practice; 