"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { BookOpen, Brain } from 'lucide-react';
import { getSubjects, getCategories, type Subject, type Category } from '@/lib/db';
import { toast } from 'sonner';

export default function QuizPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const fetchedSubjects = await getSubjects();
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!selectedSubject) {
        setCategories([]);
        return;
      }

      try {
        const fetchedCategories = await getCategories(selectedSubject);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [selectedSubject]);

  const handleStartQuiz = () => {
    if (!selectedSubject || !selectedCategory) {
      toast.error('Please select subject and category');
      return;
    }

    router.push(`/quiz/questions?categoryId=${selectedCategory}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <h1 className="text-3xl font-bold">Start a Quiz</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <BookOpen className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Choose Subject</h2>
            <p className="text-sm text-gray-500 text-center">Select your exam subject</p>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
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
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Brain className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Pick Category</h2>
            <p className="text-sm text-gray-500 text-center">Choose a specific topic</p>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              disabled={!selectedSubject}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedSubject ? "Select a category" : "Select a subject first"} />
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
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          size="lg"
          onClick={handleStartQuiz}
          disabled={!selectedSubject || !selectedCategory}
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
}