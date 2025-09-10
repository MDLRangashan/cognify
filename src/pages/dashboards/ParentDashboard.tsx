import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ChildrenManagement from '../../components/ChildrenManagement';
import StudentPerformanceReport from '../../components/StudentPerformanceReport';
import MessagingSystem from '../../components/MessagingSystem';
import ParentAnalytics from '../../components/ParentAnalytics';
import VideoCalls from '../../components/VideoCalls';
import LanguageSelector from '../../components/LanguageSelector';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import './ParentDashboard.css';
import logo from '../../logo.svg';

const ParentDashboard: React.FC = () => {
  const { userData, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [childrenCount, setChildrenCount] = useState(0);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  useEffect(() => {
    fetchChildrenCount();
  }, [userData?.uid]);

  const fetchChildrenCount = async () => {
    if (!userData?.uid) return;
    
    try {
      const childrenRef = collection(db, 'children');
      const q = query(childrenRef, where('parentId', '==', userData.uid));
      const querySnapshot = await getDocs(q);
      const childrenData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChildren(childrenData);
      setChildrenCount(childrenData.length);
    } catch (error) {
      console.error('Error fetching children count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="parent-dashboard">
      {/* Modern Header */}
      <header className="parent-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <img src={logo} alt="Cognify" style={{height:40, marginRight:10}}/>
              <div className="logo-text">
                <h1>Parent Portal</h1>
                <p>Track your child's learning journey</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <LanguageSelector />
            <div className="user-profile">
              <div className="user-avatar">
                {userData?.firstName?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div className="user-details">
                <span className="user-name">{userData?.firstName} {userData?.lastName}</span>
                <span className="user-role">{t('auth.parent')}</span>
              </div>
            </div>
            <div className="header-actions">
              <Link to="/profile" className="profile-btn">
                <span className="btn-icon">⚙️</span>
                {t('common.profile')}
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                <span className="btn-icon">🚪</span>
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <nav className="parent-nav">
        <div className="nav-container">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">{t('navigation.overview')}</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">{t('navigation.analytics')}</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'children' ? 'active' : ''}`}
            onClick={() => setActiveTab('children')}
          >
            <span className="nav-icon">👶</span>
            <span className="nav-text">{t('navigation.myChildren')}</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">{t('navigation.messages')}</span>
            <span className="notification-badge">3</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">{t('navigation.reports')}</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
            onClick={() => setActiveTab('calls')}
          >
            <span className="nav-icon">📹</span>
            <span className="nav-text">Video Calls</span>
          </button>
        </div>
      </nav>

      <main className="parent-main">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="section-header">
              <h2>Dashboard {t('navigation.overview')}</h2>
              <p>{t('dashboard.welcome')}</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">👶</div>
                <div className="stat-content">
                  <h3>{t('dashboard.myChildren')}</h3>
                  <div className="stat-number">{childrenCount}</div>
                  <p className="stat-description">{t('dashboard.registeredChildren')}</p>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">💬</div>
                <div className="stat-content">
                  <h3>{t('dashboard.unreadMessages')}</h3>
                  <div className="stat-number">3</div>
                  <p className="stat-description">{t('dashboard.newMessagesFromTeachers')}</p>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>{t('dashboard.recentReports')}</h3>
                  <div className="stat-number">5</div>
                  <p className="stat-description">{t('dashboard.performanceReportsThisWeek')}</p>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>{t('dashboard.goalsAchieved')}</h3>
                  <div className="stat-number">12</div>
                  <p className="stat-description">{t('dashboard.learningMilestonesCompleted')}</p>
                </div>
              </div>
            </div>
            
            <div className="content-grid">
              <div className="recent-activities">
                <div className="card-header">
                  <h3>Recent Updates</h3>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">📊</div>
                    <div className="activity-content">
                      <span className="activity-text">New progress report available for Sarah</span>
                      <span className="activity-time">1 hour ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">💬</div>
                    <div className="activity-content">
                      <span className="activity-text">Message from Teacher Johnson</span>
                      <span className="activity-time">3 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">✅</div>
                    <div className="activity-content">
                      <span className="activity-text">Attendance updated for this week</span>
                      <span className="activity-time">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="actions-grid">
                  <button className="action-btn" onClick={() => setActiveTab('analytics')}>
                    <span className="action-icon">📊</span>
                    <span className="action-text">View Analytics</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('reports')}>
                    <span className="action-icon">📈</span>
                    <span className="action-text">View Reports</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('messages')}>
                    <span className="action-icon">💬</span>
                    <span className="action-text">Check Messages</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('children')}>
                    <span className="action-icon">👶</span>
                    <span className="action-text">Manage Children</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <ParentAnalytics children={children} />
        )}

        {activeTab === 'children' && (
          <ChildrenManagement />
        )}

        {activeTab === 'messages' && (
          <MessagingSystem 
            userRole="parent" 
            children={children}
          />
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>{t('navigation.reports')}</h2>
              <p>{t('dashboard.welcome')}</p>
            </div>
            
            {children.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👶</div>
                <h3>{t('common.noChildrenFound')}</h3>
                <p>{t('common.addChildrenToViewReports')}</p>
                <button className="add-child-btn" onClick={() => setActiveTab('children')}>
                  {t('common.addChildren')}
                </button>
              </div>
            ) : (
              <div className="reports-container">
                <div className="child-selector">
                  <h3>{t('common.selectChildForReport')}</h3>
                  <div className="children-grid">
                    {children.map((child) => (
                      <div 
                        key={child.id} 
                        className={`child-card ${selectedChild?.id === child.id ? 'selected' : ''}`}
                        onClick={() => setSelectedChild(child)}
                      >
                        <div className="child-avatar">
                          {child.firstName?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                        <div className="child-info">
                          <h4>{child.firstName} {child.lastName}</h4>
                          <p className="child-age">{t('common.age')}: {child.age} {t('common.years')}</p>
                          <p className="child-school">{child.school}</p>
                        </div>
                        <div className="child-status">
                          {selectedChild?.id === child.id ? (
                            <span className="selected-icon">✓</span>
                          ) : (
                            <span className="select-icon">→</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedChild && (
                  <div className="performance-report-container">
                    <div className="report-header">
                      <h3>{selectedChild.firstName}'s {t('navigation.reports')}</h3>
                      <div className="report-actions">
                        <button className="export-btn">📊 {t('common.exportReport')}</button>
                        <button className="share-btn">📤 {t('common.share')}</button>
                      </div>
                    </div>
                    <StudentPerformanceReport 
                      studentId={selectedChild.id}
                      studentName={`${selectedChild.firstName} ${selectedChild.lastName}`}
                      userRole="parent"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calls' && userData && (
          <VideoCalls userUid={userData.uid} userRole="parent" />
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;
