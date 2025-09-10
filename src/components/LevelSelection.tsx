import React from 'react';
import './LevelSelection.css';
import { QuizLevel } from '../utils/performanceBasedLevels';

interface LevelSelectionProps {
  levels: QuizLevel[];
  onLevelSelect: (level: QuizLevel) => void;
  onBack: () => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({ levels, onLevelSelect, onBack }) => {
  const completedLevels = levels.filter(level => level.isCompleted).length;
  const totalPoints = levels
    .filter(level => level.isCompleted)
    .reduce((total, level) => total + level.rewards.points, 0);

  return (
    <div className="level-selection">
      <div className="level-selection-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>🎮 Choose Your Math Adventure! 🎮</h1>
        <div className="progress-summary">
          <div className="progress-item">
            <span className="progress-icon">🏆</span>
            <span className="progress-text">Levels Completed: {completedLevels}/{levels.length}</span>
          </div>
          <div className="progress-item">
            <span className="progress-icon">⭐</span>
            <span className="progress-text">Total Points: {totalPoints}</span>
          </div>
        </div>
      </div>

      <div className="levels-grid">
        {levels.map((level, index) => (
          <div
            key={level.id}
            className={`level-card ${level.isUnlocked ? 'unlocked' : 'locked'} ${level.isCompleted ? 'completed' : ''}`}
            onClick={() => level.isUnlocked && onLevelSelect(level)}
          >
            <div className="level-number">{level.id}</div>
            
            <div className="level-emoji">{level.emoji}</div>
            
            <div className="level-info">
              <h3 className="level-title">{level.title}</h3>
              <p className="level-description">{level.description}</p>
              
              <div className="level-difficulty">
                <span className={`difficulty-badge ${level.difficulty.toLowerCase()}`}>
                  {level.difficulty}
                </span>
              </div>
              
              <div className="level-stats">
                <div className="stat">
                  <span className="stat-icon">❓</span>
                  <span className="stat-text">{level.questions.count} Questions</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-text">{Math.floor(level.questions.timeLimit / 60)}m</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-text">{level.rewards.points} Points</span>
                </div>
              </div>
            </div>

            <div className="level-status">
              {level.isCompleted ? (
                <div className="status-completed">
                  <span className="status-icon">✅</span>
                  <span className="status-text">Completed!</span>
                  {level.bestScore && (
                    <div className="best-score">
                      Best: {level.bestScore}/{level.questions.count}
                    </div>
                  )}
                </div>
              ) : level.isUnlocked ? (
                <div className="status-unlocked">
                  <span className="status-icon">🚀</span>
                  <span className="status-text">Ready to Play!</span>
                </div>
              ) : (
                <div className="status-locked">
                  <span className="status-icon">🔒</span>
                  <span className="status-text">Locked</span>
                  <div className="unlock-requirements">
                    <div>Score: {level.unlockRequirement.minScore}+</div>
                    <div>Accuracy: {level.unlockRequirement.minAccuracy}%+</div>
                    {level.unlockRequirement.maxTime && (
                      <div>Time: {Math.floor(level.unlockRequirement.maxTime / 60)}m max</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {level.isCompleted && (
              <div className="completion-badge">
                <span className="badge-emoji">{level.rewards.badge}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="level-selection-footer">
        <div className="achievement-summary">
          <h3>🎯 Your Achievements</h3>
          <div className="achievements-grid">
            {levels.filter(level => level.isCompleted).map(level => (
              <div key={level.id} className="achievement-item">
                <span className="achievement-emoji">{level.rewards.badge}</span>
                <span className="achievement-name">{level.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelSelection;
