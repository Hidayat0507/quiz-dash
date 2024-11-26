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
  arrayUnion
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
    // Split the operation into smaller chunks if there are many questions
    const MAX_BATCH_SIZE = 20;
    const questions = [...quiz.questions];
    const firstBatch = questions.splice(0, MAX_BATCH_SIZE);

    // Create the initial quiz document with the first batch of questions
    const initialQuiz = {
      ...quiz,
      questions: firstBatch,
      totalQuestions: quiz.questions.length // Store total count
    };

    const docRef = await addDoc(collection(db, 'quizzes'), initialQuiz);

    // If there are remaining questions, update the document with additional batches
    if (questions.length > 0) {
      const batches = [];
      while (questions.length > 0) {
        const batch = questions.splice(0, MAX_BATCH_SIZE);
        batches.push(batch);
      }

      // Update with remaining batches sequentially
      for (const batch of batches) {
        await updateDoc(docRef, {
          questions: arrayUnion(...batch)
        });
      }
    }

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
