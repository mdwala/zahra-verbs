import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ProfileSelector from './components/ProfileSelector';
import GameScreen from './components/GameScreen';
import ScoreScreen from './components/ScoreScreen';
import './components/ProfileSelector.css';
import './components/GameScreen.css';
import './components/ScoreScreen.css';

const API_URL = 'http://localhost:3001/api/evaluate';
const PROFILES_KEY = 'zahra-verbs-profiles';
const POINTS_PER_LEVEL = 100;

// --- LocalStorage Helper Functions ---
const getProfilesFromStorage = () => {
  const data = localStorage.getItem(PROFILES_KEY);
  if (!data) return null;
  return JSON.parse(data);
};

const saveProfilesToStorage = (profiles) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};


function App() {
  const [gameState, setGameState] = useState('profile'); // 'profile', 'game', 'score'
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);

  const [lastScore, setLastScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  // Load profiles from storage on initial render
  useEffect(() => {
    let savedProfiles = getProfilesFromStorage();
    if (!savedProfiles) {
      savedProfiles = [
        { id: 1, name: 'Zahra', avatar: '👧', score: 0, level: 1 },
        { id: 2, name: 'Alya', avatar: '👶', score: 0, level: 1 },
      ];
      saveProfilesToStorage(savedProfiles);
    }
    setProfiles(savedProfiles);
  }, []);

  // Pool of fun questions for kids
  const questions = [
    "What was the most interesting thing you saw today?",
    "Describe your favorite toy and why you love it!",
    "What would you do if you could fly like a bird?",
    "Tell me about your best friend and what makes them special!",
    "What's your favorite food and how does it taste?",
    "If you had a superpower, what would it be?",
    "Describe the funniest thing that ever happened to you!",
    "What do you want to be when you grow up and why?",
    "Tell me about a dream you had recently!",
    "What's your favorite animal and what does it look like?",
    "Describe a place you'd love to visit someday!",
    "What makes you really happy?",
  ];

  const [currentQuestion, setCurrentQuestion] = useState(
    questions[Math.floor(Math.random() * questions.length)]
  );

  const handleProfileSelect = (profile) => {
    setCurrentProfile(profile);
    setCurrentQuestion(questions[Math.floor(Math.random() * questions.length)]);
    setGameState('game');
  };

  const handlePlayAgain = () => {
    // Pick a new random question
    setCurrentQuestion(questions[Math.floor(Math.random() * questions.length)]);
    setGameState('game');
  };

  const handleSwitchUser = () => {
    setCurrentProfile(null);
    setGameState('profile');
  }

  const handleSubmitAnswer = async (transcript) => {
    console.log("handleSubmitAnswer called with:", transcript);
    try {
      // Use relative URL for Vercel, absolute for local development
      const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api/evaluate' : '/api/evaluate';
      console.log("Sending to API:", apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer: transcript,
        }),
      });

      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to evaluate");
      }

      const newScore = data.score || 0;
      setLastScore(newScore);
      setLastAnswer(transcript);
      setFeedback(data.feedback || "Good job!");

      // Update Profile Score & Persist
      if (currentProfile) {
        const updatedProfiles = profiles.map(p => {
          if (p.id === currentProfile.id) {
            return { ...p, score: p.score + newScore };
          }
          return p;
        });

        setProfiles(updatedProfiles);
        saveProfilesToStorage(updatedProfiles);

        // Update current profile reference too so UI shows new score immediately if needed
        setCurrentProfile(prev => ({ ...prev, score: prev.score + newScore }));
      }

      setGameState('score');
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedback(error.message || "Error processing your answer. Please try again.");
      setLastScore(0); // Ensure score is 0 on error
      setGameState('score');
    }
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'profile':
        return <ProfileSelector profiles={profiles} onProfileSelect={handleProfileSelect} />;
      case 'game':
        return (
          <div>
            <GameScreen
              profile={currentProfile}
              question={currentQuestion}
              onSubmitAnswer={handleSubmitAnswer}
            />
            <button style={{ marginTop: '1rem', backgroundColor: '#555' }} onClick={handleSwitchUser}>Switch User</button>
          </div>
        );
      case 'score':
        return <ScoreScreen score={lastScore} answer={lastAnswer} feedback={feedback} onPlayAgain={handlePlayAgain} />;
      default:
        return <ProfileSelector profiles={profiles} onProfileSelect={handleProfileSelect} />;
    }
  }

  return (
    <div className="App">
      <h1>Zahra's Language Adventure</h1>
      <main>
        {renderGameState()}
      </main>
    </div>
  )
}

export default App;

