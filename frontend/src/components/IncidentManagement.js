import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './Management.css';

const IncidentManagement = () => {
    const { t } = useTranslation();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        category: 'software'
    });
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/incidents');
            let data = res.data.data || [];
            if (user.role !== 'admin') {
                data = data.filter(inc => inc.reporter?._id === user.id || inc.reporter === user.id);
            }
            setIncidents(data);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        console.log('Submitting incident:', formData);
        try {
            const res = await axios.post('/api/incidents', formData);
            console.log('Incident creation response:', res.data);
            alert('Incident reported successfully!');
            setShowForm(false);
            fetchData();
            setFormData({ title: '', description: '', priority: 'medium', category: 'software' });
        } catch (error) {
            console.error('Error creating incident:', error);
            alert('Failed to report incident: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`/api/incidents/${id}`, { status });
            fetchData();
        } catch (error) {
            console.error('Error updating incident status:', error);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    const totalPages = Math.ceil(incidents.length / itemsPerPage);
    const paginatedIncidents = incidents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="management-container">
                <div className="section-header">
                    <h1>{t('sidebar.incidentManagement')}</h1>
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? t('common.cancel') : 'Report New Incident'}
                    </button>
                </div>

                {showForm && (
                    <form className="entry-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="software">Software</option>
                                    <option value="hardware">Hardware</option>
                                    <option value="network">Network</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-save"
                            onClick={handleSubmit}
                            style={{ backgroundColor: '#2ecc71', color: 'white' }}
                        >
                            Submit Incident
                        </button>
                    </form>
                )}

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ref #</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Reporter</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedIncidents.map(i => (
                                <tr key={i._id}>
                                    <td>{i._id.substring(i._id.length - 6).toUpperCase()}</td>
                                    <td>{i.title}</td>
                                    <td><span className={`priority-badge ${i.priority}`}>{i.priority.toUpperCase()}</span></td>
                                    <td><span className={`status-badge status-${i.status}`}>{t(`status.${i.status}`)}</span></td>
                                    <td>{i.reporter?.employee ? `${i.reporter.employee.firstName} ${i.reporter.employee.middleName || i.reporter.employee.lastName}` : (i.reporter?.email || 'Unknown')}</td>
                                    <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                                    <td className="action-buttons">
                                        {user.role === 'admin' && i.status === 'pending' && (
                                            <button className="btn-approve" onClick={() => handleUpdateStatus(i._id, 'in-progress')}>Start Working</button>
                                        )}
                                        {user.role === 'admin' && i.status === 'in-progress' && (
                                            <button className="btn-publish" onClick={() => handleUpdateStatus(i._id, 'resolved')}>Resolve</button>
                                        )}
                                        <button className="btn-view">Details</button>
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
                    totalItems={incidents.length}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </DashboardLayout>
    );
};

export default IncidentManagement;
