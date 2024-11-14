"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserProfile, getQuizResults, getSettings } from '@/lib/db';

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
        setQuizResults(resultsData);
        setSettings(settingsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch user data');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Transform quiz results into stats format for dashboard compatibility
  const stats = quizResults.slice(0, 4).map(result => ({
    title: result.category,
    value: `${Math.round((result.score / result.totalQuestions) * 100)}%`,
    icon: result.icon,
    change: `${result.score}/${result.totalQuestions} correct`
  }));

  return { profile, stats, settings, loading, error };
}