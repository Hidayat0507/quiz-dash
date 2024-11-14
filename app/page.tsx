"use client";

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Award, Brain, Clock, Target, Trophy } from 'lucide-react';
import { useUserData } from '@/hooks/use-user-data';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { stats, loading, error } = useUserData();
  const router = useRouter();

  const defaultStats = [
    { 
      title: 'Total Quizzes', 
      value: '0',
      icon: Brain,
      change: 'No quizzes taken'
    },
    { 
      title: 'Average Score', 
      value: '0%',
      icon: Target,
      change: 'No data available'
    },
    { 
      title: 'Best Performance', 
      value: '0%',
      icon: Trophy,
      change: 'No attempts yet'
    },
    { 
      title: 'Recent Activity', 
      value: '0',
      icon: Activity,
      change: 'No recent activity'
    }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  // Sample performance data - replace with actual data from your backend
  const performanceData = [
    { month: 'Jan', score: 75 },
    { month: 'Feb', score: 82 },
    { month: 'Mar', score: 78 },
    { month: 'Apr', score: 85 },
    { month: 'May', score: 90 },
    { month: 'Jun', score: 88 }
  ];

  const categoryData = [
    { category: 'Web Dev', completed: 8 },
    { category: 'Mobile', completed: 5 },
    { category: 'Cloud', completed: 6 },
    { category: 'AI/ML', completed: 4 }
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <Button onClick={() => router.push('/quiz')}>Take a Quiz</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon || Activity;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  <p className="text-sm text-green-500 mt-1">{stat.change}</p>
                </div>
                <Icon className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Performance Trend</h2>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last 6 months</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quiz Categories</h2>
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Completion rate</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="completed" 
                  fill="#3b82f6"
                  name="Completed Quizzes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="text-sm text-gray-500">Your latest quiz attempts and achievements</p>
        </div>
        <div className="space-y-4">
          {stats.length > 0 ? (
            stats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{stat.title}</p>
                    <p className="text-sm text-gray-500">{stat.change}</p>
                  </div>
                </div>
                <span className="text-lg font-semibold">{stat.value}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No recent activity</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => router.push('/quiz')}
              >
                Start Your First Quiz
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}