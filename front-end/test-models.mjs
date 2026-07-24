const apiKey = process.env.GEMINI_API_KEY || 'YOUR_API_KEY';
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
.then(async r => {
  console.log('Status:', r.status);
  const data = await r.json();
  console.log('Models:', data.models ? data.models.map(m => m.name) : data);
});
