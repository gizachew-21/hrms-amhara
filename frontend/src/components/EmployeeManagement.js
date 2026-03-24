import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './EmployeeManagement.css';

function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [deptFormData, setDeptFormData] = useState({
        name: '',
        code: '',
        description: ''
    });
    const { user, logout } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        position: '',
        department: '',
        basicSalary: '',
        hireDate: '',
        employmentType: 'permanent',
        address: {
            region: '',
            city: '',
            subcity: '',
            woreda: ''
        },
        bankDetails: {
            bankName: 'Commercial Bank of Ethiopia (CBE)',
            accountNumber: '',
            accountHolderName: ''
        }
    });

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/employees');
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await axios.get('/api/departments');
            setDepartments(res.data.data || []);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (showEditForm && selectedEmployee) {
                await axios.put(`/api/employees/${selectedEmployee._id}`, formData);
                alert('Employee updated successfully!');
            } else {
                await axios.post('/api/employees', formData);
                alert('Employee added successfully!');
            }
            resetForm();
            fetchEmployees();
        } catch (err) {
            console.error('Error saving employee:', err);
            alert('Failed to save employee: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            firstName: employee.firstName || '',
            middleName: employee.middleName || '',
            lastName: employee.lastName || '',
            email: employee.email || '',
            phoneNumber: employee.phoneNumber || '',
            dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
            gender: employee.gender || '',
            position: employee.position || '',
            department: employee.department?._id || employee.department || '',
            basicSalary: employee.basicSalary || '',
            hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
            employmentType: employee.employmentType || 'permanent',
            address: employee.address || {
                region: '',
                city: '',
                subcity: '',
                woreda: ''
            },
            bankDetails: employee.bankDetails || {
                bankName: 'Commercial Bank of Ethiopia (CBE)',
                accountNumber: '',
                accountHolderName: ''
            }
        });
        setShowEditForm(true);
        setShowAddForm(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await axios.delete(`/api/employees/${id}`);
                alert('Employee deleted successfully!');
                fetchEmployees();
            } catch (err) {
                console.error('Error deleting employee:', err);
                alert('Failed to delete employee');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            middleName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            dateOfBirth: '',
            gender: '',
            position: '',
            department: '',
            basicSalary: '',
            hireDate: '',
            employmentType: 'permanent',
            address: {
                region: '',
                city: '',
                subcity: '',
                woreda: ''
            },
            bankDetails: {
                bankName: 'Commercial Bank of Ethiopia (CBE)',
                accountNumber: '',
                accountHolderName: ''
            }
        });
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedEmployee(null);
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/departments', deptFormData);
            alert('Department added successfully!');
            setDeptFormData({ name: '', code: '', description: '' });
            setShowDeptModal(false);
            fetchDepartments();
            // Auto-select the newly created department
            setFormData(prev => ({ ...prev, department: res.data._id }));
        } catch (err) {
            console.error('Error adding department:', err);
            alert('Failed to add department: ' + (err.response?.data?.error || err.message));
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = !filterDepartment ||
            emp.department?._id === filterDepartment ||
            emp.department === filterDepartment;

        return matchesSearch && matchesDepartment;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    if (loading) return <DashboardLayout user={user} logout={logout}><div className="loading">Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="employee-management">
                <div className="section-header">
                    <h1>Employee Management</h1>
                    <button className="btn-primary" onClick={() => { setShowAddForm(true); setShowEditForm(false); }}>
                        + Add New Employee
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="filters-section">
                    <input
                        type="text"
                        placeholder="Search by name, email, or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                {/* Add/Edit Form */}
                {(showAddForm || showEditForm) && (
                    <div className="form-modal">
                        <div className="form-container">
                            <div className="form-header">
                                <h2>{showEditForm ? 'Edit Employee' : 'Add New Employee'}</h2>
                                <button className="close-btn" onClick={resetForm}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="employee-form">
                                <div className="form-section">
                                    <h3>Personal Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>First Name *</label>
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Middle Name</label>
                                            <input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name *</label>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Date of Birth *</label>
                                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Gender *</label>
                                            <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Contact Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Initial Password *</label>
                                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!showEditForm} placeholder={showEditForm ? "Leave blank to keep current" : "Set login password"} />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number *</label>
                                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Region</label>
                                            <input type="text" name="address.region" value={formData.address.region} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>City</label>
                                            <input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Subcity</label>
                                            <input type="text" name="address.subcity" value={formData.address.subcity} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Woreda</label>
                                            <input type="text" name="address.woreda" value={formData.address.woreda} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Employment Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Position *</label>
                                            <input type="text" name="position" value={formData.position} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Department *</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <select name="department" value={formData.department} onChange={handleInputChange} required style={{ flex: 1 }}>
                                                    <option value="">Select Department</option>
                                                    {departments.map(dept => (
                                                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn-add-dept"
                                                    onClick={() => setShowDeptModal(true)}
                                                    title="Add New Department"
                                                >
                                                    + New Dept
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Basic Salary *</label>
                                            <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Hire Date *</label>
                                            <input type="date" name="hireDate" value={formData.hireDate} onChange={handleInputChange} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Employment Type *</label>
                                            <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} required>
                                                <option value="permanent">Permanent</option>
                                                <option value="contract">Contract</option>
                                                <option value="temporary">Temporary</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Bank Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Bank Name</label>
                                            <input type="text" name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleInputChange} placeholder="e.g. CBE" />
                                        </div>
                                        <div className="form-group">
                                            <label>Account Number</label>
                                            <input type="text" name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleInputChange} placeholder="1000..." />
                                        </div>
                                        <div className="form-group">
                                            <label>Account Holder Name</label>
                                            <input type="text" name="bankDetails.accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleInputChange} placeholder="Full name as on bank record" />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn-primary">{showEditForm ? 'Update Employee' : 'Add Employee'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Department Modal */}
                {showDeptModal && (
                    <div className="dept-modal-overlay" onClick={() => setShowDeptModal(false)}>
                        <div className="dept-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="dept-modal-header">
                                <h3>Add New Department</h3>
                                <button className="close-btn" onClick={() => setShowDeptModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleAddDepartment} className="dept-form">
                                <div className="form-group">
                                    <label>Department Name *</label>
                                    <input
                                        type="text"
                                        value={deptFormData.name}
                                        onChange={(e) => setDeptFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="e.g., Human Resources"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department Code *</label>
                                    <input
                                        type="text"
                                        value={deptFormData.code}
                                        onChange={(e) => setDeptFormData(prev => ({ ...prev, code: e.target.value }))}
                                        required
                                        placeholder="e.g., HR"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={deptFormData.description}
                                        onChange={(e) => setDeptFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Optional description"
                                        rows="3"
                                    />
                                </div>
                                <div className="dept-modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Add Department</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Employee List */}
                <div className="employee-list">
                    <h2>Employees ({filteredEmployees.length})</h2>
                    {filteredEmployees.length === 0 ? (
                        <p className="empty-state">No employees found</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Position</th>
                                        <th>System Role</th>
                                        <th>Department</th>
                                        <th>Phone</th>
                                        <th>Hire Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.map(emp => (
                                        <tr key={emp._id}>
                                            <td>{emp.employeeId}</td>
                                            <td>{emp.firstName} {emp.middleName || emp.lastName}</td>
                                            <td>{emp.email}</td>
                                            <td>{emp.position}</td>
                                            <td>
                                                <span className="status-badge" style={{
                                                    background: emp.user?.role === 'admin' ? '#e8eaf6' :
                                                        emp.user?.role === 'hr_officer' ? '#e3f2fd' :
                                                            emp.user?.role === 'department_head' ? '#fff3e0' :
                                                                emp.user?.role === 'finance_officer' ? '#f3e5f5' : '#f5f5f5',
                                                    color: emp.user?.role === 'admin' ? '#3f51b5' :
                                                        emp.user?.role === 'hr_officer' ? '#1976d2' :
                                                            emp.user?.role === 'department_head' ? '#f57c00' :
                                                                emp.user?.role === 'finance_officer' ? '#7b1fa2' : '#666'
                                                }}>
                                                    {emp.user?.role ? emp.user.role.replace('_', ' ') : 'employee'}
                                                </span>
                                            </td>
                                            <td>{emp.department?.name || 'N/A'}</td>
                                            <td>{emp.phoneNumber}</td>
                                            <td>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="action-buttons">
                                                <button className="btn-edit" onClick={() => handleEdit(emp)}>Edit</button>
                                                <button className="btn-delete" onClick={() => handleDelete(emp._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filteredEmployees.length > 5 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredEmployees.length}
                            onItemsPerPageChange={(value) => {
                                setItemsPerPage(value);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default EmployeeManagement;
