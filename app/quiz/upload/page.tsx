"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileType, File, Loader2, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { uploadQuiz } from '@/lib/db';
import { toast } from 'sonner';
import type { Quiz, QuizQuestion } from '@/lib/db';

const categories = [
  { id: 'web', name: 'Web Development' },
  { id: 'mobile', name: 'Mobile Development' },
  { id: 'cloud', name: 'Cloud Computing' },
  { id: 'ai', name: 'Artificial Intelligence' },
];

const difficulties = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

export default function QuizUpload() {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [saving, setSaving] = useState(false);

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
    if (!user?.uid || !title || !category || !difficulty || questions.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await uploadQuiz(user.uid, {
        title,
        category,
        difficulty,
        questions,
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      
      toast.success('Quiz saved successfully!');
      // Reset form
      setTitle('');
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

  const validOptions = options.filter(option => option.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create Quiz</h1>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Quiz Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
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
                  {validOptions.map((option, index) => (
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