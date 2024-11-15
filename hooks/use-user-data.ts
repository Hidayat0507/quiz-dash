"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserProfile, getQuizResults, getSettings } from '@/lib/db';
import { toast } from 'sonner';
import { Brain, Target, Trophy, Activity } from 'lucide-react';

export function useUserData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [profileData, resultsData, settingsData] = await Promise.all([
          getUserProfile(user.uid),
          getQuizResults(user.uid),
          getSettings(user.uid)
        ]);

        setProfile(profileData);
        setQuizResults(resultsData || []);
        setSettings(settingsData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Transform quiz results into dashboard stats
  const stats = quizResults.length > 0 ? [
    {
      title: 'Total Quizzes',
      value: quizResults.length.toString(),
      icon: Brain,
      change: `${quizResults.length} quiz${quizResults.length === 1 ? '' : 'zes'} completed`
    },
    {
      title: 'Average Score',
      value: `${Math.round(
        quizResults.reduce((acc, result) => 
          acc + (result.score / result.totalQuestions) * 100, 0
        ) / quizResults.length
      )}%`,
      icon: Target,
      change: 'Overall performance'
    },
    {
      title: 'Best Score',
      value: `${Math.round(
        Math.max(...quizResults.map(result => 
          (result.score / result.totalQuestions) * 100
        ))
      )}%`,
      icon: Trophy,
      change: 'Highest achievement'
    },
    {
      title: 'Recent Activity',
      value: quizResults[0] ? new Date(quizResults[0].timestamp).toLocaleDateString() : 'No activity',
      icon: Activity,
      change: quizResults[0] ? 
        `${quizResults[0].score}/${quizResults[0].totalQuestions} correct` : 
        'Take your first quiz'
    }
  ] : [];

  // Transform data for charts
  const performanceData = quizResults
    .slice(-6)
    .reverse()
    .map(result => ({
      month: new Date(result.timestamp).toLocaleDateString('en-US', { month: 'short' }),
      score: Math.round((result.score / result.totalQuestions) * 100)
    }));

  // Calculate category distribution
  const categoryData = Object.entries(
    quizResults.reduce((acc: { [key: string]: number }, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({
    category,
    completed: count
  }));

  return { 
    profile, 
    stats, 
    settings, 
    loading, 
    error,
    performanceData,
    categoryData,
    recentResults: quizResults.slice(0, 5) // Last 5 results for recent activity
  };
}