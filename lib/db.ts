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
  getDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

const handleFirebaseError = async <T>(operation: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(errorMessage, error);
    throw error;
  }
};

// User Profile Interface
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

// Subject Interface
export interface Subject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

// Category Interface
export interface Category {
  id: string;
  name: string;
  subjectId: string;
  description: string;
  createdAt: string;
}

// Quiz Interface
export interface Quiz {
  id: string;
  // Add other quiz properties here
}

// Subject functions
export const getSubjects = async (): Promise<Subject[]> => {
  return handleFirebaseError(async () => {
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    const subjects = subjectsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subject));

    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  }, 'Error getting subjects');
};

export const addSubject = async (data: { name: string; description: string }): Promise<Subject> => {
  return handleFirebaseError(async () => {
    const subjectData = {
      name: data.name.trim(),
      description: data.description.trim(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'subjects'), subjectData);
    return {
      id: docRef.id,
      ...subjectData
    };
  }, 'Error adding subject');
};

// Category functions
export const getCategories = async (subjectId?: string): Promise<Category[]> => {
  return handleFirebaseError(async () => {
    const categoriesRef = collection(db, 'categories');
    
    const categoriesQuery = subjectId
      ? query(categoriesRef, where('subjectId', '==', subjectId))
      : categoriesRef;

    const categoriesSnap = await getDocs(categoriesQuery);
    const categories = categoriesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }, 'Error getting categories');
};

export const addCategory = async (data: { 
  name: string; 
  subjectId: string;
  description: string;
}): Promise<Category> => {
  return handleFirebaseError(async () => {
    const categoryData = {
      name: data.name.trim(),
      subjectId: data.subjectId,
      description: data.description.trim(),
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
export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    const quizRef = collection(db, 'quizzes');
    const snapshot = await getDocs(quizRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
  } catch (error) {
    console.error('Error getting all quizzes:', error);
    return [];
  }
}

// User Profile functions
export const createUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<boolean> => {
  return handleFirebaseError(async () => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
    return true;
  }, 'Error creating user profile');
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  return handleFirebaseError(async () => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return null;
    
    return {
      id: userSnap.id,
      ...userSnap.data()
    } as UserProfile;
  }, 'Error getting user profile');
};