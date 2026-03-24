import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Try to fetch employee record for all users
            const res = await axios.get('/api/employees/me');
            if (res.data.success) {
                setEmployeeData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // If employee record not found (404), use basic user info as fallback
            if (error.response?.status === 404) {
                setEmployeeData({
                    firstName: user?.role === 'admin' ? 'Admin' : user?.role?.replace('_', ' '),
                    lastName: 'User',
                    email: user?.email,
                    role: user?.role
                });
            } else {
                setMessage({ type: 'error', text: 'Failed to load profile information.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setMessage({ type: 'error', text: 'New passwords do not match.' });
        }

        if (passwordData.newPassword.length < 6) {
            return setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
        }

        try {
            setUpdating(true);
            const res = await axios.put('/api/auth/update-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (res.data.success) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to update password.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUpdating(false);
        }
    };

    const getInitials = () => {
        if (employeeData) {
            return `${employeeData.firstName[0]}${(employeeData.middleName || employeeData.lastName)[0]}`.toUpperCase();
        }
        return user?.email?.substring(0, 2).toUpperCase() || 'U';
    };

    if (loading) {
        return (
            <DashboardLayout user={user} logout={logout}>
                <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
                    <div className="loader">Loading profile...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-title">
                        <h1>My Profile</h1>
                        <p>Manage your personal information and security settings.</p>
                    </div>
                </div>

                <div className="profile-grid">
                    <div className="profile-main">
                        <div className="profile-card">
                            <h3><span>👤</span> Personal Information</h3>
                            <div className="info-grid">
                                <InfoItem label="First Name" value={employeeData?.firstName} />
                                <InfoItem label="Middle Name" value={employeeData?.middleName} />
                                <InfoItem label="Last Name" value={employeeData?.lastName} />
                                <InfoItem label="Email Address" value={employeeData?.email} />
                                <InfoItem label="Phone Number" value={employeeData?.phoneNumber} />
                                <InfoItem label="Gender" value={employeeData?.gender} />
                                <InfoItem label="Date of Birth" value={employeeData?.dateOfBirth ? new Date(employeeData.dateOfBirth).toLocaleDateString() : null} />
                            </div>
                        </div>

                        {user?.role !== 'admin' && employeeData?.employeeId && (
                            <div className="profile-card">
                                <h3><span>💼</span> Employment Details</h3>
                                <div className="info-grid">
                                    <InfoItem label="Employee ID" value={employeeData?.employeeId} />
                                    <InfoItem label="Position" value={employeeData?.position} />
                                    <InfoItem label="Department" value={employeeData?.department?.name} />
                                    <InfoItem label="Employment Type" value={employeeData?.employmentType} />
                                    <InfoItem label="Date Joined" value={employeeData?.dateJoined ? new Date(employeeData.dateJoined).toLocaleDateString() : null} />
                                    <InfoItem label="Status" value={
                                        <span className={`status-badge status-${employeeData?.status}`}>
                                            {employeeData?.status?.replace('_', ' ')}
                                        </span>
                                    } />
                                </div>
                            </div>
                        )}

                        {user?.role === 'admin' && (
                            <div className="profile-card">
                                <h3><span>⚙️</span> System Role</h3>
                                <div className="info-grid">
                                    <InfoItem label="Role" value={
                                        <span className="status-badge status-active">
                                            System Administrator
                                        </span>
                                    } />
                                    <InfoItem label="Access Level" value="Full System Access" />
                                    <InfoItem label="Permissions" value="All Modules" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="profile-sidebar">
                        <div className="profile-card">
                            <div className="avatar-section">
                                <div className="large-avatar">{getInitials()}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{employeeData?.firstName} {employeeData?.middleName || employeeData?.lastName}</div>
                                <div className="profile-role-badge">{user?.role?.replace('_', ' ')}</div>
                            </div>
                        </div>

                        <div className="profile-card">
                            <h3><span>🔒</span> Change Password</h3>
                            {message.text && (
                                <div className={`message message-${message.type}`}>
                                    {message.text}
                                </div>
                            )}
                            <form className="password-form" onSubmit={handlePasswordUpdate}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="update-btn"
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

const InfoItem = ({ label, value }) => (
    <div className="info-item">
        <label>{label}</label>
        <span>{value || 'Not provided'}</span>
    </div>
);

export default Profile;
