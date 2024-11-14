"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileType, File, Loader2, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { uploadQuiz, addCategory, getCategories, type Category } from '@/lib/db';
import { toast } from 'sonner';
import type { QuizQuestion } from '@/lib/db';

const difficulties = [
  { id: 'beginner', name: 'Beginner', color: 'bg-green-100 text-green-800' },
  { id: 'intermediate', name: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
  { id: 'advanced', name: 'Advanced', color: 'bg-red-100 text-red-800' },
];

export default function QuizUpload() {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        toast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const addNewCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const categoryExists = categories.some(cat => 
      cat.name.toLowerCase() === newCategory.toLowerCase()
    );

    if (categoryExists) {
      toast.error('This category already exists');
      return;
    }

    setAddingCategory(true);
    try {
      const newCategoryObj = await addCategory({
        name: newCategory
      });

      if (newCategoryObj) {
        setCategories(prev => [...prev, newCategoryObj]);
        setCategory(newCategoryObj.id); // Set the newly created category as selected
        setNewCategory('');
        setDialogOpen(false);
        toast.success('Category added successfully');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addQuestion = () => {
    if (!currentQuestion || options.some(opt => !opt) || !correctAnswer) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!options.includes(correctAnswer)) {
      toast.error('Correct answer must be one of the options');
      return;
    }

    setQuestions([...questions, {
      question: currentQuestion,
      options: [...options],
      correctAnswer
    }]);

    // Reset form
    setCurrentQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user?.uid || !category || !difficulty || questions.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await uploadQuiz(user.uid, {
        title: `${category}-${difficulty}-${Date.now()}`,
        category,
        difficulty,
        questions,
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      
      toast.success('Quiz saved successfully!');
      // Reset form
      setCategory('');
      setDifficulty('');
      setQuestions([]);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create Quiz</h1>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Category Name</Label>
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={addNewCategory} 
                      disabled={addingCategory || !newCategory.trim()}
                      className="w-full"
                    >
                      {addingCategory ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Category'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff.id} value={diff.id}>
                    {diff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Add Question</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Enter your question"
              />
            </div>

            <div className="space-y-4">
              <Label>Options</Label>
              {options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  {options.filter(option => option.trim() !== '').map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addQuestion} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      </Card>

      {questions.length > 0 && (
        <Card className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Preview Questions</h2>
            
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="p-4 border rounded-lg relative">
                  <button
                    onClick={() => removeQuestion(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="font-medium mb-2">Q{index + 1}: {q.question}</p>
                  <ul className="list-disc list-inside space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i} className={opt === q.correctAnswer ? 'text-green-600 font-medium' : ''}>
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Quiz'
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}