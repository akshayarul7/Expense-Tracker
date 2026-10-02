import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const start = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Write a 10 word sentence.' }] }],
    }),
  });
  
  console.log(`Took ${Date.now() - start}ms`);
  if (!res.ok) {
    console.error('API Error:', await res.text());
  } else {
    const data = await res.json();
    console.log('Success:', data.candidates?.[0]?.content?.parts?.[0]?.text);
  }
}
test();
