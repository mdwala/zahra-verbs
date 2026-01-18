import React, { useState } from 'react';
import './ProfileEditor.css';

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

// Get lexile level description
const getLexileDescription = (level) => {
    if (level <= 200) return "Beginning Reader 📖";
    if (level <= 400) return "Early Reader 🌱";
    if (level <= 600) return "Growing Reader 🌿";
    if (level <= 800) return "Strong Reader 🌳";
    return "Advanced Reader 🚀";
};

const ProfileEditor = ({ profile, onSave, onCancel }) => {
    const [name, setName] = useState(profile?.name || '');
    const [age, setAge] = useState(profile?.age || 6);
    const [avatar, setAvatar] = useState(profile?.avatar || '👧');
    const [lexileLevel, setLexileLevel] = useState(
        profile?.lexileLevel || suggestLexileFromAge(profile?.age || 6)
    );

    const avatarOptions = ['👧', '👦', '👶', '🧒', '🧑', '👸', '🤴', '🦸', '🧙'];
    const ageOptions = Array.from({ length: 10 }, (_, i) => i + 3); // 3-12 years

    const handleSave = () => {
        if (name.trim()) {
            onSave({
                ...profile,
                name: name.trim(),
                age,
                avatar,
                lexileLevel,
            });
        }
    };

    return (
        <div className="profile-editor-overlay">
            <div className="profile-editor-modal">
                <h2>✏️ Edit Profile</h2>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter name"
                        maxLength={20}
                    />
                </div>

                <div className="form-group">
                    <label>Age</label>
                    <div className="age-selector">
                        {ageOptions.map((a) => (
                            <button
                                key={a}
                                className={`age-btn ${age === a ? 'selected' : ''}`}
                                onClick={() => setAge(a)}
                                type="button"
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Avatar</label>
                    <div className="avatar-selector">
                        {avatarOptions.map((av) => (
                            <button
                                key={av}
                                className={`avatar-btn ${avatar === av ? 'selected' : ''}`}
                                onClick={() => setAvatar(av)}
                                type="button"
                            >
                                {av}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group lexile-group">
                    <label>Reading Level (Lexile)</label>
                    <div className="lexile-slider-container">
                        <input
                            type="range"
                            min="100"
                            max="1000"
                            step="50"
                            value={lexileLevel}
                            onChange={(e) => setLexileLevel(Number(e.target.value))}
                            className="lexile-slider"
                        />
                        <div className="lexile-value">
                            <span className="lexile-number">{lexileLevel}L</span>
                            <span className="lexile-description">{getLexileDescription(lexileLevel)}</span>
                        </div>
                    </div>
                    <p className="lexile-hint">
                        💡 Adjust based on how challenging questions should be
                    </p>
                </div>

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onCancel} type="button">
                        Cancel
                    </button>
                    <button className="save-btn" onClick={handleSave} type="button">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditor;
