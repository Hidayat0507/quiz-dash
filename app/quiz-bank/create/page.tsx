"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, X, Loader2, Check } from 'lucide-react';
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

interface QuestionForm {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const initialQuestionForm: QuestionForm = {
  question: '',
  options: ['', '', '', '', ''],
  correctAnswer: '',
  explanation: ''
};

const QuizUpload = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(initialQuestionForm);
  
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
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addQuestion = () => {
    if (!questionForm.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const nonEmptyOptions = questionForm.options.filter(opt => opt.trim());
    if (nonEmptyOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    if (!questionForm.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    if (!questionForm.options.includes(questionForm.correctAnswer)) {
      toast.error('Correct answer must be one of the options');
      return;
    }

    const newQuestion: QuizQuestion = {
      question: questionForm.question,
      options: questionForm.options.filter(opt => opt.trim()),
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation.trim() || null
    };

    setQuestions(prev => [...prev, newQuestion]);
    setQuestionForm(initialQuestionForm);
    toast.success('Question added successfully');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    toast.success('Question removed');
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
      const categoryObj = categories.find(c => c.id === category);
      const quizData: Omit<Quiz, 'id'> = {
        title: `${categoryObj?.name || 'New'} Quiz`,
        subjectId: subject,
        categoryId: category,
        categoryName: categoryObj?.name || '',
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

        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Add New Question</h2>
            
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {questionForm.options.map((option, index) => (
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
              <Select 
                value={questionForm.correctAnswer}
                onValueChange={(value) => setQuestionForm(prev => ({ ...prev, correctAnswer: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  {questionForm.options.filter(option => option.trim() !== '').map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why this is the correct answer"
              />
            </div>

            <Button onClick={addQuestion} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </Card>

        {questions.length > 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Added Questions</h2>
                <span className="text-sm text-gray-500">Total: {questions.length}</span>
              </div>
              
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
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
                            {option === question.correctAnswer && (
                              <Check className="w-4 h-4" />
                            )}
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
            </div>
          </Card>
        )}

        <Button
          onClick={handleSubmit}
          disabled={saving || questions.length < 5}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuizUpload;