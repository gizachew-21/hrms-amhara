const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms_amhara');
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@hrms.com';
        const adminPassword = 'admin123'; // Standard admin password for dev

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists. Updating role...');
            admin.role = 'admin';
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            admin = await User.create({
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                status: 'active'
            });
        }

        console.log('Admin account ready:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();
