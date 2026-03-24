import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './Management.css';

const ServiceRequestManagement = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [formData, setFormData] = useState({
        requestType: 'software_install',
        details: '',
        priority: 'low'
    });
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/service-requests');
            let data = res.data.data || [];
            if (user.role !== 'admin') {
                data = data.filter(req => req.requester?._id === user.id || req.requester === user.id);
            }
            setRequests(data);
        } catch (error) {
            console.error('Error fetching service requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        console.log('Submitting service request:', formData);
        try {
            const res = await axios.post('/api/service-requests', formData);
            console.log('Service request response:', res.data);
            alert('Service request submitted successfully!');
            setShowForm(false);
            fetchData();
            setFormData({ requestType: '', details: '', priority: 'medium' });
        } catch (error) {
            console.error('Error creating service request:', error);
            alert('Failed to submit service request: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`/api/service-requests/${id}`, { status });
            fetchData();
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    if (loading) return <div className="loading">Loading...</div>;

    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const paginatedRequests = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="management-container">
                <div className="section-header">
                    <h1>{t('sidebar.serviceRequests')}</h1>
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? t('common.cancel') : 'New Service Request'}
                    </button>
                </div>

                {showForm && (
                    <form className="entry-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Request Type</label>
                                <select value={formData.requestType} onChange={e => setFormData({ ...formData, requestType: e.target.value })}>
                                    <option value="account_access">Account Access</option>
                                    <option value="software_install">Software Install</option>
                                    <option value="hardware_request">Hardware Request</option>
                                    <option value="data_access">Data Access</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>Details</label>
                                <textarea required value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })}></textarea>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-save"
                            onClick={handleSubmit}
                            style={{ backgroundColor: '#2ecc71', color: 'white' }}
                        >
                            Submit Request
                        </button>
                    </form>
                )}

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ref #</th>
                                <th>Type</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Requester</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRequests.map(r => (
                                <tr key={r._id}>
                                    <td>{r._id.substring(r._id.length - 6).toUpperCase()}</td>
                                    <td>{r.requestType.replace('_', ' ').toUpperCase()}</td>
                                    <td><span className={`priority-badge ${r.priority}`}>{r.priority.toUpperCase()}</span></td>
                                    <td><span className={`status-badge status-${r.status}`}>{t(`status.${r.status}`)}</span></td>
                                    <td>{r.requester?.employee ? `${r.requester.employee.firstName} ${r.requester.employee.middleName || r.requester.employee.lastName}` : (r.requester?.email || 'Unknown')}</td>
                                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="action-buttons">
                                        {user.role === 'admin' && r.status === 'pending' && (
                                            <button className="btn-approve" onClick={() => handleUpdateStatus(r._id, 'approved')}>Approve</button>
                                        )}
                                        {user.role === 'admin' && r.status === 'approved' && (
                                            <button className="btn-publish" onClick={() => handleUpdateStatus(r._id, 'fulfilled')}>Fulfill</button>
                                        )}
                                        <button className="btn-view" onClick={() => handleViewDetails(r)}>Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={requests.length}
                    onItemsPerPageChange={setItemsPerPage}
                />

                {showDetailsModal && selectedRequest && (
                    <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Service Request Details</h2>
                                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="detail-section">
                                    <h3>Request Information</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item"><strong>Ref #:</strong> {selectedRequest._id.substring(selectedRequest._id.length - 6).toUpperCase()}</div>
                                        <div className="detail-item"><strong>Status:</strong> <span className={`status-badge status-${selectedRequest.status}`}>{t(`status.${selectedRequest.status}`)}</span></div>
                                        <div className="detail-item"><strong>Type:</strong> {selectedRequest.requestType.replace('_', ' ').toUpperCase()}</div>
                                        <div className="detail-item"><strong>Priority:</strong> <span className={`priority-badge ${selectedRequest.priority}`}>{selectedRequest.priority.toUpperCase()}</span></div>
                                        <div className="detail-item"><strong>Created At:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</div>
                                        {selectedRequest.fulfillmentDate && (
                                            <div className="detail-item"><strong>Fulfilled At:</strong> {new Date(selectedRequest.fulfillmentDate).toLocaleString()}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Requester Details</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item"><strong>Name:</strong> {selectedRequest.requester?.employee ? `${selectedRequest.requester.employee.firstName} ${selectedRequest.requester.employee.middleName || selectedRequest.requester.employee.lastName}` : 'N/A'}</div>
                                        <div className="detail-item"><strong>Email:</strong> {selectedRequest.requester?.email || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Details</h3>
                                    <p style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', padding: '15px', borderRadius: '4px', border: '1px solid #eee' }}>
                                        {selectedRequest.details}
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ServiceRequestManagement;
