"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Search, Settings, Save, Loader2, Eye } from 'lucide-react';
import { getSubjects, getCategories, type Subject, type Category } from '@/lib/db';
import { getQuizzes, deleteQuiz, updateQuiz, type Quiz } from '@/lib/quiz';
import { toast } from 'sonner';

export default function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

      const subjectIds = Array.from(new Set(fetchedQuizzes.map(quiz => quiz.subjectId)));
      const categoriesPromises = subjectIds.map(id => getCategories(id));
      const fetchedCategories = await Promise.all(categoriesPromises);
      
      // Remove duplicate categories
      const uniqueCategories = Array.from(
        new Map(fetchedCategories.flat().map(cat => [cat.id, cat])).values()
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubjectChange = async (value: string) => {
    setSelectedSubject(value);
    setSelectedCategory('all');
    if (value && value !== 'all') {
      try {
        const fetchedCategories = await getCategories(value);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    }
  };

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

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || quiz.subjectId === selectedSubject;
    const matchesCategory = selectedCategory === 'all' || quiz.categoryId === selectedCategory;
    return matchesSearch && matchesSubject && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex items-center"
          onClick={() => router.push('/quiz-bank')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quiz Bank
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500">Quiz Management</span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Manage Quizzes</h1>
        <p className="text-gray-500 mt-1">Edit or delete your quizzes</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={!selectedSubject || selectedSubject === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="divide-y">
            {filteredQuizzes.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                No quizzes found
              </div>
            ) : (
              filteredQuizzes.map((quiz) => {
                const subject = subjects.find(s => s.id === quiz.subjectId);
                const category = categories.find(c => c.id === quiz.categoryId);
                
                return (
                  <div
                    key={quiz.id}
                    className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-4"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{quiz.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{subject?.name}</span>
                        <span>•</span>
                        <span>{category?.name}</span>
                        <span>•</span>
                        <span>{quiz.questions.length} questions</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/quiz-bank/${quiz.id}/questions`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuiz(quiz)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setQuizToDelete(quiz);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

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