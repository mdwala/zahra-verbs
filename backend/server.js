import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3001;

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Parse JSON bodies

// --- Gemini AI Configuration ---
// In a real application, use process.env.GEMINI_API_KEY
const GEMINI_API_KEY = "AIzaSyDEDfIwZ-jDiq9tByrAtgPjwAaPTXmU9Sg";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function callGeminiApi(prompt) {
  const modelName = "gemini-2.0-flash"; // This model works with your API key
  console.log("Using model:", modelName);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = await response.text();

  // Remove markdown code blocks if present (e.g., ```json ... ```)
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  console.log("AI Response text:", text);
  return JSON.parse(text);
}

// The API endpoint our frontend will call
app.post('/api/evaluate', async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' });
  }

  console.log('Received for evaluation:');
  console.log('Question:', question);
  console.log('Answer:', answer);

  try {
    const prompt = `
      You are an AI language coach for a young child.
      The child was asked: "${question}"
      The child answered: "${answer}"
      
      Please evaluate the answer based on the following criteria:
      1.  **Vocabulary Richness:** Are they using simple words or more descriptive ones?
      2.  **Creativity:** Is the answer original or just a basic response?
      
      Return a JSON object with two keys:
      - "score": An integer from 1 to 10, where 1 is a very basic answer (e.g., "it was good") and 10 is an exceptionally creative and descriptive answer.
      - "feedback": A short, one-sentence, encouraging piece of feedback for the child. Suggest a better word they could have used.

      Example response: {"score": 8, "feedback": "Wow, 'deliciously creamy' is a fantastic way to describe it!"}
    `;

    const response = await callGeminiApi(prompt);
    res.json(response);

  } catch (error) {
    console.error('Error calling Gemini API:', error);

    // Fallback logic so the child always gets a positive response
    console.log("Using fallback scoring mechanism due to API error.");

    // Simple heuristic: 1 point per word, max 10, min 3
    const wordCount = answer.trim().split(/\s+/).length;
    let fallbackScore = Math.min(10, Math.max(3, wordCount));

    // Add some variation
    fallbackScore = Math.min(10, fallbackScore + Math.floor(Math.random() * 2));

    const fallbackResponse = {
      score: fallbackScore,
      feedback: `Good effort! You used ${wordCount} words! (Offline Mode)`
    };

    res.json(fallbackResponse);
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
