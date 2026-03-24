require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');
const Vacancy = require('./models/Vacancy');
const Applicant = require('./models/Applicant');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms_amhara');
    console.log('MongoDB connected');

    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      process.exit(0);
    }

    console.log('Database is empty. Starting seed...');

    // Create Departments
    const departments = await Department.create([
      { name: 'Information Technology', code: 'IT', description: 'IT Department' },
      { name: 'Human Resources', code: 'HR', description: 'HR Department' },
      { name: 'Finance', code: 'FIN', description: 'Finance Department' },
      { name: 'Innovation', code: 'INN', description: 'Innovation Department' }
    ]);
    console.log('Created departments');

    // Create Users
    const hrUser = await User.create({
      email: 'hr@aitb.gov.et',
      password: 'password123',
      role: 'hr_officer',
      status: 'active'
    });

    const financeUser = await User.create({
      email: 'finance@aitb.gov.et',
      password: 'password123',
      role: 'finance_officer',
      status: 'active'
    });

    const deptUser = await User.create({
      email: 'dept@aitb.gov.et',
      password: 'password123',
      role: 'department_head',
      status: 'active'
    });

    const empUser = await User.create({
      email: 'employee@aitb.gov.et',
      password: 'password123',
      role: 'employee',
      status: 'active'
    });
    console.log('Created users');

    // Create Employees
    const employees = await Employee.create([
      {
        employeeId: 'EMP001',
        user: hrUser._id,
        firstName: 'Abebe',
        lastName: 'Kebede',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'male',
        email: 'hr@aitb.gov.et',
        phoneNumber: '+251911234567',
        address: { region: 'Amhara', city: 'Bahir Dar', subcity: 'Belay Zeleke' },
        department: departments[1]._id,
        position: 'HR Manager',
        employmentType: 'permanent',
        dateJoined: new Date('2020-01-15'),
        status: 'active',
        basicSalary: 15000,
        allowances: { transport: 2000, housing: 3000, other: 500 }
      },
      {
        employeeId: 'EMP002',
        user: financeUser._id,
        firstName: 'Tigist',
        lastName: 'Alemu',
        dateOfBirth: new Date('1990-08-20'),
        gender: 'female',
        email: 'finance@aitb.gov.et',
        phoneNumber: '+251922345678',
        address: { region: 'Amhara', city: 'Bahir Dar', subcity: 'Shimbet' },
        department: departments[2]._id,
        position: 'Finance Officer',
        employmentType: 'permanent',
        dateJoined: new Date('2019-03-10'),
        status: 'active',
        basicSalary: 12000,
        allowances: { transport: 1500, housing: 2500, other: 300 }
      },
      {
        employeeId: 'EMP003',
        user: deptUser._id,
        firstName: 'Mulugeta',
        lastName: 'Haile',
        dateOfBirth: new Date('1982-12-05'),
        gender: 'male',
        email: 'dept@aitb.gov.et',
        phoneNumber: '+251933456789',
        address: { region: 'Amhara', city: 'Bahir Dar', subcity: 'Tana' },
        department: departments[0]._id,
        position: 'IT Department Head',
        employmentType: 'permanent',
        dateJoined: new Date('2018-06-01'),
        status: 'active',
        basicSalary: 18000,
        allowances: { transport: 2500, housing: 3500, other: 700 }
      },
      {
        employeeId: 'EMP004',
        user: empUser._id,
        firstName: 'Hanna',
        lastName: 'Tesfaye',
        dateOfBirth: new Date('1995-03-25'),
        gender: 'female',
        email: 'employee@aitb.gov.et',
        phoneNumber: '+251944567890',
        address: { region: 'Amhara', city: 'Bahir Dar', subcity: 'Hidar 11' },
        department: departments[0]._id,
        position: 'Software Developer',
        employmentType: 'permanent',
        dateJoined: new Date('2021-09-15'),
        status: 'active',
        basicSalary: 10000,
        allowances: { transport: 1000, housing: 2000, other: 200 }
      }
    ]);
    console.log('Created employees');

    // Update users with employee references
    await User.findByIdAndUpdate(hrUser._id, { employee: employees[0]._id });
    await User.findByIdAndUpdate(financeUser._id, { employee: employees[1]._id });
    await User.findByIdAndUpdate(deptUser._id, { employee: employees[2]._id });
    await User.findByIdAndUpdate(empUser._id, { employee: employees[3]._id });

    console.log('✅ Database seeded successfully!');
    console.log('\nLogin Credentials:');
    console.log('HR Officer: hr@aitb.gov.et / password123');
    console.log('Finance Officer: finance@aitb.gov.et / password123');
    console.log('Department Head: dept@aitb.gov.et / password123');
    console.log('Employee: employee@aitb.gov.et / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
