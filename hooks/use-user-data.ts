"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserProfile, getQuizResults, getSettings } from '@/lib/db';
import { toast } from 'sonner';

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

  // Transform quiz results into stats format for dashboard compatibility
  const stats = quizResults.slice(0, 4).map(result => ({
    title: result.category || 'Unknown',
    value: result.totalQuestions > 0 
      ? `${Math.round((result.score / result.totalQuestions) * 100)}%` 
      : '0%',
    icon: result.icon,
    change: result.totalQuestions > 0 
      ? `${result.score}/${result.totalQuestions} correct` 
      : 'No attempts'
  }));

  return { profile, stats, settings, loading, error };
}