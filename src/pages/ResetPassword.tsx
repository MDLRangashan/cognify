import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Children Management System</h1>
          <h2>Reset Password</h2>
          <p>Enter your email to receive a reset link</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="error-message" style={{background:'#ecfdf5', borderColor:'#86efac', color:'#065f46'}}>{message}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Remembered your password?{' '}
            <Link to="/login" className="register-link">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


