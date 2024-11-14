"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';
import { Brain, BookOpen, Gauge, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/auth-context';
import { getQuizzes } from '@/lib/db';

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
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const fetchedQuizzes = await getQuizzes();
        setQuizzes(fetchedQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStartQuiz = () => {
    if (category && difficulty) {
      router.push(`/quiz/questions?category=${category}&difficulty=${difficulty}`);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !category || quiz.category === category;
    const matchesDifficulty = !difficulty || quiz.difficulty === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 md:col-span-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search quizzes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
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
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
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

        <div className="md:col-span-3">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No quizzes found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuizzes.map((quiz, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{quiz.title}</h3>
                        <p className="text-sm text-gray-500">{categories.find(c => c.id === quiz.category)?.name}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {difficulties.find(d => d.id === quiz.difficulty)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{quiz.questions?.length || 0} questions</span>
                      <Button
                        onClick={() => router.push(`/quiz/questions?id=${quiz.id}`)}
                        size="sm"
                      >
                        Start Quiz
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}