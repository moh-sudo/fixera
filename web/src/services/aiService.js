import { supabase } from '../supabase';

export async function askFixeraAI(messages) {
  const trimmed = [...messages].filter(m => m.role !== 'system');
  while (trimmed.length > 0 && trimmed[0].role === 'assistant') trimmed.shift();
  if (trimmed.length === 0) return "Hi! How can I help you today? 😊";

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/ai-chat', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    },
    body:    JSON.stringify({ messages: trimmed }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Error ${res.status}`);
  }

  const data = await res.json();
  return data.reply || "Sorry, I couldn't process that. Try again!";
}

export async function quickAsk(prompt) {
  return askFixeraAI([{ role: 'user', content: prompt }]);
}