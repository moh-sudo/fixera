// ─────────────────────────────────────────────────────────────
//  Fixera — Fixy AI Edge Function
//  Supabase Edge Function: /functions/v1/fixy-ai
//  Calls Gemini API server-side so the key stays secret
// ─────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are Fixy, the smart AI assistant for Fixera — a home services platform in Nairobi, Kenya.

Your personality: friendly, helpful, professional, and concise. Use short responses (max 3–4 sentences unless the user asks for detail). Occasionally use relevant emojis.

What you know about Fixera:
- Services offered: Plumbing 💧, Electrical ⚡, Cleaning ✨, Painting 🎨
- Location: Nairobi, Kenya — serving Westlands, Kilimani, Karen, Lavington, Parklands, CBD and surrounding areas
- Bookings: Customers pick a service → choose a professional → pick date/time → confirm
- Inspection system: Customers can request an inspection for problems they can't identify — pros assess and send a quotation
- Emergency services: Available 24/7, under 30 minute response
- Payment: M-Pesa (primary), card (coming soon)
- All professionals are vetted, background-checked and rated by customers

Price estimates (KSh):
- Pipe leak repair: 1,500 – 4,000
- Drain unblocking: 1,000 – 2,500
- Toilet repair: 1,200 – 3,000
- Socket/switch repair: 800 – 2,000
- Wiring installation: 3,000 – 8,000
- Deep house cleaning (2BR): 2,500 – 4,500
- Carpet cleaning: 1,500 – 3,500
- Interior painting (per room): 4,000 – 9,000
- Emergency call-out fee: +500

When a user describes a problem, identify which Fixera service applies and suggest they book it.
You CANNOT process payments, make bookings, or access real account data. Guide users to the relevant page instead.
If asked something outside home services, politely say you are specialized for home services.`;

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret not set' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Gemini requires conversations to START with a user turn —
    // strip any leading assistant messages (e.g. the welcome greeting)
    const trimmed = [...messages];
    while (trimmed.length > 0 && trimmed[0].role === 'assistant') {
      trimmed.shift();
    }
    if (trimmed.length === 0) {
      return new Response(JSON.stringify({ text: "Hi! How can I help you today? 😊" }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Build Gemini contents array
    const contents = trimmed.map((m: { role: string; content: string }) => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 400, topP: 0.9 },
    };

    // Try each model in order
    let lastError = 'Unknown error';
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        lastError = (err as any)?.error?.message || `HTTP ${res.status}`;
        console.warn(`[fixy-ai] ${model} failed: ${lastError}`);
        continue;
      }

      const data = await res.json();
      const text = (data as any).candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) { lastError = 'Empty response from model'; continue; }

      //
      return new Response(JSON.stringify({ text }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // All models failed
    console.error('[fixy-ai] All models failed. Last error:', lastError);
    return new Response(JSON.stringify({ error: lastError }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[fixy-ai] Unexpected error:', e.message);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
