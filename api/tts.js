// Google Cloud TTS API endpoint

// Use separate API key for Text-to-Speech
const TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

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

    const { text } = req.body;

    if (!TTS_API_KEY) {
        console.error('GOOGLE_TTS_API_KEY is missing from environment variables');
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    // Strip emojis from text to prevent TTS from reading them
    const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    try {
        console.log(`Attempting TTS for text: "${cleanText.substring(0, 20)}..."`);
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${TTS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text: cleanText },
                    voice: {
                        languageCode: 'en-US',
                        name: 'en-US-Wavenet-F', // Friendly female WaveNet voice
                        ssmlGender: 'FEMALE',
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 0.85, // Slightly slower for kids
                        pitch: 2.0, // Warmer, friendlier tone
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorJson = await response.json();
            console.error('Google TTS API Error Response:', JSON.stringify(errorJson, null, 2));
            return res.status(response.status).json({
                error: 'Google TTS API Error',
                details: errorJson
            });
        }

        const data = await response.json();

        // Return the base64 audio content
        return res.status(200).json({
            audioContent: data.audioContent,
        });

    } catch (error) {
        console.error('Error calling TTS API:', error);
        return res.status(500).json({
            error: 'TTS failed',
            message: error.message
        });
    }
}
