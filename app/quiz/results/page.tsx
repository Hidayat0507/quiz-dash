"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti'

export default function QuizResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const score = parseInt(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const percentage = (score / total) * 100;

  useEffect(() => {
    if (percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [percentage]);

  const getGrade = () => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'text-green-500' };
    if (percentage >= 70) return { text: 'Good Job!', color: 'text-blue-500' };
    if (percentage >= 50) return { text: 'Keep Practicing!', color: 'text-yellow-500' };
    return { text: 'Need Improvement', color: 'text-red-500' };
  };

  const grade = getGrade();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Quiz Results</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h2 className="text-xl font-semibold">Score</h2>
            <p className="text-3xl font-bold">{score}/{total}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Target className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Accuracy</h2>
            <p className="text-3xl font-bold">{Math.round(percentage)}%</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className={`text-4xl font-bold ${grade.color}`}>{grade.text}</div>
            <p className="text-sm text-gray-500 text-center">
              {percentage >= 70 ? 'Great performance!' : 'Keep learning and try again!'}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Whats Next?</h2>
            <p className="text-gray-500">
              Continue your learning journey or try another quiz!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push('/quiz')}>
              Try Another Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push('/quiz/performance')}>
              View Performance History
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}