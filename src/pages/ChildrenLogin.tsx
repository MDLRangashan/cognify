import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './Login.css';

const ChildrenLogin: React.FC = () => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      // Query children collection for matching username and password
      const childrenRef = collection(db, 'children');
      const q = query(
        childrenRef,
        where('username', '==', username),
        where('password', '==', password)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid username or password');
      } else {
        // Get the child data
        const childDoc = querySnapshot.docs[0];
        const childData = { id: childDoc.id, ...childDoc.data() };
        
        // Store child data in localStorage
        localStorage.setItem('childUser', JSON.stringify(childData));
        
        // Navigate to children dashboard
        navigate('/children-dashboard');
      }
    } catch (err: any) {
      setError('Login failed. Please try again.');
      console.error('Children login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Children Login</h1>
          <h2>Welcome Back!</h2>
          <p>Enter your username and password to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('common.enterUsername')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('common.enterPassword')}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Need help? Contact your teacher or parent.</p>
          <div className="navigation-links">
            <Link to="/login" className="back-to-main-login">
              {t('common.backToMainLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildrenLogin;
