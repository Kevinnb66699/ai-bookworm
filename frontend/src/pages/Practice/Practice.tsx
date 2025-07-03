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
    const [score, setScore] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [practiceMode, setPracticeMode] = useState<PracticeMode>('word');
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        loadNextWord();
    }, [courseId, practiceMode]);

    const loadNextWord = async () => {
        try {
            const response = await words.practice(Number(courseId!), 'word');
            if (response.data && response.data.length > 0) {
                setCurrentWord(response.data[0]);
                setAnswer('');
                setShowResult(false);
            } else {
                setCompleted(true);
            }
        } catch (error) {
            console.error('Error loading practice word:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWord) return;

        try {
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
        } catch (error) {
            console.error('Error checking practice:', error);
        }
    };

    const handleNext = () => {
        loadNextWord();
    };

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    if (completed) {
        return (
            <div className="practice-completed">
                <h2>练习完成！</h2>
                <p>得分: {score}/{totalQuestions}</p>
                <p>正确率: {((score / totalQuestions) * 100).toFixed(1)}%</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    重新开始
                </button>
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

            <div className="practice-card">
                <div className="word-display">
                    <h2>{currentWord?.word}</h2>
                    <p className="pronunciation">{currentWord?.pronunciation}</p>
                    <p className="example">{currentWord?.example}</p>
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
        </div>
    );
};

export default Practice; 