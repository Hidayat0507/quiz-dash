"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Award, Brain, Clock, Target, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { getQuizResults } from '@/lib/db';

export default function Dashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
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
        setResults(quizResults);
        setError(null);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load quiz results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

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
    month: new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short' }),
    score: Math.round((result.score / result.totalQuestions) * 100)
  }));

  const categoryData = Object.entries(
    results.reduce((acc: { [key: string]: number }, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, completed]) => ({
    category,
    completed
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Button onClick={() => router.push('/quiz')}>Take Another Quiz</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <p className="text-sm text-gray-500">Average Score</p>
              <h3 className="text-2xl font-bold mt-1">
                {Math.round(
                  results.reduce((acc, result) => 
                    acc + (result.score / result.totalQuestions) * 100, 0
                  ) / results.length
                )}%
              </h3>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#888" 
                  fontSize={12}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                  name="Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quiz Categories</h2>
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Attempts per category</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="category" 
                  stroke="#888" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#888" 
                  fontSize={12}
                />
                <Tooltip />
                <Bar 
                  dataKey="completed" 
                  fill="#3b82f6"
                  name="Attempts"
                  radius={[4, 4, 0, 0]}
                />
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
        <div className="space-y-4">
          {results.slice(0, 5).map((result, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{result.category}</p>
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