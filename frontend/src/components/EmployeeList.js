import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    axios.get('/api/employees')
      .then(res => setEmployees(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <DashboardLayout user={user} logout={logout}>
      <div>
        <h2>Employees</h2>
        <ul>
          {employees.map(emp => (
            <li key={emp._id}>{emp.fullName} - {emp.position}</li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}

export default EmployeeList;
