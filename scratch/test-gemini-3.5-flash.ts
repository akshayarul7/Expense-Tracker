import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Say hello' }] }],
    }),
  });
  
  if (!res.ok) {
    console.error('API Error:', await res.text());
  } else {
    const data = await res.json();
    console.log('Success:', data.candidates?.[0]?.content?.parts?.[0]?.text);
  }
}
test();
