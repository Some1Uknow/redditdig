require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const { generateText } = require('ai'); 
const { mistral } = require('@ai-sdk/mistral');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
  const { messages } = req.body;
  const lastUserMessage = messages[messages.length - 1];
  const keywords = lastUserMessage?.content;

  if (!keywords) {
    return res.status(400).json({ error: 'No query provided' });
  }

  try {
    const scraperPromise = new Promise((resolve, reject) => {
      const args = ['--keywords', keywords, '--limit', '10'];
      const process = spawn('node', [path.join(__dirname, 'reddit-search.js'), ...args]);
      let stdout = '', stderr = '';
      process.stdout.on('data', (data) => (stdout += data));
      process.stderr.on('data', (data) => (stderr += data));
      process.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Scraper failed: ${stderr}`));
        try { resolve(JSON.parse(stdout)); }
        catch (e) { reject(new Error('Failed to parse scraper JSON.')); }
      });
    });

    const { posts } = await scraperPromise;
    
    // 2. Format the context for the AI
    const context = posts.map((post, index) =>
      `Source [${index + 1}]: r/${post.subreddit} - "${post.title}"`
    ).join('\n');

    const prompt = `Based on the following Reddit post titles, provide a concise, one-paragraph summary of the main topics being discussed.
    
    Titles:
    ${context}
    
    Summary:`;

    // 3. Get the complete AI response - NO STREAMING
    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      prompt: prompt,
    });

    // 4. Send a single JSON response with the summary and sources
    res.json({
      summary: text,
      sources: posts,
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});