import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Key Configuration (from .env file) ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is not set in .env file!");
  console.error("Please add your API key to backend/.env file");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function callGeminiApi(prompt) {
  const modelName = "gemini-2.0-flash";
  console.log("Using model:", modelName);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = await response.text();

  // Remove markdown code blocks if present
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  console.log("AI Response text:", text);
  return JSON.parse(text);
}

// --- Generate Question Endpoint ---
app.post('/api/generate-question', async (req, res) => {
  const { age, lexileLevel } = req.body;
  const childAge = age || 6;
  const childLexile = lexileLevel || 400;

  console.log('Generating question for age:', childAge, 'lexile:', childLexile);

  // Random topic categories to ensure variety
  const topics = [
    "animals and pets",
    "food and eating",
    "family and friends",
    "dreams and imagination",
    "school and learning",
    "adventures and travel",
    "feelings and emotions",
    "nature and outdoors",
    "games and play",
    "superheroes and magic",
    "seasons and weather",
    "music and dancing",
    "colors and shapes",
    "vehicles and transportation"
  ];

  // Pick a random topic
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const randomSeed = Math.floor(Math.random() * 10000);

  try {
    const prompt = `
You are creating a simple, fun question for a ${childAge}-year-old child with a ${childLexile}L Lexile reading level.

CRITICAL RULES - YOU MUST FOLLOW:
1. Ask ONE simple question only - NO multi-part questions!
2. The question must be about: ${randomTopic}
3. Random seed: ${randomSeed}

${childLexile < 300 ? `
LEXILE 100-300 (Beginning Reader - Age ${childAge}):
- Maximum 8 WORDS total
- Use only basic words a 4-year-old knows
- Simple "What", "Who", or "Do you like" questions
- Examples: "What is your favorite animal?", "Do you like dogs?"
` : ''}
${childLexile >= 300 && childLexile < 500 ? `
LEXILE 300-500 (Early Reader - Age ${childAge}):
- Maximum 12 WORDS total
- Use simple everyday words
- One simple question about preferences or experiences
- Examples: "What do you like to eat for breakfast?", "Tell me about your pet!"
` : ''}
${childLexile >= 500 && childLexile < 700 ? `
LEXILE 500-700 (Growing Reader - Age ${childAge}):
- Maximum 15 WORDS total
- Simple but engaging questions
- Can ask about imagination or feelings
- Examples: "What would you do on a rainy day?", "What makes you happy?"
` : ''}
${childLexile >= 700 ? `
LEXILE 700+ (Developing Reader - Age ${childAge}):
- Maximum 20 WORDS total
- Can ask more thoughtful questions
- Keep it to ONE question, not multiple parts
- Examples: "If you could have any superpower, what would it be?", "What is the best thing about your school?"
` : ''}

NEVER DO THIS:
- No questions longer than 20 words
- No multi-part questions (no "and also" or multiple questions)
- No complex scenarios with many details
- No questions asking to "describe" multiple things at once

Return ONLY: {"question": "Your short question here"}
`;

    const response = await callGeminiApi(prompt);
    res.json(response);

  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({
      error: 'Oops! Our robot helper is taking a nap. Please try again!'
    });
  }
});

// --- Evaluate Answer Endpoint ---
app.post('/api/evaluate', async (req, res) => {
  const { question, answer, age } = req.body;
  const childAge = age || 6;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required.' });
  }

  console.log('Received for evaluation:');
  console.log('Question:', question);
  console.log('Answer:', answer);
  console.log('Age:', childAge);

  try {
    const prompt = `
You are a friendly, encouraging AI language coach for a ${childAge}-year-old child.

The child was asked: "${question}"
The child answered: "${answer}"

Please evaluate the answer with these age-specific considerations:

For a ${childAge}-year-old, evaluate based on:
1. **Vocabulary Richness:** Are they using words appropriate or advanced for their age?
2. **Creativity:** Is the answer original and imaginative?
3. **Expression:** Did they explain their thoughts clearly for their age level?

IMPORTANT: Your feedback should:
- Be age-appropriate in language and tone for a ${childAge}-year-old
- Focus on HOW the child could have expressed their answer even better
- Be encouraging and specific about what was good
- If the answer was short, gently encourage them to say more next time
- Use simple words for younger children (3-5), slightly more complex for older (9-12)
- Include an emoji to make it fun!

Return a JSON object with two keys:
- "score": An integer from 1 to 10, where 1 is a very basic answer and 10 is exceptionally creative and descriptive for a ${childAge}-year-old.
- "feedback": A short, one-sentence, encouraging piece of feedback. Focus on what they did well AND how they could make it even better next time.

Example responses by age:
- For age 4: {"score": 7, "feedback": "Wow, you told me so much! 🌟 Next time, try telling me what color it is too!"}
- For age 7: {"score": 8, "feedback": "Great description! 🎨 You could make it even more exciting by adding how it made you feel!"}
- For age 10: {"score": 6, "feedback": "Good start! 💡 Try using more descriptive words like 'magnificent' or 'thrilling' to paint a picture with your words!"}
`;

    const response = await callGeminiApi(prompt);
    res.json(response);

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      error: 'Oops! Our robot helper is taking a nap. Please try again!'
    });
  }
});

// --- TTS Endpoint ---
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  console.log(`TTS request for: "${text.substring(0, 30)}..."`);

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Wavenet-F',
            ssmlGender: 'FEMALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.85,
            pitch: 2.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorJson = await response.json();
      console.error('Google TTS API Error:', JSON.stringify(errorJson, null, 2));
      return res.status(response.status).json({
        error: 'Google TTS API Error',
        details: errorJson
      });
    }

    const data = await response.json();
    return res.json({
      audioContent: data.audioContent,
    });

  } catch (error) {
    console.error('Error calling TTS API:', error);
    return res.status(500).json({
      error: 'TTS failed',
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
  console.log(`Using Gemini API Key: ${GEMINI_API_KEY ? '***' + GEMINI_API_KEY.slice(-4) : 'NOT SET'}`);
});
