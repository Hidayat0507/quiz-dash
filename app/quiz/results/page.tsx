"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, ArrowRight, BarChart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/auth-context';
import { saveQuizResult, type QuizResult } from '@/lib/quiz';
import { toast } from 'sonner';

export default function QuizResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const score = parseInt(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const categoryName = searchParams.get('categoryName');
  const percentage = (score / total) * 100;
  const { user } = useAuth();

  useEffect(() => {
    if (percentage >= 70) {
      // Initial burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD']
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 75,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.6 },
          colors: ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD']
        });
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.6 },
          colors: ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD']
        });
      }, 300);
    }
  }, [percentage]);

  useEffect(() => {
    const saveResult = async () => {
      if (user && categoryName && !isNaN(score) && !isNaN(total)) {
        try {
          const newResult: QuizResult = {
            userId: user.uid,
            score: score,
            totalQuestions: total,
            categoryName: decodeURIComponent(categoryName),
            timestamp: new Date().toISOString(),
            subjectName: decodeURIComponent(categoryName),
            quizId: 'practice-quiz'
          };
          await saveQuizResult(newResult);
        } catch (error) {
          console.error('Error saving quiz result:', error);
          toast.error('Failed to save quiz result');
        }
      }
    };

    saveResult();
  }, [user, score, total, categoryName]);

  const getGrade = () => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'text-green-500' };
    if (percentage >= 70) return { text: 'Good Job!', color: 'text-blue-500' };
    if (percentage >= 50) return { text: 'Keep Practicing!', color: 'text-yellow-500' };
    return { text: 'Need Improvement', color: 'text-red-500' };
  };

  const grade = getGrade();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center animate-[bounce_1s_ease-in-out]">Quiz Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
          <div className="flex flex-col items-center space-y-4">
            <Trophy className="w-12 h-12 text-yellow-500 animate-[bounce_2s_ease-in-out_infinite]" />
            <h2 className="text-xl font-semibold">Score</h2>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text animate-[pulse_2s_ease-in-out_infinite]">
              {score}/{total}
            </p>
          </div>
        </Card>

        <Card className="p-6 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
          <div className="flex flex-col items-center space-y-4">
            <Target className="w-12 h-12 text-blue-500 animate-[spin_3s_linear_infinite]" />
            <h2 className="text-xl font-semibold">Accuracy</h2>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-teal-500 text-transparent bg-clip-text animate-[pulse_2s_ease-in-out_infinite]">
              {Math.round(percentage)}%
            </p>
          </div>
        </Card>

        <Card className="p-6 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className={`text-4xl font-bold ${grade.color} animate-[bounce_2s_ease-in-out_infinite]`}>
              {grade.text}
            </div>
            <p className="text-sm text-gray-500 text-center">
              {percentage >= 70 ? 
                '🎉 Amazing performance! Keep it up! 🌟' : 
                '💪 Keep learning! You&apos;ll get this! 🚀'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              What&apos;s Next? 🚀
            </h2>
            <p className="text-gray-500">
              Continue your amazing learning journey! ✨
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push('/quiz')}>
              Try Another Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/quiz/performance')}
              className="flex items-center"
            >
              <BarChart className="mr-2 h-4 w-4" />
              View Performance History
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}