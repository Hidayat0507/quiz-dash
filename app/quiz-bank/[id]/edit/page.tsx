"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { getQuiz, updateQuiz, getSubjects, getCategories, type Quiz, type Subject, type Category, type QuizQuestion } from '@/lib/quiz';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditQuizPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        console.log('Fetching quiz with ID:', resolvedParams.id);
        const [fetchedQuiz, fetchedSubjects] = await Promise.all([
          getQuiz(resolvedParams.id),
          getSubjects()
        ]);

        if (!isMounted) return;

        console.log('Fetched quiz:', fetchedQuiz);
        if (!fetchedQuiz) {
          toast.error('Quiz not found');
          router.push('/quiz-bank');
          return;
        }

        setQuiz(fetchedQuiz);
        setTitle(fetchedQuiz.title);
        setSelectedSubject(fetchedQuiz.subjectId);
        setSelectedCategory(fetchedQuiz.categoryId);
        setQuestions(fetchedQuiz.questions);
        setSubjects(fetchedSubjects);

        // Fetch categories after setting subject
        setLoadingCategories(true);
        try {
          const fetchedCategories = await getCategories(fetchedQuiz.subjectId);
          if (isMounted) {
            setCategories(fetchedCategories);
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
          }
        } finally {
          if (isMounted) {
            setLoadingCategories(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching quiz:', error);
          toast.error('Failed to load quiz');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (resolvedParams.id) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, router]);

  const handleSubjectChange = async (value: string) => {
    setSelectedSubject(value);
    setSelectedCategory('');
    setLoadingCategories(true);
    try {
      const fetchedCategories = await getCategories(value);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: string | string[]) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    const options = [...updatedQuestions[questionIndex].options];
    options[optionIndex] = value;
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options
    };
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: null
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questions.length < 5) {
      toast.error('Please add at least 5 questions');
      return;
    }

    if (!title || !selectedSubject || !selectedCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate questions
    const invalidQuestions = questions.filter(q => 
      !q.question || 
      !q.options.every(opt => opt.trim()) || 
      !q.correctAnswer ||
      !q.options.includes(q.correctAnswer) ||
      (q.explanation !== null && q.explanation.trim() === '') // Validate explanation if provided
    );

    if (invalidQuestions.length > 0) {
      toast.error('Please complete all questions with valid options and correct answers. If providing an explanation, it cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      await updateQuiz(resolvedParams.id, {
        title,
        subjectId: selectedSubject,
        categoryId: selectedCategory,
        categoryName: categories.find(c => c.id === selectedCategory)?.name || '',
        questions: questions.map(q => ({
          ...q,
          explanation: q.explanation?.trim() || null
        })),
        createdAt: quiz?.createdAt || new Date().toISOString(),
        userId: quiz?.userId || '',
        isActive: true
      });
      
      toast.success('Quiz updated successfully!');
      router.push('/quiz-bank');
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
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={selectedSubject} onValueChange={handleSubjectChange}>
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                  disabled={!selectedSubject || loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingCategories 
                        ? "Loading categories..." 
                        : selectedSubject 
                          ? "Select a category" 
                          : "Select a subject first"
                    } />
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
          </form>
        </Card>

        <div className="space-y-4">
          {questions.map((question, questionIndex) => (
            <Card key={questionIndex} className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Question {questionIndex + 1}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => removeQuestion(questionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Question Text</label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                    placeholder="Enter the question"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Options</label>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <span className="text-sm font-medium w-6">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Correct Answer</label>
                  <RadioGroup
                    value={question.correctAnswer}
                    onValueChange={(value) => handleQuestionChange(questionIndex, 'correctAnswer', value)}
                  >
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`q${questionIndex}-opt${optionIndex}`} />
                          <Label htmlFor={`q${questionIndex}-opt${optionIndex}`}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Explanation (Optional)</label>
                  <Textarea
                    value={question.explanation || ''}
                    onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
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
      </div>
    </div>
  );
}
