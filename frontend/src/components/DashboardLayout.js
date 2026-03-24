import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserProfile from './UserProfile';
import RoleSwitcher from './RoleSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import './DashboardLayout.css';

const DashboardLayout = ({ user, logout, children }) => {
    const { t } = useTranslation();
    // isSidebarCollapsed: true means icons only, false means expanded
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    // isMobileNavOpen: specifically for mobile drawer
    const [isMobileNavOpen, setMobileNavOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setMobileNavOpen(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        if (isMobile) {
            setMobileNavOpen(!isMobileNavOpen);
        } else {
            setSidebarCollapsed(!isSidebarCollapsed);
        }
    };

    const SidebarItem = ({ label, path, icon }) => {
        const isActive = location.pathname === path;

        return (
            <div
                onClick={() => {
                    navigate(path);
                    if (isMobile) setMobileNavOpen(false);
                }}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                title={isSidebarCollapsed ? label : ''}
            >
                <span className="icon">{icon}</span>
                <span className="label">{label}</span>
            </div>
        );
    };

    const renderSidebarLinks = () => {
        const role = user?.activeRole || user?.role;
        const links = [<SidebarItem key="home" label={t('sidebar.dashboard')} path="/dashboard" icon="🏠" />];

        if (role === 'hr_officer') {
            links.push(
                <div key="sep1" style={{ margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', height: '1px' }}></div>,
                <SidebarItem key="emp" label={t('sidebar.manageEmployees')} path="/employees" icon="👥" />,
                <SidebarItem key="dept" label={t('sidebar.manageDepartments')} path="/departments" icon="🏢" />,
                <SidebarItem key="vac" label={t('sidebar.manageVacancies')} path="/vacancies" icon="💼" />,
                <SidebarItem key="app" label={t('sidebar.viewApplicants')} path="/applicants" icon="📑" />,
                <SidebarItem key="pro" label={t('sidebar.managePromotions')} path="/promotions" icon="⬆️" />,
                <SidebarItem key="pay" label={t('sidebar.managePayroll')} path="/payroll" icon="💰" />,
                <SidebarItem key="inc" label={t('sidebar.reportIncident')} path="/incidents" icon="🚨" />,
                <SidebarItem key="svc" label={t('sidebar.itServiceRequest')} path="/service-requests" icon="🛠️" />,
                <SidebarItem key="rep" label={t('sidebar.viewReports')} path="/reports" icon="📊" />
            );
        } else if (role === 'admin') {
            links.push(
                <div key="sep1" style={{ margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', height: '1px' }}></div>,
                <SidebarItem key="user-mgt" label={t('sidebar.userManagement')} path="/users" icon="👥" />,
                <SidebarItem key="inc" label={t('sidebar.incidentManagement')} path="/incidents" icon="🚨" />,
                <SidebarItem key="svc" label={t('sidebar.serviceRequests')} path="/service-requests" icon="🛠️" />,
                <SidebarItem key="rep" label={t('sidebar.systemReports')} path="/reports" icon="📊" />
            );
        } else if (role === 'department_head') {
            links.push(
                <div key="sep1" style={{ margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', height: '1px' }}></div>,
                <SidebarItem key="vac" label={t('sidebar.requestVacancy')} path="/vacancies?new=true" icon="➕" />,
                <SidebarItem key="app" label={t('sidebar.evaluateApplicants')} path="/applicants" icon="📑" />,
                <SidebarItem key="pro" label={t('sidebar.reviewPromotions')} path="/promotions" icon="⬆️" />,
                <SidebarItem key="vac-list" label={t('sidebar.myVacancies')} path="/vacancies" icon="📋" />,
                <div key="sep2" style={{ margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', height: '1px' }}></div>,
                <SidebarItem key="emp" label={t('sidebar.viewEmployees')} path="/employees" icon="👥" />,
                <SidebarItem key="inc" label={t('sidebar.reportIncident')} path="/incidents" icon="🚨" />,
                <SidebarItem key="svc" label={t('sidebar.itServiceRequest')} path="/service-requests" icon="🛠️" />,
                <SidebarItem key="rep" label={t('sidebar.viewReports')} path="/reports" icon="📊" />
            );
        } else if (role === 'finance_officer') {
            links.push(
                <div key="sep1" style={{ margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', height: '1px' }}></div>,
                <SidebarItem key="pay" label={t('sidebar.managePayroll')} path="/payroll" icon="💰" />,
                <SidebarItem key="inc" label={t('sidebar.reportIncident')} path="/incidents" icon="🚨" />,
                <SidebarItem key="svc" label={t('sidebar.itServiceRequest')} path="/service-requests" icon="🛠️" />,
                <SidebarItem key="rep" label={t('sidebar.payrollReports')} path="/reports" icon="📊" />
            );
        } else if (role === 'employee') {
            links.push(
                <div key="sep1" style={{ margin: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', height: '1px' }}></div>,
                <SidebarItem key="pro-req" label={t('sidebar.requestPromotion')} path="/promotions" icon="⬆️" />,
                <SidebarItem key="sal" label={t('sidebar.mySalary')} path="/payroll/my-salary" icon="💸" />,
                <SidebarItem key="leave" label={t('sidebar.requestLeave')} path="/leave" icon="📝" />,
                <SidebarItem key="inc" label={t('sidebar.incidentManagement')} path="/incidents" icon="🚨" />,
                <SidebarItem key="svc" label={t('sidebar.serviceRequests')} path="/service-requests" icon="🛠️" />
            );
        }
        return links;
    };

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar */}
            <aside className={`sidebar 
                ${isMobile ? (isMobileNavOpen ? 'open' : '') : (isSidebarCollapsed ? 'collapsed' : 'expanded')}
            `}>
                <div className="sidebar-header">
                    <img
                        src="/images/aitb-logo.png"
                        alt="AITB"
                        className={`sidebar-logo ${isSidebarCollapsed && !isMobile ? 'small' : ''}`}
                    />
                </div>
                <nav className="sidebar-nav">
                    {renderSidebarLinks()}
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="btn-logout">
                        <span className="icon">🚪</span>
                        <span className="label">{t('nav.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobile && isMobileNavOpen && (
                <div className="overlay" onClick={() => setMobileNavOpen(false)} />
            )}

            {/* Main Content Area */}
            <div className="content-area">
                {/* Header */}
                <header className="content-header">
                    <div className="header-left">
                        <button onClick={toggleSidebar} className="toggle-btn" title="Toggle Sidebar">
                            ☰
                        </button>
                        <h1 className="page-title">
                            {(user?.activeRole || user?.role) === 'hr_officer' && 'HR Dashboard'}
                            {(user?.activeRole || user?.role) === 'department_head' && 'Dept. Head Dashboard'}
                            {(user?.activeRole || user?.role) === 'finance_officer' && 'Finance Dashboard'}
                            {(user?.activeRole || user?.role) === 'employee' && 'Employee Dashboard'}
                            {(user?.activeRole || user?.role) === 'admin' && 'Admin Dashboard'}
                        </h1>
                    </div>
                    <div className="header-right">
                        <LanguageSwitcher />
                        <div className="role-badge">
                            {(user?.activeRole || user?.role)?.replace('_', ' ')}
                        </div>
                        <UserProfile user={user} logout={handleLogout} />
                    </div>
                </header>

                {/* Scrollable Main Content */}
                <div className="main-body">
                    <main className="main-content">
                        <RoleSwitcher />
                        {children}
                    </main>
                    <footer className="footer">
                        &copy; {new Date().getFullYear()} AITB HR Management System. All Rights Reserved.
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
