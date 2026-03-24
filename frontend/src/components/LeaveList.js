import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import './Management.css';

const LeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/leave');
      // Backend now returns an array for this endpoint
      setLeaves(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/leave', formData);
      alert('Leave request submitted successfully!');
      setShowForm(false);
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit leave request';
      alert(`Failed to submit leave request: ${errorMessage}`);
    }
  };

  if (loading) return <div className="loading">Loading leave requests...</div>;

  return (
    <DashboardLayout user={user} logout={logout}>
      <div className="management-container">
        <div className="section-header">
          <h1>Leave Requests</h1>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Request Leave'}
          </button>
        </div>

        {showForm && (
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Leave Type</label>
                <select required value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: e.target.value })}>
                  <option value="">Select Type</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Reason</label>
                <textarea required value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="State the reason for your leave..."></textarea>
              </div>
            </div>
            <button type="submit" className="btn-save">Submit Request</button>
          </form>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied At</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave._id}>
                  <td style={{ textTransform: 'capitalize' }}>{leave.leaveType}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {leave.reason}
                  </td>
                  <td>
                    <span className={`status-badge status-${leave.status}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(leave.appliedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaveList;
