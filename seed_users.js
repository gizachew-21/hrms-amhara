const mongoose = require('mongoose');
const User = require('./backend/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const users = [
    {
        email: 'hr@aitb.gov.et',
        password: 'password123',
        role: 'hr_officer'
    },
    {
        email: 'depthead@aitb.gov.et',
        password: 'password123',
        role: 'department_head'
    },
    {
        email: 'finance@aitb.gov.et',
        password: 'password123',
        role: 'finance_officer'
    },
    {
        email: 'employee@aitb.gov.et',
        password: 'password123',
        role: 'employee'
    }
];

const seedDB = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('Database already has users. Skipping seed.');
            return;
        }
        await User.insertMany(users);
        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();
