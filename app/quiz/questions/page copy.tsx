"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/auth-context';
import { getCategories, type Category } from '@/lib/db';
import { getQuizzes, saveQuizResult, type QuizQuestion, type Quiz } from '@/lib/quiz';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const categoryId = searchParams.get('categoryId');

  useEffect(() => {
    const loadQuestionsAndCategory = async () => {
      if (!categoryId) {
        toast.error('Missing category parameter');
        router.push('/quiz');
        return;
      }

      try {
        const [quizzes, categories] = await Promise.all([
          getQuizzes(),
          getCategories()
        ]);

        // Find category name
        const category = categories.find((c: Category) => c.id === categoryId);
        if (category) {
          setCategoryName(category.name);
        }

        const matchingQuizzes = quizzes.filter((quiz: Quiz) => 
          quiz.categoryId === categoryId
        );

        if (!matchingQuizzes.length) {
          toast.error('No questions available for this category');
          router.push('/quiz');
          return;
        }

        // Get all questions from matching quizzes
        const allQuestions = matchingQuizzes.reduce<QuizQuestion[]>((acc: QuizQuestion[], quiz: Quiz) => {
          return [...acc, ...quiz.questions];
        }, []);

        // Shuffle questions for variety
        const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading questions:', error);
        }
        
        toast.error(error instanceof Error 
          ? `Failed to load questions: ${error.message}` 
          : 'Failed to load questions'
        );
        router.push('/quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionsAndCategory();
  }, [categoryId, router]);

  const handleAnswerSelect = (answer: string) => {
    if (!hasAnswered) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }
    setHasAnswered(true);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!selectedAnswer || !hasAnswered) {
      toast.error('Please answer the question first');
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: selectedAnswer
    }));
    setSelectedAnswer('');
    setShowFeedback(false);
    setHasAnswered(false);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    if (!user || !categoryId) {
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
      await saveQuizResult({
        categoryName,
        score,
        totalQuestions: questions.length,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        subjectName: '',
        quizId: ''
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
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600">No questions available.</p>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const isCorrect = selectedAnswer === currentQuestionData.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{categoryName}</h2>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <Progress value={(currentQuestion + 1) / questions.length * 100} />
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">{currentQuestionData.question}</h3>

          <RadioGroup 
            value={selectedAnswer} 
            onValueChange={handleAnswerSelect}
            className={hasAnswered ? 'pointer-events-none opacity-80' : ''}
          >
            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // Convert 0-4 to A-E
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} disabled={hasAnswered} />
                    <Label 
                      htmlFor={`option-${index}`}
                      className={
                        hasAnswered
                          ? option === currentQuestionData.correctAnswer
                            ? 'text-green-600 font-medium'
                            : option === selectedAnswer && option !== currentQuestionData.correctAnswer
                              ? 'text-red-600'
                              : ''
                          : ''
                      }
                    >
                      {optionLabel}. {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {showFeedback && selectedAnswer && (
            <Alert variant={isCorrect ? "default" : "destructive"} className="mt-4">
              <div className="flex items-center space-x-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {isCorrect ? (
                    "Correct! Well done!"
                  ) : (
                    <>
                      Incorrect. The correct answer is: {currentQuestionData.correctAnswer}
                      {currentQuestionData.explanation && (
                        <p className="mt-2 text-sm">{currentQuestionData.explanation}</p>
                      )}
                    </>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
        {!hasAnswered ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={submitting}
          >
            {currentQuestion + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
}