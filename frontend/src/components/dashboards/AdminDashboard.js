import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Pagination from '../Pagination';
import DateDisplay from '../DateDisplay';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalIncidents: 0,
        newIncidents: 0,
        totalServiceRequests: 0,
        newServiceRequests: 0,
        recentLogs: []
    });
    const [loading, setLoading] = useState(true);
    const [logsPage, setLogsPage] = useState(1);
    const [logsPerPage, setLogsPerPage] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, logsRes, incidentsRes, serviceRequestsRes] = await Promise.all([
                    axios.get('/api/auth/users'),
                    axios.get('/api/reports/audit-logs'),
                    axios.get('/api/incidents'),
                    axios.get('/api/service-requests')
                ]);

                if (usersRes.data.success && logsRes.data.success) {
                    const incidents = incidentsRes.data.data || [];
                    const serviceRequests = serviceRequestsRes.data.data || [];

                    setStats({
                        totalUsers: usersRes.data.data.length,
                        activeUsers: usersRes.data.data.filter(u => u.status === 'active').length,
                        totalIncidents: incidents.length,
                        newIncidents: incidents.filter(i => i.status === 'pending').length,
                        totalServiceRequests: serviceRequests.length,
                        newServiceRequests: serviceRequests.filter(sr => sr.status === 'pending').length,
                        recentLogs: logsRes.data.data
                    });
                }
            } catch (err) {
                console.error('Error fetching admin stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, color, onClick, newCount }) => {
        const [isHovered, setIsHovered] = React.useState(false);

        return (
            <div
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: isHovered ? '0 6px 12px rgba(0,0,0,0.12)' : '0 4px 6px rgba(0,0,0,0.05)',
                    borderLeft: `6px solid ${color}`,
                    cursor: onClick ? 'pointer' : 'default',
                    transform: isHovered && onClick ? 'translateY(-3px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                }}
            >
                {newCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(231, 76, 60, 0.4)',
                        animation: 'pulse 2s infinite'
                    }}>
                        {newCount}
                    </div>
                )}
                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#333', marginTop: '8px' }}>{value}</div>
                <style>
                    {`
                        @keyframes pulse {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                            100% { transform: scale(1); }
                        }
                    `}
                </style>
            </div>
        );
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading Dashboard...</div>;

    const totalLogsPages = Math.ceil(stats.recentLogs.length / logsPerPage);
    const startIndex = (logsPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    const paginatedLogs = stats.recentLogs.slice(startIndex, endIndex);

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ color: '#1a237e', marginBottom: '24px' }}>{t('dashboard.adminDashboard')}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <StatCard
                    title={t('dashboard.totalUsers')}
                    value={stats.totalUsers}
                    color="#1a237e"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title={t('dashboard.activeUsers')}
                    value={stats.activeUsers}
                    color="#2e7d32"
                    onClick={() => navigate('/users')}
                />
                <StatCard
                    title={t('dashboard.systemStatus')}
                    value={t('dashboard.operational')}
                    color="#f39c12"
                />
                <StatCard
                    title={t('dashboard.incidents')}
                    value={stats.totalIncidents}
                    color="#e74c3c"
                    onClick={() => navigate('/incidents')}
                    newCount={stats.newIncidents}
                />
                <StatCard
                    title={t('dashboard.serviceRequests')}
                    value={stats.totalServiceRequests}
                    color="#3498db"
                    onClick={() => navigate('/service-requests')}
                    newCount={stats.newServiceRequests}
                />
            </div>

            <div style={{ gridTemplateColumns: '1fr 1fr', gap: '30px', display: 'grid' }}>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e7ff' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1a237e', fontSize: '1.2rem' }}>
                        🛡️ {t('dashboard.quickSystemControls')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/users')}
                            style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                border: '2px solid #667eea',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: 'white',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>👥</span>
                            <span>{t('dashboard.manageUserRolesAccess')}</span>
                        </button>
                        <button
                            onClick={() => navigate('/reports')}
                            style={{
                                padding: '16px 20px',
                                textAlign: 'left',
                                border: '2px solid #667eea',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: 'white',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>📋</span>
                            <span>{t('dashboard.viewSystemAuditLogs')}</span>
                        </button>
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px' }}>🕒 {t('dashboard.recentActivity')}</h3>
                    {stats.recentLogs.length === 0 ? (
                        <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>{t('dashboard.noRecentActivity')}</p>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {paginatedLogs.map((log, i) => (
                                    <div key={i} style={{ padding: '10px', backgroundColor: '#fcfcfc', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                                        <strong>{log.action}</strong> - {log.module} <br />
                                        <small style={{ color: '#888' }}><DateDisplay date={log.timestamp} format="full" /></small>
                                    </div>
                                ))}
                            </div>
                            {stats.recentLogs.length > 5 && (
                                <Pagination
                                    currentPage={logsPage}
                                    totalPages={totalLogsPages}
                                    onPageChange={setLogsPage}
                                    itemsPerPage={logsPerPage}
                                    totalItems={stats.recentLogs.length}
                                    onItemsPerPageChange={(value) => {
                                        setLogsPerPage(value);
                                        setLogsPage(1);
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
