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
    console.log('Fetching results for user:', userId);
    const q = query(
      collection(db, 'quiz_results'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult));

    console.log('Fetched results:', results);

    // Sort in memory instead of using orderBy
    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, 'Error getting quiz results');
};

export const saveQuizResult = async (result: QuizResult): Promise<void> => {
  try {
    console.log('Saving quiz result:', result);
    const resultsRef = collection(db, 'quiz_results');
    await addDoc(resultsRef, result);
    console.log('Quiz result saved successfully');
  } catch (error) {
    console.error('Error saving quiz result:', error);
    throw error;
  }
};

export const saveQuizResult2 = async (data: Omit<QuizResult, 'id'>): Promise<string> => {
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