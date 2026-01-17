import React, { useState, useEffect, useRef } from 'react';
import './GameScreen.css';

const GameScreen = ({ profile, question, onSubmitAnswer }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("idle"); // idle, listening, processing
  const hasSpokenRef = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // Keep track of transcript in ref to avoid stale closures

  // Initialize speech recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      // Don't set error yet - we'll handle it when user clicks
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
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

  // Speak the question when it changes
  useEffect(() => {
    if (question) {
      // Cancel any previous speech
      speechSynthesis.cancel();

      // Small delay to ensure previous speech is cancelled
      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.rate = 0.60; // Slow pace for kids
        utterance.pitch = 1.1; // Friendly tone
        speechSynthesis.speak(utterance);
      }, 300);

      return () => {
        clearTimeout(timer);
        speechSynthesis.cancel();
      };
    }
  }, [question]);

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
      recognition.continuous = true;
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
        </div>
        <div className="profile-stats">
          <div>Level: {profile.level}</div>
          <div>Score: {profile.score}</div>
        </div>
      </div>

      <div className="character-area">
        <div className="character-emoji">🤖</div>
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
