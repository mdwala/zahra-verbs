import React, { useState } from 'react';
import './ProfileEditor.css';



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
    // Removed Age
    const [avatar, setAvatar] = useState(profile?.avatar || '👧');
    const [lexileLevel, setLexileLevel] = useState(profile?.lexileLevel || 400);

    const avatarOptions = ['👧', '👦', '👶', '🧒', '🧑', '👸', '🤴', '🦸', '🧙'];

    const handleSave = () => {
        if (name.trim()) {
            onSave({
                ...profile,
                name: name.trim(),
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
