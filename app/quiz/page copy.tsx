"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { Brain, BookOpen, Gauge } from 'lucide-react';

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

export default function QuizPage() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const router = useRouter();

  const handleStartQuiz = () => {
    if (category && difficulty) {
      router.push(`/quiz/questions?category=${category}&difficulty=${difficulty}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Quiz Selection</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Brain className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Choose Category</h2>
            <p className="text-sm text-gray-500 text-center">Select a topic you want to test your knowledge in</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Gauge className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Set Difficulty</h2>
            <p className="text-sm text-gray-500 text-center">Choose how challenging you want the quiz to be</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <BookOpen className="w-12 h-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Start Learning</h2>
            <p className="text-sm text-gray-500 text-center">Begin the quiz and test your knowledge</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
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
            <label className="text-sm font-medium">Difficulty</label>
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

          <Button 
            className="w-full"
            onClick={handleStartQuiz}
            disabled={!category || !difficulty}
          >
            Start Quiz
          </Button>
        </div>
      </Card>
    </div>
  );
}