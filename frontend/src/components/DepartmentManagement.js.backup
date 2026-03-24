import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import './EmployeeManagement.css'; // Reuse same styles

function DepartmentManagement() {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        budget: '',
        head: ''
    });

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/employees');
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await axios.get('/api/departments');
            setDepartments(res.data.data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await axios.put(`/api/departments/${editingDept._id}`, formData);
                alert(t('departments.updateSuccess'));
            } else {
                await axios.post('/api/departments', formData);
                alert(t('departments.addSuccess'));
            }
            resetForm();
            fetchDepartments();
        } catch (err) {
            console.error('Error saving department:', err);
            alert(t('departments.saveError') + ': ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (dept) => {
        setEditingDept(dept);
        setFormData({
            name: dept.name || '',
            code: dept.code || '',
            description: dept.description || '',
            budget: dept.budget || '',
            head: dept.head?._id || dept.head || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('departments.deleteConfirm'))) {
            try {
                await axios.delete(`/api/departments/${id}`);
                alert(t('departments.deleteSuccess'));
                fetchDepartments();
            } catch (err) {
                console.error('Error deleting department:', err);
                alert(t('departments.deleteError') + ': ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            budget: '',
            head: ''
        });
        setShowForm(false);
        setEditingDept(null);
    };

    if (loading) return <DashboardLayout user={user} logout={logout}><div className="loading">{t('common.loading')}...</div></DashboardLayout>;

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="employee-management">
                <div className="section-header">
                    <h1>Department Management</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={fetchDepartments}>🔄 Refresh</button>
                        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingDept(null); }}>
                            + Add New Department
                        </button>
                    </div>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="form-modal">
                        <div className="form-container">
                            <div className="form-header">
                                <h2>{editingDept ? 'Edit Department' : 'Add New Department'}</h2>
                                <button className="close-btn" onClick={resetForm}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="employee-form">
                                <div className="form-section">
                                    <h3>Department Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Department Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g., Human Resources"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Department Code *</label>
                                            <input
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g., HR"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Budget</label>
                                            <input
                                                type="number"
                                                name="budget"
                                                value={formData.budget}
                                                onChange={handleInputChange}
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Department Head</label>
                                            <select
                                                name="head"
                                                value={formData.head}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Head</option>
                                                {employees.map(emp => (
                                                    <option key={emp._id} value={emp._id}>
                                                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>Description</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Optional description"
                                                style={{
                                                    padding: '10px 14px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '6px',
                                                    fontSize: '1rem',
                                                    fontFamily: 'inherit',
                                                    resize: 'vertical',
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn-primary">
                                        {editingDept ? 'Update Department' : 'Add Department'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Department List */}
                <div className="employee-list">
                    <h2>Departments ({departments.length})</h2>
                    {departments.length === 0 ? (
                        <p className="empty-state">No departments found. Add your first department!</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Head</th>
                                        <th>Budget</th>
                                        <th>Employees</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map(dept => (
                                        <tr key={dept._id}>
                                            <td><strong>{dept.code}</strong></td>
                                            <td>{dept.name}</td>
                                            <td>{dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'Not Assigned'}</td>
                                            <td>{dept.budget ? `$${dept.budget.toLocaleString()}` : 'N/A'}</td>
                                            <td>{dept.employeeCount || 0}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                    background: dept.status === 'active' ? '#d4edda' : '#f8d7da',
                                                    color: dept.status === 'active' ? '#155724' : '#721c24'
                                                }}>
                                                    {dept.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="action-buttons">
                                                <button className="btn-edit" onClick={() => handleEdit(dept)}>Edit</button>
                                                <button className="btn-delete" onClick={() => handleDelete(dept._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default DepartmentManagement;
