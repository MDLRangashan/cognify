import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import SchoolsManagement from '../../components/SchoolsManagement';
import TeacherApproval from '../../components/TeacherApproval';
import QuizManagement from '../../components/QuizManagement';
import LanguageSelector from '../../components/LanguageSelector';
import './Dashboard.css';
import logo from '../../logo.svg';
import '../../components/SchoolsManagement.css';
import '../../components/TeacherApproval.css';
import '../../components/QuizManagement.css';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
}

const AdminDashboard: React.FC = () => {
  const { userData, logout } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'parent' as 'admin' | 'teacher' | 'parent'
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phoneNumber: editFormData.phoneNumber,
        address: editFormData.address,
        role: editFormData.role,
        updatedAt: new Date()
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...editFormData }
          : user
      ));

      setShowEditModal(false);
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        
        // Update local state
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      role: 'parent'
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStats = () => {
    const teachers = users.filter(user => user.role === 'teacher').length;
    const parents = users.filter(user => user.role === 'parent').length;
    const totalUsers = users.length;

    return { teachers, parents, totalUsers };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src={logo} alt="Cognify" style={{height:40}}/>
            <h1>{t('navigation.manageUsers')} Dashboard</h1>
          </div>
          <div className="user-info">
            <LanguageSelector />
            <span>Welcome, {userData?.firstName} {userData?.lastName}</span>
            <Link to="/profile" className="logout-btn" style={{textDecoration:'none'}}>{t('common.profile')}</Link>
            <button onClick={handleLogout} className="logout-btn">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'overview' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('overview')}
        >
          {t('navigation.overview')}
        </button>
        <button 
          className={activeTab === 'users' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('users')}
        >
          {t('navigation.manageUsers')}
        </button>
        <button 
          className={activeTab === 'schools' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('schools')}
        >
          {t('navigation.manageSchools')}
        </button>
        <button 
          className={activeTab === 'teachers' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('teachers')}
        >
          {t('navigation.approveTeachers')}
        </button>
        <button 
          className={activeTab === 'quizzes' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('quizzes')}
        >
          {t('navigation.manageQuizzes')}
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>{t('navigation.overview')}</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{t('common.totalUsers')}</h3>
                <div className="stat-number">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <h3>{t('auth.teacher')}s</h3>
                <div className="stat-number">{stats.teachers}</div>
              </div>
              <div className="stat-card">
                <h3>{t('auth.parent')}s</h3>
                <div className="stat-number">{stats.parents}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>{t('navigation.manageUsers')}</h2>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('auth.email')}</th>
                    <th>{t('auth.role')}</th>
                    <th>{t('auth.phoneNumber')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td>{user.phoneNumber || 'N/A'}</td>
                      <td>
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="schools-section">
            <SchoolsManagement />
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="teachers-section">
            <TeacherApproval />
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="quizzes-section">
            <QuizManagement />
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleUpdateUser} className="edit-user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value as 'admin' | 'teacher' | 'parent'})}
                  required
                >
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
