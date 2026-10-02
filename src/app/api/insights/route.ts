import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

export const maxDuration = 60;
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { accessToken, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd } = await req.json();
    
    if (!accessToken || !thisMonthStart || !thisMonthEnd) {
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

    // Fetch this month's expenses
    const { data: thisMonthExpenses } = await supabase
      .from('expenses')
      .select('name, amount, category, date')
      .eq('user_id', user.id)
      .gte('date', thisMonthStart)
      .lte('date', thisMonthEnd)
      .order('amount', { ascending: false });

    // Fetch last month's expenses
    const { data: lastMonthExpenses } = await supabase
      .from('expenses')
      .select('name, amount, category, date')
      .eq('user_id', user.id)
      .gte('date', lastMonthStart)
      .lte('date', lastMonthEnd);

    const current = thisMonthExpenses || [];
    const previous = lastMonthExpenses || [];

    if (current.length === 0) {
      return NextResponse.json({ 
        insights: "No expenses recorded this month yet. Start tracking to get insights!" 
      });
    }

    // Compute summaries to send to the LLM (not raw data)
    const currentTotal = current.reduce((s, e) => s + e.amount, 0);
    const previousTotal = previous.reduce((s, e) => s + e.amount, 0);

    const currentByCategory: Record<string, number> = {};
    current.forEach(e => { currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount; });

    const previousByCategory: Record<string, number> = {};
    previous.forEach(e => { previousByCategory[e.category] = (previousByCategory[e.category] || 0) + e.amount; });

    const topExpenses = current.slice(0, 5).map(e => `${e.name}: $${e.amount.toFixed(2)}`);

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedTotal = (currentTotal / dayOfMonth) * daysInMonth;

    const prompt = `You are a personal finance assistant. Analyze this user's spending data and provide 3-4 concise, actionable bullet-point insights. Be specific with numbers. Don't be preachy — be direct and helpful.
If there is very little data (e.g. only 1 or 2 transactions), just provide 1 or 2 encouraging bullet points about starting to track expenses, rather than trying to force trend analysis.

Current month: ${format(now, 'MMMM yyyy')} (day ${dayOfMonth} of ${daysInMonth})
Total spent so far: $${currentTotal.toFixed(2)}
Projected month total: $${projectedTotal.toFixed(2)}
Last month total: $${previousTotal.toFixed(2)}

This month by category:
${Object.entries(currentByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`).join('\n')}

Last month by category:
${Object.entries(previousByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`).join('\n')}

Top 5 expenses this month:
${topExpenses.join('\n')}

Respond with ONLY the bullet points (use • as the bullet character), no intro or outro text. Keep each bullet to 1-2 sentences max.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const insights = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate insights.';

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Insights error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
