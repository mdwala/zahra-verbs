import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ProfileSelector from './components/ProfileSelector';
import ProfileEditor from './components/ProfileEditor';
import GameScreen from './components/GameScreen';
import ScoreScreen from './components/ScoreScreen';
import './components/ProfileSelector.css';
import './components/ProfileEditor.css';
import './components/GameScreen.css';
import './components/ScoreScreen.css';

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
  const [editingProfile, setEditingProfile] = useState(null);

  const [lastScore, setLastScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  // Helper to suggest lexile level based on age
  const suggestLexileFromAge = (age) => {
    if (age <= 4) return 200;
    if (age <= 5) return 300;
    if (age <= 6) return 400;
    if (age <= 7) return 500;
    if (age <= 8) return 600;
    if (age <= 9) return 700;
    if (age <= 10) return 800;
    if (age <= 11) return 900;
    return 1000;
  };

  // Load profiles from storage on initial render
  useEffect(() => {
    let savedProfiles = getProfilesFromStorage();
    if (!savedProfiles) {
      savedProfiles = [
        { id: 1, name: 'Zahra', avatar: '👧', score: 0, level: 1, age: 6, lexileLevel: 400 },
        { id: 2, name: 'Alya', avatar: '👶', score: 0, level: 1, age: 4, lexileLevel: 200 },
      ];
      saveProfilesToStorage(savedProfiles);
    }
    // Migrate old profiles without age or lexileLevel
    savedProfiles = savedProfiles.map(p => ({
      ...p,
      age: p.age || 6,
      lexileLevel: p.lexileLevel || suggestLexileFromAge(p.age || 6)
    }));
    setProfiles(savedProfiles);
  }, []);

  // Fetch AI-generated question based on lexile level
  const fetchQuestion = async (lexileLevel, age) => {
    setIsLoadingQuestion(true);
    setCurrentQuestion("");
    try {
      const apiUrl = import.meta.env.DEV
        ? `http://localhost:3001/api/generate-question`
        : `/api/generate-question`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lexileLevel, age }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate question');
      }

      const data = await response.json();
      setCurrentQuestion(data.question);
    } catch (error) {
      console.error("Error fetching question:", error);
      setFeedback("Oops! Our robot helper is taking a nap. Please try again!");
      setLastScore(0);
      setGameState('score');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleProfileSelect = async (profile) => {
    setCurrentProfile(profile);
    setGameState('game');
    await fetchQuestion(profile.lexileLevel || 400, profile.age);
  };

  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
  };

  const handleSaveProfile = (updatedProfile) => {
    const updatedProfiles = profiles.map(p =>
      p.id === updatedProfile.id ? updatedProfile : p
    );
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
    setEditingProfile(null);
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
  };

  const handlePlayAgain = async () => {
    if (currentProfile) {
      setGameState('game');
      await fetchQuestion(currentProfile.lexileLevel || 400, currentProfile.age);
    }
  };

  const handleSwitchUser = () => {
    setCurrentProfile(null);
    setGameState('profile');
  }

  const handleSubmitAnswer = async (transcript) => {
    console.log("handleSubmitAnswer called with:", transcript);
    try {
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/evaluate'
        : '/api/evaluate';

      console.log("Sending to API:", apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer: transcript,
          age: currentProfile?.age || 6,
          lexileLevel: currentProfile?.lexileLevel || 400,
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
      setFeedback("Oops! Our robot helper is taking a nap. Please try again!");
      setLastScore(0);
      setGameState('score');
    }
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'profile':
        return (
          <ProfileSelector
            profiles={profiles}
            onProfileSelect={handleProfileSelect}
            onEditProfile={handleEditProfile}
          />
        );
      case 'game':
        return (
          <div>
            <GameScreen
              profile={currentProfile}
              question={isLoadingQuestion ? "Let me think of a good question..." : currentQuestion}
              onSubmitAnswer={handleSubmitAnswer}
              isLoading={isLoadingQuestion}
            />
            <button style={{ marginTop: '1rem', backgroundColor: '#555' }} onClick={handleSwitchUser}>Switch User</button>
          </div>
        );
      case 'score':
        return <ScoreScreen score={lastScore} answer={lastAnswer} feedback={feedback} onPlayAgain={handlePlayAgain} />;
      default:
        return <ProfileSelector profiles={profiles} onProfileSelect={handleProfileSelect} onEditProfile={handleEditProfile} />;
    }
  }

  return (
    <div className="App">
      <h1>Zahra's Language Adventure</h1>
      <main>
        {renderGameState()}
      </main>

      {/* Profile Editor Modal */}
      {editingProfile && (
        <ProfileEditor
          profile={editingProfile}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  )
}

export default App;

