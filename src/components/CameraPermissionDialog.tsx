import React from 'react';
import './CameraPermissionDialog.css';

interface CameraPermissionDialogProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

const CameraPermissionDialog: React.FC<CameraPermissionDialogProps> = ({ isOpen, onAllow, onDeny }) => {
  if (!isOpen) return null;

  return (
    <div className="camera-permission-overlay">
      <div className="camera-permission-dialog">
        <div className="camera-permission-header">
          <h3>📹 Camera Permission Required</h3>
        </div>
        <div className="camera-permission-content">
          <p>
            To ensure a secure and monitored assessment experience, we need to access your camera 
            to capture photos every 10 seconds during the quiz.
          </p>
          <div className="camera-permission-features">
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Photos are securely stored and only accessible to authorized personnel</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏱️</span>
              <span>Photos are captured automatically every 10 seconds</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👨‍👩‍👧‍👦</span>
              <span>Helps parents and teachers monitor your progress</span>
            </div>
          </div>
        </div>
        <div className="camera-permission-actions">
          <button className="permission-btn deny-btn" onClick={onDeny}>
            Continue Without Camera
          </button>
          <button className="permission-btn allow-btn" onClick={onAllow}>
            Allow Camera Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraPermissionDialog;
