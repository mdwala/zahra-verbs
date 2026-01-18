import React, { useState, useEffect, useRef } from 'react';
import './GameScreen.css';

const GameScreen = ({ profile, question, onSubmitAnswer, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("idle"); // idle, listening, processing
  const hasSpokenRef = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // Keep track of transcript in ref to avoid stale closures
  const audioContextRef = useRef(null); // Ref to track Web Audio Context

  // Initialize speech recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      // Don't set error yet - we'll handle it when user clicks
      return;
    }

    const recognition = new SpeechRecognition();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    recognition.continuous = !isMobile; // Mobile works better with short bursts
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("🎤 Recognition started");
      setStatus("listening");
    };

    recognition.onresult = (event) => {
      let fullTranscript = "";

      // Build the complete transcript from all results
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      console.log("📝 Transcript:", fullTranscript);
      transcriptRef.current = fullTranscript;
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event) => {
      console.error("❌ Recognition error:", event.error);
      if (event.error !== 'aborted') {
        setStatus("idle");
      }
    };

    recognition.onend = () => {
      console.log("🛑 Recognition ended");
      // Only update status if we're not manually stopping
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  // Speak the question when it changes (only if not loading)
  useEffect(() => {
    if (question && !isLoading) {
      // Use Cloud TTS with browser fallback
      const speak = async () => {
        try {
          // Determine API URL based on environment
          const apiUrl = import.meta.env?.DEV ? 'http://localhost:3001/api/tts' : '/api/tts';

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: question }),
          });

          if (response.ok) {
            const data = await response.json();

            // --- Web Audio API for Volume Boost ---
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              audioContextRef.current = audioContext; // Store ref to close it later


              // Decode base64 to array buffer
              const binaryString = window.atob(data.audioContent);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);

              // Create Gain Node (Volume Boost)
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 2.0; // 200% Volume (Double the original)

              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;

              // Connect: Source -> Gain -> Speakers
              source.connect(gainNode);
              gainNode.connect(audioContext.destination);

              source.start(0);
            } catch (audioError) {
              console.error("Web Audio API Error, falling back to standard audio:", audioError);
              const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
              const audio = new Audio(audioSrc);
              audio.play().catch(console.error);
            }
            return;
          } else {
            const errorText = await response.text();
            console.error(`Cloud TTS API Error (${response.status}):`, errorText);
            // AI TTS is required - no fallback
            setStatus("error");
            setTranscript("Oops! Our voice robot is sleeping. Please check your internet and try again!");
          }
        } catch (e) {
          console.error('Cloud TTS System Error:', e);
          // AI TTS is required - no fallback
          setStatus("error");
          setTranscript("Oops! Our voice robot is sleeping. Please check your internet and try again!");
        }
      };

      const timer = setTimeout(speak, 300);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [question, isLoading]);

  const startListening = async () => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("error");
      setTranscript("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    // Request microphone permission first
    try {
      // release TTS audio if playing
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setStatus("error");
      setTranscript("Microphone access denied. Please allow microphone access.");
      return;
    }

    // Create recognition if it doesn't exist
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log("🎤 Recognition started");
        setStatus("listening");
      };

      recognition.onresult = (event) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        console.log("📝 Transcript:", fullTranscript);
        transcriptRef.current = fullTranscript;
        setTranscript(fullTranscript);
      };

      recognition.onerror = (event) => {
        console.error("❌ Recognition error:", event.error);
        if (event.error !== 'aborted') {
          setStatus("idle");
        }
      };

      recognition.onend = () => {
        console.log("🛑 Recognition ended");
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Clear previous transcript
    setTranscript("");
    transcriptRef.current = "";

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setStatus("listening");
    } catch (err) {
      console.error("Error starting recognition:", err);
      setStatus("error");
      setTranscript("Error starting microphone: " + err.message);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.error("Error stopping recognition:", err);
    }

    setIsListening(false);
    setStatus("processing");

    // Use the ref value to ensure we have the latest transcript
    const finalTranscript = transcriptRef.current.trim();
    console.log("📤 Submitting:", finalTranscript);

    if (finalTranscript && onSubmitAnswer) {
      onSubmitAnswer(finalTranscript);
    } else {
      // No transcript captured
      setStatus("idle");
      setTranscript("No speech detected. Please try again.");
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Keyboard shortcut: Spacebar to toggle mic
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent scrolling
        if (status !== 'error' && status !== 'processing') {
          handleMicClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isListening, status]);

  const robotArt = `
   d_(-_-)_b
  /--o--o--\\
 / |  o  | \\
/  |  o  |  \\
\\  |     |  /
 \\ |     | /
  \\|_____|/
   |     |
  /|_____|\\
 /         \\
`;

  return (
    <div className="game-screen">
      <div className="profile-header">
        <div className="profile-info">
          <span className="avatar">{profile.avatar}</span>
          <span>{profile.name}</span>
          <span className="age-badge">{profile.age} yrs</span>
          {profile.lexileLevel && <span className="lexile-badge">{profile.lexileLevel}L</span>}
        </div>
        <div className="profile-stats">
          <div>Level: {profile.level}</div>
          <div>Score: {profile.score}</div>
        </div>
      </div>

      <div className="character-area">
        <div className={`character-emoji ${isLoading ? 'thinking' : ''}`}>🤖</div>
        <div className="question-bubble">
          <p>{question}</p>
        </div>
      </div>

      <div className="transcript-area">
        <p>
          {transcript || (isListening ? "🎤 Listening... Speak now!" : "Your answer will appear here.")}
        </p>
      </div>

      <div className="controls-area">
        <button
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={handleMicClick}
          disabled={status === "error" || status === "processing"}
          type="button"
          style={{ touchAction: 'manipulation' }}
        >
          <span className="mic-icon">{isListening ? '🔴' : '🎤'}</span>
          {status === "error" && 'Mic not available'}
          {status === "processing" && 'Processing...'}
          {status === "idle" && 'Tap to Speak'}
          {status === "listening" && 'Tap to Send'}
        </button>
      </div>
    </div>
  );
};

export default GameScreen;
