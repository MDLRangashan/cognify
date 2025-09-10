import React from 'react';
import './PerformanceModal.css';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  performance: {
    score: number;
    totalQuestions: number;
    timeTaken: number;
    accuracy: number;
    category: 'High Performer' | 'Middle Performer' | 'Slow Performer';
    message: string;
    emoji: string;
    color: string;
  };
}

const PerformanceModal: React.FC<PerformanceModalProps> = ({ isOpen, onClose, performance }) => {
  if (!isOpen) return null;

  const timeMinutes = Math.floor(performance.timeTaken / 60);
  const timeSeconds = performance.timeTaken % 60;
  const timeString = timeMinutes > 0 ? `${timeMinutes}m ${timeSeconds}s` : `${timeSeconds}s`;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="performance-modal-overlay" onClick={handleOverlayClick}>
      <div className="performance-modal">
        <div className="performance-modal-header">
          <h2>🎉 Quiz Complete! 🎉</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="performance-content">
          <div className="performance-badge" style={{ backgroundColor: performance.color }}>
            <div className="badge-emoji">{performance.emoji}</div>
            <div className="badge-title">{performance.category}</div>
          </div>

          <div className="performance-message">
            <p>{performance.message}</p>
          </div>

          <div className="performance-stats">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-label">Score</div>
              <div className="stat-value">{performance.score}/{performance.totalQuestions}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-label">Accuracy</div>
              <div className="stat-value">{Math.round(performance.accuracy)}%</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-label">Time Taken</div>
              <div className="stat-value">{timeString}</div>
            </div>
          </div>

          <div className="performance-encouragement">
            {performance.category === 'High Performer' && (
              <div className="encouragement high-performer">
                <h3>🌟 You're a Math Superstar! 🌟</h3>
                <p>You solved problems quickly and accurately! Keep up the amazing work!</p>
              </div>
            )}
            
            {performance.category === 'Middle Performer' && (
              <div className="encouragement middle-performer">
                <h3>💪 Great Job! 💪</h3>
                <p>You're doing really well! A little more practice and you'll be unstoppable!</p>
              </div>
            )}
            
            {performance.category === 'Slow Performer' && (
              <div className="encouragement slow-performer">
                <h3>🌱 Keep Growing! 🌱</h3>
                <p>Every expert was once a beginner! Keep practicing and you'll get better every day!</p>
              </div>
            )}
          </div>

          <div className="performance-actions">
            <button className="continue-btn" onClick={onClose}>
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceModal;
