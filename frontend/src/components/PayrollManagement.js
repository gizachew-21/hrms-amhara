import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import './Management.css';

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const STATUS_COLOR = {
    draft: { bg: '#f1f3f4', color: '#5f6368' },
    pending: { bg: '#fff3e0', color: '#e65100' },
    pending_approval: { bg: '#fff3e0', color: '#e65100' },
    approved: { bg: '#e8f5e9', color: '#2e7d32' },
    paid: { bg: '#e3f2fd', color: '#1565c0' },
    cancelled: { bg: '#fce4ec', color: '#c62828' },
    submitted_to_finance: { bg: '#e1f5fe', color: '#0277bd' },
    payment_order_sent: { bg: '#f3e5f5', color: '#6a1b9a' },
    processed: { bg: '#e8f5e9', color: '#1b5e20' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_COLOR[status] || { bg: '#eee', color: '#333' };
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem',
            fontWeight: 600, backgroundColor: s.bg, color: s.color,
            textTransform: 'capitalize', whiteSpace: 'nowrap'
        }}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
};

const SalarySlipModal = ({ payroll, onClose }) => {
    const slipRef = useRef();
    const handlePrint = () => {
        const content = slipRef.current.innerHTML;
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>Salary Slip</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #222; }
        h2   { text-align: center; margin-bottom: 4px; }
        p.sub{ text-align: center; color: #555; margin: 0 0 20px; }
        table{ width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; }
        th   { background: #f5f5f5; text-align: left; }
        .total-row td { font-weight: bold; background: #fafafa; }
        .net-row  td { font-weight: bold; background: #e8f5e9; font-size: 1.1em; }
      </style></head><body>${content}</body></html>`);
        w.document.close();
        w.print();
    };
    if (!payroll) return null;
    const emp = payroll.employee || {};
    const gross = payroll.grossSalary || 0;
    const net = payroll.netSalary || 0;
    const tax = payroll.deductions?.incomeTax || 0;
    const pension = payroll.deductions?.pension || 0;
    const loan = payroll.deductions?.loan || 0;
    const otherD = payroll.deductions?.other || 0;
    const transport = payroll.allowances?.transport || 0;
    const housing = payroll.allowances?.housing || 0;
    const otherA = payroll.allowances?.other || 0;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: 620, padding: 0 }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Salary Slip</h3>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-primary" onClick={handlePrint}>🖨️ Print</button>
                        <button className="btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
                <div ref={slipRef} style={{ padding: 24 }}>
                    <h2>Amhara Bureau – Salary Slip</h2>
                    <p className="sub">{MONTHS[payroll.month]} {payroll.year}</p>
                    <table style={{ marginBottom: 16, borderCollapse: 'collapse', width: '100%' }}>
                        <tbody>
                            <tr><th>Employee Name</th><td>{emp.firstName} {emp.middleName || emp.lastName}</td><th>Employee ID</th><td>{emp.employeeId}</td></tr>
                            <tr><th>Position</th><td>{emp.position}</td><th>Payroll #</th><td>{payroll.payrollNumber}</td></tr>
                            <tr><th>Bank Name</th><td>{emp.bankDetails?.bankName || 'N/A'}</td><th>Account #</th><td>{emp.bankDetails?.accountNumber || 'N/A'}</td></tr>
                        </tbody>
                    </table>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead><tr><th>Earnings</th><th>Amount (ETB)</th><th>Deductions</th><th>Amount (ETB)</th></tr></thead>
                        <tbody>
                            <tr><td>Basic Salary</td><td>{(payroll.basicSalary || 0).toLocaleString()}</td><td>Income Tax</td><td>{tax.toLocaleString()}</td></tr>
                            <tr><td>Transport Allowance</td><td>{transport.toLocaleString()}</td><td>Pension (7%)</td><td>{pension.toLocaleString()}</td></tr>
                            <tr><td>Housing Allowance</td><td>{housing.toLocaleString()}</td><td>Loan Deduction</td><td>{loan.toLocaleString()}</td></tr>
                            <tr><td>Other Allowance</td><td>{otherA.toLocaleString()}</td><td>Other Deduction</td><td>{otherD.toLocaleString()}</td></tr>
                            {payroll.overtime > 0 && <tr><td>Overtime</td><td>{(payroll.overtime).toLocaleString()}</td><td></td><td></td></tr>}
                            {payroll.bonus > 0 && <tr><td>Bonus</td><td>{(payroll.bonus).toLocaleString()}</td><td></td><td></td></tr>}
                            <tr className="total-row"><td>Gross Salary</td><td>{gross.toLocaleString()}</td><td>Total Deductions</td><td>{(payroll.totalDeductions || 0).toLocaleString()}</td></tr>
                            <tr className="net-row"><td colSpan="3"><strong>Net Salary</strong></td><td><strong>{net.toLocaleString()} ETB</strong></td></tr>
                        </tbody>
                    </table>
                    <p style={{ marginTop: 24, fontSize: '0.85rem', color: '#555' }}>
                        Status: <strong>{payroll.status}</strong> &nbsp;|&nbsp; Payment Method: {payroll.paymentMethod || 'bank_transfer'}
                        {payroll.transactionReference && <> &nbsp;|&nbsp; Ref: {payroll.transactionReference}</>}
                    </p>
                </div>
            </div>
        </div>
    );
};

const PayrollManagement = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const isHR = user?.role === 'hr_officer';
    const isFinance = user?.role === 'finance_officer';

    const [activeTab, setActiveTab] = useState('payrolls');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [payrolls, setPayrolls] = useState([]);
    const [salaryOrders, setSalaryOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', ok: true });
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [txRef, setTxRef] = useState('');
    const [payingId, setPayingId] = useState(null);

    useEffect(() => {
        if (location.state?.activeTab) setActiveTab(location.state.activeTab);
    }, [location.state]);

    useEffect(() => {
        if (activeTab === 'payrolls') fetchPayrolls();
        if (activeTab === 'salary-orders' || activeTab === 'pending-orders') fetchOrders();
    }, [activeTab, month, year]); // eslint-disable-line

    const showMsg = (text, ok = true) => setMessage({ text, ok });

    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/payrolls?month=${month}&year=${year}`);
            setPayrolls(res.data.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/payrolls/salary-orders');
            setSalaryOrders(res.data.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // HR: generate all payrolls
    const handleGenerateAll = async () => {
        try {
            setLoading(true); showMsg('');
            const res = await axios.post('/api/payrolls/generate-all', { month, year });
            if (res.data.errors?.length > 0) {
                showMsg(`${res.data.message} (${res.data.errors.length} failed. Example: ${res.data.errors[0].error})`, false);
            } else {
                showMsg(res.data.message || 'Payrolls generated!');
            }
            fetchPayrolls();
        } catch (e) {
            const err = e.response?.data?.error || 'Failed to generate payrolls';
            const details = e.response?.data?.details;
            showMsg(details ? `${err}: ${details[0]?.error}` : err, false);
        } finally { setLoading(false); }
    };

    // HR: create salary order and send to Finance
    const handleGenerateOrder = async () => {
        try {
            setLoading(true); showMsg('');
            const res = await axios.post('/api/payrolls/generate-order', { month, year });
            showMsg(`Salary Order ${res.data.data.orderNumber} sent to Finance!`);
            fetchOrders();
        } catch (e) { showMsg(e.response?.data?.error || 'Failed', false); }
        finally { setLoading(false); }
    };

    // HR: approve individual payroll
    const handleApprovePayroll = async (id) => {
        try {
            await axios.patch(`/api/payrolls/${id}/approve`);
            fetchPayrolls();
            showMsg('Payroll approved.');
        } catch (e) { showMsg(e.response?.data?.error || 'Failed', false); }
    };

    // HR: confirm payment order received from Finance
    const handleConfirmOrder = async (id) => {
        try {
            await axios.patch(`/api/payrolls/salary-orders/${id}/confirm`);
            fetchOrders();
            showMsg('Payment order confirmed – marked as Processed.');
        } catch (e) { showMsg(e.response?.data?.error || 'Failed', false); }
    };

    // Finance: send payment order back to HR
    const handleSendPaymentOrder = async (id) => {
        try {
            await axios.patch(`/api/payrolls/salary-orders/${id}/approve`);
            fetchOrders();
            showMsg('Payment order sent to HR Officer.');
        } catch (e) { showMsg(e.response?.data?.error || 'Failed', false); }
    };

    // Finance: mark payroll as paid
    const handleMarkPaid = async (id) => {
        if (!txRef.trim()) { showMsg('Please enter a transaction reference.', false); return; }
        try {
            await axios.patch(`/api/payrolls/${id}/paid`, { transactionReference: txRef });
            setPayingId(null); setTxRef('');
            fetchPayrolls();
            showMsg('Payroll marked as paid.');
        } catch (e) { showMsg(e.response?.data?.error || 'Failed', false); }
    };

    const hrTabs = [
        { id: 'payrolls', label: '📋 Payroll Records' },
        { id: 'generate-all', label: '⚙️ Generate Monthly Payrolls' },
        { id: 'generate-order', label: '📝 Generate Salary Order' },
        { id: 'salary-orders', label: '📊 Review Salary Orders' },
    ];
    const financeTabs = [
        { id: 'payrolls', label: '📋 Payroll Records' },
        { id: 'pending-orders', label: '📜 Review Pending Orders' },
        { id: 'print-slips', label: '🖨️ Print Salary Slips' },
    ];
    const tabs = isHR ? hrTabs : financeTabs;

    const pendingOrders = salaryOrders.filter(o => o.status === 'submitted_to_finance');
    const sentOrders = salaryOrders.filter(o => o.status === 'payment_order_sent');

    return (
        <DashboardLayout user={user} logout={logout}>
            {selectedSlip && <SalarySlipModal payroll={selectedSlip} onClose={() => setSelectedSlip(null)} />}
            <div style={{ padding: '24px 28px' }}>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a237e' }}>💼 Payroll Management</h1>
                    <p style={{ margin: '4px 0 0', color: '#666' }}>
                        {isHR ? 'HR Officer – Salary orders & verification' : 'Finance Officer – Payments & payroll generation'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); showMsg(''); }}
                            style={{
                                padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.9rem', transition: 'all .2s',
                                backgroundColor: activeTab === t.id ? '#1a237e' : '#f0f2f5',
                                color: activeTab === t.id ? '#fff' : '#444',
                                boxShadow: activeTab === t.id ? '0 2px 8px rgba(26,35,126,.3)' : 'none'
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {message.text && (
                    <div style={{
                        padding: '10px 16px', borderRadius: 8, marginBottom: 18,
                        backgroundColor: message.ok ? '#e8f5e9' : '#fce4ec',
                        color: message.ok ? '#2e7d32' : '#c62828',
                        border: `1px solid ${message.ok ? '#a5d6a7' : '#f48fb1'}`,
                        fontWeight: 500
                    }}>
                        {message.ok ? '✅ ' : '❌ '}{message.text}
                    </div>
                )}

                {['payrolls', 'generate-all', 'generate-order'].includes(activeTab) && (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: '14px 18px', backgroundColor: '#f8f9fa', borderRadius: 10, border: '1px solid #e0e0e0' }}>
                        <label style={{ fontWeight: 600, color: '#444' }}>Period:</label>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))}
                            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
                            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                            style={{ width: 90, padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }} />
                        <button onClick={fetchPayrolls}
                            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', backgroundColor: '#fff' }}>
                            🔄 Refresh
                        </button>
                    </div>
                )}

                {/* Payroll Records Tab */}
                {activeTab === 'payrolls' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h2 style={{ margin: 0 }}>Payroll Records — {MONTHS[month]} {year}</h2>
                            {isFinance && payrolls.length > 0 && (
                                <button className="btn-secondary" onClick={() => {
                                    const list = payrolls.map(p =>
                                        `${p.employee?.firstName} ${p.employee?.middleName || p.employee?.lastName}\t${p.employee?.bankDetails?.accountNumber || 'NO_ACC'}\t${p.netSalary}`
                                    ).join('\n');
                                    navigator.clipboard.writeText(list);
                                }}>
                                    📋 Copy Payment List
                                </button>
                            )}
                        </div>
                        {loading ? <p>Loading…</p> : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Payroll #</th><th>Employee</th>
                                            {isFinance && <th>Bank / Account</th>}
                                            <th>Basic Salary</th><th>Gross Salary</th><th>Net Salary</th>
                                            <th>Status</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payrolls.length === 0 && (
                                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#888' }}>No payroll records for this period.</td></tr>
                                        )}
                                        {payrolls.map(p => (
                                            <tr key={p._id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.payrollNumber}</td>
                                                <td>{p.employee?.firstName} {p.employee?.middleName || p.employee?.lastName}<br /><span style={{ fontSize: '0.78rem', color: '#888' }}>{p.employee?.employeeId}</span></td>
                                                {isFinance && (
                                                    <td>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.employee?.bankDetails?.bankName || 'CBE'}</span><br />
                                                        <span style={{ fontSize: '0.8rem', color: '#555' }}>{p.employee?.bankDetails?.accountNumber || 'N/A'}</span>
                                                    </td>
                                                )}
                                                <td>{(p.basicSalary || 0).toLocaleString()} ETB</td>
                                                <td>{(p.grossSalary || 0).toLocaleString()} ETB</td>
                                                <td style={{ fontWeight: 700 }}>{(p.netSalary || 0).toLocaleString()} ETB</td>
                                                <td><StatusBadge status={p.status} /></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <button className="btn-view" onClick={() => setSelectedSlip(p)} style={{ fontSize: '0.8rem' }}>🖨️ Slip</button>
                                                        {isHR && p.status === 'pending' && (
                                                            <button className="btn-approve" onClick={() => handleApprovePayroll(p._id)} style={{ fontSize: '0.8rem' }}>✅ Approve</button>
                                                        )}
                                                        {isFinance && (p.status === 'approved' || p.status === 'pending') && (
                                                            payingId === p._id ? (
                                                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                                    <input placeholder="Tx Ref" value={txRef} onChange={e => setTxRef(e.target.value)}
                                                                        style={{ width: 100, padding: '3px 6px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.8rem' }} />
                                                                    <button className="btn-approve" onClick={() => handleMarkPaid(p._id)} style={{ fontSize: '0.8rem' }}>Confirm</button>
                                                                    <button className="btn-secondary" onClick={() => setPayingId(null)} style={{ fontSize: '0.8rem' }}>Cancel</button>
                                                                </div>
                                                            ) : (
                                                                <button className="btn-approve" onClick={() => setPayingId(p._id)} style={{ fontSize: '0.8rem' }}>💳 Mark Paid</button>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* HR: Generate Monthly Payrolls Tab */}
                {activeTab === 'generate-all' && isHR && (
                    <div>
                        <h2 style={{ marginBottom: 8 }}>⚙️ Generate Monthly Payrolls</h2>
                        <p style={{ color: '#555', marginBottom: 20 }}>
                            Automatically calculate and create payroll records for <strong>all active employees</strong> for the selected period.
                            Skips employees who already have a record for this period.
                        </p>
                        <div style={{ padding: 20, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', maxWidth: 480 }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Month</label>
                                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
                                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Year</label>
                                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }} />
                            </div>
                            <button className="btn-primary" onClick={handleGenerateAll} disabled={loading}
                                style={{ width: '100%', padding: '10px 0', fontSize: '1rem' }}>
                                {loading ? '⏳ Processing…' : `⚙️ Generate Payrolls for ${MONTHS[month]} ${year}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* HR: Generate Salary Order Tab */}
                {activeTab === 'generate-order' && isHR && (
                    <div>
                        <h2 style={{ marginBottom: 8 }}>📝 Generate Salary Order</h2>
                        <p style={{ color: '#555', marginBottom: 20 }}>
                            Aggregates all payroll records for the selected period into a single salary order and sends it to Finance.
                            You must generate and approve monthly payrolls first.
                        </p>
                        <div style={{ padding: 20, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e0e0e0', maxWidth: 480 }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Month</label>
                                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
                                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Year</label>
                                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }} />
                            </div>
                            <div style={{ padding: '12px 14px', backgroundColor: '#e3f2fd', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', color: '#0d47a1' }}>
                                💡 <strong>Workflow:</strong> Generate Payrolls → Approve Payrolls → Generate Salary Order → Finance pays employees → Confirm receipt
                            </div>
                            <button className="btn-primary" onClick={handleGenerateOrder} disabled={loading}
                                style={{ width: '100%', padding: '10px 0', fontSize: '1rem', backgroundColor: '#2e7d32' }}>
                                {loading ? '⏳ Processing…' : `📤 Send Salary Order to Finance`}
                            </button>
                        </div>
                    </div>
                )}

                {/* HR: Review Salary Orders Tab */}
                {activeTab === 'salary-orders' && isHR && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h2 style={{ margin: 0 }}>📊 Salary Orders</h2>
                            <button onClick={fetchOrders} className="btn-secondary">🔄 Refresh</button>
                        </div>
                        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                            {[
                                { label: 'Total Orders', value: salaryOrders.length, color: '#1a237e' },
                                { label: 'Awaiting Finance', value: salaryOrders.filter(o => o.status === 'submitted_to_finance').length, color: '#e65100' },
                                { label: 'Awaiting Your Confirmation', value: sentOrders.length, color: '#6a1b9a' },
                                { label: 'Processed', value: salaryOrders.filter(o => o.status === 'processed').length, color: '#2e7d32' },
                            ].map(c => (
                                <div key={c.label} style={{ flex: 1, padding: '14px 18px', backgroundColor: '#fff', borderRadius: 10, border: `2px solid ${c.color}20`, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 4 }}>{c.label}</div>
                                </div>
                            ))}
                        </div>
                        {loading ? <p>Loading…</p> : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Order #</th><th>Period</th><th>Employees</th><th>Gross Total</th><th>Net Total</th><th>Status</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {salaryOrders.length === 0 && (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#888' }}>No salary orders yet.</td></tr>
                                        )}
                                        {salaryOrders.map(o => (
                                            <tr key={o._id}>
                                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.orderNumber}</td>
                                                <td>{MONTHS[o.month]} {o.year}</td>
                                                <td>{o.totalEmployees}</td>
                                                <td>{(o.totalGrossSalary || 0).toLocaleString()} ETB</td>
                                                <td style={{ fontWeight: 700 }}>{(o.totalNetSalary || 0).toLocaleString()} ETB</td>
                                                <td><StatusBadge status={o.status} /></td>
                                                <td>
                                                    {o.status === 'payment_order_sent' && (
                                                        <button className="btn-approve" onClick={() => handleConfirmOrder(o._id)} style={{ fontSize: '0.82rem' }}>
                                                            ✅ Confirm Receipt
                                                        </button>
                                                    )}
                                                    {o.status === 'submitted_to_finance' && (
                                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>⏳ Awaiting Finance</span>
                                                    )}
                                                    {o.status === 'processed' && (
                                                        <span style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✔ Completed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Finance: Review Pending Orders Tab */}
                {activeTab === 'pending-orders' && isFinance && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h2 style={{ margin: 0 }}>📜 Salary Orders from HR</h2>
                            <button onClick={fetchOrders} className="btn-secondary">🔄 Refresh</button>
                        </div>
                        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                            {[
                                { label: 'Pending Review', value: pendingOrders.length, color: '#e65100' },
                                { label: 'Payment Sent', value: sentOrders.length, color: '#6a1b9a' },
                                { label: 'Processed', value: salaryOrders.filter(o => o.status === 'processed').length, color: '#2e7d32' },
                            ].map(c => (
                                <div key={c.label} style={{ flex: 1, padding: '14px 18px', backgroundColor: '#fff', borderRadius: 10, border: `2px solid ${c.color}20`, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 4 }}>{c.label}</div>
                                </div>
                            ))}
                        </div>
                        {loading ? <p>Loading…</p> : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Order #</th><th>Period</th><th>Employees</th><th>Gross Total</th><th>Net Total</th><th>Status</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {salaryOrders.length === 0 && (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#888' }}>No salary orders received yet.</td></tr>
                                        )}
                                        {salaryOrders.map(o => (
                                            <tr key={o._id}>
                                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.orderNumber}</td>
                                                <td>{MONTHS[o.month]} {o.year}</td>
                                                <td>{o.totalEmployees}</td>
                                                <td>{(o.totalGrossSalary || 0).toLocaleString()} ETB</td>
                                                <td style={{ fontWeight: 700 }}>{(o.totalNetSalary || 0).toLocaleString()} ETB</td>
                                                <td><StatusBadge status={o.status} /></td>
                                                <td>
                                                    {o.status === 'submitted_to_finance' && (
                                                        <button className="btn-approve" onClick={() => handleSendPaymentOrder(o._id)} style={{ fontSize: '0.82rem' }}>
                                                            📤 Send Payment Order
                                                        </button>
                                                    )}
                                                    {o.status === 'payment_order_sent' && (
                                                        <span style={{ fontSize: '0.8rem', color: '#6a1b9a' }}>⏳ Awaiting HR Confirmation</span>
                                                    )}
                                                    {o.status === 'processed' && (
                                                        <span style={{ fontSize: '0.8rem', color: '#2e7d32' }}>✔ Fully Processed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Finance: Print Salary Slips Tab */}
                {activeTab === 'print-slips' && isFinance && (
                    <div>
                        <h2 style={{ marginBottom: 8 }}>🖨️ Print Salary Slips</h2>
                        <p style={{ color: '#555', marginBottom: 20 }}>Select a period to load payroll records, then print salary slips.</p>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: '14px 18px', backgroundColor: '#f8f9fa', borderRadius: 10, border: '1px solid #e0e0e0' }}>
                            <label style={{ fontWeight: 600 }}>Period:</label>
                            <select value={month} onChange={e => setMonth(Number(e.target.value))}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
                                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </select>
                            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
                                style={{ width: 90, padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc' }} />
                            <button className="btn-primary" onClick={fetchPayrolls} disabled={loading}>
                                {loading ? '⏳ Loading…' : '🔍 Load Payrolls'}
                            </button>
                        </div>
                        {payrolls.length > 0 && (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Employee</th><th>ID</th><th>Net Salary</th><th>Status</th><th>Print</th></tr>
                                    </thead>
                                    <tbody>
                                        {payrolls.map(p => (
                                            <tr key={p._id}>
                                                <td>{p.employee?.firstName} {p.employee?.middleName || p.employee?.lastName}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.employee?.employeeId}</td>
                                                <td style={{ fontWeight: 700 }}>{(p.netSalary || 0).toLocaleString()} ETB</td>
                                                <td><StatusBadge status={p.status} /></td>
                                                <td><button className="btn-view" onClick={() => setSelectedSlip(p)}>🖨️ Print Slip</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {payrolls.length === 0 && !loading && (
                            <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>Select a period and click "Load Payrolls".</p>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PayrollManagement;
