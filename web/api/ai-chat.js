// ============================================================
//  Fixera AI Chat — Vercel Serverless Function
//  Proxies Gemini 2.0 Flash so the API key stays server-side.
//  The client sends { messages: [{role,content}] } and receives
//  { reply: string }.
//
//  Required env var: GEMINI_API_KEY
// ============================================================

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are Fixy, the smart AI assistant for Fixera — a home services platform in Nairobi, Kenya.

Your personality: friendly, helpful, professional, and concise. Use short responses (max 3–4 sentences unless the user asks for detail). Occasionally use relevant emojis.

Services: Plumbing 💧, Electrical ⚡, Cleaning ✨, Painting 🎨 — Nairobi, Kenya.
Prices: Pipe leak 1,500–4,000 | Drain 1,000–2,500 | Socket 800–2,000 | 2BR cleaning 2,500–4,500 | Room painting 4,000–9,000.
Bookings: pick service → choose professional → date/time → confirm.
Emergency: 24/7, under 30 min response. Payment: M-Pesa.
You CANNOT make bookings or process payments — guide users to the app pages instead.`;

import { requireAuth } from './_auth.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireAuth(req, res);
  if (!auth) return;

  // Rate limit — protects the Gemini API quota/cost from abuse
  const allowed = await rateLimit(req, res, auth.supabase, `ai-chat:${auth.user.id}`, { max: 15, windowSeconds: 60 });
  if (!allowed) return;

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  try {
    const upstream = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 400, topP: 0.9 },
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || 'Upstream error' });
    }

    const data  = await upstream.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "Sorry, I couldn't process that. Try again!";

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'AI service unavailable' });
  }
}
