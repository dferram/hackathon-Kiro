const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';

// Test 1: Query param
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
}).then(async r => {
  console.log('Query param status:', r.status);
  console.log('Query param text:', await r.text());
});

// Test 2: Header
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey
  },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] })
}).then(async r => {
  console.log('Header status:', r.status);
  console.log('Header text:', await r.text());
});
