import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './Management.css';

const UserManagement = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Role modal
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleMessage, setRoleMessage] = useState(null);
    const [availableRoles] = useState(['hr_officer', 'department_head', 'finance_officer', 'employee', 'admin']);

    // Reset password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordUser, setPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { user, logout } = useContext(AuthContext);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/auth/users');
            if (res.data.success) setUsers(res.data.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId, data) => {
        setUpdating(true);
        try {
            const res = await axios.put(`/api/auth/users/${userId}`, data);
            if (res.data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, ...data } : u));
            }
        } catch (err) {
            console.error('Error updating user:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleManageRoles = (userItem) => {
        setSelectedUser({ ...userItem, roles: userItem.roles || [userItem.role] });
        setRoleMessage(null);
        setShowRoleModal(true);
    };

    const handleToggleRole = async (role, hasRole) => {
        if (!selectedUser) return;
        setUpdating(true);
        setRoleMessage(null);
        try {
            const endpoint = hasRole ? 'remove-role' : 'add-role';
            const res = await axios.post(`/api/auth/users/${selectedUser._id}/${endpoint}`, { role });
            if (res.data.success) {
                const updatedRoles = hasRole
                    ? selectedUser.roles.filter(r => r !== role)
                    : [...selectedUser.roles, role];
                const updatedUser = { ...selectedUser, roles: updatedRoles };
                setSelectedUser(updatedUser);
                setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, roles: updatedRoles } : u));
                setRoleMessage({ type: 'success', text: hasRole ? 'Role removed successfully' : 'Role added successfully' });
            }
        } catch (err) {
            setRoleMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update role' });
        } finally {
            setUpdating(false);
        }
    };

    const handleOpenResetPassword = (userItem) => {
        setPasswordUser(userItem);
        setNewPassword('');
        setPasswordMessage(null);
        setShowPasswordModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setUpdating(true);
        setPasswordMessage(null);
        try {
            const res = await axios.put(`/api/auth/users/${passwordUser._id}/reset-password`, { password: newPassword });
            if (res.data.success) {
                setPasswordMessage({ type: 'success', text: 'Password reset successfully' });
                setNewPassword('');
            }
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset password' });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>{t('common.loading')} {t('users.title')}...</div>;

    const totalPages = Math.ceil(users.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div style={{ padding: '24px 28px' }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a237e' }}>👥 {t('users.title')}</h1>
                    <p style={{ margin: '4px 0 0', color: '#666' }}>{t('users.subtitle')}</p>
                </div>

                <div className="section" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('users.name')}</th>
                                    <th>{t('users.position')}</th>
                                    <th>{t('users.systemRole')}</th>
                                    <th>{t('users.status')}</th>
                                    <th>{t('users.department')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('users.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map(userItem => (
                                    <tr key={userItem._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {userItem.employee
                                                    ? `${userItem.employee.firstName} ${userItem.employee.middleName || userItem.employee.lastName}`
                                                    : 'System User'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{userItem.email}</div>
                                        </td>
                                        <td>
                                            <span style={{ color: '#546e7a', fontSize: '0.9rem' }}>
                                                {userItem.employee?.position || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleManageRoles(userItem)}
                                                disabled={updating}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '6px',
                                                    border: '1px solid #ddd', fontSize: '0.85rem',
                                                    fontWeight: 500, background: 'white',
                                                    cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', gap: '8px'
                                                }}
                                            >
                                                <span>{userItem.role.replace(/_/g, ' ')}</span>
                                                {userItem.roles && userItem.roles.length > 1 && (
                                                    <span style={{ background: '#667eea', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>
                                                        +{userItem.roles.length - 1}
                                                    </span>
                                                )}
                                                <span>▼</span>
                                            </button>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${userItem.status}`}>{userItem.status}</span>
                                        </td>
                                        <td>{userItem.employee?.department?.name || 'N/A'}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleOpenResetPassword(userItem)}
                                                    disabled={updating}
                                                    style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    {t('users.resetPassword')}
                                                </button>
                                                <button
                                                    className={userItem.status === 'active' ? 'btn-secondary' : 'btn-save'}
                                                    onClick={() => handleUpdateUser(userItem._id, { status: userItem.status === 'active' ? 'inactive' : 'active' })}
                                                    disabled={updating}
                                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                                >
                                                    {userItem.status === 'active' ? t('users.deactivate') : t('users.activate')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length > 5 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={users.length}
                            onItemsPerPageChange={(value) => { setItemsPerPage(value); setCurrentPage(1); }}
                        />
                    )}
                </div>

                {/* Role Management Modal */}
                {showRoleModal && selectedUser && (
                    <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                            <div className="modal-header">
                                <h2>{t('users.systemRoles')}</h2>
                                <button className="close-btn" onClick={() => setShowRoleModal(false)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ marginBottom: '15px', fontWeight: 600, color: '#333' }}>
                                    {selectedUser.employee
                                        ? `${selectedUser.employee.firstName} ${selectedUser.employee.middleName || selectedUser.employee.lastName}`
                                        : selectedUser.email}
                                </div>

                                {roleMessage && (
                                    <div style={{
                                        marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem',
                                        background: roleMessage.type === 'success' ? '#e8f5e9' : '#fdecea',
                                        color: roleMessage.type === 'success' ? '#2e7d32' : '#c62828',
                                        border: `1px solid ${roleMessage.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                                    }}>
                                        {roleMessage.type === 'success' ? '✓' : '✗'} {roleMessage.text}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {availableRoles.map(role => {
                                        const hasRole = (selectedUser.roles || [selectedUser.role]).includes(role);
                                        const isOnlyRole = (selectedUser.roles || []).length === 1 && hasRole;
                                        return (
                                            <label key={role} style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                                background: hasRole ? '#e8f5e9' : '#f8f9fa', borderRadius: '8px',
                                                cursor: isOnlyRole || updating ? 'not-allowed' : 'pointer',
                                                border: hasRole ? '2px solid #4caf50' : '2px solid #e0e0e0',
                                                opacity: isOnlyRole ? 0.6 : 1, transition: 'all 0.2s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={hasRole}
                                                    disabled={updating || isOnlyRole}
                                                    onChange={() => handleToggleRole(role, hasRole)}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <span style={{ flex: 1, fontWeight: 500, textTransform: 'capitalize' }}>
                                                    {role.replace(/_/g, ' ')}
                                                </span>
                                                {isOnlyRole && (
                                                    <span style={{ fontSize: '0.75rem', color: '#999', background: '#eee', padding: '2px 8px', borderRadius: '10px' }}>
                                                        {t('users.primary')}
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '6px', fontSize: '0.85rem', color: '#856404' }}>
                                    💡 {t('users.usersSwitchRoles')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {showPasswordModal && passwordUser && (
                    <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h2>🔑 {t('users.resetPassword')}</h2>
                                <button className="close-btn" onClick={() => setShowPasswordModal(false)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ marginBottom: '16px', fontWeight: 600, color: '#333' }}>
                                    {passwordUser.employee
                                        ? `${passwordUser.employee.firstName} ${passwordUser.employee.middleName || passwordUser.employee.lastName}`
                                        : passwordUser.email}
                                </div>
                                <form onSubmit={handleResetPassword}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.9rem' }}>
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => { setNewPassword(e.target.value); setPasswordMessage(null); }}
                                        placeholder="Min. 6 characters"
                                        required
                                        autoFocus
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                    />

                                    {passwordMessage && (
                                        <div style={{
                                            marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem',
                                            background: passwordMessage.type === 'success' ? '#e8f5e9' : '#fdecea',
                                            color: passwordMessage.type === 'success' ? '#2e7d32' : '#c62828',
                                            border: `1px solid ${passwordMessage.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                                        }}>
                                            {passwordMessage.type === 'success' ? '✓' : '✗'} {passwordMessage.text}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={() => setShowPasswordModal(false)}
                                            style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={updating}
                                            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#f39c12', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                            {updating ? '...' : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;
