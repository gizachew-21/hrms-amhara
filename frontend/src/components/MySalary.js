import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import './Management.css';

const MySalary = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        fetchMySalary();
    }, []);

    const fetchMySalary = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/payrolls');
            setPayrolls(res.data.data || []);
        } catch (error) {
            console.error('Error fetching salary records:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading salary records...</div>;

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="management-container">
                <div className="section-header">
                    <h1>My Salary & Pay Slips</h1>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Gross Salary</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                                <th>Payment Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map(p => (
                                <tr key={p._id}>
                                    <td>{p.month}/{p.year}</td>
                                    <td>{p.grossSalary.toLocaleString()} ETB</td>
                                    <td>{p.totalDeductions.toLocaleString()} ETB</td>
                                    <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{p.netSalary.toLocaleString()} ETB</td>
                                    <td>
                                        <span className={`status-badge status-${p.status}`}>
                                            {p.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {payrolls.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                        No salary records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#2c3e50' }}>
                        <strong>Note:</strong> If you have questions about your pay slip, please contact the Finance Department.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MySalary;
