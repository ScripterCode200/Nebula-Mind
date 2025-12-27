export type Rarity = 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Exam {
    id: string;
    title: string;
    subject: string;
    description: string;
    duration: string;
    xp: number;
    rarity: Rarity;
    rarityPoints: number;
    completed?: boolean;
}

export interface DailyGoal {
    id: string;
    title: string;
    subject: string;
    description: string;
    xp: number;
    completed?: boolean;
    duration: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questionsCount: number;
    isExam?: boolean;
    questions: {
        question: string;
        type: 'MCQ' | 'LongAnswer';
        options?: string[]; // Optional for LongAnswer
        answer?: string; // For MCQ
        idealAnswer?: string; // For LongAnswer
        keyPoints?: string[]; // For LongAnswer
        explanation?: string;
    }[];
}
