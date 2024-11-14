import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  orderBy,
  limit 
} from 'firebase/firestore';

// Interfaces
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

// Users collection
export const createUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userSnap = await getDocs(
      query(collection(db, 'users'), where('userId', '==', userId))
    );
    if (!userSnap.empty) {
      const userData = userSnap.docs[0].data();
      return {
        id: userSnap.docs[0].id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        photoURL: userData.photoURL || '',
        userId: userData.userId
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Quiz results collection
export const getQuizResults = async (userId: string): Promise<QuizResult[]> => {
  try {
    const resultsSnap = await getDocs(
      query(
        collection(db, 'quiz_results'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      )
    );
    
    return resultsSnap.docs.map(doc => ({
      id: doc.id,
      timestamp: doc.data().timestamp,
      category: doc.data().category,
      difficulty: doc.data().difficulty,
      score: doc.data().score,
      totalQuestions: doc.data().totalQuestions,
      userId: doc.data().userId
    }));
  } catch (error) {
    console.error('Error getting quiz results:', error);
    throw error;
  }
};

// Save quiz result
export const saveQuizResult = async (userId: string, data: Omit<QuizResult, 'id'>) => {
  try {
    await addDoc(collection(db, 'quiz_results'), {
      ...data,
      userId,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error saving quiz result:', error);
    throw error;
  }
};

// Upload quiz
export const uploadQuiz = async (userId: string, data: Omit<Quiz, 'id'>) => {
  try {
    await addDoc(collection(db, 'quizzes'), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error uploading quiz:', error);
    throw error;
  }
};

// Get quizzes
export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    const quizzesSnap = await getDocs(collection(db, 'quizzes'));
    return quizzesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Quiz[];
  } catch (error) {
    console.error('Error getting quizzes:', error);
    throw error;
  }
};

// Get quiz questions
export const getQuizQuestions = async (category: string, difficulty: string): Promise<QuizQuestion[]> => {
  try {
    const questionsSnap = await getDocs(
      query(
        collection(db, 'quizzes'),
        where('category', '==', category),
        where('difficulty', '==', difficulty)
      )
    );
    const quizzes = questionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Quiz[];
    return quizzes[0]?.questions || [];
  } catch (error) {
    console.error('Error getting quiz questions:', error);
    throw error;
  }
};

// Settings collection
export const updateSettings = async (userId: string, data: any) => {
  try {
    const settingsRef = doc(db, 'settings', userId);
    await setDoc(settingsRef, {
      ...data,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const getSettings = async (userId: string) => {
  try {
    const settingsSnap = await getDocs(
      query(collection(db, 'settings'), where('userId', '==', userId))
    );
    if (!settingsSnap.empty) {
      return {
        id: settingsSnap.docs[0].id,
        ...settingsSnap.docs[0].data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};