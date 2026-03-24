import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const StatCard = ({ label, value, color, icon, onClick }) => (
  <div onClick={onClick} style={{
    flex: 1, minWidth: 140, padding: '18px 20px',
    backgroundColor: '#fff', borderRadius: 12,
    border: `2px solid ${color}30`,
    boxShadow: '0 2px 8px rgba(0,0,0,.06)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform .15s, box-shadow .15s',
  }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.12)'; } }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)'; }}
  >
    <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 4 }}>{label}</div>
  </div>
);

const ActionButton = ({ label, onClick, color, icon }) => (
  <button onClick={onClick} style={{
    padding: '13px 20px', backgroundColor: color, color: 'white',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'transform .15s, box-shadow .15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.2)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.15)'; }}
  >
    <span style={{ fontSize: '1.2rem' }}>{icon}</span> {label}
  </button>
);

const FinanceDashboard = () => {
  const { t } = useTranslation();
  const [payrolls, setPayrolls] = useState([]);
  const [salaryOrders, setSalaryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [payrollRes, orderRes, statsRes] = await Promise.all([
        axios.get('/api/payrolls'),
        axios.get('/api/payrolls/salary-orders'),
        axios.get('/api/reports/dashboard'),
      ]);
      setPayrolls(payrollRes.data.data || []);
      setSalaryOrders(orderRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentOrder = async (orderId) => {
    try {
      await axios.patch(`/api/payrolls/salary-orders/${orderId}/approve`);
      fetchDashboardData();
    } catch (error) {
      alert('Failed to send payment order: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>⏳ Loading Finance Dashboard…</div>
  );

  const pendingOrders = salaryOrders.filter(o => o.status === 'submitted_to_finance');
  const sentOrders = salaryOrders.filter(o => o.status === 'payment_order_sent');
  const paidPayrolls = payrolls.filter(p => p.status === 'paid');
  const approvedPayrolls = payrolls.filter(p => p.status === 'approved');

  return (
    <div style={{ padding: '26px 28px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a237e' }}>
          💰 Finance Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', color: '#666' }}>
          Welcome, {user?.email} — manage payrolls, orders & payments
        </p>
      </div>



      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard icon="📋" label="Total Payrolls" value={payrolls.length} color="#1a237e" />
        <StatCard icon="✅" label="Approved (Unpaid)" value={approvedPayrolls.length} color="#2e7d32"
          onClick={() => navigate('/payroll', { state: { activeTab: 'payrolls' } })} />
        <StatCard icon="💳" label="Paid This Period" value={paidPayrolls.length} color="#0277bd" />
        <StatCard icon="⌛" label="Pending Orders" value={pendingOrders.length} color="#e65100"
          onClick={() => navigate('/payroll', { state: { activeTab: 'pending-orders' } })} />
        <StatCard icon="📤" label="Payment Orders Sent" value={sentOrders.length} color="#6a1b9a" />
        <StatCard icon="⏱️" label={t('dashboard.slaCompliance')} value={stats?.slaCompliance || '100%'} color="#f39c12" />
        <StatCard icon="⚡" label={t('dashboard.avgResolutionTime')} value="4.2h" color="#16a085" />
      </div>

      {/* Pending Salary Orders */}
      <div className="section" style={{ marginBottom: 28 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: '1.1rem', color: '#333' }}>
          📜 Pending Salary Orders
          {pendingOrders.length > 0 && (
            <span style={{ marginLeft: 10, backgroundColor: '#e65100', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.8rem' }}>
              {pendingOrders.length} new
            </span>
          )}
        </h2>
        {pendingOrders.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>
            ✅ No pending salary orders from HR.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th><th>Period</th><th>Employees</th>
                  <th>Gross Total</th><th>Net Total</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(order => (
                  <tr key={order._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.orderNumber}</td>
                    <td>{MONTHS[order.month]} {order.year}</td>
                    <td>{order.totalEmployees}</td>
                    <td>{(order.totalGrossSalary || 0).toLocaleString()} ETB</td>
                    <td style={{ fontWeight: 700 }}>{(order.totalNetSalary || 0).toLocaleString()} ETB</td>
                    <td>
                      <button className="btn-approve" onClick={() => handleSendPaymentOrder(order._id)}>
                        📤 Send Payment Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Approved Payrolls */}
      <div className="section">
        <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: '1.1rem', color: '#333' }}>
          ✅ Approved Payrolls – Ready for Payment
        </h2>
        {approvedPayrolls.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No approved payrolls awaiting payment.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Payroll #</th><th>Employee</th><th>Period</th><th>Net Salary</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedPayrolls.slice(0, 8).map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.payrollNumber}</td>
                    <td>{p.employee?.firstName} {p.employee?.middleName || p.employee?.lastName}</td>
                    <td>{MONTHS[p.month]} {p.year}</td>
                    <td style={{ fontWeight: 700 }}>{(p.netSalary || 0).toLocaleString()} ETB</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                        approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {approvedPayrolls.length > 8 && (
              <div style={{ textAlign: 'center', padding: 12 }}>
                <button className="btn-secondary" onClick={() => navigate('/payroll', { state: { activeTab: 'payrolls' } })}>
                  View All {approvedPayrolls.length} Approved Payrolls →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* IT Quick Actions */}
      <div className="section" style={{ marginTop: 28 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: '1.1rem', color: '#333' }}>
          🛠️ IT Service Management
        </h2>
        <div style={{ display: 'flex', gap: 15 }}>
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

export default FinanceDashboard;
