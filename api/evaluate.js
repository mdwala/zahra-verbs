import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key - In production, use environment variable GEMINI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDEDfIwZ-jDiq9tByrAtgPjwAaPTXmU9Sg";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function callGeminiApi(prompt) {
    const modelName = "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = await response.text();

    // Remove markdown code blocks if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    return JSON.parse(text);
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required.' });
    }

    try {
        const prompt = `
      You are an AI language coach for a young child.
      The child was asked: "${question}"
      The child answered: "${answer}"
      
      Please evaluate the answer based on the following criteria:
      1.  **Vocabulary Richness:** Are they using simple words or more descriptive ones?
      2.  **Creativity:** Is the answer original or just a basic response?
      
      Return a JSON object with two keys:
      - "score": An integer from 1 to 10, where 1 is a very basic answer and 10 is exceptionally creative and descriptive.
      - "feedback": A short, one-sentence, encouraging piece of feedback for the child.

      Example response: {"score": 8, "feedback": "Wow, 'deliciously creamy' is a fantastic way to describe it!"}
    `;

        const response = await callGeminiApi(prompt);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error calling Gemini API:', error);

        // Fallback scoring
        const wordCount = answer.split(/\s+/).filter(w => w.length > 0).length;
        const fallbackScore = Math.min(10, Math.max(3, wordCount));

        return res.status(200).json({
            score: fallbackScore,
            feedback: `Good effort! You used ${wordCount} words! (Offline Mode)`
        });
    }
}
