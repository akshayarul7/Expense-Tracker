import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const start = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Write a 300 word essay about personal finance.' }] }],
    }),
  });
  
  console.log(`Took ${Date.now() - start}ms`);
  if (!res.ok) {
    console.error('API Error:', await res.text());
  } else {
    console.log('Success');
  }
}
test();
