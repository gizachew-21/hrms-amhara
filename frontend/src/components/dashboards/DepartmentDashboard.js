import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';

const DepartmentDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingApplicants, setPendingApplicants] = useState([]);
  const [pendingPromotions, setPendingPromotions] = useState([]);
  const [myVacancies, setMyVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get department-specific data
      const [applicantsRes, promotionsRes, vacanciesRes, statsRes] = await Promise.all([
        axios.get('/api/applicants'),
        axios.get('/api/promotions'),
        axios.get('/api/vacancies'),
        axios.get('/api/reports/dashboard')
      ]);

      setStats(statsRes.data.data);

      setPendingApplicants(applicantsRes.data.data.filter(a => a.status === 'submitted'));
      setPendingPromotions(promotionsRes.data.data.filter(p => p.status === 'pending'));
      setMyVacancies(vacanciesRes.data.data);
    } catch (error) {
      console.error('Error fetching department data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">{t('common.loading')} {t('dashboard.departmentDashboard')}...</div>;

  const departmentName = user?.employee?.department?.name || 'Department';

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>{departmentName} {t('dashboard.departmentDashboard')}</h1>
        <p>Managing {departmentName}'s workforce and evaluations</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard
          title={t('dashboard.totalEmployees')}
          value={user?.employee?.department?.employeeCount || 0}
          color="#2ecc71"
          icon="👥"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title={t('dashboard.openVacancies')}
          value={myVacancies.filter(v => v.status === 'published').length}
          color="#3498db"
          icon="💼"
          onClick={() => navigate('/vacancies')}
        />
        <StatCard
          title={t('dashboard.pendingEvaluations')}
          value={pendingApplicants.length}
          color="#e67e22"
          icon="📑"
          onClick={() => navigate('/applicants')}
        />
        <StatCard
          title={t('dashboard.promotionRequests')}
          value={pendingPromotions.length}
          color="#9b59b6"
          icon="⬆️"
          onClick={() => navigate('/promotions')}
        />
        <StatCard
          title={t('dashboard.slaCompliance')}
          value={stats?.slaCompliance || '100%'}
          color="#f39c12"
          icon="⏱️"
        />
        <StatCard
          title={t('dashboard.avgResolutionTime')}
          value="4.2h"
          color="#16a085"
          icon="⚡"
        />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
        <div className="dashboard-card">
          <h3>{t('dashboard.recentVacancyRequests')}</h3>
          {myVacancies.filter(v => v.status === 'pending_approval').length === 0 ? (
            <p>{t('dashboard.noPendingRequests')}</p>
          ) : (
            <ul className="action-list">
              {myVacancies.filter(v => v.status === 'pending_approval').map(v => (
                <li key={v._id} className="action-item">
                  <span>{v.position}</span>
                  <span className="badge-pending">{t('dashboard.pendingHRApproval')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-card">
          <h3>{t('dashboard.needsEvaluation')}</h3>
          {pendingApplicants.length === 0 ? (
            <p>{t('dashboard.noApplicantsToEvaluate')}</p>
          ) : (
            <ul className="action-list">
              {pendingApplicants.slice(0, 5).map(a => (
                <li key={a._id} className="action-item" onClick={() => navigate(`/applicants/${a._id}`)}>
                  <span>{a.firstName} {a.middleName || a.lastName}</span>
                  <span className="action-link">{t('dashboard.evaluate')} →</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* IT Quick Actions */}
      <div className="dashboard-card" style={{ marginTop: '30px', padding: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>🛠️ IT Service Management</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <ActionButton
            label="Report IT Incident"
            icon="🚨"
            color="#e74c3c"
            onClick={() => navigate('/incidents')}
          />
          <ActionButton
            label="Request IT Service"
            icon="🛠️"
            color="#3498db"
            onClick={() => navigate('/service-requests')}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '20px',
      backgroundColor: 'white',
      borderLeft: `5px solid ${color}`,
      borderRadius: '8px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      transform: 'translateY(0)'
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
      }
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h4 style={{ margin: 0, color: '#7f8c8d' }}>{title}</h4>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px' }}>{value}</div>
      </div>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
    </div>
  </div>
);

const ActionButton = ({ label, onClick, color, icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: '15px 25px',
      backgroundColor: color,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}
  >
    <span>{icon}</span> {label}
  </button>
);

export default DepartmentDashboard;
