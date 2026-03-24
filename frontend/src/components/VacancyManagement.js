import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './Management.css';

const VacancyManagement = () => {
    const { t } = useTranslation();
    const [vacancies, setVacancies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        position: '',
        numberOfPositions: 1,
        description: '',
        vacancyType: 'external',
        requirements: { education: '', experience: '' },
        announcementDate: new Date().toISOString().split('T')[0],
        applicationDeadline: ''
    });
    const [departments, setDepartments] = useState([]);
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('new') === 'true') {
            setShowForm(true);
        }
    }, [location]);

    useEffect(() => {
        if (showForm && user.role === 'department_head' && user.employee?.department) {
            const deptId = typeof user.employee.department === 'object' 
                ? user.employee.department._id || user.employee.department.toString()
                : user.employee.department;
            setFormData(prev => ({ ...prev, department: deptId }));
        }
    }, [showForm, user]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vacRes, deptRes] = await Promise.all([
                axios.get('/api/vacancies'),
                axios.get('/api/departments')
            ]);
            setVacancies(vacRes.data.data || []);
            setDepartments(deptRes.data.data || []);
        } catch (error) {
            console.error('Error fetching vacancy data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.patch(`/api/vacancies/${id}/approve`);
            alert(t('vacancies.approveSuccess'));
            fetchData();
        } catch (error) {
            alert(t('vacancies.approveError'));
        }
    };

    const handlePublish = async (id) => {
        try {
            await axios.patch(`/api/vacancies/${id}/publish`);
            alert(t('vacancies.publishSuccess'));
            fetchData();
        } catch (error) {
            alert(t('vacancies.publishError'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/vacancies', formData);
            alert(t('vacancies.createSuccess'));
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error creating vacancy:', error);
            const errorMessage = error.response?.data?.error || t('vacancies.createError');
            alert(`${t('vacancies.createError')}: ${errorMessage}`);
        }
    };

    if (loading) return <div className="loading">{t('vacancies.loading')}</div>;

    // Pagination logic
    const totalPages = Math.ceil(vacancies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVacancies = vacancies.slice(startIndex, endIndex);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="management-container">
                <div className="section-header">
                    <h1>{t('vacancies.title')}</h1>
                    {(user.role === 'hr_officer' || user.role === 'department_head') && (
                        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                            {showForm ? t('common.cancel') : t('vacancies.createVacancy')}
                        </button>
                    )}
                </div>

                {showForm && (
                    <form className="entry-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('vacancies.formTitle')}</label>
                                <input type="text" required onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('reports.department')}</label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    disabled={user.role === 'department_head'}
                                >
                                    <option value="">{t('vacancies.selectDepartment')}</option>
                                    {user.role === 'department_head' ? (
                                        departments
                                            .filter(d => d._id === user.employee?.department)
                                            .map(d => <option key={d._id} value={d._id}>{d.name}</option>)
                                    ) : (
                                        departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)
                                    )}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('reports.position')}</label>
                                <input type="text" required onChange={e => setFormData({ ...formData, position: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('vacancies.positionsCount')}</label>
                                <input type="number" min="1" required onChange={e => setFormData({ ...formData, numberOfPositions: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>{t('vacancies.educationRequirement')}</label>
                                <input type="text" required placeholder={t('vacancies.educationPlaceholder')} onChange={e => setFormData({ ...formData, requirements: { ...formData.requirements, education: e.target.value } })} />
                            </div>
                            <div className="form-group">
                                <label>{t('vacancies.experienceRequirement')}</label>
                                <input type="text" required placeholder={t('vacancies.experiencePlaceholder')} onChange={e => setFormData({ ...formData, requirements: { ...formData.requirements, experience: e.target.value } })} />
                            </div>
                            <div className="form-group full-width">
                                <label>{t('vacancies.description')}</label>
                                <textarea required onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div className="form-group">
                                <label>{t('vacancies.type')}</label>
                                <select onChange={e => setFormData({ ...formData, vacancyType: e.target.value })}>
                                    <option value="external">{t('jobs.external')}</option>
                                    <option value="internal">{t('jobs.internal')}</option>
                                    <option value="both">{t('jobs.both')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('jobs.deadline')}</label>
                                <input type="date" required onChange={e => setFormData({ ...formData, applicationDeadline: e.target.value })} />
                            </div>
                        </div>
                        <button type="submit" className="btn-save">{t('vacancies.createButton')}</button>
                    </form>
                )}

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>VN #</th>
                                <th>{t('reports.position')}</th>
                                <th>{t('reports.department')}</th>
                                <th>{t('reports.status')}</th>
                                <th>{t('jobs.deadline')}</th>
                                <th>{t('reports.action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedVacancies.map(v => (
                                <tr key={v._id}>
                                    <td>{v.vacancyNumber}</td>
                                    <td>{v.position}</td>
                                    <td>{v.department?.name || 'N/A'}</td>
                                    <td><span className={`status-badge status-${v.status}`}>{t(`status.${v.status}`)}</span></td>
                                    <td>{new Date(v.applicationDeadline).toLocaleDateString()}</td>
                                    <td className="action-buttons">
                                        {user.role === 'hr_officer' && v.status === 'pending_approval' && (
                                            <button className="btn-approve" onClick={() => handleApprove(v._id)}>{t('common.approved')}</button>
                                        )}
                                        {user.role === 'hr_officer' && v.status === 'draft' && (
                                            <button className="btn-publish" onClick={() => handlePublish(v._id)}>{t('common.published')}</button>
                                        )}
                                        <button className="btn-view" onClick={() => { }}>{t('reports.details')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {vacancies.length > 5 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={vacancies.length}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default VacancyManagement;
