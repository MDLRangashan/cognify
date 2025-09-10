import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './AssignedStudents.css';

interface Child {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  username: string;
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

const AssignedStudents: React.FC = () => {
  const { userData } = useAuth();
  const [students, setStudents] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Child | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userData?.uid) {
      fetchAssignedStudents();
    }
  }, [userData?.uid]);

  const fetchAssignedStudents = async () => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const studentsRef = collection(db, 'children');
      const q = query(studentsRef, where('assignedTeacherId', '==', userData.uid));
      const querySnapshot = await getDocs(q);
      
      const studentsData: Child[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Child);
      });
      
      setStudents(studentsData);
      setMessage(`You have ${studentsData.length} assigned student${studentsData.length !== 1 ? 's' : ''}`);
    } catch (err: any) {
      console.error('Error fetching assigned students:', err);
    } finally {
      setLoading(false);
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

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="assigned-students">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading assigned students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-students">
      <div className="students-header">
        <h2>My Assigned Students</h2>
        {message && (
          <div className="info-message">{message}</div>
        )}
      </div>

      {students.length === 0 ? (
        <div className="no-students">
          <p>No students have been assigned to you yet.</p>
        </div>
      ) : (
        <div className="students-grid">
          {students.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-header">
                <h4>{student.firstName} {student.lastName}</h4>
                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedStudent(student)}
                >
                  View Details
                </button>
              </div>
              
              <div className="student-summary">
                <div className="summary-item">
                  <strong>Username:</strong> {student.username}
                </div>
                <div className="summary-item">
                  <strong>Age:</strong> {calculateAge(student.dateOfBirth)} years old
                </div>
                <div className="summary-item">
                  <strong>Grade:</strong> {student.grade || 'Not specified'}
                </div>
                <div className="summary-item">
                  <strong>School:</strong> {student.school || 'Not specified'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="student-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Student Details - {selectedStudent.firstName} {selectedStudent.lastName}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedStudent(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-item">
                    <strong>Full Name:</strong> {selectedStudent.firstName} {selectedStudent.lastName}
                  </div>
                  <div className="detail-item">
                    <strong>Username:</strong> {selectedStudent.username}
                  </div>
                  <div className="detail-item">
                    <strong>Date of Birth:</strong> {formatDate(selectedStudent.dateOfBirth)}
                  </div>
                  <div className="detail-item">
                    <strong>Age:</strong> {calculateAge(selectedStudent.dateOfBirth)} years old
                  </div>
                  <div className="detail-item">
                    <strong>Gender:</strong> {selectedStudent.gender.charAt(0).toUpperCase() + selectedStudent.gender.slice(1)}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Academic Information</h4>
                  <div className="detail-item">
                    <strong>Grade/Class:</strong> {selectedStudent.grade || 'Not specified'}
                  </div>
                  <div className="detail-item">
                    <strong>School:</strong> {selectedStudent.school || 'Not specified'}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <div className="detail-item">
                    <strong>Emergency Contact:</strong> {selectedStudent.emergencyContact || 'Not provided'}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Health Information</h4>
                  <div className="detail-item">
                    <strong>Allergies:</strong> {selectedStudent.allergies || 'None reported'}
                  </div>
                  <div className="detail-item">
                    <strong>Medical Information:</strong> {selectedStudent.medicalInfo || 'None reported'}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>System Information</h4>
                  <div className="detail-item">
                    <strong>Assigned Date:</strong> {formatDate(selectedStudent.createdAt)}
                  </div>
                  <div className="detail-item">
                    <strong>Last Updated:</strong> {formatDate(selectedStudent.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="close-btn"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedStudents;
