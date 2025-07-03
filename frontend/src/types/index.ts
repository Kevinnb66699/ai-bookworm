export interface User {
    id: number;
    username: string;
    email: string;
    points: number;
    streak_days: number;
    created_at: string;
    last_login: string;
}

export interface Course {
    id: number;
    name: string;
    description: string;
    creator_id: number;
    created_at: string;
    updated_at: string;
    word_count: number;
    text_count: number;
}

export interface Word {
    id: number;
    word: string;
    meaning: string;
    example: string;
    pronunciation: string;
    course_id: number;
    created_at: string;
    updated_at: string;
    ease_factor: number;
    interval: number;
    repetitions: number;
    next_review: string;
}

export interface CourseStats {
    total_words: number;
    mastered_words: number;
    total_texts: number;
    mastered_texts: number;
    recent_reviews: number;
    mastery_rate: {
        words: number;
        texts: number;
    };
}

export interface Review {
    id: number;
    user_id: number;
    created_at: string;
    quality: number;
    word_id?: number;
    text_id?: number;
}

export interface Practice {
    id: number;
    user_id: number;
    created_at: string;
    practice_type: 'word' | 'text_fill' | 'text_full';
    score: number;
    mistakes: any;
    text_id?: number;
} 