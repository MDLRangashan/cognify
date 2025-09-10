import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './ChildrenManagement.css';

interface School {
  id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  currentSchool?: string;
  yearsOfExperience?: string;
  isApproved: boolean;
}

interface Child {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  grade: string;
  school: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  emergencyContact: string;
  medicalInfo: string;
  allergies: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChildrenManagement: React.FC = () => {
  const { userData } = useAuth();
  const { t } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    grade: '',
    school: '',
    assignedTeacherId: '',
    assignedTeacherName: '',
    emergencyContact: '',
    medicalInfo: '',
    allergies: ''
  });

  useEffect(() => {
    if (userData?.uid) {
      fetchChildren();
      fetchSchools();
      fetchTeachers();
    }
  }, [userData?.uid]);

  const fetchChildren = async () => {
    if (!userData?.uid) {
      console.log('No userData.uid available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching children for parentId:', userData.uid);
      
      const childrenRef = collection(db, 'children');
      const q = query(childrenRef, where('parentId', '==', userData.uid));
      const querySnapshot = await getDocs(q);
      
      console.log('Query snapshot size:', querySnapshot.size);
      
      const childrenData: Child[] = [];
      querySnapshot.forEach((doc) => {
        console.log('Child document:', doc.id, doc.data());
        childrenData.push({ id: doc.id, ...doc.data() } as Child);
      });
      
      console.log('Children data array:', childrenData);
      setChildren(childrenData);
    } catch (err: any) {
      setError('Failed to fetch children data: ' + err.message);
      console.error('Error fetching children:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsData);
      console.log('Fetched schools:', schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const teachersSnapshot = await getDocs(collection(db, 'users'));
      const teachersData = teachersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((user: any) => user.role === 'teacher' && user.isApproved === true) as Teacher[];
      setTeachers(teachersData);
      console.log('Fetched teachers:', teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = e.target.value;
    const selectedTeacher = teachers.find(teacher => teacher.id === teacherId);
    
    setFormData(prev => ({
      ...prev,
      assignedTeacherId: teacherId,
      assignedTeacherName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : ''
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      dateOfBirth: '',
      gender: 'male',
      grade: '',
      school: '',
      assignedTeacherId: '',
      assignedTeacherName: '',
      emergencyContact: '',
      medicalInfo: '',
      allergies: ''
    });
    setShowAddForm(false);
    setEditingChild(null);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.uid) {
      console.log('No userData.uid available for form submission');
      return;
    }

    setError('');
    setMessage('');

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      const childData = {
        parentId: userData.uid,
        ...formData,
        createdAt: editingChild ? editingChild.createdAt : new Date(),
        updatedAt: new Date()
      };

      console.log('Submitting child data:', childData);

      if (editingChild) {
        // Update existing child
        await updateDoc(doc(db, 'children', editingChild.id), childData);
        setMessage('Child information updated successfully');
        console.log('Child updated successfully');
      } else {
        // Add new child
        const docRef = await addDoc(collection(db, 'children'), childData);
        setMessage('Child added successfully');
        console.log('Child added successfully with ID:', docRef.id);
      }

      await fetchChildren();
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to save child information');
      console.error('Error saving child:', err);
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      username: child.username,
      password: child.password,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      grade: child.grade,
      school: child.school,
      assignedTeacherId: child.assignedTeacherId,
      assignedTeacherName: child.assignedTeacherName,
      emergencyContact: child.emergencyContact,
      medicalInfo: child.medicalInfo,
      allergies: child.allergies
    });
    setShowAddForm(true);
  };

  const handleDelete = async (childId: string) => {
    if (!window.confirm('Are you sure you want to delete this child\'s information?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'children', childId));
      setMessage('Child information deleted successfully');
      await fetchChildren();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete child information');
      console.error('Error deleting child:', err);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="children-management">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading children data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="children-management">
      <div className="children-header">
        <h2>My Children</h2>
        <button 
          className="add-child-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Child
        </button>
      </div>

      {message && (
        <div className="success-message">{message}</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {showAddForm && (
        <div className="add-child-form">
          <div className="form-header">
            <h3>{editingChild ? 'Edit Child Information' : 'Add New Child'}</h3>
            <button className="close-btn" onClick={resetForm}>×</button>
          </div>
          
                     <form onSubmit={handleSubmit} className="child-form">
             <div className="form-row">
               <div className="form-group">
                 <label htmlFor="firstName">First Name *</label>
                 <input
                   type="text"
                   id="firstName"
                   name="firstName"
                   value={formData.firstName}
                   onChange={handleInputChange}
                   required
                 />
               </div>
               <div className="form-group">
                 <label htmlFor="lastName">Last Name *</label>
                 <input
                   type="text"
                   id="lastName"
                   name="lastName"
                   value={formData.lastName}
                   onChange={handleInputChange}
                   required
                 />
               </div>
             </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grade">Grade/Class</label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="e.g., 5th Grade, Class A"
                />
              </div>
                             <div className="form-group">
                 <label htmlFor="school">School</label>
                 <select
                   id="school"
                   name="school"
                   value={formData.school}
                   onChange={handleInputChange}
                 >
                   <option value="">Select a school</option>
                   {schools.length > 0 ? (
                     schools.map((school) => (
                       <option key={school.id} value={school.name}>
                         {school.name}
                       </option>
                     ))
                   ) : (
                     <option value="" disabled>No schools available</option>
                   )}
                 </select>
                 {schools.length === 0 && (
                   <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                     No schools available. Please contact admin to add schools.
                   </small>
                 )}
               </div>
            </div>

            <div className="form-group">
              <label htmlFor="assignedTeacherId">Assign Teacher *</label>
              <select
                id="assignedTeacherId"
                name="assignedTeacherId"
                value={formData.assignedTeacherId}
                onChange={handleTeacherChange}
                required
              >
                <option value="">Select a teacher</option>
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} - {teacher.currentSchool || 'No School'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No teachers available</option>
                )}
              </select>
              {teachers.length === 0 && (
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  No teachers available. Please contact admin to add teachers.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="emergencyContact">Emergency Contact</label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                placeholder={t('common.emergencyContactPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="medicalInfo">Medical Information</label>
              <textarea
                id="medicalInfo"
                name="medicalInfo"
                value={formData.medicalInfo}
                onChange={handleInputChange}
                placeholder={t('common.medicalConditionsPlaceholder')}
                rows={3}
              />
            </div>

                         <div className="form-group">
               <label htmlFor="allergies">Allergies</label>
               <input
                 type="text"
                 id="allergies"
                 name="allergies"
                 value={formData.allergies}
                 onChange={handleInputChange}
                 placeholder={t('common.allergiesPlaceholder')}
               />
             </div>

             {/* Login Details Section */}
             <div className="login-details-section">
               <h4>Login Details</h4>
               <div className="form-row">
                 <div className="form-group">
                   <label htmlFor="username">Username *</label>
                   <input
                     type="text"
                     id="username"
                     name="username"
                     value={formData.username}
                     onChange={handleInputChange}
                     required
                     placeholder="Choose a unique username for the child"
                   />
                 </div>
                 <div className="form-group">
                   <label htmlFor="password">Password *</label>
                   <input
                     type="password"
                     id="password"
                     name="password"
                     value={formData.password}
                     onChange={handleInputChange}
                     required
                     placeholder={t('common.createPasswordPlaceholder')}
                     minLength={6}
                   />
                 </div>
               </div>
             </div>

             <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                {editingChild ? 'Update Child' : 'Add Child'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="children-list">
        {children.length === 0 ? (
          <div className="no-children">
            <p>{t('common.noChildrenAddedYet')}</p>
          </div>
        ) : (
          <div className="children-grid">
            {children.map((child) => (
              <div key={child.id} className="child-card">
                <div className="child-header">
                  <h4>{child.firstName} {child.lastName}</h4>
                  <div className="child-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(child)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(child.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                                 <div className="child-details">
                   <div className="detail-item">
                     <strong>Username:</strong> {child.username}
                   </div>
                   <div className="detail-item">
                     <strong>Password:</strong> ••••••••
                   </div>
                   <div className="detail-item">
                     <strong>Age:</strong> {calculateAge(child.dateOfBirth)} years old
                   </div>
                   <div className="detail-item">
                     <strong>Gender:</strong> {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                   </div>
                  {child.grade && (
                    <div className="detail-item">
                      <strong>Grade:</strong> {child.grade}
                    </div>
                  )}
                                     {child.school && (
                     <div className="detail-item">
                       <strong>School:</strong> {child.school}
                     </div>
                   )}
                   {child.assignedTeacherName && (
                     <div className="detail-item">
                       <strong>Assigned Teacher:</strong> {child.assignedTeacherName}
                     </div>
                   )}
                   {child.emergencyContact && (
                    <div className="detail-item">
                      <strong>Emergency Contact:</strong> {child.emergencyContact}
                    </div>
                  )}
                  {child.allergies && (
                    <div className="detail-item">
                      <strong>Allergies:</strong> {child.allergies}
                    </div>
                  )}
                  {child.medicalInfo && (
                    <div className="detail-item">
                      <strong>Medical Info:</strong> {child.medicalInfo}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildrenManagement;
