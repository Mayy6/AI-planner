import { useState, useEffect } from 'react';

export function useStreak(userId) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const key = `streak_${userId}`;
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify({ count: 1, lastDate: today }));
      setStreak(1);
      return;
    }

    const { count, lastDate } = JSON.parse(stored);
    if (lastDate === today) {
      setStreak(count);
      return;
    }
    if (lastDate === yesterday.toDateString()) {
      const next = count + 1;
      localStorage.setItem(key, JSON.stringify({ count: next, lastDate: today }));
      setStreak(next);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ count: 1, lastDate: today }));
    setStreak(1);
  }, [userId]);

  return streak;
}
