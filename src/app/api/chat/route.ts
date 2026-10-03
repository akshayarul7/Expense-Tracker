import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { accessToken, messages } = await req.json();
    
    if (!accessToken || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Create a Supabase client with the user's token so RLS works
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch all expenses to feed into the prompt (up to 2000 for safety, but usually enough for personal tracking)
    const { data: expenses } = await supabase
      .from('expenses')
      .select('name, amount, category, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(2000);

    const expenseContext = expenses ? JSON.stringify(expenses) : 'No expenses recorded.';

    const systemPrompt = `You are an expert personal finance assistant. 
Your job is to answer the user's questions about their financial data.
Be concise, helpful, and direct. Use bullet points when listing things.

Here is the user's expense data in JSON format:
${expenseContext}

When analyzing dates, remember that the current date is ${new Date().toISOString()}.
Answer the user's query accurately based on the data provided above.`;

    // Map messages to Gemini's format
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Inject system prompt into the first message or use system_instruction if supported
    // For REST API v1beta, systemInstruction is supported in the root of the request
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.2, // low temp for accurate data analysis
      },
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate chat response' }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I am unable to answer that right now.';

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
