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

    const { lexileLevel } = req.body;
    // Default to 400L if not provided
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
        const randomSeed = Math.floor(Math.random() * 999999);

        const prompt = `
You are creating a simple, fun question for a child with a ${childLexile}L Lexile reading level.

TOPIC: ${randomTopic} (The question MUST be about this topic)
RANDOM SEED: ${randomSeed} (Use this number to generate a COMPLETELY UNIQUE question. Do not repeat previous questions.)

CRITICAL RULES - YOU MUST FOLLOW:
1. Ask ONE simple question only - NO multi-part questions!
2. Keep the question SHORT and appropriate for the reading level
3. Make it engaging for a child!

${childLexile < 300 ? `
LEXILE 100-300 (Beginning Reader):
- Maximum 8 WORDS total
- Use only basic words a 4-year-old knows
- Simple "What", "Who", or "Do you like" questions
` : ''}
${childLexile >= 300 && childLexile < 500 ? `
LEXILE 300-500 (Early Reader):
- Maximum 12 WORDS total
- Use simple everyday words
- One simple question about preferences or experiences
` : ''}
${childLexile >= 500 && childLexile < 700 ? `
LEXILE 500-700 (Growing Reader):
- Maximum 15 WORDS total
- Simple but engaging questions
- Can ask about imagination or feelings
` : ''}
${childLexile >= 700 && childLexile < 900 ? `
LEXILE 700-900 (Developing Reader):
- Maximum 20 WORDS total
- somewhat complex sentence structure (can use clauses)
- Use descriptive vocabulary (e.g., instead of "big", use "enormous" or "gigantic")
- Ask "Why" or "How" questions that require a thought
` : ''}
${childLexile >= 900 ? `
LEXILE 900+ (Advanced Reader):
- Maximum 25 WORDS total
- Use sophisticated vocabulary appropriate for the level
- Ask questions that require inference or critical thinking
- Can use metaphors or more abstract concepts
` : ''}

NEVER DO THIS:
- No questions longer than 30 words
- No multi-part questions (no "and also" or multiple questions)
- No complex scenarios with many details (keep it focused)
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
