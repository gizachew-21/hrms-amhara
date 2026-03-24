const mongoose = require('mongoose');
const Vacancy = require('./models/Vacancy');
const Department = require('./models/Department');

async function seed() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrms_amhara', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to DB');

        // Create a dummy department if doesn't exist
        let dept = await Department.findOne();
        if (!dept) {
            dept = await Department.create({
                name: 'IT Department',
                code: 'IT',
                description: 'Information Technology'
            });
        }

        const hrUser = await mongoose.connection.db.collection('users').findOne({ role: 'hr_officer' });

        const testVacancy = new Vacancy({
            title: 'Senior Software Engineer',
            description: 'We are looking for a Senior Software Engineer to join our dynamic team.',
            department: dept._id,
            position: 'Senior Software Engineer',
            vacancyType: 'internal',
            vacancyNumber: 'VAC-2024-001',
            announcementDate: new Date(),
            postedBy: hrUser ? hrUser._id : new mongoose.Types.ObjectId(),
            requirements: {
                education: 'BSc in Computer Science or related field',
                experience: '5+ years of experience in Software Development'
            },
            numberOfPositions: 2,
            salaryRange: {
                min: 15000,
                max: 25000
            },
            applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            status: 'published'
        });

        await testVacancy.save();
        console.log('Created test vacancy:', testVacancy.title);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seed();
