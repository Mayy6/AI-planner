import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const DEMO_KEY = 'demo_conversations';
const demoMsgKey = (id) => `demo_msgs_${id}`;

// Falls back to localStorage when supabase is unavailable or user is in demo mode
function useIsDemo(user) {
  return !supabase || user?.id === 'demo-user';
}

export function useConversations() {
  const { user } = useAuth();
  const isDemo = useIsDemo(user);
  const [conversations, setConversations] = useState([]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    if (isDemo) {
      const raw = localStorage.getItem(DEMO_KEY);
      setConversations(raw ? JSON.parse(raw) : []);
      return;
    }
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id, title, plan, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setConversations(data || []);
    } catch (err) {
      console.error('[DB] loadConversations failed:', err.message);
      setConversations([]);
    }
  }, [user, isDemo]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const createConversation = useCallback(async (title = 'New conversation') => {
    if (!user) return null;
    const now = new Date().toISOString();
    if (isDemo) {
      const conv = { id: crypto.randomUUID(), title, plan: null, created_at: now, updated_at: now };
      const raw = localStorage.getItem(DEMO_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(DEMO_KEY, JSON.stringify([conv, ...existing]));
      setConversations(prev => [conv, ...prev]);
      return conv;
    }
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;
      setConversations(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('[DB] createConversation failed:', err.message);
      console.error('👉 Have you run the SQL to create the conversations table in Supabase?');
      return null;
    }
  }, [user, isDemo]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!user) return [];
    if (isDemo) {
      const raw = localStorage.getItem(demoMsgKey(conversationId));
      return raw ? JSON.parse(raw) : [];
    }
    try {
      const { data } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return data || [];
    } catch {
      return [];
    }
  }, [user, isDemo]);

  const addMessage = useCallback(async (conversationId, role, content) => {
    if (!user) return null;
    const now = new Date().toISOString();
    if (isDemo) {
      const msg = { id: crypto.randomUUID(), conversation_id: conversationId, role, content, created_at: now };
      const key = demoMsgKey(conversationId);
      const raw = localStorage.getItem(key);
      const msgs = raw ? JSON.parse(raw) : [];
      localStorage.setItem(key, JSON.stringify([...msgs, msg]));
      return msg;
    }
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, role, content })
        .select()
        .single();
      if (error) throw error;
      await supabase.from('conversations').update({ updated_at: now }).eq('id', conversationId);
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, updated_at: now } : c)
      );
      return data;
    } catch (err) {
      console.error('[DB] addMessage failed:', err.message);
      return null;
    }
  }, [user, isDemo]);

  const updateTitle = useCallback(async (conversationId, title) => {
    if (!user) return;
    if (isDemo) {
      const raw = localStorage.getItem(DEMO_KEY);
      const convs = raw ? JSON.parse(raw) : [];
      const updated = convs.map(c => c.id === conversationId ? { ...c, title } : c);
      localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
      setConversations(updated);
      return;
    }
    try {
      await supabase.from('conversations').update({ title }).eq('id', conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
    } catch {}
  }, [user, isDemo]);

  const savePlan = useCallback(async (conversationId, plan) => {
    if (!user) return;
    if (isDemo) {
      const raw = localStorage.getItem(DEMO_KEY);
      const convs = raw ? JSON.parse(raw) : [];
      const updated = convs.map(c => c.id === conversationId ? { ...c, plan } : c);
      localStorage.setItem(DEMO_KEY, JSON.stringify(updated));
      setConversations(updated);
      return;
    }
    try {
      await supabase.from('conversations').update({ plan }).eq('id', conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, plan } : c));
    } catch {}
  }, [user, isDemo]);

  const deleteConversation = useCallback(async (id) => {
    if (!user) return;
    if (isDemo) {
      const raw = localStorage.getItem(DEMO_KEY);
      const convs = raw ? JSON.parse(raw) : [];
      localStorage.setItem(DEMO_KEY, JSON.stringify(convs.filter(c => c.id !== id)));
      localStorage.removeItem(demoMsgKey(id));
      setConversations(prev => prev.filter(c => c.id !== id));
      return;
    }
    try {
      await supabase.from('conversations').delete().eq('id', id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch {}
  }, [user, isDemo]);

  return {
    conversations,
    loadConversations,
    createConversation,
    loadMessages,
    addMessage,
    updateTitle,
    savePlan,
    deleteConversation,
  };
}
