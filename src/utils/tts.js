// Utility function to speak text using Google Cloud TTS
// Falls back to browser TTS if API fails

export async function speakText(text) {
    try {
        // Determine API URL based on environment
        const apiUrl = import.meta.env?.DEV ? 'http://localhost:3001/api/tts' : '/api/tts';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS API failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Cloud TTS received audio successfully');

        // Create audio from base64
        const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
        const audio = new Audio(audioSrc);

        // Return a promise that resolves when audio finishes
        return new Promise((resolve, reject) => {
            audio.onended = resolve;
            audio.onerror = reject;
            audio.play().catch(reject);
        });

    } catch (error) {
        console.warn('Cloud TTS failed, falling back to browser TTS:', error);

        // Fallback to browser TTS
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.60;
            utterance.pitch = 1.1;
            utterance.onend = resolve;
            utterance.onerror = resolve; // Still resolve on error to not block
            speechSynthesis.speak(utterance);
        });
    }
}
