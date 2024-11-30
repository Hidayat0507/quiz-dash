"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Award, Brain, Clock, Target, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getQuizResults, type QuizResult } from '@/lib/quiz';
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from 'next/navigation';

export default function QuizPerformance() {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const score = searchParams.get('score');
  const total = searchParams.get('total');
  const categoryName = searchParams.get('categoryName');

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Then fetch all results
        const quizResults = await getQuizResults(user.uid);
        console.log('Setting results:', quizResults);
        setResults(quizResults.sort((a: QuizResult, b: QuizResult) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        setError(null);
      } catch (error) {
        console.error('Error in fetchResults:', error);
        setError(error instanceof Error ? error.message : 'Failed to load quiz results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Please Sign In</h2>
          <p className="text-gray-500 mb-4">You need to be signed in to view your performance.</p>
          <Button onClick={() => router.push('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Quiz Results Yet</h2>
          <p className="text-gray-500 mb-4">Take your first quiz to start tracking your performance!</p>
          <Button onClick={() => router.push('/quiz')}>Start a Quiz</Button>
        </div>
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
  ).map(([category, count]) => ({
    category,
    attempts: count
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <Button onClick={() => router.push('/quiz')}>Take Another Quiz</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Quizzes</p>
              <h3 className="text-2xl font-bold mt-1">{results.length}</h3>
            </div>
            <Brain className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Best Score</p>
              <h3 className="text-2xl font-bold mt-1">
                {Math.round(
                  Math.max(...results.map(result => 
                    (result.score / result.totalQuestions) * 100
                  ))
                )}%
              </h3>
            </div>
            <Trophy className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recent Activity</p>
              <h3 className="text-2xl font-bold mt-1">
                {new Date(results[0].timestamp).toLocaleDateString()}
              </h3>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Performance Trend</h2>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last 6 quizzes</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Category Attempts</h2>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">By subject</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="attempts" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Recent Quiz History</h2>
          <p className="text-sm text-gray-500">Your latest quiz attempts and scores</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map((result, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2">{result.categoryName}</td>
                  <td className="py-2">
                    {Math.round((result.score / result.totalQuestions) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}