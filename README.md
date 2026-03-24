# Amhara Innovation and Technology Bureau - HRMS

Complete Web-Based Human Resource Management System built with MERN Stack.

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- 5 user roles: HR Officer, Department Head, Finance Officer, Employee, Applicant

### Core Modules
1. **Employee Management** - Complete employee lifecycle management
2. **Vacancy Announcements** - Post and manage job vacancies
3. **Applicant Portal** - External application submission and tracking
4. **Evaluation System** - Applicant screening and evaluation
5. **Placement** - Employee placement tracking
6. **Promotions** - Promotion request and approval workflow
7. **Payroll** - Automated payroll generation with Ethiopian tax calculation
8. **Leave Management** - Leave request and approval
9. **Performance Reviews** - Employee performance tracking
10. **Reports & Analytics** - Comprehensive reporting system

## Installation

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Default Login Credentials
After running seed script:
- HR Officer: hr@aitb.gov.et / password123
- Finance: finance@aitb.gov.et / password123
- Department Head: dept@aitb.gov.et / password123
- Employee: employee@aitb.gov.et / password123

## Technology Stack
- MongoDB - Database
- Express.js - Backend framework
- React.js - Frontend framework
- Node.js - Runtime environment
- JWT - Authentication
- bcryptjs - Password hashing

## API Documentation
Base URL: http://localhost:5000/api

### Auth Routes
- POST /auth/register - Register new user
- POST /auth/login - Login
- GET /auth/me - Get current user

### Protected Routes (Require Authentication)
- /employees - Employee management
- /vacancies - Vacancy management
- /applicants - Applicant management
- /promotions - Promotion management
- /payrolls - Payroll management
- /reports - Reports and analytics

## License
Proprietary - Amhara Innovation and Technology Bureau
