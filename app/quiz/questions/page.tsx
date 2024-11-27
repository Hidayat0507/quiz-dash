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
import { 
  getQuizProgress,
  createQuizProgress,
  updateQuizProgress,
  type QuizProgress 
} from '@/lib/quizFlow';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Save } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QuizQuestions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);

  const categoryId = searchParams.get('categoryId');

  useEffect(() => {
    const loadQuestionsAndCategory = async () => {
      if (!categoryId || !user) {
        toast.error('Missing category parameter');
        router.push('/quiz');
        return;
      }

      try {
        const [quizzes, categories, existingProgress] = await Promise.all([
          getQuizzes(),
          getCategories(),
          getQuizProgress(user.uid, categoryId)
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

        // Set the current quiz
        setCurrentQuiz(matchingQuizzes[0]);

        // Get all questions
        const allQuestions = matchingQuizzes.reduce<QuizQuestion[]>((acc: QuizQuestion[], quiz: Quiz) => {
          return [...acc, ...quiz.questions];
        }, []);

        if (existingProgress) {
          setQuizProgress(existingProgress);
          
          // Convert saved answers to our answer format
          const savedAnswers: { [key: number]: string } = {};
          const savedOrder = existingProgress.questionOrder || [];
          
          if (savedOrder.length > 0) {
            // Use saved question order
            setQuestionOrder(savedOrder);
            
            // Get only unanswered questions
            const answeredIndices = new Set(existingProgress.answeredQuestions.map(q => 
              savedOrder.indexOf(parseInt(q.questionId))
            ));
            
            // Filter out answered questions and keep only unanswered ones
            const unansweredQuestions = savedOrder
              .map((originalIndex, currentIndex) => ({
                question: allQuestions[originalIndex],
                currentIndex
              }))
              .filter(({ currentIndex }) => !answeredIndices.has(currentIndex))
              .map(({ question }) => question);

            if (unansweredQuestions.length === 0) {
              toast.info('All questions have been answered. Starting a new quiz.');
              // Create new order for a fresh start
              const newOrder = Array.from({ length: allQuestions.length }, (_, i) => i);
              const shuffledOrder = [...newOrder].sort(() => Math.random() - 0.5);
              setQuestionOrder(shuffledOrder);
              setQuestions(shuffledOrder.map(index => allQuestions[index]));
              setAnswers({});
              // Create new progress
              const newProgress = await createQuizProgress(user.uid, matchingQuizzes[0].id || '', categoryId);
              setQuizProgress(newProgress);
            } else {
              setQuestions(unansweredQuestions);
              
              // Map saved answers
              existingProgress.answeredQuestions.forEach(q => {
                const originalIndex = parseInt(q.questionId);
                const currentIndex = savedOrder.indexOf(originalIndex);
                if (currentIndex !== -1) {
                  savedAnswers[currentIndex] = q.answer;
                }
              });
              setAnswers(savedAnswers);
            }
          } else {
            // If no saved order, create new one
            const newOrder = Array.from({ length: allQuestions.length }, (_, i) => i);
            const shuffledOrder = [...newOrder].sort(() => Math.random() - 0.5);
            setQuestionOrder(shuffledOrder);
            setQuestions(shuffledOrder.map(index => allQuestions[index]));
          }
        } else {
          // Create new random order for questions
          const newOrder = Array.from({ length: allQuestions.length }, (_, i) => i);
          const shuffledOrder = [...newOrder].sort(() => Math.random() - 0.5);
          setQuestionOrder(shuffledOrder);
          setQuestions(shuffledOrder.map(index => allQuestions[index]));
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        toast.error('Failed to load questions');
        router.push('/quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionsAndCategory();
  }, [categoryId, router, user]);

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

  const handleNext = async () => {
    if (!user) {
      toast.error('User not authenticated');
      router.push('/login');
      return;
    }

    if (currentQuestion + 1 === questions.length) {
      const score = Object.values(answers).reduce((total, answer, index) => {
        return total + (answer === questions[index].correctAnswer ? 1 : 0);
      }, 0);

      setSubmitting(true);
      try {
        // Mark the current question as answered in progress
        if (quizProgress?.id) {
          const currentAnswers = {
            ...answers,
            [currentQuestion]: selectedAnswer
          };

          const answeredQuestions = Object.entries(currentAnswers).map(([index, answer]) => {
            const currentIndex = parseInt(index);
            const originalIndex = questionOrder[currentIndex];
            return {
              questionId: originalIndex.toString(),
              answer,
              correct: questions[currentIndex].correctAnswer === answer
            };
          });

          await updateQuizProgress(quizProgress.id, {
            answeredQuestions,
            questionOrder,
            completed: true,
            lastUpdated: new Date().toISOString()
          });
        }

        await saveQuizResult({
          categoryName,
          score,
          totalQuestions: questions.length,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          subjectName: '',
          quizId: currentQuiz?.id || ''
        });

        router.push(`/quiz/results?score=${score}&total=${questions.length}`);
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save quiz results');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Save progress for the current question
      if (quizProgress?.id) {
        const currentAnswers = {
          ...answers,
          [currentQuestion]: selectedAnswer
        };

        const answeredQuestions = Object.entries(currentAnswers).map(([index, answer]) => {
          const currentIndex = parseInt(index);
          const originalIndex = questionOrder[currentIndex];
          return {
            questionId: originalIndex.toString(),
            answer,
            correct: questions[currentIndex].correctAnswer === answer
          };
        });

        try {
          await updateQuizProgress(quizProgress.id, {
            answeredQuestions,
            questionOrder,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving progress:', error);
          toast.error('Failed to save progress');
        }
      }

      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
      setShowFeedback(false);
      setHasAnswered(false);
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

  const handleSaveAndExit = async () => {
    if (!user || !categoryId || !currentQuiz) {
      toast.error('Session expired or quiz not properly loaded. Please try again.');
      router.push('/quiz');
      return;
    }

    try {
      setSubmitting(true);
      // Save current progress
      const currentAnswers = {
        ...answers,
        ...(selectedAnswer ? { [currentQuestion]: selectedAnswer } : {})
      };

      // Map current answers back to original question indices
      const answeredQuestions = Object.entries(currentAnswers).map(([index, answer]) => {
        const currentIndex = parseInt(index);
        const originalIndex = questionOrder[currentIndex];
        return {
          questionId: originalIndex.toString(),
          answer,
          correct: questions[currentIndex].correctAnswer === answer
        };
      });

      if (quizProgress?.id) {
        // Update existing progress
        await updateQuizProgress(quizProgress.id, {
          answeredQuestions,
          questionOrder,
          lastUpdated: new Date().toISOString(),
          completed: false
        });
      } else {
        // Create new progress with answers
        const newProgress = await createQuizProgress(user.uid, currentQuiz.id || '', categoryId);
        // Update the newly created progress with answers
        if (newProgress.id) {
          await updateQuizProgress(newProgress.id, {
            answeredQuestions,
            questionOrder,
            lastUpdated: new Date().toISOString(),
            completed: false
          });
        }
      }

      toast.success('Progress saved successfully');
      router.push('/quiz');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
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
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{categoryName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Question {currentQuestion + 1} of {questions.length} • {answeredCount} Answered
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-lg font-bold text-blue-600">{Math.round((answeredCount / questions.length) * 100)}%</p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="space-y-4 sm:space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-medium text-gray-800 break-words">
              {currentQuestionData.question}
            </h3>
          </div>

          {/* Answer Options */}
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerSelect}
            className="border rounded-lg overflow-hidden divide-y divide-gray-200"
          >
            {currentQuestionData.options.map((option, index) => (
              <div
                key={option}
                className={`relative flex items-center ${
                  hasAnswered
                    ? option === currentQuestionData.correctAnswer
                      ? 'bg-green-50'
                      : option === selectedAnswer
                      ? 'bg-red-50'
                      : 'hover:bg-gray-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Label
                  htmlFor={option}
                  className={`flex items-center w-full p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                    selectedAnswer === option && !hasAnswered
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <RadioGroupItem
                    value={option}
                    id={option}
                    className="mr-3 sm:mr-4 flex-shrink-0"
                    disabled={hasAnswered}
                  />
                  <span className="flex items-center min-w-0 flex-1">
                    <span className="font-medium mr-2 flex-shrink-0">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="break-words">{option}</span>
                  </span>
                  {hasAnswered && (
                    <span className="absolute right-3 sm:right-4 flex-shrink-0">
                      {option === currentQuestionData.correctAnswer ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : option === selectedAnswer ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Feedback Alert */}
          {showFeedback && selectedAnswer && (
            <Alert 
              variant={isCorrect ? "default" : "destructive"}
              className={`mt-4 transition-all duration-300 ${
                isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <AlertDescription className="text-sm sm:text-base">
                  {isCorrect ? (
                    <span className="font-medium text-green-800">Correct! Well done!</span>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-red-800">
                        Incorrect. The correct answer is: {currentQuestionData.correctAnswer}
                      </p>
                      {currentQuestionData.explanation && (
                        <p className="text-sm text-red-600 break-words">{currentQuestionData.explanation}</p>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4 pt-2 sm:pt-4">
        <Button
          variant="outline"
          onClick={handleSaveAndExit}
          className="flex items-center justify-center space-x-2 hover:bg-blue-50 transition-colors w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save & Exit</span>
        </Button>
        <div className="w-full sm:w-auto">
          {!hasAnswered ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors w-full"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors w-full"
            >
              {currentQuestion + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}