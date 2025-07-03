import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Course, CourseStats } from '../../types';
import { courses } from '../../services/api';
import './CourseList.css';

const CourseList: React.FC = () => {
    const [courseList, setCourseList] = useState<Course[]>([]);
    const [courseStats, setCourseStats] = useState<Record<number, CourseStats>>({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCourse, setNewCourse] = useState({ name: '', description: '' });

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await courses.getAll();
            setCourseList(response.data);
            
            // 加载每个课程的统计信息
            const stats: Record<number, CourseStats> = {};
            for (const course of response.data) {
                const statsResponse = await courses.getStats(course.id);
                stats[course.id] = statsResponse.data;
            }
            setCourseStats(stats);
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await courses.create(newCourse);
            setShowCreateModal(false);
            setNewCourse({ name: '', description: '' });
            loadCourses();
        } catch (error) {
            console.error('Error creating course:', error);
        }
    };

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    return (
        <div className="course-list">
            <div className="course-list-header">
                <h1>我的课程</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    创建新课程
                </button>
            </div>

            <div className="course-grid">
                {courseList.map(course => (
                    <div key={course.id} className="course-card">
                        <h2>{course.name}</h2>
                        <p>{course.description}</p>
                        <div className="course-stats">
                            <div className="stat-item">
                                <span className="stat-label">单词</span>
                                <span className="stat-value">
                                    {courseStats[course.id]?.mastered_words || 0} / {course.word_count}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">课文</span>
                                <span className="stat-value">
                                    {courseStats[course.id]?.mastered_texts || 0} / {course.text_count}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">掌握率</span>
                                <span className="stat-value">
                                    {courseStats[course.id]?.mastery_rate.words || 0}%
                                </span>
                            </div>
                        </div>
                        <div className="course-actions">
                            <Link to={`/courses/${course.id}`} className="btn btn-outline">
                                查看详情
                            </Link>
                            <Link to={`/courses/${course.id}/review`} className="btn btn-primary">
                                开始复习
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>创建新课程</h2>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label htmlFor="name">课程名称</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={newCourse.name}
                                    onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">课程描述</label>
                                <textarea
                                    id="description"
                                    value={newCourse.description}
                                    onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    创建
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseList; 