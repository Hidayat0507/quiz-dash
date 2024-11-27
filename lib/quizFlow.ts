"use client";

import { Quiz, QuizQuestion } from './quiz';

// Basic quiz state interface
export interface QuizState {
  currentQuestion: number;
  answers: {
    answer: string;
    isCorrect: boolean;
  }[];
  categoryId?: string;
  lastAnswered?: {
    answer: string;
    showFeedback: boolean;
  };
}

// Storage key for quiz state
const QUIZ_STATE_KEY = 'quiz_state';

// Initialize quiz state
export const initializeQuiz = (categoryId: string): QuizState => {
  // Try to load saved state first
  const savedState = loadQuizState();
  if (savedState && savedState.categoryId === categoryId) {
    return savedState;
  }

  // If no saved state or different category, create new state
  return {
    currentQuestion: 0,
    answers: [],
    categoryId
  };
};

// Save quiz state to localStorage
export const saveQuizState = (state: QuizState): void => {
  try {
    localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save quiz state:', error);
  }
};

// Load quiz state from localStorage
export const loadQuizState = (): QuizState | null => {
  try {
    const saved = localStorage.getItem(QUIZ_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load quiz state:', error);
    return null;
  }
};

// Clear saved quiz state
export const clearQuizState = (): void => {
  localStorage.removeItem(QUIZ_STATE_KEY);
};

// Save current answer state (for refresh handling)
export const saveCurrentAnswer = (
  state: QuizState,
  answer: string,
  showFeedback: boolean
): QuizState => {
  const newState = {
    ...state,
    lastAnswered: {
      answer,
      showFeedback
    }
  };
  saveQuizState(newState);
  return newState;
};

// Get unanswered questions
export const getUnansweredQuestions = (quiz: Quiz, state: QuizState): QuizQuestion[] => {
  const answeredIndices = new Set(
    state.answers.map((_, index) => index)
  );
  
  return quiz.questions.filter((_, index) => !answeredIndices.has(index));
};

// Get next unanswered question
export const getNextUnansweredQuestion = (quiz: Quiz, state: QuizState): QuizQuestion | null => {
  const unanswered = getUnansweredQuestions(quiz, state);
  return unanswered.length > 0 ? unanswered[0] : null;
};

// Handle answer submission
export const submitAnswer = (
  state: QuizState,
  answer: string,
  correctAnswer: string
): QuizState => {
  const newState = {
    ...state,
    currentQuestion: state.currentQuestion + 1,
    answers: [
      ...state.answers,
      {
        answer,
        isCorrect: answer === correctAnswer
      }
    ],
    lastAnswered: undefined // Clear last answered state after submission
  };

  saveQuizState(newState);
  return newState;
};

// Get current question
export const getCurrentQuestion = (quiz: Quiz, state: QuizState): QuizQuestion | null => {
  if (state.currentQuestion >= quiz.questions.length) {
    return null;
  }
  return quiz.questions[state.currentQuestion];
};

// Calculate score
export const calculateScore = (state: QuizState): number => {
  return state.answers.filter(a => a.isCorrect).length;
};