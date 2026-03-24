import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import DepartmentManagement from './components/DepartmentManagement';
import LeaveList from './components/LeaveList';
import PerformanceList from './components/PerformanceList';
import PayrollManagement from './components/PayrollManagement';
import Reports from './components/Reports';
import VacancyManagement from './components/VacancyManagement';
import ApplicantManagement from './components/ApplicantManagement';
import PromotionManagement from './components/PromotionManagement';
import PublicJobs from './components/PublicJobs';
import ApplicationForm from './components/ApplicationForm';
import ApplicationStatus from './components/ApplicationStatus';
import IncidentManagement from './components/IncidentManagement';
import ServiceRequestManagement from './components/ServiceRequestManagement';
import './App.css';

import Landing from './components/Landing';
import Profile from './components/Profile';
import UserManagement from './components/UserManagement';

import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import MySalary from './components/MySalary';

// Component to handle language attribute on HTML element
function LanguageHandler() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set lang attribute on HTML element when language changes
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LanguageHandler />
        <div className="App">
          <Routes>
            <Route path="/jobs" element={<PublicJobs />} />
            <Route path="/apply/:vacancyId" element={<ApplicationForm />} />
            <Route path="/status" element={<ApplicationStatus />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/employees" element={
              <PrivateRoute roles={['hr_officer', 'department_head', 'admin']}>
                <EmployeeManagement />
              </PrivateRoute>
            } />
            <Route path="/departments" element={
              <PrivateRoute roles={['hr_officer', 'admin']}>
                <DepartmentManagement />
              </PrivateRoute>
            } />
            <Route path="/users" element={
              <PrivateRoute roles={['admin']}>
                <UserManagement />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/leave" element={
              <PrivateRoute>
                <LeaveList />
              </PrivateRoute>
            } />
            <Route path="/performance" element={
              <PrivateRoute>
                <PerformanceList />
              </PrivateRoute>
            } />
            <Route path="/payroll" element={
              <PrivateRoute roles={['hr_officer', 'finance_officer', 'admin']}>
                <PayrollManagement />
              </PrivateRoute>
            } />
            <Route path="/payroll/my-salary" element={
              <PrivateRoute roles={['employee']}>
                <MySalary />
              </PrivateRoute>
            } />
            <Route path="/vacancies" element={
              <PrivateRoute roles={['hr_officer', 'department_head', 'admin']}>
                <VacancyManagement />
              </PrivateRoute>
            } />
            <Route path="/applicants" element={
              <PrivateRoute roles={['hr_officer', 'department_head', 'admin']}>
                <ApplicantManagement />
              </PrivateRoute>
            } />
            <Route path="/promotions" element={
              <PrivateRoute roles={['hr_officer', 'department_head', 'employee', 'admin']}>
                <PromotionManagement />
              </PrivateRoute>
            } />
            <Route path="/incidents" element={
              <PrivateRoute roles={['hr_officer', 'employee', 'admin', 'department_head', 'finance_officer']}>
                <IncidentManagement />
              </PrivateRoute>
            } />
            <Route path="/service-requests" element={
              <PrivateRoute roles={['hr_officer', 'employee', 'admin', 'department_head', 'finance_officer']}>
                <ServiceRequestManagement />
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute roles={['hr_officer', 'department_head', 'finance_officer', 'admin']}>
                <Reports />
              </PrivateRoute>
            } />
            <Route path="/" element={
              <RequireAuthOrLanding>
                <Dashboard />
              </RequireAuthOrLanding>
            } />
            <Route path="/unauthorized" element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>Unauthorized Access</h1>
                <p>You don't have permission to access this page.</p>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Special component to handle root route logic
function RequireAuthOrLanding({ children }) {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Landing />;
  }

  return children;
}

export default App;
