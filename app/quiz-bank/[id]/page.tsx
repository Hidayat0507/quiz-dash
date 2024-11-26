"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft } from 'lucide-react';
import { getQuiz, getSubjects, getCategories, type Quiz, type Subject, type Category } from '@/lib/db';
import { toast } from 'sonner';

export default function ViewQuizPage({ params }: { params: { id: string } }) {
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
        setCategory(categories.find(c => c.id === fetchedQuiz.category) || null);
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex items-center"
          onClick={() => router.push('/quiz-bank')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quiz Bank
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/quiz-bank/${params.id}/edit`)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Quiz
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{subject?.name}</span>
            <span>•</span>
            <span>{category?.name}</span>
            <span>•</span>
            <span>{quiz.questions.length} questions</span>
          </div>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((question, index) => (
            <Card key={index} className="p-6">
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
          ))}
        </div>
      </div>
    </div>
  );
}
