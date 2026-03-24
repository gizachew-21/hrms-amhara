import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './RoleSwitcher.css';

const RoleSwitcher = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useContext(AuthContext);
    const [switching, setSwitching] = useState(false);
    const navigate = useNavigate();

    const getRoleLabel = (role) => {
        return t(`roles.${role}`, role);
    };

    const handleRoleSwitch = async (newRole) => {
        const currentRole = user.activeRole || user.role;
        if (newRole === currentRole) return;

        try {
            setSwitching(true);
            const res = await axios.post('/api/auth/switch-role', { role: newRole });
            
            if (res.data.success) {
                // Refresh user data in context
                await refreshUser();
                
                // Redirect to dashboard
                navigate('/dashboard', { replace: true });
                
                // Force a full page reload to ensure all components update
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            }
        } catch (error) {
            console.error('Error switching role:', error);
            alert(error.response?.data?.error || 'Failed to switch role. Please try again.');
            setSwitching(false);
        }
    };

    // Don't show if user has only one role
    if (!user || !user.roles || user.roles.length <= 1) {
        return null;
    }

    const activeRole = user.activeRole || user.role;

    return (
        <div className="role-switcher">
            <div className="role-switcher-label">Active Role:</div>
            <div className="role-options">
                {user.roles.map(role => (
                    <button
                        key={role}
                        className={`role-option ${activeRole === role ? 'active' : ''}`}
                        onClick={() => handleRoleSwitch(role)}
                        disabled={switching || activeRole === role}
                    >
                        {switching && activeRole !== role ? '...' : getRoleLabel(role)}
                    </button>
                ))}
            </div>
            {switching && (
                <div style={{ fontSize: '0.85rem', color: 'white', marginLeft: '10px' }}>
                    {t('common.loading')}...
                </div>
            )}
        </div>
    );
};

export default RoleSwitcher;
