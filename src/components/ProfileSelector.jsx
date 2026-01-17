import React from 'react';
import './ProfileSelector.css';

const ProfileSelector = ({ profiles, onProfileSelect }) => {
  return (
    <div className="profile-selector">
      <h2>Who is playing? 🎮</h2>
      <div className="profiles-grid">
        {profiles.map(profile => (
          <div key={profile.id} className="profile-card" onClick={() => onProfileSelect(profile)}>
            <span className="profile-avatar">{profile.avatar}</span>
            <span className="profile-name">{profile.name}</span>
            <span className="profile-score">⭐ {profile.score} points</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSelector;

