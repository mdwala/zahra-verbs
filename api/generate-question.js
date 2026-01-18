import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key - Use environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

    const { age, lexileLevel } = req.body;
    const childAge = age || 6;
    const childLexile = lexileLevel || 400;

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing from environment variables');
        return res.status(500).json({
            error: 'Oops! Our robot helper is taking a nap. Please try again later!'
        });
    }

    try {
        const topics = [
            'Space & Stars', 'Dinosaurs', 'Daily Routine', 'Family',
            'Friends', 'Favorite Foods', 'Dreams & Imagination', 'Superpowers',
            'School', 'Sports & Games', 'Nature & Trees', 'Colors & Art',
            'Emotions', 'Holidays', 'Inventions', 'The Ocean',
            'Music & Dancing', 'Books & Stories', 'Weather', 'Travel',
            'Animals' // Keep animals but as just one option
        ];
        // Pick a random topic
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        const prompt = `
You are creating a simple, fun question for a ${childAge}-year-old child with a ${childLexile}L Lexile reading level.

TOPIC: ${randomTopic} (The question MUST be about this topic)

CRITICAL RULES - YOU MUST FOLLOW:
1. Ask ONE simple question only - NO multi-part questions!
2. Keep the question SHORT and appropriate for the reading level
3. Make it engaging for a child!

${childLexile < 300 ? `
LEXILE 100-300 (Beginning Reader - Age ${childAge}):
- Maximum 8 WORDS total
- Use only basic words a 4-year-old knows
- Simple "What", "Who", or "Do you like" questions
` : ''}
${childLexile >= 300 && childLexile < 500 ? `
LEXILE 300-500 (Early Reader - Age ${childAge}):
- Maximum 12 WORDS total
- Use simple everyday words
- One simple question about preferences or experiences
` : ''}
${childLexile >= 500 && childLexile < 700 ? `
LEXILE 500-700 (Growing Reader - Age ${childAge}):
- Maximum 15 WORDS total
- Simple but engaging questions
- Can ask about imagination or feelings
` : ''}
${childLexile >= 700 ? `
LEXILE 700+ (Developing Reader - Age ${childAge}):
- Maximum 20 WORDS total
- Can ask more thoughtful questions
- Keep it to ONE question, not multiple parts
` : ''}

NEVER DO THIS:
- No questions longer than 20 words
- No multi-part questions (no "and also" or multiple questions)
- No complex scenarios with many details
- No questions asking to "describe" multiple things at once

Return ONLY: {"question": "Your short question here"}
`;

        const response = await callGeminiApi(prompt);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error generating question:', error);
        return res.status(500).json({
            error: 'Oops! Our robot helper is taking a nap. Please try again!'
        });
    }
}
