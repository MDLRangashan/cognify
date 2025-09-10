import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

interface School {
  id: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}

const SchoolsManagement: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('School name is required');
      return;
    }

    try {
      if (editingSchool) {
        // Update existing school
        await updateDoc(doc(db, 'schools', editingSchool.id), formData);
        setSchools(schools.map(school => 
          school.id === editingSchool.id ? { ...school, ...formData } : school
        ));
      } else {
        // Add new school
        const docRef = await addDoc(collection(db, 'schools'), formData);
        setSchools([...schools, { id: docRef.id, ...formData }]);
      }
      
      setFormData({ name: '', address: '', phoneNumber: '', email: '' });
      setShowAddForm(false);
      setEditingSchool(null);
    } catch (error) {
      console.error('Error saving school:', error);
      alert('Error saving school');
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address || '',
      phoneNumber: school.phoneNumber || '',
      email: school.email || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (schoolId: string) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await deleteDoc(doc(db, 'schools', schoolId));
        setSchools(schools.filter(school => school.id !== schoolId));
      } catch (error) {
        console.error('Error deleting school:', error);
        alert('Error deleting school');
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', address: '', phoneNumber: '', email: '' });
    setShowAddForm(false);
    setEditingSchool(null);
  };

  if (loading) {
    return <div className="loading">Loading schools...</div>;
  }

  return (
    <div className="schools-management">
      <div className="schools-header">
        <h2>Schools Management</h2>
        <button 
          className="add-school-btn"
          onClick={() => setShowAddForm(true)}
        >
          Add New School
        </button>
      </div>

      {showAddForm && (
        <div className="school-form-modal">
          <div className="school-form-card">
            <h3>{editingSchool ? 'Edit School' : 'Add New School'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">School Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter school name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter school address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter school email"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingSchool ? 'Update School' : 'Add School'}
                </button>
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schools-list">
        {schools.length === 0 ? (
          <div className="no-schools">
            <p>No schools found. Add a school to get started.</p>
          </div>
        ) : (
          <div className="schools-grid">
            {schools.map(school => (
              <div key={school.id} className="school-card">
                <h4>{school.name}</h4>
                {school.address && <p><strong>Address:</strong> {school.address}</p>}
                {school.phoneNumber && <p><strong>Phone:</strong> {school.phoneNumber}</p>}
                {school.email && <p><strong>Email:</strong> {school.email}</p>}
                <div className="school-actions">
                  <button 
                    onClick={() => handleEdit(school)}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(school.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolsManagement;
