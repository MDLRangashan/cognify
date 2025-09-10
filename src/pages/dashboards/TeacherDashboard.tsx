import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AssignedStudents from '../../components/AssignedStudents';
import StudentPerformanceReport from '../../components/StudentPerformanceReport';
import MessagingSystem from '../../components/MessagingSystem';
import TeacherAnalytics from '../../components/TeacherAnalytics';
import VideoCalls from '../../components/VideoCalls';
import LanguageSelector from '../../components/LanguageSelector';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import './TeacherDashboard.css';
import logo from '../../logo.svg';

const TeacherDashboard: React.FC = () => {
  const { userData, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    fetchAssignedStudents();
  }, [userData?.uid]);

  const fetchAssignedStudents = async () => {
    if (!userData?.uid) return;
    
    try {
      const childrenRef = collection(db, 'children');
      const q = query(childrenRef, where('assignedTeacherId', '==', userData.uid));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignedStudents(studentsData);
    } catch (error) {
      console.error('Error fetching assigned students:', error);
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
    <div className="teacher-dashboard">
      {/* Modern Header */}
      <header className="teacher-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <img src={logo} alt="Cognify" style={{height:40, marginRight:10}}/>
              <div className="logo-text">
                <h1>Teacher Portal</h1>
                <p>Manage your students and track their progress</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <LanguageSelector />
            <div className="user-profile">
              <div className="user-avatar">
                {userData?.firstName?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div className="user-details">
                <span className="user-name">{userData?.firstName} {userData?.lastName}</span>
                <span className="user-role">{t('auth.teacher')}</span>
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
      <nav className="teacher-nav">
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
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">{t('navigation.myChildren')}</span>
            <span className="student-count">{assignedStudents.length}</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">{t('navigation.messages')}</span>
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

      <main className="teacher-main">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="section-header">
              <h2>{t('auth.teacher')} {t('navigation.overview')}</h2>
              <p>{t('dashboard.welcome')}</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Total Students</h3>
                  <div className="stat-number">{assignedStudents.length}</div>
                  <p className="stat-description">Assigned students</p>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h3>Active Classes</h3>
                  <div className="stat-number">3</div>
                  <p className="stat-description">Classes in progress</p>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <h3>Pending Reports</h3>
                  <div className="stat-number">5</div>
                  <p className="stat-description">Reports to complete</p>
                </div>
              </div>
              <div className="stat-card info">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>Goals Achieved</h3>
                  <div className="stat-number">18</div>
                  <p className="stat-description">Learning milestones</p>
                </div>
              </div>
            </div>
            
            <div className="content-grid">
              <div className="recent-activities">
                <div className="card-header">
                  <h3>Recent Activities</h3>
                  <button className="view-all-btn">View All</button>
                </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">📊</div>
                    <div className="activity-content">
                      <span className="activity-text">Added progress report for Sarah Johnson</span>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">📅</div>
                    <div className="activity-content">
                      <span className="activity-text">Updated attendance for Class A</span>
                      <span className="activity-time">1 day ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">💬</div>
                    <div className="activity-content">
                      <span className="activity-text">Sent message to parent - Mike Davis</span>
                      <span className="activity-time">2 days ago</span>
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
                  <button className="action-btn" onClick={() => setActiveTab('students')}>
                    <span className="action-icon">👥</span>
                    <span className="action-text">View Students</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('reports')}>
                    <span className="action-icon">📈</span>
                    <span className="action-text">View Reports</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('messages')}>
                    <span className="action-icon">💬</span>
                    <span className="action-text">Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <TeacherAnalytics assignedStudents={assignedStudents} />
        )}

        {activeTab === 'students' && (
          <AssignedStudents />
        )}

        {activeTab === 'messages' && (
          <MessagingSystem 
            userRole="teacher" 
            assignedStudents={assignedStudents}
          />
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>{t('navigation.reports')}</h2>
              <p>{t('dashboard.welcome')}</p>
            </div>
            
            {assignedStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>{t('common.noAssignedStudents')}</h3>
                <p>{t('common.studentsWillAppearWhenAssigned')}</p>
                <button className="contact-admin-btn">
                  {t('common.contactAdministrator')}
                </button>
              </div>
            ) : (
              <div className="reports-container">
                <div className="student-selector">
                  <h3>Select a student to view their performance report</h3>
                  <div className="students-grid">
                    {assignedStudents.map((student) => (
                      <div 
                        key={student.id} 
                        className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="student-avatar">
                          {student.firstName?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                        <div className="student-info">
                          <h4>{student.firstName} {student.lastName}</h4>
                          <p className="student-age">Age: {student.age} years</p>
                          <p className="student-school">{student.school}</p>
                          <p className="student-parent">Parent: {student.parentName}</p>
                        </div>
                        <div className="student-status">
                          {selectedStudent?.id === student.id ? (
                            <span className="selected-icon">✓</span>
                          ) : (
                            <span className="select-icon">→</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedStudent && (
                  <div className="performance-report-container">
                    <div className="report-header">
                      <h3>{selectedStudent.firstName}'s Performance Report</h3>
                      <div className="report-actions">
                        <button className="export-btn">📊 Export Report</button>
                        <button className="share-btn">📤 Share with Parent</button>
                        <button className="print-btn">🖨️ Print</button>
                      </div>
                    </div>
                    <StudentPerformanceReport 
                      studentId={selectedStudent.id}
                      studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                      userRole="teacher"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calls' && userData && (
          <VideoCalls userUid={userData.uid} userRole="teacher" />
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
