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
            const response = await words.submitPractice({
                word_id: currentWord.id,
                answer: answer,
                course_id: Number(courseId!)
            });
            setShowResult(true);
            setTotalQuestions(prev => prev + 1);
            if (response.data.is_correct) {
                setScore(prev => prev + 1);
            }
        } catch (error: any) {
            console.error('Error checking practice:', error);
            const errorMessage = error.response?.data?.message || error.message || '提交答案失败';
            setSubmitError(`提交失败: ${errorMessage}`);
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
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                            >
                                下一个
                            </button>
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