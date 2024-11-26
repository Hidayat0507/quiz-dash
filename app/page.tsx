"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Award, Brain, Clock, Target, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { getQuizResults, type QuizResult } from '@/lib/quiz';

export default function Dashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const quizResults = await getQuizResults(user.uid);
        setResults(quizResults.sort((a: QuizResult, b: QuizResult) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        setError(null);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError(error instanceof Error ? error.message : 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Welcome to Quiz Dashboard</h1>
        <p className="text-gray-500">Please sign in to view your quiz performance</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const performanceData = results.slice(0, 6).reverse().map(result => ({
    date: new Date(result.timestamp).toLocaleDateString(),
    score: Math.round((result.score / result.totalQuestions) * 100)
  }));

  const categoryData = Object.entries(
    results.reduce((acc: { [key: string]: number }, result) => {
      acc[result.categoryName] = (acc[result.categoryName] || 0) + 1;
      return acc;
    }, {})
  ).map(([categoryName, completed]) => ({
    categoryName,
    completed
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Button onClick={() => router.push('/quiz')}>Take Another Quiz</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Quizzes</p>
              <p className="text-2xl font-bold">{results.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  results.reduce((acc, curr) => 
                    acc + (curr.score / curr.totalQuestions) * 100, 0
                  ) / results.length || 0
                )}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold">{categoryData.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="text-2xl font-bold">
                {results.reduce((acc, curr) => acc + curr.totalQuestions, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Performance Trend</h2>
          <p className="text-sm text-gray-500">Your quiz scores over time</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Distribution */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Category Distribution</h2>
          <p className="text-sm text-gray-500">Number of quizzes taken per category</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Recent Quiz History</h2>
          <p className="text-sm text-gray-500">Your latest quiz attempts and scores</p>
        </div>
        <div className="space-y-4">
          {results.slice(0, 5).map((result, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{result.categoryName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold">
                {Math.round((result.score / result.totalQuestions) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}