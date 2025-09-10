import React from 'react';
import { Link } from 'react-router-dom';
import './PendingApproval.css';

const PendingApproval: React.FC = () => {
  return (
    <div className="pending-approval-container">
      <div className="pending-approval-card">
        <div className="pending-icon">
          <div className="clock-icon">⏳</div>
        </div>
        
        <div className="pending-content">
          <h1>Account Pending Approval</h1>
          <p className="pending-message">
            Your teacher account has been created successfully, but it requires admin approval before you can access the system.
          </p>
          
          <div className="pending-details">
            <h3>What happens next?</h3>
            <ul>
              <li>An admin will review your registration details</li>
              <li>You will receive an email notification once approved</li>
              <li>You can then login to access your teacher dashboard</li>
            </ul>
          </div>
          
          <div className="pending-actions">
            <Link to="/login" className="back-to-login-btn">
              Back to Login
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="refresh-btn"
            >
              Check Status
            </button>
          </div>
          
          <div className="contact-info">
            <p>
              <strong>Need help?</strong> Contact the admin at{' '}
              <a href="mailto:admin@cognify.com">admin@cognify.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
