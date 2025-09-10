import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

const Profile: React.FC = () => {
  const { userData, currentUser, changePassword, updateUserProfile } = useAuth();
  const { t } = useLanguage();
  const [edit, setEdit] = useState(false);
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  const [address, setAddress] = useState(userData?.address || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(userData?.yearsOfExperience || '');
  const [currentSchool, setCurrentSchool] = useState(userData?.currentSchool || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await updateUserProfile({ firstName, lastName, phoneNumber, address, yearsOfExperience, currentSchool });
      setMessage('Profile updated successfully');
      setEdit(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(userData?.firstName || '', userData?.lastName || '')}
          </div>
          <h1 className="profile-name">
            {userData?.firstName || 'User'} {userData?.lastName || ''}
          </h1>
          <p className="profile-email">{currentUser?.email}</p>
          <div className="profile-role">
            {getRoleDisplayName(userData?.role || '')}
          </div>
        </div>

        {/* Content Section */}
        <div className="profile-content">
          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">
                {userData?.createdAt ? 
                  (() => {
                    try {
                      console.log('Profile - createdAt value:', userData.createdAt);
                      console.log('Profile - createdAt type:', typeof userData.createdAt);
                      
                      // Handle different date formats from Firebase
                      let createdDate: Date;
                      if (userData.createdAt instanceof Date) {
                        createdDate = userData.createdAt;
                      } else if (typeof userData.createdAt === 'string') {
                        createdDate = new Date(userData.createdAt);
                      } else if (userData.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt) {
                        // Firestore timestamp
                        createdDate = (userData.createdAt as any).toDate();
                      } else {
                        console.log('Profile - Unknown createdAt format, returning 0');
                        return '0';
                      }
                      
                      console.log('Profile - Parsed createdDate:', createdDate);
                      const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                      console.log('Profile - Calculated daysDiff:', daysDiff);
                      return isNaN(daysDiff) ? '0' : daysDiff.toString();
                    } catch (error) {
                      console.error('Error calculating days active:', error);
                      return '0';
                    }
                  })() : '0'
                }
              </div>
              <div className="stat-label">Days Active</div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <div className="section-icon">👤</div>
                Personal Information
              </h2>
              {!edit ? (
                <button className="edit-button" onClick={() => setEdit(true)}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <button className="edit-button cancel" onClick={() => setEdit(false)}>
                  ❌ Cancel
                </button>
              )}
            </div>

            {!edit ? (
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">First Name</div>
                  <div className="info-value">{userData?.firstName || '-'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Last Name</div>
                  <div className="info-value">{userData?.lastName || '-'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Email Address</div>
                  <div className="info-value">{userData?.email || '-'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Phone Number</div>
                  <div className={`info-value ${!userData?.phoneNumber ? 'empty' : ''}`}>
                    {userData?.phoneNumber || 'Not provided'}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Address</div>
                  <div className={`info-value ${!userData?.address ? 'empty' : ''}`}>
                    {userData?.address || 'Not provided'}
                  </div>
                </div>
                {userData?.role === 'teacher' && (
                  <>
                    <div className="info-card">
                      <div className="info-label">Years of Experience</div>
                      <div className={`info-value ${!userData?.yearsOfExperience ? 'empty' : ''}`}>
                        {userData?.yearsOfExperience ? `${userData.yearsOfExperience} years` : 'Not specified'}
                      </div>
                    </div>
                    <div className="info-card">
                      <div className="info-label">Current School</div>
                      <div className={`info-value ${!userData?.currentSchool ? 'empty' : ''}`}>
                        {userData?.currentSchool || 'Not specified'}
                      </div>
                    </div>
                  </>
                )}
                <div className="info-card">
                  <div className="info-label">Account Created</div>
                  <div className="info-value">
                    {userData?.createdAt ? 
                      (() => {
                        try {
                          // Handle different date formats from Firebase
                          let createdDate: Date;
                          if (userData.createdAt instanceof Date) {
                            createdDate = userData.createdAt;
                          } else if (typeof userData.createdAt === 'string') {
                            createdDate = new Date(userData.createdAt);
                          } else if (userData.createdAt && typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt) {
                            // Firestore timestamp
                            createdDate = (userData.createdAt as any).toDate();
                          } else {
                            return 'Unknown';
                          }
                          
                          // Check if the date is valid
                          if (isNaN(createdDate.getTime())) {
                            return 'Unknown';
                          }
                          
                          return createdDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        } catch (error) {
                          console.error('Error formatting account created date:', error);
                          return 'Unknown';
                        }
                      })() : '-'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSaveProfile} className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">First Name</label>
                    <input
                      className="form-input"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('common.enterFirstName')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Last Name</label>
                    <input
                      className="form-input"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('common.enterLastName')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <input
                      className="form-input"
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t('common.enterPhoneNumber')}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="address">Address</label>
                    <input
                      className="form-input"
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t('common.enterAddress')}
                    />
                  </div>
                  {userData?.role === 'teacher' && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="exp">Years of Experience</label>
                        <input
                          className="form-input"
                          id="exp"
                          type="number"
                          min={0}
                          max={50}
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                          placeholder={t('common.enterYearsOfExperience')}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="school">Current School</label>
                        <input
                          className="form-input"
                          id="school"
                          value={currentSchool}
                          onChange={(e) => setCurrentSchool(e.target.value)}
                          placeholder={t('common.enterCurrentSchool')}
                        />
                      </div>
                    </>
                  )}
                </div>
                <button type="submit" className="save-button">
                  💾 Save Changes
                </button>
              </form>
            )}
          </div>

          {/* Password Change Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">
                <div className="section-icon">🔒</div>
                Security Settings
              </h2>
            </div>

            <div className="password-section">
              <h3 style={{ margin: '0 0 16px 0', color: '#92400e', fontSize: '18px', fontWeight: '600' }}>
                Change Password
              </h3>
              <p style={{ margin: '0 0 24px 0', color: '#92400e', fontSize: '14px' }}>
                Update your password to keep your account secure
              </p>

              {error && (
                <div className="message error">
                  ⚠️ {error}
                </div>
              )}
              {message && (
                <div className="message success">
                  ✅ {message}
                </div>
              )}

              <form onSubmit={onUpdatePassword} className="password-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">Current Password</label>
                  <input
                    className="password-input"
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('common.enterCurrentPassword')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Password</label>
                  <input
                    className="password-input"
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('common.enterNewPassword')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    className="password-input"
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('common.confirmNewPassword')}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="update-password-button">
                  {loading ? '⏳ Updating...' : '🔐 Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


