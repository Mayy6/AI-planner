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

  // Add many events atomically — avoids stale-closure overwrite when called in a loop
  const addEvents = useCallback((list) => {
    const added = list.map(ev => ({ ...ev, id: crypto.randomUUID() }));
    persist([...events, ...added]);
    return added;
  }, [events, persist]);

  // Atomically replace all events from a conversation with a new set.
  // Tags every event with conversationId so they can be found and swapped on re-accept.
  const replaceEventsByConversation = useCallback((conversationId, newList) => {
    const kept = events.filter(e => e.conversationId !== conversationId);
    const added = newList.map(ev => ({ ...ev, id: crypto.randomUUID(), conversationId }));
    persist([...kept, ...added]);
    return added;
  }, [events, persist]);

  // Returns conflicting existing events for a list of candidates.
  // Pass excludeConvId to ignore events from a conversation that will be replaced anyway.
  const checkConflicts = useCallback((candidates, excludeConvId = null) => {
    const pool = excludeConvId
      ? events.filter(e => e.conversationId !== excludeConvId)
      : events;

    return candidates.reduce((acc, candidate) => {
      const hits = pool.filter(e =>
        e.date === candidate.date &&
        e.startTime < candidate.endTime &&
        e.endTime > candidate.startTime
      );
      if (hits.length > 0) acc.push({ candidate, conflictsWith: hits });
      return acc;
    }, []);
  }, [events]);

  const removeEvent = useCallback((id) => {
    persist(events.filter(e => e.id !== id));
  }, [events, persist]);

  const toggleComplete = useCallback((id) => {
    persist(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  }, [events, persist]);

  return { events, addEvent, addEvents, replaceEventsByConversation, checkConflicts, removeEvent, toggleComplete };
}
