import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './TeacherApproval.css';

interface Teacher {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  yearsOfExperience?: string;
  currentSchool?: string;
  teacherProofBase64?: string;
  isApproved: boolean;
  createdAt: Date;
}

const TeacherApproval: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const usersSnapshot = await getDocs(q);
      const teachersData = usersSnapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Teacher[];
      console.log('Fetched teachers:', teachersData.length);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, 'users', teacherId), { isApproved: true });
      setTeachers(teachers.map(teacher => 
        teacher.id === teacherId ? { ...teacher, isApproved: true } : teacher
      ));
      
      // Here you could add email notification logic
      console.log(`Teacher ${teacherId} has been approved`);
    } catch (error) {
      console.error('Error approving teacher:', error);
      alert('Error approving teacher');
    }
  };

  const handleReject = async (teacherId: string) => {
    if (window.confirm('Are you sure you want to reject this teacher? This action cannot be undone.')) {
      try {
        await updateDoc(doc(db, 'users', teacherId), { isApproved: false });
        setTeachers(teachers.map(teacher => 
          teacher.id === teacherId ? { ...teacher, isApproved: false } : teacher
        ));
        
        console.log(`Teacher ${teacherId} has been rejected`);
      } catch (error) {
        console.error('Error rejecting teacher:', error);
        alert('Error rejecting teacher');
      }
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    if (filter === 'pending') return !teacher.isApproved;
    if (filter === 'approved') return teacher.isApproved;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading teachers...</div>;
  }

  return (
    <div className="teacher-approval">
      <div className="approval-header">
        <h2>Teacher Approval Management</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            All Teachers ({teachers.length})
          </button>
          <button 
            className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('pending')}
          >
            Pending Approval ({teachers.filter(t => !t.isApproved).length})
          </button>
          <button 
            className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('approved')}
          >
            Approved ({teachers.filter(t => t.isApproved).length})
          </button>
        </div>
      </div>

      <div className="teachers-list">
        {filteredTeachers.length === 0 ? (
          <div className="no-teachers">
            <p>No teachers found for the selected filter.</p>
          </div>
        ) : (
          <div className="teachers-grid">
            {filteredTeachers.map(teacher => (
              <div key={teacher.id} className={`teacher-card ${teacher.isApproved ? 'approved' : 'pending'}`}>
                <div className="teacher-header">
                  <h3>{teacher.firstName} {teacher.lastName}</h3>
                  <span className={`status-badge ${teacher.isApproved ? 'approved' : 'pending'}`}>
                    {teacher.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                
                <div className="teacher-details">
                  <p><strong>Email:</strong> {teacher.email}</p>
                  {teacher.phoneNumber && <p><strong>Phone:</strong> {teacher.phoneNumber}</p>}
                  {teacher.address && <p><strong>Address:</strong> {teacher.address}</p>}
                  {teacher.yearsOfExperience && <p><strong>Experience:</strong> {teacher.yearsOfExperience} years</p>}
                  {teacher.currentSchool && <p><strong>School:</strong> {teacher.currentSchool}</p>}
                  {teacher.teacherProofBase64 && (
                    <div style={{marginTop: '8px'}}>
                      <strong>Proof:</strong>{' '}
                      {teacher.teacherProofBase64.startsWith('data:application/pdf') ? (
                        <a href={teacher.teacherProofBase64} target="_blank" rel="noreferrer">View PDF</a>
                      ) : (
                        <img src={teacher.teacherProofBase64} alt="Teacher proof" style={{maxWidth: '100%', maxHeight: 160, display: 'block', border: '1px solid #eee', borderRadius: 6, marginTop: 6}} />
                      )}
                    </div>
                  )}
                  <p>
                    <strong>Registered:</strong>{' '}
                    {(() => {
                      const ts: any = teacher.createdAt as any;
                      const dateValue = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts || Date.now());
                      return dateValue.toLocaleDateString();
                    })()}
                  </p>
                </div>

                {!teacher.isApproved && (
                  <div className="teacher-actions">
                    <button 
                      onClick={() => handleApprove(teacher.id)}
                      className="approve-btn"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(teacher.id)}
                      className="reject-btn"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {teacher.isApproved && (
                  <div className="approved-message">
                    <span className="checkmark">✓</span>
                    <span>This teacher has been approved and can login</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherApproval;
