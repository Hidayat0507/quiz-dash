"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { getQuiz, updateQuiz, type Quiz, type QuizQuestion } from '@/lib/quiz';
import { toast } from 'sonner';

interface EditQuestionForm {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
}

export default function QuestionsPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(-1);
  const [editForm, setEditForm] = useState<EditQuestionForm>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: null
  });
  const [saving, setSaving] = useState(false);
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
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id, router]);

  const handleEditClick = (index: number) => {
    if (!quiz) return;
    
    const question = quiz.questions[index];
    setEditForm({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });
    setSelectedQuestionIndex(index);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (index: number) => {
    setSelectedQuestionIndex(index);
    setDeleteDialogOpen(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...editForm.options];
    newOptions[index] = value;
    setEditForm(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleSaveQuestion = async () => {
    if (!quiz?.id || selectedQuestionIndex === -1) {
      toast.error('Invalid quiz or question');
      return;
    }

    // Validate form
    if (!editForm.question.trim()) {
      toast.error('Question text is required');
      return;
    }

    const nonEmptyOptions = editForm.options.filter(opt => opt.trim());
    if (nonEmptyOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }

    if (!editForm.correctAnswer || !editForm.options.includes(editForm.correctAnswer)) {
      toast.error('Please select a valid correct answer');
      return;
    }

    setSaving(true);
    try {
      const updatedQuestions = [...quiz.questions];
      updatedQuestions[selectedQuestionIndex] = {
        ...editForm,
        options: editForm.options.filter(opt => opt.trim())
      };

      await updateQuiz(quiz.id, {
        ...quiz,
        questions: updatedQuestions
      });

      setQuiz(prev => prev ? { ...prev, questions: updatedQuestions } : null);
      toast.success('Question updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!quiz?.id || selectedQuestionIndex === -1) {
      toast.error('Invalid quiz or question');
      return;
    }

    try {
      const updatedQuestions = quiz.questions.filter((_, index) => index !== selectedQuestionIndex);
      
      if (updatedQuestions.length < 5) {
        toast.error('Quiz must have at least 5 questions');
        return;
      }

      await updateQuiz(quiz.id, {
        ...quiz,
        questions: updatedQuestions
      });

      setQuiz(prev => prev ? { ...prev, questions: updatedQuestions } : null);
      toast.success('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    } finally {
      setSelectedQuestionIndex(-1);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading questions...</p>
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
      </div>

      <div>
        <h1 className="text-2xl font-bold">{quiz.title} - Questions</h1>
        <p className="text-gray-500 mt-1">Manage quiz questions</p>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((question, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Question {index + 1}</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(index)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteClick(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p>{question.question}</p>

              <div className="ml-4 space-y-1">
                {question.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`flex items-center space-x-2 ${
                      option === question.correctAnswer ? 'text-green-600 font-medium' : ''
                    }`}
                  >
                    <span>{String.fromCharCode(65 + optIndex)}.</span>
                    <span>{option}</span>
                  </div>
                ))}
              </div>

              {question.explanation && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">Explanation:</p>
                  <p>{question.explanation}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={editForm.question}
                onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {editForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-medium w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <div className="space-y-2">
                {editForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="correctAnswer"
                      value={option}
                      checked={option === editForm.correctAnswer}
                      onChange={(e) => setEditForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={editForm.explanation || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, explanation: e.target.value || null }))}
                placeholder="Explain why this is the correct answer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}