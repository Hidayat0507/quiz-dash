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
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot
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

export interface Subject {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subjectId: string;
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

// Subject and Category operations
export async function getSubjects(): Promise<Subject[]> {
  return handleFirebaseError(async () => {
    const querySnapshot = await getDocs(collection(db, 'subjects'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subject));
  }, 'Failed to fetch subjects');
}

export async function getCategories(subjectId: string): Promise<Category[]> {
  return handleFirebaseError(async () => {
    const q = query(
      collection(db, 'categories'),
      where('subjectId', '==', subjectId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
  }, 'Failed to fetch categories');
}

// Shared utility function for mapping quiz results
const mapQuizResults = (snapshot: QuerySnapshot<DocumentData>) => 
  snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as QuizResult));

// Quiz results management
export const getQuizResults = async (userId: string): Promise<QuizResult[]> => {
  return handleFirebaseError(async () => {
    console.log('Fetching results for user:', userId);
    const q = query(
      collection(db, 'quiz_results'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult));

    console.log('Fetched results:', results);
    return results;
  }, 'Error getting quiz results');
};

export const saveQuizResult = async (result: QuizResult): Promise<void> => {
  return handleFirebaseError(async () => {
    console.log('Saving quiz result:', result);
    try {
      const resultsRef = collection(db, 'quiz_results');
      const docRef = await addDoc(resultsRef, {
        ...result,
        timestamp: new Date().toISOString(),
        score: Number(result.score),
        totalQuestions: Number(result.totalQuestions),
      });
      console.log('Quiz result saved successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Error in saveQuizResult:', error);
      throw error;
    }
  }, 'Error saving quiz result');
};