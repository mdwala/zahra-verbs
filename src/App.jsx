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
import { version } from '../package.json';

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
  const [lastPoints, setLastPoints] = useState(0); // New state for scaled points
  const [lastAnswer, setLastAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);



  // Load profiles from storage on initial render
  useEffect(() => {
    let savedProfiles = getProfilesFromStorage();
    if (!savedProfiles) {
      savedProfiles = [
        { id: 1, name: 'Zahra', avatar: '👧', score: 0, level: 1, lexileLevel: 400 },
        { id: 2, name: 'Alya', avatar: '👶', score: 0, level: 1, lexileLevel: 200 },
      ];
      saveProfilesToStorage(savedProfiles);
    }
    // Migrate old profiles
    savedProfiles = savedProfiles.map(p => ({
      ...p,
      lexileLevel: p.lexileLevel || 400
    }));
    setProfiles(savedProfiles);
  }, []);

  // Fetch AI-generated question based on lexile level
  const fetchQuestion = async (lexileLevel) => {
    setIsLoadingQuestion(true);
    setCurrentQuestion("");
    try {
      const apiUrl = '/api/generate-question';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lexileLevel }),
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
    await fetchQuestion(profile.lexileLevel || 400);
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
      await fetchQuestion(currentProfile.lexileLevel || 400);
    }
  };

  const handleSwitchUser = () => {
    setCurrentProfile(null);
    setGameState('profile');
  }

  const handleSubmitAnswer = async (transcript) => {
    console.log("handleSubmitAnswer called with:", transcript);
    try {
      const apiUrl = '/api/evaluate';

      console.log("Sending to API:", apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer: transcript,
          lexileLevel: currentProfile?.lexileLevel || 400,
        }),
      });

      console.log("API response status:", response.status);
      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to evaluate");
      }

      const rawScore = data.score || 0;

      // Standardized scoring: Max 20 points
      const calculatedPoints = rawScore * 2;

      setLastScore(rawScore);
      setLastPoints(calculatedPoints);
      setLastAnswer(transcript);
      setFeedback(data.feedback || "Good job!");

      // Update Profile Score & Persist
      if (currentProfile) {
        const updatedProfiles = profiles.map(p => {
          if (p.id === currentProfile.id) {
            return { ...p, score: p.score + calculatedPoints };
          }
          return p;
        });

        setProfiles(updatedProfiles);
        saveProfilesToStorage(updatedProfiles);

        // Update current profile reference too so UI shows new score immediately if needed
        setCurrentProfile(prev => ({ ...prev, score: prev.score + calculatedPoints }));
      }

      setGameState('score');
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedback("Oops! Our robot helper is taking a nap. Please try again!");
      setLastScore(0);
      setLastPoints(0);
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
        return <ScoreScreen score={lastScore} points={lastPoints} answer={lastAnswer} feedback={feedback} onPlayAgain={handlePlayAgain} />;
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
      <footer style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        fontSize: '1.2rem',
        fontWeight: 'bold',
        opacity: 1,
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '5px 12px',
        borderRadius: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        v{version}
      </footer>
    </div>
  )
}

export default App;

