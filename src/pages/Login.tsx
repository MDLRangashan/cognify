import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const persisted = localStorage.getItem('loginError');
    if (persisted) {
      setError(persisted);
      localStorage.removeItem('loginError');
      // ensure banner is visible
      window.scrollTo({ top: 0, behavior: 'instant' as any });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error?.message || 'Failed to log in. Please check your credentials.';
      setError(msg);
      console.error('Login error:', error);
      // Keep user on the login page and highlight the banner
      if (error?.code === 'PENDING_APPROVAL') {
        // Persist across auth state remount
        localStorage.setItem('loginError', msg);
        // Focus the banner by scrolling to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Children Management System</h1>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className={`error-message ${error.includes('approval') ? 'approval-error' : ''}`}>
            {error}
            {error.includes('approval') && (
              <div className="approval-help">
                <p>Your account is pending admin approval. You can check your status or contact support.</p>
                <Link to="/pending-approval" className="check-status-link">
                  Check Approval Status
                </Link>
              </div>
            )}
          </div>
        )}

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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Register here
            </Link>
          </p>
          <p style={{marginTop: 8}}>
            <Link to="/reset-password" className="register-link">Forgot password?</Link>
          </p>
          <p style={{marginTop: 16, padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd'}}>
            <strong>Children Login:</strong>{' '}
            <Link to="/children-login" className="register-link" style={{fontWeight: 'bold'}}>
              Click here to login as a child
            </Link>
          </p>
        </div>

        <div className="demo-credentials">
          <h3>Demo Credentials</h3>
          <div className="credential-item">
            <strong>Admin:</strong> admin@gmail.com / Admin1234
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
