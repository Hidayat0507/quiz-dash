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
  updateDoc
} from 'firebase/firestore';

// Core quiz interfaces
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

const handleFirebaseError = async <T>(operation: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(errorMessage, error);
    throw error;
  }
};

// Quiz CRUD operations
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

export const createQuiz = async (quiz: Omit<Quiz, 'id'>): Promise<string> => {
  return handleFirebaseError(async () => {
    const docRef = await addDoc(collection(db, 'quizzes'), quiz);
    return docRef.id;
  }, 'Error creating quiz');
};

export const updateQuiz = async (id: string, quiz: Partial<Omit<Quiz, 'id'>>): Promise<void> => {
  return handleFirebaseError(async () => {
    const docRef = doc(db, 'quizzes', id);
    await updateDoc(docRef, quiz);
  }, 'Error updating quiz');
};

export const deleteQuiz = async (id: string): Promise<void> => {
  return handleFirebaseError(async () => {
    const docRef = doc(db, 'quizzes', id);
    await deleteDoc(docRef);
  }, 'Error deleting quiz');
};

// Quiz filtering and querying
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

// Quiz results management
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

export const saveQuizResult = async (data: Omit<QuizResult, 'id'>): Promise<string> => {
  return handleFirebaseError(async () => {
    const docRef = await addDoc(collection(db, 'quiz_results'), {
      ...data,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  }, 'Error saving quiz result');
};

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