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
  updateDoc,
  limit
} from 'firebase/firestore';
import { Quiz } from './quiz';

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
  questionOrder?: number[];
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
