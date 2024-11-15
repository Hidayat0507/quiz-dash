"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';
import { getCategories, type Category } from '@/lib/db';
import { toast } from 'sonner';

const difficulties = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

export default function QuizPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleStartQuiz = () => {
    if (!selectedCategory || !selectedDifficulty) {
      toast.error('Please select both category and difficulty');
      return;
    }

    router.push(`/quiz/questions?categoryId=${selectedCategory}&difficulty=${selectedDifficulty}`);
  };

  if (loading) {
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
    <div className="max-w-md mx-auto mt-20">
      <Card className="p-8">
        <div className="flex flex-col items-center space-y-6">
          <Brain className="w-16 h-16 text-blue-500" />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Start a Quiz</h1>
            <p className="text-gray-500 mt-2">Choose your category and difficulty level</p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Select 
                value={selectedDifficulty} 
                onValueChange={setSelectedDifficulty}
              >
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

      <div className="mt-6">
        <Button 
          className="w-full"
          size="lg"
          onClick={handleStartQuiz}
          disabled={!selectedCategory || !selectedDifficulty}
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
}