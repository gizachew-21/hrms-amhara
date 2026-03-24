import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import Pagination from '../Pagination';
import DateDisplay from '../DateDisplay';
import './HRDashboard.css';

const HRDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingPromotions, setPendingPromotions] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [activeVacancies, setActiveVacancies] = useState([]);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [pendingServiceRequests, setPendingServiceRequests] = useState([]);
  const [paymentOrders, setPaymentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Pagination states
  const [leavesPage, setLeavesPage] = useState(1);
  const [leavesPerPage, setLeavesPerPage] = useState(10);
  const [promotionsPage, setPromotionsPage] = useState(1);
  const [promotionsPerPage, setPromotionsPerPage] = useState(10);
  const [applicantsPage, setApplicantsPage] = useState(1);
  const [applicantsPerPage, setApplicantsPerPage] = useState(10);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const tabContentRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, leavesRes, promotionsRes, applicantsRes, vacanciesRes, incidentsRes, serviceRequestsRes] = await Promise.all([
        axios.get('/api/reports/dashboard'),
        axios.get('/api/leave'),
        axios.get('/api/promotions'),
        axios.get('/api/applicants'),
        axios.get('/api/vacancies'),
        axios.get('/api/incidents'),
        axios.get('/api/service-requests')
      ]);

      setStats(statsRes.data.data);
      // Handle both direct array and wrapped response formats
      const leavesData = Array.isArray(leavesRes.data) ? leavesRes.data : leavesRes.data.data || [];
      const promotionsData = Array.isArray(promotionsRes.data) ? promotionsRes.data : promotionsRes.data.data || [];
      const applicantsData = Array.isArray(applicantsRes.data) ? applicantsRes.data : applicantsRes.data.data || [];
      const vacanciesData = Array.isArray(vacanciesRes.data) ? vacanciesRes.data : vacanciesRes.data.data || [];

      setPendingLeaves(leavesData.filter(leave => leave.status === 'pending'));
      setPendingPromotions(promotionsData.filter(promo => promo.status === 'pending' || promo.status === 'under_review'));
      setRecentApplicants(applicantsData);
      setActiveVacancies(vacanciesData.filter(vac => ['draft', 'pending_approval', 'published'].includes(vac.status)));

      const incidentsData = Array.isArray(incidentsRes.data) ? incidentsRes.data : incidentsRes.data.data || [];
      const serviceRequestsData = Array.isArray(serviceRequestsRes.data) ? serviceRequestsRes.data : serviceRequestsRes.data.data || [];

      setPendingIncidents(incidentsData.filter(inc => inc.status === 'pending'));
      setPendingServiceRequests(serviceRequestsData.filter(req => req.status === 'pending'));

      // Fetch payment orders if user is HR officer
      if (user.role === 'hr_officer') {
        const salaryOrdersRes = await axios.get('/api/payrolls/salary-orders');
        const orders = salaryOrdersRes.data.data || [];
        setPaymentOrders(orders.filter(o => o.status === 'payment_order_sent'));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await axios.put(`/api/leave/${leaveId}`, { status });
      alert(`Leave request ${status} successfully!`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating leave:', error);
      alert('Failed to update leave request');
    }
  };

  const handlePromotionApprove = async (promotionId, status) => {
    try {
      await axios.patch(`/api/promotions/${promotionId}/approve`, {
        status: status,
        comments: status === 'approved' ? 'Approved by HR' : 'Rejected by HR',
        effectiveDate: status === 'approved' ? new Date() : null
      });
      alert(`Promotion ${status} successfully!`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating promotion:', error);
      alert('Failed to update promotion status');
    }
  };

  const handleApplicantScreen = async (applicantId, status) => {
    try {
      await axios.patch(`/api/applicants/${applicantId}/screen`, { status });
      alert(`Applicant ${status} successfully!`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error screening applicant:', error);
      alert('Failed to update applicant status');
    }
  };

  const handleApproveVacancy = async (vacancyId) => {
    try {
      await axios.patch(`/api/vacancies/${vacancyId}/approve`);
      alert('Vacancy approved successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving vacancy:', error);
      alert('Failed to approve vacancy');
    }
  };

  const handleHireApplicant = async (applicantId) => {
    try {
      await axios.patch(`/api/applicants/${applicantId}/hire`);
      alert('Applicant hired and placed successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error hiring applicant:', error);
      alert('Failed to hire applicant');
    }
  };

  const openModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Scroll to tab content after state update
    setTimeout(() => {
      if (tabContentRef.current) {
        tabContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (loading) return <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>⏳ {t('common.loading')} {t('dashboard.hrDashboard')}...</div>;

  return (
    <div className="hr-dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.hrDashboard')}</h1>
        <p>{t('dashboard.manageEmployeesLeaveRequestsRecruitmentPromotions')}</p>
      </div>

      {/* Statistics Overview */}
      <div className="stats-grid">
        <StatCard
          title={t('dashboard.totalEmployees')}
          value={stats?.totalEmployees || 0}
          color="#3498db"
          icon="👥"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          title={t('dashboard.pendingLeaveRequests')}
          value={pendingLeaves.length}
          color="#e74c3c"
          icon="📅"
          badge={pendingLeaves.length > 0}
          onClick={() => handleTabChange('leaves')}
        />
        <StatCard
          title={t('dashboard.activeVacancies')}
          value={activeVacancies.length}
          color="#2ecc71"
          icon="💼"
          onClick={() => handleTabChange('recruitment')}
        />
        <StatCard
          title={t('dashboard.pendingPromotions')}
          value={pendingPromotions.length}
          color="#9b59b6"
          icon="⬆️"
          badge={pendingPromotions.length > 0}
          onClick={() => handleTabChange('promotions')}
        />
        <StatCard
          title={t('dashboard.slaCompliance')}
          value={stats?.slaCompliance || '100%'}
          color="#f39c12"
          icon="⏱️"
        />
      </div>



      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={activeTab === 'overview' ? 'tab-active' : ''}
          onClick={() => handleTabChange('overview')}
        >
          {t('dashboard.overview')}
        </button>
        <button
          className={activeTab === 'leaves' ? 'tab-active' : ''}
          onClick={() => handleTabChange('leaves')}
        >
          {t('dashboard.leaveRequests')} {pendingLeaves.length > 0 && <span className="badge">{pendingLeaves.length}</span>}
        </button>
        <button
          className={activeTab === 'recruitment' ? 'tab-active' : ''}
          onClick={() => handleTabChange('recruitment')}
        >
          {t('dashboard.recruitment')}
        </button>
        <button
          className={activeTab === 'promotions' ? 'tab-active' : ''}
          onClick={() => handleTabChange('promotions')}
        >
          {t('dashboard.promotions')} {pendingPromotions.length > 0 && <span className="badge">{pendingPromotions.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content" ref={tabContentRef}>
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            pendingLeaves={pendingLeaves}
            pendingPromotions={pendingPromotions}
            recentApplicants={recentApplicants}
            paymentOrders={paymentOrders}
            navigate={navigate}
            setActiveTab={handleTabChange}
          />
        )}

        {activeTab === 'leaves' && (
          <LeavesTab
            leaves={pendingLeaves}
            onAction={handleLeaveAction}
            onViewDetails={openModal}
            currentPage={leavesPage}
            itemsPerPage={leavesPerPage}
            onPageChange={setLeavesPage}
            onItemsPerPageChange={(value) => {
              setLeavesPerPage(value);
              setLeavesPage(1);
            }}
          />
        )}

        {activeTab === 'recruitment' && (
          <RecruitmentTab
            vacancies={activeVacancies}
            applicants={recentApplicants}
            onScreenApplicant={handleApplicantScreen}
            onApproveVacancy={handleApproveVacancy}
            onHireApplicant={handleHireApplicant}
            navigate={navigate}
            currentPage={applicantsPage}
            itemsPerPage={applicantsPerPage}
            onPageChange={setApplicantsPage}
            onItemsPerPageChange={(value) => {
              setApplicantsPerPage(value);
              setApplicantsPage(1);
            }}
          />
        )}

        {activeTab === 'promotions' && (
          <PromotionsTab
            promotions={pendingPromotions}
            onApprove={handlePromotionApprove}
            onViewDetails={openModal}
            currentPage={promotionsPage}
            itemsPerPage={promotionsPerPage}
            onPageChange={setPromotionsPage}
            onItemsPerPageChange={(value) => {
              setPromotionsPerPage(value);
              setPromotionsPage(1);
            }}
          />
        )}
      </div>

      {/* Modal for details */}
      {showModal && (
        <Modal
          type={modalType}
          item={selectedItem}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, color, icon, badge, onClick }) => (
  <div
    className="stat-card"
    style={{ borderLeftColor: color }}
    onClick={onClick}
  >
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
    </div>
    {badge && <div className="stat-badge">!</div>}
  </div>
);

// Overview Tab
const OverviewTab = ({ stats, pendingLeaves, pendingPromotions, recentApplicants, paymentOrders, navigate, setActiveTab }) => {
  const { t } = useTranslation();

  return (
    <div className="overview-tab">
      <div className="welcome-section">
        <h2>{t('dashboard.welcomeToHRDashboard')}</h2>
        <p>{t('dashboard.manageAllHRTasks')}</p>
      </div>

      <div className="pending-items">
        <div className="pending-section">
          <h3>{t('dashboard.pendingActions')}</h3>
          {pendingLeaves.length > 0 && (
            <div className="pending-alert" onClick={() => setActiveTab('leaves')}>
              <span className="alert-icon">⚠️</span>
              <span>{pendingLeaves.length} {t('dashboard.leaveRequests').toLowerCase()} awaiting approval</span>
            </div>
          )}
          {pendingPromotions.length > 0 && (
            <div className="pending-alert" onClick={() => setActiveTab('promotions')}>
              <span className="alert-icon">⚠️</span>
              <span>{pendingPromotions.length} {t('dashboard.promotions').toLowerCase()} awaiting approval</span>
            </div>
          )}
          {recentApplicants.filter(a => a.status === 'applied' || a.status === 'submitted').length > 0 && (
            <div className="pending-alert" onClick={() => setActiveTab('recruitment')}>
              <span className="alert-icon">⚠️</span>
              <span>{recentApplicants.filter(a => a.status === 'applied' || a.status === 'submitted').length} new applicant(s) to review</span>
            </div>
          )}
          {paymentOrders && paymentOrders.length > 0 && (
            <div className="pending-alert" onClick={() => navigate('/payroll')}>
              <span className="alert-icon">💰</span>
              <span>{paymentOrders.length} payment order(s) received from Finance</span>
            </div>
          )}
          {pendingLeaves.length === 0 && pendingPromotions.length === 0 && recentApplicants.filter(a => a.status === 'applied' || a.status === 'submitted').length === 0 && (
            <p className="no-pending">✅ {t('dashboard.allCaughtUp')}</p>
          )}
        </div>
      </div>

      <div className="stats-summary">
        <h3>{t('dashboard.quickStatistics')}</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">{t('dashboard.totalEmployees')}</span>
            <span className="summary-value">{stats?.totalEmployees || 0}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">{t('dashboard.activeVacancies')}</span>
            <span className="summary-value">{stats?.totalVacancies || 0}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Applications</span>
            <span className="summary-value">{stats?.totalApplications || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// Leaves Tab
const LeavesTab = ({ leaves, onAction, onViewDetails, currentPage, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = Math.ceil(leaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeaves = leaves.slice(startIndex, endIndex);

  return (
    <div className="leaves-tab">
      <h2>Pending Leave Requests</h2>
      {leaves.length === 0 ? (
        <p className="empty-state">No pending leave requests</p>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Applied On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map(leave => (
                  <tr key={leave._id}>
                    <td>{leave.employee?.firstName} {leave.employee?.middleName || leave.employee?.lastName}</td>
                    <td><span className="leave-type">{leave.leaveType}</span></td>
                    <td><DateDisplay date={leave.startDate} format="short" /></td>
                    <td><DateDisplay date={leave.endDate} format="short" /></td>
                    <td>{calculateDuration(leave.startDate, leave.endDate)} days</td>
                    <td><DateDisplay date={leave.appliedAt} format="short" /></td>
                    <td className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={() => onAction(leave._id, 'approved')}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => onAction(leave._id, 'rejected')}
                      >
                        ✗ Reject
                      </button>
                      <button
                        className="btn-view"
                        onClick={() => onViewDetails('leave', leave)}
                      >
                        👁 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {leaves.length > 5 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              itemsPerPage={itemsPerPage}
              totalItems={leaves.length}
              onItemsPerPageChange={onItemsPerPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

// Recruitment Tab
const RecruitmentTab = ({ vacancies, applicants, onScreenApplicant, navigate, onApproveVacancy, onHireApplicant, currentPage, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = Math.ceil(applicants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplicants = applicants.slice(startIndex, endIndex);

  return (
    <div className="recruitment-tab">
      <div className="recruitment-section">
        <div className="section-header">
          <h2>Vacancy Management</h2>
          <button className="btn-primary" onClick={() => navigate('/vacancies')}>
            + Post New Vacancy
          </button>
        </div>

        {vacancies.filter(v => v.status === 'pending_approval').length > 0 && (
          <div className="pending-approvals">
            <h3 className="section-subtitle">Pending Approval Requests</h3>
            <div className="vacancy-grid">
              {vacancies.filter(v => v.status === 'pending_approval').map(vacancy => (
                <div key={vacancy._id} className="vacancy-card pending">
                  <div className="badge-pending">Pending Approval</div>
                  <h3>{vacancy.position}</h3>
                  <p className="vacancy-dept">{vacancy.department?.name}</p>
                  <div className="vacancy-footer">
                    <button className="btn-approve" onClick={() => onApproveVacancy(vacancy._id)}>Approve</button>
                    <button className="btn-small" onClick={() => navigate(`/vacancies/${vacancy._id}`)}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="section-subtitle">Active Vacancies</h3>
        {vacancies.filter(v => v.status === 'published' || v.status === 'draft').length === 0 ? (
          <p className="empty-state">No active vacancies</p>
        ) : (
          <div className="vacancy-grid">
            {vacancies.filter(v => ['published', 'draft'].includes(v.status)).map(vacancy => (
              <div key={vacancy._id} className="vacancy-card">
                <span className={`status-tag ${vacancy.status}`}>{vacancy.status}</span>
                <h3>{vacancy.position}</h3>
                <p className="vacancy-dept">{vacancy.department?.name}</p>
                <div className="vacancy-footer">
                  <span className="vacancy-date">Posted: <DateDisplay date={vacancy.createdAt} format="short" /></span>
                  <button className="btn-small" onClick={() => navigate(`/vacancies/${vacancy._id}`)}>
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="recruitment-section">
        <h2>Applicant Management</h2>
        {applicants.length === 0 ? (
          <p className="empty-state">No applicants yet</p>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApplicants.map(applicant => (
                    <tr key={applicant._id}>
                      <td>{applicant.firstName} {applicant.middleName || applicant.lastName}</td>
                      <td>{applicant.vacancy?.position || 'N/A'}</td>
                      <td><span className={`status-badge status-${applicant.status}`}>{applicant.status}</span></td>
                      <td><DateDisplay date={applicant.appliedAt} format="short" /></td>
                      <td className="action-buttons">
                        {applicant.status === 'submitted' && (
                          <>
                            <button className="btn-approve" onClick={() => onScreenApplicant(applicant._id, 'passed')}>Pass</button>
                            <button className="btn-reject" onClick={() => onScreenApplicant(applicant._id, 'rejected')}>Reject</button>
                          </>
                        )}
                        {applicant.status === 'passed' && (
                          <button className="btn-approve" onClick={() => onHireApplicant(applicant._id)}>Hire & Place</button>
                        )}
                        <button className="btn-view" onClick={() => navigate(`/applicants/${applicant._id}`)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {applicants.length > 5 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                itemsPerPage={itemsPerPage}
                totalItems={applicants.length}
                onItemsPerPageChange={onItemsPerPageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Promotions Tab
const PromotionsTab = ({ promotions, onApprove, onViewDetails, currentPage, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = Math.ceil(promotions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromotions = promotions.slice(startIndex, endIndex);

  return (
    <div className="promotions-tab">
      <h2>Pending Promotions</h2>
      {promotions.length === 0 ? (
        <p className="empty-state">No pending promotions</p>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Current Position</th>
                  <th>Proposed Position</th>
                  <th>Requested By</th>
                  <th>Date Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPromotions.map(promotion => (
                  <tr key={promotion._id}>
                    <td>{promotion.employee?.firstName} {promotion.employee?.middleName || promotion.employee?.lastName}</td>
                    <td>{promotion.currentPosition}</td>
                    <td><strong>{promotion.proposedPosition}</strong></td>
                    <td>{promotion.requestedBy?.employee?.firstName || promotion.requestedBy?.email || 'N/A'}</td>
                    <td><DateDisplay date={promotion.requestDate} format="short" /></td>
                    <td className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={() => onApprove(promotion._id, 'approved')}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => onApprove(promotion._id, 'rejected')}
                      >
                        ✗ Reject
                      </button>
                      <button
                        className="btn-view"
                        onClick={() => onViewDetails('promotion', promotion)}
                      >
                        👁 View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {promotions.length > 5 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              itemsPerPage={itemsPerPage}
              totalItems={promotions.length}
              onItemsPerPageChange={onItemsPerPageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ type, item, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{type === 'leave' ? 'Leave Request Details' : 'Promotion Details'}</h2>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        {type === 'leave' && item && (
          <div className="details-grid">
            <div className="detail-item">
              <label>Employee:</label>
              <span>{item.employee?.firstName} {item.employee?.lastName}</span>
            </div>
            <div className="detail-item">
              <label>Leave Type:</label>
              <span>{item.leaveType}</span>
            </div>
            <div className="detail-item">
              <label>Start Date:</label>
              <span><DateDisplay date={item.startDate} format="full" /></span>
            </div>
            <div className="detail-item">
              <label>End Date:</label>
              <span><DateDisplay date={item.endDate} format="full" /></span>
            </div>
            <div className="detail-item full-width">
              <label>Reason:</label>
              <p>{item.reason || 'No reason provided'}</p>
            </div>
          </div>
        )}
        {type === 'promotion' && item && (
          <div className="details-grid">
            <div className="detail-item">
              <label>Employee:</label>
              <span>{item.employee?.firstName} {item.employee?.lastName}</span>
            </div>
            <div className="detail-item">
              <label>Current Position:</label>
              <span>{item.currentPosition}</span>
            </div>
            <div className="detail-item">
              <label>Proposed Position:</label>
              <span>{item.proposedPosition}</span>
            </div>
            <div className="detail-item">
              <label>Justification:</label>
              <p>{item.justification || 'No justification provided'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Helper function
const calculateDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export default HRDashboard;