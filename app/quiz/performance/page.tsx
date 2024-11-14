"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/auth-context';
import { getQuizResults, type QuizResult } from '@/lib/db';

export default function QuizPerformance() {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;

      try {
        const quizResults = await getQuizResults(user.uid);
        setResults(quizResults.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const performanceData = results.map(result => ({
    date: new Date(result.timestamp).toLocaleDateString(),
    score: (result.score / result.totalQuestions) * 100
  }));

  const categoryData = Object.entries(
    results.reduce((acc: { [key: string]: number }, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({
    category,
    attempts: count
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Performance Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Score Trends</h2>
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
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="attempts" 
                  fill="#3b82f6"
                  name="Number of Attempts"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Quiz History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Difficulty</th>
                <th className="text-left py-2">Score</th>
                <th className="text-left py-2">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 10).map((result, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2">
                    {new Date(result.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-2">{result.category}</td>
                  <td className="py-2">{result.difficulty}</td>
                  <td className="py-2">
                    {result.score}/{result.totalQuestions}
                  </td>
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