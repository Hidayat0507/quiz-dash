"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Quiz } from "@/lib/quiz";

interface QuizBankCardProps {
  quiz: Quiz;
  onStartQuiz: (categoryId: string) => void;
}

export function QuizBankCard({ quiz, onStartQuiz }: QuizBankCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{quiz.categoryName}</h3>
            <p className="text-sm text-gray-500">
              {quiz.questions.length} questions
            </p>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <Button 
            onClick={() => onStartQuiz(quiz.categoryId)}
            className="w-full sm:w-auto"
          >
            Start Quiz
          </Button>
        </div>
      </div>
    </Card>
  );
}
