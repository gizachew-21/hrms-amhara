import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import HRDashboard from './dashboards/HRDashboard';
import DepartmentDashboard from './dashboards/DepartmentDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import DashboardLayout from './DashboardLayout';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);

    const renderDashboard = () => {
        // Use activeRole if available, otherwise fall back to role
        const currentRole = user?.activeRole || user?.role;
        
        switch (currentRole) {
            case 'hr_officer':
                return <HRDashboard />;
            case 'admin':
                return <AdminDashboard />;
            case 'department_head':
                return <DepartmentDashboard />;
            case 'finance_officer':
                return <FinanceDashboard />;
            case 'employee':
                return <EmployeeDashboard />;
            default:
                return <div>No dashboard available for your role</div>;
        }
    };

    return (
        <DashboardLayout user={user} logout={logout}>
            {renderDashboard()}
        </DashboardLayout>
    );
};

export default Dashboard;
