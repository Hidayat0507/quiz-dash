"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/auth-context';
import { getQuizQuestions, saveQuizResult, type QuizQuestion } from '@/lib/db';
import { toast } from 'sonner';

interface Question extends QuizQuestion {
  id: string;
}

export default function QuizQuestions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');

  useEffect(() => {
    const loadQuestions = async () => {
      if (!category || !difficulty) {
        router.push('/quiz');
        return;
      }

      try {
        const fetchedQuestions = await getQuizQuestions(category, difficulty);
        // Add unique IDs to questions
        const questionsWithIds = fetchedQuestions.map((q, index) => ({
          ...q,
          id: `q-${index}`
        }));
        setQuestions(questionsWithIds);
      } catch (error) {
        toast.error('Failed to load questions');
        router.push('/quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [category, difficulty, router]);

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers(prev => ({
        ...prev,
        [questions[currentQuestion].id]: selectedAnswer
      }));
      setSelectedAnswer('');

      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        handleQuizComplete();
      }
    }
  };

  const handleQuizComplete = async () => {
    if (!user || !category || !difficulty) return;

    const finalAnswers = {
      ...answers,
      [questions[currentQuestion].id]: selectedAnswer
    };

    const score = calculateScore(finalAnswers);
    
    try {
      await saveQuizResult(user.uid, {
        category,
        difficulty,
        score,
        totalQuestions: questions.length,
        timestamp: new Date().toISOString(),
        userId: user.uid
      });

      router.push(`/quiz/results?score=${score}&total=${questions.length}`);
    } catch (error) {
      toast.error('Failed to save quiz results');
    }
  };

  const calculateScore = (answers: { [key: string]: string }) => {
    return questions.reduce((score, question) => {
      return score + (answers[question.id] === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center">No questions available</div>;
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
            disabled={!selectedAnswer}
          >
            {currentQuestion + 1 === questions.length ? 'Finish' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}