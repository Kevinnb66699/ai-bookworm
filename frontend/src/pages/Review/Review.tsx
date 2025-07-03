import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Word } from '../../types';
import { words } from '../../services/api';
import './Review.css';

const Review: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [showMeaning, setShowMeaning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewCount, setReviewCount] = useState(0);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        loadNextWord();
    }, [courseId]);

    const loadNextWord = async () => {
        try {
            const response = await words.getReviewWords(Number(courseId));
            if (response.data.length > 0) {
                setCurrentWord(response.data[0]);
                setShowMeaning(false);
            } else {
                setCompleted(true);
            }
        } catch (error) {
            console.error('Error loading review word:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowMeaning = () => {
        setShowMeaning(true);
    };

    const handleReview = async (quality: number) => {
        if (!currentWord) return;

        try {
            await words.submitReview(currentWord.id, quality);
            setReviewCount(prev => prev + 1);
            loadNextWord();
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    if (completed) {
        return (
            <div className="review-completed">
                <h2>今日复习完成！</h2>
                <p>共复习了 {reviewCount} 个单词</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    重新开始
                </button>
            </div>
        );
    }

    return (
        <div className="review">
            <div className="review-header">
                <h1>单词复习</h1>
                <div className="review-progress">
                    已复习: {reviewCount} 个单词
                </div>
            </div>

            <div className="review-card">
                <div className="word-display">
                    <h2>{currentWord?.word}</h2>
                    <p className="pronunciation">{currentWord?.pronunciation}</p>
                    {showMeaning && (
                        <div className="meaning">
                            <p className="definition">{currentWord?.meaning}</p>
                            <p className="example">{currentWord?.example}</p>
                        </div>
                    )}
                </div>

                <div className="review-actions">
                    {!showMeaning ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleShowMeaning}
                        >
                            显示释义
                        </button>
                    ) : (
                        <div className="quality-buttons">
                            <button
                                className="btn btn-outline btn-danger"
                                onClick={() => handleReview(0)}
                            >
                                不认识
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleReview(3)}
                            >
                                一般
                            </button>
                            <button
                                className="btn btn-outline btn-success"
                                onClick={() => handleReview(5)}
                            >
                                认识
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Review; 