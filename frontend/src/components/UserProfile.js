import React, { useState, useRef, useEffect } from 'react';
import './UserProfile.css';

const UserProfile = ({ user, logout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Get user initials for avatar
    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${(user.middleName || user.lastName)[0]}`.toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Get role display name
    const getRoleDisplay = () => {
        const roleMap = {
            'hr_officer': 'HR Officer',
            'department_head': 'Department Head',
            'finance_officer': 'Finance Officer',
            'employee': 'Employee'
        };
        return roleMap[user?.role] || user?.role || 'User';
    };

    // Get avatar color based on role
    const getAvatarColor = () => {
        const colorMap = {
            'hr_officer': '#3498db',
            'department_head': '#9b59b6',
            'finance_officer': '#2ecc71',
            'employee': '#e67e22'
        };
        return colorMap[user?.role] || '#95a5a6';
    };

    const handleLogout = () => {
        setIsOpen(false);
        logout();
    };

    return (
        <div className="user-profile-container" ref={dropdownRef}>
            <div
                className="user-avatar"
                onClick={() => setIsOpen(!isOpen)}
                style={{ backgroundColor: getAvatarColor() }}
            >
                {getInitials()}
            </div>

            {isOpen && (
                <div className="user-dropdown">
                    <div className="user-info">
                        <div className="user-name">
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.middleName || user.lastName}`
                                : user?.email}
                        </div>
                        <div className="user-role">{getRoleDisplay()}</div>
                        {user?.email && user?.firstName && (
                            <div className="user-email">{user.email}</div>
                        )}
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="logout-button" onClick={() => { setIsOpen(false); window.location.href = '/profile'; }} style={{ marginBottom: '5px' }}>
                        <span className="logout-icon">👤</span>
                        My Profile
                    </button>
                    <button className="logout-button" onClick={handleLogout}>
                        <span className="logout-icon">🚪</span>
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
