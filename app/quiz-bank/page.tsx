"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { Plus, Upload, BookOpen, MoreVertical, Eye, Pencil, Trash2, Settings, Save, Loader2 } from 'lucide-react';
import { getSubjects, getCategories, type Subject, type Category } from '@/lib/db';
import { getQuizzes, deleteQuiz, updateQuiz, type Quiz } from '@/lib/quiz';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QuizBankPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [fetchedQuizzes, fetchedSubjects] = await Promise.all([
        getQuizzes(),
        getSubjects()
      ]);
      setQuizzes(fetchedQuizzes);
      setSubjects(fetchedSubjects);

      // Fix: Convert Set to Array using Array.from() and spread operator
      const subjectIds = Array.from(new Set(fetchedQuizzes.map(quiz => quiz.subjectId)));
      const categoriesPromises = subjectIds.map(id => getCategories(id));
      const fetchedCategories = await Promise.all(categoriesPromises);
      const allCategories = fetchedCategories.flat();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load quiz bank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete?.id) return;

    try {
      await deleteQuiz(quizToDelete.id);
      toast.success('Quiz deleted successfully');
      fetchData(); // Refresh the quiz list
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    } finally {
      setQuizToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setEditDialogOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!editingQuiz?.id) return;

    setSaving(true);
    try {
      await updateQuiz(editingQuiz.id, editingQuiz);
      toast.success('Quiz updated successfully');
      fetchData(); // Refresh the quiz list
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading quiz bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quiz Bank</h1>
          <p className="text-gray-500 mt-1">Manage and organize your quizzes</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => router.push('/quiz-bank/create')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
          <Button onClick={() => router.push('/quiz-bank/upload')} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Quiz
          </Button>
          <Button onClick={() => router.push('/quiz-bank/manage')} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Manage Quizzes
          </Button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">No Quizzes Yet</h2>
              <p className="text-gray-500">Start by creating a new quiz or uploading one.</p>
            </div>
            <div className="space-x-2">
              <Button onClick={() => router.push('/quiz-bank/create')} variant="outline">
                Create Quiz
              </Button>
              <Button onClick={() => router.push('/quiz-bank/upload')} variant="outline">
                Upload Quiz
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const subject = subjects.find(s => s.id === quiz.subjectId);
            const category = categories.find(c => c.id === quiz.categoryId);
            
            return (
              <Card key={quiz.id} className="p-6 hover:border-primary transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium truncate">{quiz.title}</h3>
                      <p className="text-sm text-gray-500">
                        {subject?.name} • {category?.name}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/quiz-bank/${quiz.id}/questions`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditQuiz(quiz)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            setQuizToDelete(quiz);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Questions:</span>
                      <span className="font-medium">{quiz.questions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Created:</span>
                      <span className="font-medium">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => router.push(`/quiz/questions?categoryId=${quiz.categoryId}`)}
                  >
                    Start Quiz
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingQuiz?.title || ''}
                onChange={(e) => setEditingQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Quiz title"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={editingQuiz?.subjectId || ''}
                onValueChange={(value) => setEditingQuiz(prev => prev ? { ...prev, subjectId: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editingQuiz?.categoryId || ''}
                onValueChange={(value) => setEditingQuiz(prev => prev ? { ...prev, categoryId: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuiz} disabled={saving}>
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
            <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz
              {quizToDelete?.title} and all its questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
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