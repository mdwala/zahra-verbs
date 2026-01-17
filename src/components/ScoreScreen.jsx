import React, { useEffect, useRef } from 'react';
import './ScoreScreen.css';

const ScoreScreen = ({ score, answer, feedback, onPlayAgain }) => {
  const audioRef = useRef(null);

  // Play celebration sound on mount
  useEffect(() => {
    // Create and play a simple celebration tone using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Play a cheerful arpeggio
      const notes = score >= 7 ? [523, 659, 784, 1047] : [523, 659, 784]; // C, E, G, (high C for high scores)
      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);

        oscillator.start(audioContext.currentTime + i * 0.15);
        oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3);
      });
    } catch (e) {
      console.log("Audio not supported:", e);
    }
  }, [score]);

  // Speak the feedback aloud
  useEffect(() => {
    if (feedback) {
      // Wait a moment for sound effects, then speak
      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(feedback);
        utterance.rate = 0.60; // Slow pace for kids
        utterance.pitch = 1.1; // Slightly higher pitch for friendly tone
        speechSynthesis.speak(utterance);
      }, 800);

      return () => {
        clearTimeout(timer);
        speechSynthesis.cancel();
      };
    }
  }, [feedback]);

  // Generate confetti elements for high scores
  const renderConfetti = () => {
    if (score < 7) return null;

    const confettiColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const confetti = [];

    for (let i = 0; i < 50; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      };
      confetti.push(<div key={i} className="confetti" style={style} />);
    }

    return <div className="confetti-container">{confetti}</div>;
  };

  // Generate floating stars
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 8; i++) {
      const style = {
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        animationDelay: `${Math.random() * 2}s`,
      };
      stars.push(<div key={i} className="floating-star" style={style}>⭐</div>);
    }
    return stars;
  };

  const getScoreEmoji = () => {
    if (score >= 9) return '🏆';
    if (score >= 7) return '🌟';
    if (score >= 5) return '😊';
    return '💪';
  };

  const getScoreMessage = () => {
    if (score >= 9) return 'AMAZING!';
    if (score >= 7) return 'Great Job!';
    if (score >= 5) return 'Good Work!';
    return 'Nice Try!';
  };

  return (
    <div className="score-screen">
      {renderConfetti()}
      {renderStars()}

      <div className="score-card">
        <h2 className="score-title">{getScoreMessage()}</h2>
        <div className="score-emoji">{getScoreEmoji()}</div>

        <div className="score-circle-container">
          <div className={`score-circle ${score >= 7 ? 'high-score' : ''}`}>
            <span className="score-number">{score}</span>
            <span className="score-label">points</span>
          </div>
        </div>

        {answer && (
          <div className="answer-section">
            <p className="answer-label">You said:</p>
            <p className="answer-text">"{answer}"</p>
          </div>
        )}

        <div className="feedback-section">
          <p className="feedback-text">{feedback}</p>
        </div>

        <button className="play-again-btn" onClick={onPlayAgain}>
          ➡️ Next Question!
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen;
