import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key - Use environment variable only, no hardcoded key
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

    const { question, answer, lexileLevel } = req.body;
    // Default to 400L if not provided
    const childLexile = lexileLevel || 400;

    if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required.' });
    }

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing from environment variables');
        return res.status(500).json({
            error: 'Oops! Our robot helper is taking a nap. Please try again later!'
        });
    }

    try {
        const prompt = `
You are a friendly, encouraging AI language coach for a child with a reading level of ${childLexile}L (Lexile measure).

The child was asked: "${question}"
The child answered: "${answer}"

Please evaluate the answer based on their ${childLexile}L Lexile level:

For Lexile ${childLexile}L, evaluate based on:
1. **Vocabulary Richness:** Are they using words appropriate for their reading level? For ${childLexile}L, expect:
   ${childLexile <= 200 ? '- Simple words like: big, red, happy, fun' : ''}
   ${childLexile > 200 && childLexile <= 400 ? '- Basic descriptive words like: excited, colorful, friendly' : ''}
   ${childLexile > 400 && childLexile <= 600 ? '- Intermediate vocabulary like: adventurous, creative, discover' : ''}
   ${childLexile > 600 && childLexile <= 800 ? '- More sophisticated words like: fascinating, challenging, perspective' : ''}
   ${childLexile > 800 ? '- Advanced vocabulary like: exemplary, innovative, contemplative' : ''}

2. **Creativity:** Is the answer original and imaginative?
3. **Expression:** Did they explain their thoughts clearly?

IMPORTANT: Your feedback should:
- Be friendly, encouraging and consistent in tone for a child (use simple, friendly language)
- Suggest vocabulary improvements matching their ${childLexile}L level
- Be encouraging and specific about what was good
- If the answer was short, gently encourage them to say more next time
- Include an emoji to make it fun!

STRICT SCORING RULES:
- If the answer is only 1-2 words (e.g., "green", "it is big"), the MAXIMUM score is 4.
- To get a score of 8-10, the child MUST use a full sentence or a detailed thought.

Return a JSON object with two keys:
- "score": An integer from 1 to 10, where 1 is very basic and 10 is exceptionally creative for their level
- "feedback": A short, one-sentence, encouraging piece of feedback with a vocabulary suggestion

Example responses by Lexile level:
- For 200L: {"score": 7, "feedback": "Wow, you used the word 'happy'! 🌟 Next time, try saying 'super happy' or 'excited'!"}
- For 500L: {"score": 8, "feedback": "Great description! 🎨 Try using a word like 'fascinating' to make it even more interesting!"}
- For 800L: {"score": 6, "feedback": "Solid answer! 💡 Consider using words like 'remarkable' or 'innovative' to express your ideas!"}
`;

        const response = await callGeminiApi(prompt);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error calling Gemini API:', error);

        // NO OFFLINE FALLBACK - Return error so user knows AI is required
        return res.status(500).json({
            error: 'Oops! Our robot helper is taking a nap. Please try again!'
        });
    }
}
