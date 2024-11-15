"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/auth-context';
import { getQuizzes, saveQuizResult, getCategories, type QuizQuestion, type Category } from '@/lib/db';
import { toast } from 'sonner';

export default function QuizQuestions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState<string>('');

  const categoryId = searchParams.get('categoryId');
  const difficulty = searchParams.get('difficulty');

  useEffect(() => {
    const loadQuestionsAndCategory = async () => {
      if (!categoryId || !difficulty) {
        toast.error('Missing quiz parameters');
        router.push('/quiz');
        return;
      }

      try {
        const [quizzes, categories] = await Promise.all([
          getQuizzes(),
          getCategories()
        ]);

        // Find category name
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          setCategoryName(category.name);
        }

        const matchingQuizzes = quizzes.filter(
          quiz => quiz.category === categoryId && quiz.difficulty === difficulty
        );

        if (!matchingQuizzes.length) {
          toast.error('No questions available for this category and difficulty level');
          router.push('/quiz');
          return;
        }

        // Get all questions from matching quizzes
        const allQuestions = matchingQuizzes.reduce<QuizQuestion[]>((acc, quiz) => {
          return [...acc, ...quiz.questions];
        }, []);

        // Shuffle questions for variety
        const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast.error('Failed to load questions');
        router.push('/quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionsAndCategory();
  }, [categoryId, difficulty, router]);

  const handleNext = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: selectedAnswer
    }));
    setSelectedAnswer('');

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    if (!user || !categoryId || !difficulty) {
      toast.error('Session expired. Please login again.');
      router.push('/login');
      return;
    }

    const finalAnswers = {
      ...answers,
      [currentQuestion]: selectedAnswer
    };

    const score = questions.reduce((total, question, index) => {
      return total + (finalAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);

    setSubmitting(true);
    try {
      await saveQuizResult(user.uid, {
        category: categoryName, // Save category name instead of ID
        difficulty,
        score,
        totalQuestions: questions.length,
        timestamp: new Date().toISOString(),
        userId: user.uid
      });

      router.push(`/quiz/results?score=${score}&total=${questions.length}`);
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save quiz results');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Questions Available</h2>
          <p className="text-gray-500 mb-4">There are no questions for this category and difficulty level yet.</p>
          <Button onClick={() => router.push('/quiz')}>Back to Quiz Selection</Button>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-gray-500">Category:</span>
              <span className="ml-2 font-medium">{categoryName}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Difficulty:</span>
              <span className="ml-2 font-medium capitalize">{difficulty}</span>
            </div>
          </div>

          <h2 className="text-xl font-semibold">
            {questions[currentQuestion].question}
          </h2>

          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-3"
          >
            {questions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            className="w-full"
            onClick={handleNext}
            disabled={!selectedAnswer || submitting}
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : currentQuestion + 1 === questions.length ? (
              'Finish Quiz'
            ) : (
              'Next Question'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}