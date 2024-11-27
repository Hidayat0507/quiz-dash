"use client";

import { Quiz } from "@/lib/quiz";
import { QuizBankCard } from "./QuizBankCard";

interface QuizBankListProps {
  quizzes: Quiz[];
  onStartQuiz: (categoryId: string) => void;
}

export function QuizBankList({ quizzes, onStartQuiz }: QuizBankListProps) {
  if (!quizzes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No quizzes available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quizzes.map((quiz) => (
        <QuizBankCard
          key={quiz.id}
          quiz={quiz}
          onStartQuiz={onStartQuiz}
        />
      ))}
    </div>
  );
}
