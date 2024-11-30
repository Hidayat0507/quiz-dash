"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft } from 'lucide-react';
import { getQuiz, getSubjects, getCategories } from '@/lib/quiz';
import type { Quiz, Subject, Category } from '@/lib/quiz';
import { toast } from 'sonner';

interface PageProps {
  params: {
    id: string;
  };
}

// Navigation component
function QuizNavigation({ onBack, onEdit }: { onBack: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        className="flex items-center"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Quiz Bank
      </Button>
      <Button
        variant="outline"
        onClick={onEdit}
      >
        <Pencil className="w-4 h-4 mr-2" />
        Edit Quiz
      </Button>
    </div>
  );
}

// Quiz header component
function QuizHeader({ 
  title, 
  subjectName, 
  categoryName, 
  questionCount 
}: { 
  title: string;
  subjectName?: string;
  categoryName?: string;
  questionCount: number;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>{subjectName}</span>
        <span>•</span>
        <span>{categoryName}</span>
        <span>•</span>
        <span>{questionCount} questions</span>
      </div>
    </div>
  );
}

// Question component
function QuizQuestion({ 
  question, 
  index 
}: { 
  question: Quiz['questions'][0];
  index: number;
}) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <span className="font-medium text-gray-500">Q{index + 1}.</span>
          <div className="flex-1">
            <p className="font-medium">{question.question}</p>
            <ul className="mt-4 space-y-2">
              {question.options.map((option, optionIndex) => (
                <li
                  key={optionIndex}
                  className={`p-3 rounded-lg border ${
                    option === question.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  {option}
                  {option === question.correctAnswer && (
                    <span className="ml-2 text-sm text-green-600">(Correct Answer)</span>
                  )}
                </li>
              ))}
            </ul>
            {question.explanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Explanation: </span>
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading quiz...</p>
      </div>
    </div>
  );
}

export default function ViewQuizPage({ params }: PageProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const fetchedQuiz = await getQuiz(params.id);
        if (!fetchedQuiz) {
          toast.error('Quiz not found');
          router.push('/quiz-bank');
          return;
        }

        setQuiz(fetchedQuiz);

        const [subjects, categories] = await Promise.all([
          getSubjects(),
          getCategories(fetchedQuiz.subjectId)
        ]);

        setSubject(subjects.find(s => s.id === fetchedQuiz.subjectId) || null);
        setCategory(categories.find(c => c.id === fetchedQuiz.categoryId) || null);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!quiz) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <QuizNavigation 
        onBack={() => router.push('/quiz-bank')}
        onEdit={() => router.push(`/quiz-bank/${params.id}/edit`)}
      />

      <div className="space-y-6">
        <QuizHeader 
          title={quiz.title}
          subjectName={subject?.name}
          categoryName={category?.name}
          questionCount={quiz.questions.length}
        />

        <div className="space-y-4">
          {quiz.questions.map((question, index) => (
            <QuizQuestion 
              key={index}
              question={question}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
