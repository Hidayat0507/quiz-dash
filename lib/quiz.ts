"use client";

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  limit
} from 'firebase/firestore';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

export interface Quiz {
  id?: string;
  title: string;
  subjectId: string;
  categoryId: string;
  categoryName: string;
  questions: QuizQuestion[];
  createdAt: string;
  userId: string;
  isActive: boolean;
}

export interface QuizResult {
  id?: string;
  categoryName: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  userId: string;
  subjectName: string;
  quizId: string;
}

export interface QuizProgress {
  id?: string;
  userId: string;
  quizId: string;
  categoryId: string;
  answeredQuestions: {
    questionId: string;
    answer: string;
    correct: boolean;
  }[];
  completed: boolean;
  startedAt: string;
  lastUpdated: string;
}

const handleFirebaseError = async <T>(operation: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(errorMessage, error);
    throw error;
  }
};

// Get all quizzes
export const getQuizzes = async (): Promise<Quiz[]> => {
  return handleFirebaseError(async () => {
    const q = query(
      collection(db, 'quizzes'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Quiz));
  }, 'Error getting quizzes');
};

// Get a single quiz by ID
export const getQuiz = async (id: string): Promise<Quiz | null> => {
  return handleFirebaseError(async () => {
    const docRef = doc(db, 'quizzes', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Quiz;
  }, 'Error getting quiz');
};

// Create a new quiz
export const createQuiz = async (quiz: Omit<Quiz, 'id'>): Promise<string> => {
  return handleFirebaseError(async () => {
    const docRef = await addDoc(collection(db, 'quizzes'), quiz);
    return docRef.id;
  }, 'Error creating quiz');
};

// Update an existing quiz
export const updateQuiz = async (id: string, quiz: Partial<Omit<Quiz, 'id'>>): Promise<void> => {
  return handleFirebaseError(async () => {
    const docRef = doc(db, 'quizzes', id);
    await updateDoc(docRef, quiz);
  }, 'Error updating quiz');
};

// Delete a quiz
export const deleteQuiz = async (id: string): Promise<void> => {
  return handleFirebaseError(async () => {
    const docRef = doc(db, 'quizzes', id);
    await deleteDoc(docRef);
  }, 'Error deleting quiz');
};

// Get quizzes by subject
export const getQuizzesBySubject = async (subjectId: string): Promise<Quiz[]> => {
  return handleFirebaseError(async () => {
    const q = query(
      collection(db, 'quizzes'),
      where('subjectId', '==', subjectId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Quiz));
  }, 'Error getting quizzes by subject');
};

// Get quiz results for a user
export const getQuizResults = async (userId: string): Promise<QuizResult[]> => {
  return handleFirebaseError(async () => {
    try {
      const q = query(
        collection(db, 'quiz_results'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizResult));
    } catch (error) {
      if (error instanceof Error && error.message.includes('requires an index')) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
        throw new Error(
          `This query requires a Firestore index. Please create it using this URL: ${indexUrl}`
        );
      }
      throw error;
    }
  }, 'Error getting quiz results');
};

// Save a quiz result
export const saveQuizResult = async (data: Omit<QuizResult, 'id'>): Promise<string> => {
  return handleFirebaseError(async () => {
    const docRef = await addDoc(collection(db, 'quiz_results'), {
      ...data,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  }, 'Error saving quiz result');
};

// Get quiz results for a specific quiz
export const getQuizResultsByQuiz = async (quizId: string): Promise<QuizResult[]> => {
  return handleFirebaseError(async () => {
    const q = query(
      collection(db, 'quiz_results'),
      where('quizId', '==', quizId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult));
  }, 'Error getting quiz results');
};

// Get quiz progress
export const getQuizProgress = async (userId: string, categoryId: string): Promise<QuizProgress | null> => {
  return handleFirebaseError(async () => {
    const q = query(
      collection(db, 'quiz_progress'),
      where('userId', '==', userId),
      where('categoryId', '==', categoryId),
      where('completed', '==', false),
      orderBy('startedAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as QuizProgress;
  }, 'Error getting quiz progress');
};

// Create new quiz progress
export const createQuizProgress = async (
  userId: string,
  quizId: string,
  categoryId: string
): Promise<QuizProgress> => {
  return handleFirebaseError(async () => {
    const data: Omit<QuizProgress, 'id'> = {
      userId,
      quizId,
      categoryId,
      answeredQuestions: [],
      completed: false,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'quiz_progress'), data);
    return {
      id: docRef.id,
      ...data
    };
  }, 'Error creating quiz progress');
};

// Update quiz progress
export const updateQuizProgress = async (id: string, data: Partial<QuizProgress>): Promise<void> => {
  return handleFirebaseError(async () => {
    const docRef = doc(db, 'quiz_progress', id);
    await updateDoc(docRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
  }, 'Error updating quiz progress');
};

// Get unanswered questions
export const getUnansweredQuestions = (quiz: Quiz, progress: QuizProgress): QuizQuestion[] => {
  const answeredQuestionIds = new Set(progress.answeredQuestions.map(q => q.questionId));
  return quiz.questions.filter((_, index) => !answeredQuestionIds.has(index.toString()));
};

// Get quiz statistics
export const getQuizStats = (quiz: Quiz, progress: QuizProgress): {
  totalQuestions: number;
  answeredQuestions: number;
  remainingQuestions: number;
} => {
  return {
    totalQuestions: quiz.questions.length,
    answeredQuestions: progress.answeredQuestions.length,
    remainingQuestions: quiz.questions.length - progress.answeredQuestions.length
  };
};
