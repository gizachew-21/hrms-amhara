import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import DateDisplay from '../DateDisplay';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    totalPromotions: 0,
    lastNetSalary: 0,
    performanceRating: 0,
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, statsRes] = await Promise.all([
        axios.get('/api/employees/me'),
        axios.get('/api/reports/employee-stats')
      ]);

      setEmployeeData(empRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching employee dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="loader">{t('employeeDashboard.loadingDashboard')}</div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#1a237e', marginBottom: '8px' }}>{t('dashboard.employeeDashboard')}</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        {t('dashboard.welcomeBack')}, {employeeData?.firstName || 'User'} — {t('employeeDashboard.happeningToday')}
      </p>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard
          title={t('employeeDashboard.leaveRequests')}
          value={stats.totalLeaves}
          icon="📅"
          color="#2ecc71"
          label={t('employeeDashboard.totalApplied')}
          onClick={() => navigate('/leave')}
        />
        <StatCard
          title={t('employeeDashboard.promotions')}
          value={stats.totalPromotions}
          icon="⬆️"
          color="#9b59b6"
          label={t('employeeDashboard.requests')}
          onClick={() => navigate('/promotions')}
        />
        <StatCard
          title={t('employeeDashboard.lastSalary')}
          value={`${stats.lastNetSalary.toLocaleString()} ETB`}
          icon="💸"
          color="#f1c40f"
          label={t('employeeDashboard.netPayment')}
          onClick={() => navigate('/payroll/my-salary')}
        />
        <StatCard
          title={t('employeeDashboard.performance')}
          value={stats.performanceRating > 0 ? `${stats.performanceRating}/5` : 'N/A'}
          icon="⭐"
          color="#e67e22"
          label={t('employeeDashboard.rating')}
          onClick={() => navigate('/performance')}
        />
      </div>

      {/* Employment Information */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1a237e' }}>
          ℹ️ {t('employeeDashboard.employmentInformation')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <InfoItem label={t('employeeDashboard.employeeId')} value={employeeData?.employeeId || 'N/A'} />
          <InfoItem label={t('employeeDashboard.fullName')} value={`${employeeData?.firstName} ${employeeData?.middleName || employeeData?.lastName}`} />
          <InfoItem label={t('employeeDashboard.email')} value={employeeData?.email} />
          <InfoItem label={t('employeeDashboard.phone')} value={employeeData?.phoneNumber} />
          <InfoItem label={t('reports.position')} value={employeeData?.position} />
          <InfoItem label={t('reports.department')} value={employeeData?.department?.name} />
          <InfoItem label={t('employeeDashboard.joinDate')} value={employeeData?.dateJoined ? <DateDisplay date={employeeData.dateJoined} format="short" /> : 'N/A'} />
          <InfoItem label={t('employeeDashboard.employmentType')} value={employeeData?.employmentType} />
          <InfoItem label={t('employeeDashboard.workStatus')} value={
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '500',
              background: employeeData?.status === 'active' ? '#d4edda' : '#f8d7da',
              color: employeeData?.status === 'active' ? '#155724' : '#721c24'
            }}>
              {t(`status.${employeeData?.status}`, employeeData?.status?.replace('_', ' '))}
            </span>
          } />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, label, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
        borderLeft: `5px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        cursor: onClick ? 'pointer' : 'default',
        transform: isHovered && onClick ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', color: '#7f8c8d', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c3e50' }}>{value}</div>
        <small style={{ color: '#95a5a6', fontSize: '0.75rem' }}>{label}</small>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div style={{ marginBottom: '10px' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '5px', fontWeight: 600 }}>{label}</label>
    <span style={{ fontSize: '1rem', color: '#2c3e50' }}>{value || 'N/A'}</span>
  </div>
);

export default EmployeeDashboard;
