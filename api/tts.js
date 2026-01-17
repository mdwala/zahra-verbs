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

    try {
        console.log(`Attempting TTS for text: "${text.substring(0, 20)}..."`);
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${TTS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
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
            const errorData = await response.text();
            console.error('TTS API error:', errorData);
            throw new Error(`TTS API error: ${response.status}`);
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
