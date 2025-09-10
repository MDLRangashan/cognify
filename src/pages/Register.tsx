import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './Register.css';

const Register: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    role: 'parent' as 'teacher' | 'parent',
    yearsOfExperience: '',
    currentSchool: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);
  const [teacherProofBase64, setTeacherProofBase64] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (!file) {
      setTeacherProofBase64(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setTeacherProofBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.role === 'teacher' && (!formData.yearsOfExperience || !formData.currentSchool)) {
      setError('Please fill in all required teacher fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await register(formData.email, formData.password, {
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        yearsOfExperience: formData.role === 'teacher' ? formData.yearsOfExperience : undefined,
        currentSchool: formData.role === 'teacher' ? formData.currentSchool : undefined
      }, teacherProofBase64);
      
      // Redirect based on role
      if (formData.role === 'teacher') {
        navigate('/pending-approval');
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      setError('Failed to create account. Email might already be in use.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Children Management System</h1>
          <h2>Create Account</h2>
          <p>Join our community today</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
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
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'teacher' && (
            <>
              <div className="form-group">
                <label htmlFor="yearsOfExperience">Years of Experience *</label>
                <input
                  type="number"
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder={t('common.enterYearsOfExperience')}
                  min="0"
                  max="50"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="currentSchool">Current School *</label>
                <select
                  id="currentSchool"
                  name="currentSchool"
                  value={formData.currentSchool}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a school</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.name}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="teacherProof">Proof of Employment (PDF/Image) *</label>
                <input
                  type="file"
                  id="teacherProof"
                  name="teacherProof"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                />
                <small>Upload a document that proves you are a teacher.</small>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
