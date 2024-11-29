"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getCategories } from '@/lib/db';
import { getQuizzes, type Quiz } from '@/lib/quiz';
import { 
  initializeQuiz,
  submitAnswer,
  getCurrentQuestion,
  calculateScore,
  getUnansweredQuestions,
  clearQuizState,
  saveCurrentAnswer,
  type QuizState 
} from '@/lib/quizFlow';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QuizQuestions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('categoryId');

  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState<number>(0);

  useEffect(() => {
    const initializeQuizData = async () => {
      if (!categoryId) {
        toast.error('Missing category ID');
        router.push('/quiz');
        return;
      }

      try {
        // Fetch initial data
        const [quizzes, categories] = await Promise.all([
          getQuizzes(),
          getCategories()
        ]);

        // Set category name
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          setCategoryName(category.name);
        }

        // Find matching quiz
        const matchingQuizzes = quizzes.filter(quiz => quiz.categoryId === categoryId);
        if (!matchingQuizzes.length) {
          toast.error('No questions available for this category');
          router.push('/quiz');
          return;
        }

        const quiz = matchingQuizzes[0];
        setCurrentQuiz(quiz);

        // Initialize quiz state with categoryId
        const initialState = initializeQuiz(categoryId);
        setQuizState(initialState);

        // Calculate remaining questions
        const unanswered = getUnansweredQuestions(quiz, initialState);
        setRemainingQuestions(unanswered.length);

      } catch (error) {
        console.error('Error initializing quiz:', error);
        toast.error('Failed to load quiz');
        router.push('/quiz');
      } finally {
        setLoading(false);
      }
    };

    initializeQuizData();
  }, [categoryId, router]);

  const handleAnswerSelect = (answer: string) => {
    if (!showFeedback && quizState) {
      setSelectedAnswer(answer);
      // Save current answer state for refresh handling
      setQuizState(saveCurrentAnswer(quizState, answer, false));
    }
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !quizState) {
      toast.error('Please select an answer');
      return;
    }
    setShowFeedback(true);
    // Save feedback state for refresh handling
    setQuizState(saveCurrentAnswer(quizState, selectedAnswer, true));
  };

  const handleNext = () => {
    if (!currentQuiz || !quizState) return;

    const currentQuestion = getCurrentQuestion(currentQuiz, quizState);
    if (!currentQuestion) return;

    // Update quiz state with the answer
    const newState = submitAnswer(
      quizState,
      selectedAnswer,
      currentQuestion.correctAnswer
    );
    setQuizState(newState);

    // Update remaining questions count
    const unanswered = getUnansweredQuestions(currentQuiz, newState);
    setRemainingQuestions(unanswered.length);

    // Check if quiz is complete
    if (unanswered.length === 0) {
      const finalScore = calculateScore(newState);
      clearQuizState(); // Clear saved state when quiz is complete
      router.push(`/quiz/results?score=${finalScore}&total=${currentQuiz.questions.length}&categoryName=${encodeURIComponent(categoryName)}`);
    } else {
      // Reset for next question
      setSelectedAnswer('');
      setShowFeedback(false);
    }
  };

  const handleSaveAndExit = () => {
    router.push('/quiz'); // Return to quiz categories
    toast.success('Progress saved! Continue later from where you left off.');
  };

  if (loading || !quizState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz && getCurrentQuestion(currentQuiz, quizState);
  if (!currentQuiz || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600">No questions available</p>
        </div>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  // Show 100% progress when on the last question
  const progress = remainingQuestions === 1 ? 100 : 
    Math.round(((currentQuiz.questions.length - remainingQuestions) / currentQuiz.questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{categoryName}</h2>
            <p className="text-sm text-gray-500">
              {remainingQuestions} questions remaining
            </p>
          </div>
          <Button variant="outline" onClick={handleSaveAndExit}>
            Save & Exit
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-3">{currentQuestion.question}</h3>
        
        <RadioGroup
          value={selectedAnswer}
          onValueChange={handleAnswerSelect}
          className="space-y-2"
        >
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all duration-200 ${
                showFeedback
                  ? option === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : option === selectedAnswer
                    ? 'border-red-500 bg-red-50'
                    : 'border-transparent'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label
                htmlFor={`option-${index}`}
                className="flex-grow cursor-pointer py-0.5"
              >
                {option}
              </Label>
              {showFeedback && option === currentQuestion.correctAnswer && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {showFeedback && option === selectedAnswer && !isCorrect && (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </RadioGroup>

        {showFeedback && (
          <Alert className={`mt-3 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <AlertDescription>
              <div className="space-y-1.5">
                <p>{isCorrect ? 'Correct!' : 'Incorrect. The correct answer is: ' + currentQuestion.correctAnswer}</p>
                {currentQuestion.explanation && (
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Explanation: </span>
                    {currentQuestion.explanation}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {!showFeedback ? (
          <Button 
            onClick={handleSubmitAnswer}
            className="px-6"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            className="px-6"
          >
            {remainingQuestions === 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
}