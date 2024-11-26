"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, X, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { 
  addCategory, 
  addSubject,
  getSubjects,
  getCategories, 
  type Category,
  type Subject,
} from '@/lib/db';
import { createQuiz, type Quiz, type QuizQuestion } from '@/lib/quiz';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const QuizUpload = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  
  const [loadingData, setLoadingData] = useState(true);
  const [addingSubject, setAddingSubject] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedSubjects = await getSubjects();
        setSubjects(fetchedSubjects);
      } catch (error) {
        toast.error('Failed to load subjects');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!subject) {
        setCategories([]);
        return;
      }

      try {
        const fetchedCategories = await getCategories(subject);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [subject]);

  const addNewSubject = async () => {
    if (!newSubject.trim() || !newSubjectDesc.trim()) {
      toast.error('Please fill in all subject fields');
      return;
    }

    setAddingSubject(true);
    try {
      const newSubjectObj = await addSubject({
        name: newSubject,
        description: newSubjectDesc
      });

      setSubjects(prev => [...prev, newSubjectObj]);
      setSubject(newSubjectObj.id);
      setNewSubject('');
      setNewSubjectDesc('');
      setSubjectDialogOpen(false);
      toast.success('Subject added successfully');
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    } finally {
      setAddingSubject(false);
    }
  };

  const addNewCategory = async () => {
    if (!subject) {
      toast.error('Please select a subject first');
      return;
    }

    if (!newCategory.trim() || !newCategoryDesc.trim()) {
      toast.error('Please fill in all category fields');
      return;
    }

    setAddingCategory(true);
    try {
      const newCategoryObj = await addCategory({
        name: newCategory,
        subjectId: subject,
        description: newCategoryDesc
      });

      setCategories(prev => [...prev, newCategoryObj]);
      setCategory(newCategoryObj.id);
      setNewCategory('');
      setNewCategoryDesc('');
      setCategoryDialogOpen(false);
      toast.success('Category added successfully');
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
    if (!currentQuestion.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const nonEmptyOptions = options.filter(opt => opt.trim());
    if (nonEmptyOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    if (!correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    if (!options.includes(correctAnswer)) {
      toast.error('Correct answer must be one of the options');
      return;
    }

    setQuestions([...questions, {
      question: currentQuestion,
      options: [...options],
      correctAnswer,
      explanation: explanation.trim() || null
    }]);

    // Reset form
    setCurrentQuestion('');
    setOptions(['', '', '', '', '']);
    setCorrectAnswer('');
    setExplanation('');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!subject || !category) {
      toast.error('Please select a subject and category');
      return;
    }

    if (questions.length < 5) {
      toast.error('Please add at least 5 questions');
      return;
    }

    setSaving(true);
    try {
      const quizData: Omit<Quiz, 'id'> = {
        title: `${subject} Quiz`,
        subjectId: subject,
        categoryId: category,
        categoryName: categories.find(c => c.id === category)?.name || '',
        questions,
        createdAt: new Date().toISOString(),
        userId: user?.uid || '',
        isActive: true
      };

      await createQuiz(quizData);
      toast.success('Quiz created successfully!');
      router.push('/quiz-bank');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create a Quiz</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Subject Name</Label>
                      <Input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="e.g., MRCS Part A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newSubjectDesc}
                        onChange={(e) => setNewSubjectDesc(e.target.value)}
                        placeholder="Brief description of the subject"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={addNewSubject} 
                      disabled={addingSubject || !newSubject.trim() || !newSubjectDesc.trim()}
                      className="w-full"
                    >
                      {addingSubject ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Subject'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory} disabled={!subject}>
                <SelectTrigger>
                  <SelectValue placeholder={subject ? "Select a category" : "Select a subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" disabled={!subject}>
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
                        placeholder="e.g., Anatomy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                        placeholder="Brief description of the category"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={addNewCategory} 
                      disabled={addingCategory || !newCategory.trim() || !newCategoryDesc.trim()}
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
        </Card>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={index} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeQuestion(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Question Text</label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Enter the question"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Options</label>
                  <div className="space-y-2">
                    {options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <span className="text-sm font-medium w-6">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Correct Answer</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Explanation (Optional)</label>
                  <Textarea
                    value={explanation || ''}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Explain why this answer is correct"
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button
            onClick={addQuestion}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Quiz'}
        </Button>
      </div>
    </div>
  );
};

export default QuizUpload;