import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import DateDisplay from './DateDisplay';
import { formatEthiopianDate } from '../utils/ethiopianCalendar';
import './Management.css';

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const Reports = () => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('employees');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [departments, setDepartments] = useState([]);
    const tableRef = useRef(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filters
    const [deptFilter, setDeptFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');

    useEffect(() => {
        fetchDepartments();
        setReportData([]); // Clear data before fetching new report
        setSummary(null);
        setCurrentPage(1); // Reset to first page when changing tabs
        handleFetchReport();
    }, [activeTab]);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get('/api/departments');
            if (res.data.success) setDepartments(res.data.data);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const handleFetchReport = async () => {
        setLoading(true);
        try {
            let url = '';
            let params = {};

            if (activeTab === 'employees') {
                url = '/api/reports/employees';
                params = { department: deptFilter, status: statusFilter, startDate, endDate };
            } else if (activeTab === 'payroll') {
                url = '/api/reports/payroll';
                params = { month, year, department: deptFilter };
            } else if (activeTab === 'audit-logs') {
                url = '/api/reports/audit-logs';
                params = { module: moduleFilter, startDate, endDate };
            }

            const res = await axios.get(url, { params });
            if (res.data.success) {
                setReportData(res.data.data);
                setSummary(res.data.summary || null);

                // Scroll to table after data loads
                setTimeout(() => {
                    if (tableRef.current) {
                        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            } else {
                setReportData([]);
                setSummary(null);
            }
        } catch (err) {
            console.error(`Error fetching ${activeTab} report:`, err);
            alert('Failed to fetch report data.');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData.length) return;

        let headers = [];
        let rows = [];

        if (activeTab === 'employees') {
            headers = ['ID', 'Name', 'Department', 'Position', 'Status', 'Hire Date'];
            rows = reportData.map(emp => [
                emp.employeeId,
                `${emp.firstName} ${emp.middleName || emp.lastName}`,
                emp.department?.name || 'N/A',
                emp.position,
                emp.status,
                i18n.language === 'am'
                    ? formatEthiopianDate(emp.hireDate, 'short')
                    : new Date(emp.hireDate).toLocaleDateString()
            ]);
        } else if (activeTab === 'payroll') {
            headers = ['Payroll #', 'Employee', 'Gross Salary', 'Total Deductions', 'Net Salary', 'Status'];
            rows = reportData.map(p => [
                p.payrollNumber,
                `${p.employee?.firstName} ${p.employee?.middleName || p.employee?.lastName}`,
                p.grossSalary,
                p.totalDeductions,
                p.netSalary,
                p.status
            ]);
        } else if (activeTab === 'audit-logs') {
            headers = ['Timestamp', 'User', 'Action', 'Module', 'Details'];
            rows = reportData.map(log => [
                i18n.language === 'am'
                    ? formatEthiopianDate(log.timestamp, 'full')
                    : new Date(log.timestamp).toLocaleString(),
                log.user?.email || 'System',
                log.action,
                log.module,
                JSON.stringify(log.details)
            ]);
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs = [
        { id: 'employees', label: `👥 ${t('reports.employeeReport')}`, icon: '👥' },
        { id: 'payroll', label: `💰 ${t('reports.payrollReport')}`, icon: '💰' },
        ...((user?.role === 'hr_officer' || user?.role === 'admin') ? [{ id: 'audit-logs', label: `📋 ${t('dashboard.auditLogs')}`, icon: '📋' }] : [])
    ];

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Scroll will happen automatically after data loads in handleFetchReport
    };

    // Pagination logic
    const totalPages = Math.ceil(reportData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = reportData.slice(startIndex, endIndex);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1a237e' }}>📊 {t('reports.title')}</h1>
                        <p style={{ margin: '4px 0 0', color: '#666' }}>{t('reports.subtitle')}</p>
                    </div>
                    <button className="btn-save" onClick={exportToCSV} disabled={!reportData.length} style={{ marginTop: 0 }}>
                        📥 {t('reports.exportCSV')}
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => handleTabChange(t.id)}
                            style={{
                                padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.9rem', transition: 'all .2s',
                                backgroundColor: activeTab === t.id ? '#1a237e' : '#f0f2f5',
                                color: activeTab === t.id ? '#fff' : '#444',
                                boxShadow: activeTab === t.id ? '0 2px 8px rgba(26,35,126,.3)' : 'none'
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="section" style={{ marginBottom: 24 }}>
                    <div className="form-grid">
                        {activeTab === 'employees' && (
                            <>
                                <div className="form-group">
                                    <label>{t('reports.department')}</label>
                                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                                        <option value="">{t('reports.allDepartments')}</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('reports.status')}</label>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                        <option value="">{t('reports.allStatuses')}</option>
                                        <option value="active">{t('common.active')}</option>
                                        <option value="on_leave">On Leave</option>
                                        <option value="terminated">Terminated</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {activeTab === 'payroll' && (
                            <>
                                <div className="form-group">
                                    <label>{t('reports.month')}</label>
                                    <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                                        {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('reports.year')}</label>
                                    <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
                                </div>
                                <div className="form-group">
                                    <label>{t('reports.department')}</label>
                                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                                        <option value="">{t('reports.allDepartments')}</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        {activeTab === 'audit-logs' && (
                            <>
                                <div className="form-group">
                                    <label>{t('reports.module')}</label>
                                    <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                                        <option value="">{t('reports.allModules')}</option>
                                        <option value="auth">Auth</option>
                                        <option value="employee">Employee</option>
                                        <option value="payroll">Payroll</option>
                                        <option value="vacancy">Vacancy</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {(['employees', 'audit-logs'].includes(activeTab)) && (
                            <>
                                <div className="form-group">
                                    <label>{t('reports.startDate')}</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>{t('reports.endDate')}</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </>
                        )}
                        <div className="form-group" style={{ justifyContent: 'flex-end', display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                            <button className="btn-primary" onClick={handleFetchReport} style={{ height: '40px' }}>🔍 {t('reports.generate')}</button>
                            <button className="btn-secondary" onClick={() => {
                                setDeptFilter(''); setStatusFilter(''); setMonth(new Date().getMonth() + 1);
                                setYear(new Date().getFullYear()); setStartDate(''); setEndDate(''); setModuleFilter('');
                            }} style={{ height: '40px' }}>{t('reports.reset')}</button>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {activeTab === 'employees' && (
                            <>
                                <div className="section" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a237e' }}>{summary.total}</div>
                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{t('reports.totalEmployees')}</div>
                                </div>
                                <div className="section" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2e7d32' }}>{(summary.averageSalary || 0).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>ETB</span></div>
                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{t('reports.avgBasicSalary')}</div>
                                </div>
                            </>
                        )}
                        {activeTab === 'payroll' && (
                            <>
                                <div className="section" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a237e' }}>{(summary.totalNet || 0).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>ETB</span></div>
                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{t('reports.totalNetPayout')}</div>
                                </div>
                                <div className="section" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c62828' }}>{(summary.totalDeductions || 0).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>ETB</span></div>
                                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{t('reports.totalTaxDeductions')}</div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Data Table */}
                <div className="section" style={{ padding: 0, overflow: 'hidden' }} ref={tableRef}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>⏳ {t('reports.loadingReportData')}</div>
                    ) : reportData.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>{t('reports.noDataFound')}</div>
                    ) : (
                        <div className="table-container" style={{ border: 'none' }}>
                            <table className="data-table">
                                <thead>
                                    {activeTab === 'employees' && (
                                        <tr>
                                            <th>{t('reports.employeeId')}</th><th>{t('reports.fullName')}</th><th>{t('reports.department')}</th><th>{t('reports.position')}</th><th>{t('reports.status')}</th><th>{t('reports.hireDate')}</th>
                                        </tr>
                                    )}
                                    {activeTab === 'payroll' && (
                                        <tr>
                                            <th>{t('reports.payrollNumber')}</th><th>{t('reports.employee')}</th><th>{t('reports.grossSalary')}</th><th>{t('reports.deductions')}</th><th>{t('reports.netSalary')}</th><th>{t('reports.status')}</th>
                                        </tr>
                                    )}
                                    {activeTab === 'audit-logs' && (
                                        <tr>
                                            <th>{t('reports.timestamp')}</th><th>{t('reports.user')}</th><th>{t('reports.action')}</th><th>{t('reports.module')}</th><th>{t('reports.details')}</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {activeTab === 'employees' && paginatedData.map(emp => (
                                        <tr key={emp._id}>
                                            <td style={{ fontFamily: 'monospace' }}>{emp.employeeId}</td>
                                            <td style={{ fontWeight: 600 }}>{emp.firstName} {emp.middleName || emp.lastName}</td>
                                            <td>{emp.department?.name || 'Unassigned'}</td>
                                            <td>{emp.position}</td>
                                            <td><span className={`status-badge status-${emp.status}`}>{emp.status}</span></td>
                                            <td><DateDisplay date={emp.hireDate} format="short" /></td>
                                        </tr>
                                    ))}
                                    {activeTab === 'payroll' && paginatedData.map(p => (
                                        <tr key={p._id}>
                                            <td style={{ fontFamily: 'monospace' }}>{p.payrollNumber}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{p.employee?.firstName} {p.employee?.middleName || p.employee?.lastName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{p.employee?.employeeId}</div>
                                            </td>
                                            <td>{p.grossSalary?.toLocaleString()} ETB</td>
                                            <td style={{ color: '#c62828' }}>-{p.totalDeductions?.toLocaleString()} ETB</td>
                                            <td style={{ fontWeight: 700, color: '#2e7d32' }}>{p.netSalary?.toLocaleString()} ETB</td>
                                            <td><span className={`status-badge status-${p.status}`}>{p.status}</span></td>
                                        </tr>
                                    ))}
                                    {activeTab === 'audit-logs' && paginatedData.map(log => (
                                        <tr key={log._id}>
                                            <td style={{ fontSize: '0.8rem' }}>{log.timestamp ? <DateDisplay date={log.timestamp} format="full" /> : 'N/A'}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{log.user?.firstName || 'System'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{log.user?.email}</div>
                                            </td>
                                            <td>{log.action}</td>
                                            <td><span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: '#e8eaf6', fontSize: '0.8rem', fontWeight: 600 }}>{log.module}</span></td>
                                            <td style={{ fontSize: '0.75rem', color: '#555', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination - outside the section */}
                {!loading && reportData.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={reportData.length}
                            onItemsPerPageChange={(value) => {
                                setItemsPerPage(value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Reports;
