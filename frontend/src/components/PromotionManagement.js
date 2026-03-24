import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './Management.css';

const PromotionManagement = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        employee: '',
        proposedPosition: '',
        proposedDepartment: '',
        proposedSalary: '',
        reason: ''
    });
    const [currentEmployeeProfile, setCurrentEmployeeProfile] = useState(null);
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        console.log("PromotionManagement mounted. User:", user);
        if (user) {
            fetchData();
        } else {
            console.warn("User is null in PromotionManagement!");
            setLoading(false); // Stop loading if no user, though PrivateRoute should prevent this
        }
    }, [user]); // Add user to dependency to ensure we have it

    const fetchData = async () => {
        console.log("fetchData started");
        setLoading(true);
        try {
            console.log("Fetching promotions and departments...");
            // 1. Fetch Promotions and Departments (Available to all)
            const [promoRes, deptRes] = await Promise.all([
                axios.get('/api/promotions'),
                axios.get('/api/departments')
            ]);
            console.log("Promotions and departments fetched successfully");

            setPromotions(promoRes.data.data || []);
            setDepartments(deptRes.data.data || []);

            // 2. Conditional Fetching for Employees
            // HR and Dept Heads need the full list to approve/recommend
            if (['hr_officer', 'department_head', 'finance_officer'].includes(user.role)) {
                try {
                    const empRes = await axios.get('/api/employees');
                    setEmployees(empRes.data.data || []);
                } catch (error) {
                    console.error("Failed to fetch full employee list:", error);
                }
            }
            // Regular employees just need their own profile for the form
            else if (user.role === 'employee') {
                try {
                    // Try to fetch own profile directly
                    const myProfileRes = await axios.get('/api/employees/me');
                    const me = myProfileRes.data.data;

                    if (me) {
                        setCurrentEmployeeProfile(me);
                        setEmployees([me]); // Set as single item in list for consistency if needed
                        setFormData(prev => ({ ...prev, employee: me._id }));
                    }
                } catch (err) {
                    console.warn("Could not fetch individual employee profile", err);
                    // Fallback: try to match from user object if API fails
                    if (user.employee) {
                        setFormData(prev => ({ ...prev, employee: user.employee }));
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecommend = async (id, status) => {
        try {
            await axios.patch(`/api/promotions/${id}/recommend`, {
                status,
                comments: status === 'recommended' ? 'Recommended by Dept Head' : 'Not recommended by Dept Head'
            });
            alert(`Promotion ${status === 'not_recommended' ? 'rejected' : status} successfully!`);
            fetchData();
        } catch (error) {
            alert('Failed to update promotion status');
        }
    };

    const handleApprove = async (id, status) => {
        try {
            await axios.patch(`/api/promotions/${id}/approve`, {
                status: status,
                comments: status === 'approved' ? 'Approved by HR' : 'Rejected by HR',
                effectiveDate: status === 'approved' ? new Date() : null
            });
            alert(`Promotion ${status} successfully!`);
            fetchData();
        } catch (error) {
            alert('Failed to update promotion status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Find selected employee to get current details
            const emp = employees.find(e => e._id === formData.employee);
            const data = {
                ...formData,
                currentPosition: emp.position,
                currentDepartment: emp.department._id,
                currentSalary: emp.basicSalary || 0
            };
            await axios.post('/api/promotions', data);
            alert('Promotion request submitted!');
            setShowForm(false);
            fetchData();
        } catch (error) {
            alert('Failed to submit promotion request');
        }
    };

    if (loading) return <div className="loading">Loading Promotions...</div>;

    // Pagination logic
    const totalPages = Math.ceil(promotions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPromotions = promotions.slice(startIndex, endIndex);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="management-container">
                <div className="section-header">
                    <h1>Promotion Management</h1>
                    {user.role === 'employee' && (
                        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel' : 'Submit Promotion Request'}
                        </button>
                    )}
                </div>

                {showForm && (
                    <form className="entry-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {user.role !== 'employee' ? (
                                <div className="form-group">
                                    <label>Employee</label>
                                    <select required value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                                        <option value="">Select Employee</option>
                                        {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.middleName || e.lastName}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Employee</label>
                                    <input type="text" readOnly value={`${currentEmployeeProfile?.firstName} ${currentEmployeeProfile?.middleName || currentEmployeeProfile?.lastName}`} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Proposed Position</label>
                                <input type="text" required onChange={e => setFormData({ ...formData, proposedPosition: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Proposed Department</label>
                                <select required onChange={e => setFormData({ ...formData, proposedDepartment: e.target.value })}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Proposed Salary</label>
                                <input type="number" required onChange={e => setFormData({ ...formData, proposedSalary: e.target.value })} />
                            </div>
                            <div className="form-group full-width">
                                <label>Reason/Justification</label>
                                <textarea required onChange={e => setFormData({ ...formData, reason: e.target.value })}></textarea>
                            </div>
                        </div>
                        <button type="submit" className="btn-save">Submit Request</button>
                    </form>
                )}

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Current Position</th>
                                <th>Proposed Position</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPromotions.map(p => (
                                <tr key={p._id}>
                                    <td>{p.employee?.firstName} {p.employee?.middleName || p.employee?.lastName}</td>
                                    <td>{p.currentPosition}</td>
                                    <td>{p.proposedPosition}</td>
                                    <td><span className={`status-badge status-${p.status}`}>{p.status === 'not_recommended' ? 'Rejected' : p.status}</span></td>
                                    <td className="action-buttons">
                                        {user.role === 'department_head' && p.status === 'pending' && (
                                            <>
                                                <button className="btn-approve" onClick={() => handleRecommend(p._id, 'recommended')}>Recommend</button>
                                                <button className="btn-reject" onClick={() => handleRecommend(p._id, 'not_recommended')}>Reject</button>
                                            </>
                                        )}
                                        {user.role === 'hr_officer' && p.status === 'recommended' && (
                                            <>
                                                <button className="btn-approve" onClick={() => handleApprove(p._id, 'approved')}>Approve</button>
                                                <button className="btn-reject" onClick={() => handleApprove(p._id, 'rejected')}>Reject</button>
                                            </>
                                        )}
                                        <button className="btn-view" onClick={() => { }}>Details</button>
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
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={promotions.length}
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

export default PromotionManagement;
