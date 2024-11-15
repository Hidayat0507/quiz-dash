"use client";

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  doc,
  enableIndexedDbPersistence,
  getDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

// Enable offline persistence with error handling
try {
  enableIndexedDbPersistence(db);
} catch (err) {
  console.warn('Persistence failed:', err);
}

// Error handling helper
const handleFirebaseError = async <T>(operation: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(errorMessage, error);
    throw error;
  }
};

// Interfaces
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  photoURL: string;
  userId: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questions: QuizQuestion[];
  createdAt: string;
  userId: string;
}

export interface QuizResult {
  id: string;
  timestamp: string;
  category: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

// User profile functions
export const createUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<boolean> => {
  return handleFirebaseError(async () => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  }, 'Error creating user profile');
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  return handleFirebaseError(async () => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        firstName: userSnap.data().firstName || '',
        lastName: userSnap.data().lastName || '',
        email: userSnap.data().email || '',
        phone: userSnap.data().phone || '',
        location: userSnap.data().location || '',
        photoURL: userSnap.data().photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        userId: userSnap.data().userId
      };
    }
    return null;
  }, 'Error getting user profile');
};

// Quiz results functions
export const getQuizResults = async (userId: string): Promise<QuizResult[]> => {
  try {
    const resultsQuery = query(
      collection(db, 'quiz_results'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const resultsSnap = await getDocs(resultsQuery);
    return resultsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult));
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      const unorderedQuery = query(
        collection(db, 'quiz_results'),
        where('userId', '==', userId)
      );
      const resultsSnap = await getDocs(unorderedQuery);
      const results = resultsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuizResult));
      
      return results.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    throw error;
  }
};

// Categories functions
export const getCategories = async (): Promise<Category[]> => {
  return handleFirebaseError(async () => {
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }, 'Error getting categories');
};

export const addCategory = async (data: { name: string }): Promise<Category> => {
  return handleFirebaseError(async () => {
    const categoryData = {
      name: data.name.trim(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    return {
      id: docRef.id,
      ...categoryData
    };
  }, 'Error adding category');
};

// Quiz functions
export const uploadQuiz = async (userId: string, data: Omit<Quiz, 'id'>): Promise<void> => {
  return handleFirebaseError(async () => {
    await addDoc(collection(db, 'quizzes'), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
  }, 'Error uploading quiz');
};

export const getQuizzes = async (): Promise<Quiz[]> => {
  return handleFirebaseError(async () => {
    const quizzesSnap = await getDocs(collection(db, 'quizzes'));
    return quizzesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Quiz));
  }, 'Error getting quizzes');
};

export const saveQuizResult = async (userId: string, data: Omit<QuizResult, 'id'>): Promise<void> => {
  return handleFirebaseError(async () => {
    await addDoc(collection(db, 'quiz_results'), {
      ...data,
      userId,
      timestamp: new Date().toISOString()
    });
  }, 'Error saving quiz result');
};