// Common types
export type ID = string;
export type Timestamp = string;

export interface BaseEntity {
  id?: ID;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface QuizQuestion {
  id?: ID;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Quiz extends BaseEntity {
  categoryId: ID;
  questions: QuizQuestion[];
  title: string;
  subjectId: string;
  userId: ID;
  isActive: boolean;
}

export interface QuizProgress extends BaseEntity {
  userId: ID;
  quizId: ID;
  categoryId: ID;
  answeredQuestions: AnsweredQuestion[];
  questionOrder: number[];
  completed: boolean;
  startedAt?: Timestamp;
  lastUpdated: Timestamp;
}

export interface AnsweredQuestion {
  questionId: ID;
  answer: string;
  correct: boolean;
}

export interface QuizResult extends BaseEntity {
  quizId: ID;
  userId: ID;
  score: number;
  totalQuestions: number;
  timestamp: Timestamp;
  categoryName: string;
  subjectName: string;
}
