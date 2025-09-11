const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/translate', async (req, res) => {
  const { text: textToTranslate } = req.body;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) { return res.status(500).json({ error: 'API Key not configured on the server.' }); }
  if (!textToTranslate) { return res.status(400).json({ error: 'No text provided to translate.' }); }

  const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: `Translate "${textToTranslate}" into English. Provide only the translated text, without any introductory phrases.` }] }],
  };

  try {
    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) { throw new Error(`Google API returned an error: ${response.status}`); }
    const result = await response.json();
    const translatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedText) { throw new Error('API response did not contain a valid translation.'); }
    res.status(200).json({ translation: translatedText.trim() });
  } catch (error) {
    console.error('Translation server error:', error);
    res.status(500).json({ error: 'Failed to communicate with the translation API.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
