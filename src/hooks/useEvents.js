import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

function storageKey(userId) {
  return `events_${userId}`;
}

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(storageKey(user.id));
    setEvents(raw ? JSON.parse(raw) : []);
  }, [user]);

  const persist = useCallback((updated) => {
    setEvents(updated);
    localStorage.setItem(storageKey(user.id), JSON.stringify(updated));
  }, [user]);

  const addEvent = useCallback((event) => {
    const newEvent = { ...event, id: crypto.randomUUID() };
    persist([...events, newEvent]);
    return newEvent;
  }, [events, persist]);

  const removeEvent = useCallback((id) => {
    persist(events.filter(e => e.id !== id));
  }, [events, persist]);

  return { events, addEvent, removeEvent };
}
