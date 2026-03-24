const Vacancy = require('../models/Vacancy');
const Applicant = require('../models/Applicant');
const emailService = require('../utils/emailService');

exports.getAllApplicants = async (req, res) => {
  try {
    const { vacancy, status } = req.query;
    const filter = {};

    if (vacancy) filter.vacancy = vacancy;
    if (status) filter.status = status;

    // If Department Head, only show applicants for their department
    if (req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      if (!deptId) {
        return res.status(403).json({ error: 'Department Head not assigned to a department' });
      }

      // Find all vacancies in this department
      const vacancies = await Vacancy.find({ department: deptId }).select('_id');
      const vacancyIds = vacancies.map(v => v._id);

      filter.vacancy = { $in: vacancyIds };

      // If a specific vacancy was requested, ensure it belongs to the dept
      if (vacancy && !vacancyIds.some(id => id.toString() === vacancy)) {
        return res.status(403).json({ error: 'You are not authorized to view applicants for this vacancy' });
      }
    }

    const applicants = await Applicant.find(filter)
      .populate({
        path: 'vacancy',
        select: 'title position vacancyNumber department',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ appliedAt: -1 });

    console.log(`Fetched ${applicants.length} applicants. First one vacancy:`, applicants[0]?.vacancy);

    res.json({ success: true, count: applicants.length, data: applicants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApplicantById = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id)
      .populate({
        path: 'vacancy',
        select: 'title position department',
        populate: { path: 'department', select: 'name' }
      })
      .populate('reviewedBy', 'email role');

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    // Check departmental access for Dept Heads
    if (req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      if (!applicant.vacancy || applicant.vacancy.department.toString() !== deptId.toString()) {
        return res.status(403).json({ error: 'Not authorized to view this applicant' });
      }
    }

    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createApplication = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.body.vacancy);

    if (!vacancy || vacancy.status !== 'published') {
      return res.status(400).json({ error: 'Vacancy not available' });
    }

    if (new Date() > new Date(vacancy.applicationDeadline)) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    // Parse the nested objects if they are sent as strings (common with FormData)
    let body = { ...req.body };
    if (typeof body.address === 'string') body.address = JSON.parse(body.address);
    if (typeof body.education === 'string') body.education = JSON.parse(body.education);
    if (typeof body.workExperience === 'string') body.workExperience = JSON.parse(body.workExperience);
    if (typeof body.certifications === 'string') body.certifications = JSON.parse(body.certifications);
    if (typeof body.skills === 'string') body.skills = JSON.parse(body.skills);

    const applicationNumber = `APP-${Date.now()}`;

    // Add resume info if file was uploaded
    if (req.file) {
      body.documents = {
        ...body.documents,
        resume: {
          fileName: req.file.originalname,
          filePath: req.file.path.replace(/\\/g, '/') // Normalize path
        }
      };
    }

    const applicant = await Applicant.create({
      ...body,
      applicationNumber
    });

    await Vacancy.findByIdAndUpdate(req.body.vacancy, {
      $inc: { totalApplications: 1 }
    });

    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    const applicant = await Applicant.findOne({ applicationNumber })
      .populate('vacancy', 'title status');

    if (!applicant) {
      return res.status(404).json({ success: false, error: 'Application not found. Please check the Application Number.' });
    }

    res.json({
      success: true,
      data: {
        applicationNumber: applicant.applicationNumber,
        fullName: applicant.fullName,
        vacancy: applicant.vacancy?.title || 'Unknown Vacancy',
        status: applicant.status,
        appliedAt: applicant.appliedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.screenApplicant = async (req, res) => {
  try {
    const { status, comments } = req.body;
    const screenerId = req.user._id;
    const applicantId = req.params.id;

    console.log('=== SCREENING APPLICANT ===');
    console.log('Applicant ID:', applicantId);
    console.log('Status:', status);
    console.log('Screener ID:', screenerId);
    console.log('User Role:', req.user.role);

    const applicant = await Applicant.findById(applicantId).populate('vacancy');
    if (!applicant) {
      console.log('ERROR: Applicant not found');
      return res.status(404).json({ error: 'Applicant not found' });
    }

    console.log('Current applicant status:', applicant.status);

    // Check departmental access for Dept Heads
    if (req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      if (!applicant.vacancy || applicant.vacancy.department.toString() !== deptId.toString()) {
        console.log('ERROR: Not authorized - department mismatch');
        return res.status(403).json({ error: 'Not authorized to screen this applicant' });
      }
    }

    // Create or update screening result
    console.log('Creating/updating screening result...');
    const screeningResult = await require('../models/ScreeningResult').findOneAndUpdate(
      { applicant: applicant._id, vacancy: applicant.vacancy._id },
      {
        screener: screenerId,
        status, comments, screener: screenerId, screenedAt: Date.now()
      },
      { new: true, upsert: true }
    );
    console.log('Screening result saved:', screeningResult._id);

    // Update applicant status based on screening and user role
    let applicantStatus = applicant.status;

    if (status === 'recommended') {
      // Department Head recommends the applicant
      applicantStatus = 'recommended';
      console.log('Setting status to: recommended');
    } else if (status === 'shortlisted') {
      // HR Officer approves the recommended applicant
      applicantStatus = 'shortlisted';
      console.log('Setting status to: shortlisted');
    } else if (status === 'rejected') {
      applicantStatus = 'rejected';
      console.log('Setting status to: rejected');
    }

    applicant.status = applicantStatus;
    applicant.screeningScore = (status === 'recommended' || status === 'shortlisted') ? 100 : 0;
    applicant.reviewedBy = screenerId;
    applicant.reviewedAt = Date.now();
    await applicant.save();
    console.log('Applicant status updated to:', applicant.status);

    // Only send email and update vacancy count when HR Officer approves (shortlisted)
    if (applicantStatus === 'shortlisted') {
      console.log('Updating vacancy shortlisted count...');
      await Vacancy.findByIdAndUpdate(applicant.vacancy, {
        $inc: { shortlistedCount: 1 }
      });

      // Send email notification
      try {
        console.log(`Attempting to send shortlist email to: ${applicant.email}`);
        await emailService.sendShortlistEmail(
          applicant.email,
          `${applicant.firstName} ${applicant.middleName || ''} ${applicant.lastName}`,
          applicant.vacancy.title
        );
        console.log(`Shortlist email sent successfully to: ${applicant.email}`);
      } catch (emailError) {
        console.error('Failed to send shortlist email:', emailError);
        console.error('Email error details:', {
          email: applicant.email,
          name: `${applicant.firstName} ${applicant.lastName}`,
          vacancy: applicant.vacancy.title,
          error: emailError.message
        });
        // We don't want to fail the whole screening process if email fails
      }
    }

    console.log('=== SCREENING COMPLETE ===');
    res.json({ success: true, data: { applicant, screeningResult } });
  } catch (error) {
    console.error('=== SCREENING ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
};

exports.hireApplicant = async (req, res) => {
  try {
    // Populate vacancy so we can access vacancy.department and vacancy.position
    const applicant = await Applicant.findById(req.params.id).populate('vacancy');
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    if (applicant.status !== 'shortlisted') {
      return res.status(400).json({ error: 'Applicant must be shortlisted by HR before hiring' });
    }

    // Validate that vacancy and department are available
    if (!applicant.vacancy || !applicant.vacancy.department) {
      return res.status(400).json({ error: 'Applicant vacancy or department not found. Cannot create employee record.' });
    }

    // Create Employee record FIRST - only update applicant status after success
    const Employee = require('../models/Employee');
    const employeeCount = await Employee.countDocuments();
    const employeeId = `EMP-${(employeeCount + 1).toString().padStart(4, '0')}`;

    // Check if an employee with this email already exists
    const existingEmployee = await Employee.findOne({ email: applicant.email });
    const employeeEmail = existingEmployee
      ? `${applicant.email.split('@')[0]}_${Date.now()}@aitb.gov.et`
      : applicant.email;

    // Map fields from the applicant record to create an Employee
    const newEmployee = await Employee.create({
      employeeId,
      user: req.user._id, // The logged-in HR Officer who triggered the hire
      firstName: applicant.firstName || 'Unknown',
      middleName: applicant.middleName,
      lastName: applicant.lastName || 'Unknown',
      dateOfBirth: applicant.dateOfBirth || new Date('1990-01-01'),
      gender: applicant.gender || 'male',
      email: employeeEmail,
      phoneNumber: applicant.phoneNumber || '0000000000',
      address: applicant.address || {},
      education: applicant.education || [],
      skills: applicant.skills || [],
      certifications: applicant.certifications || [],
      department: applicant.vacancy.department, // Populated from vacancy
      position: applicant.vacancy.position || 'Employee',
      employmentType: 'permanent',
      dateJoined: new Date(),
      basicSalary: 5000,
      status: 'active'
    });

    // ONLY NOW mark applicant as hired (after employee creation succeeded)
    applicant.status = 'hired';
    await applicant.save();

    // Update vacancy hire count
    await Vacancy.findByIdAndUpdate(applicant.vacancy._id, {
      $inc: { hiredCount: 1 }
    });

    res.json({ success: true, data: { applicant, employee: newEmployee } });
  } catch (error) {
    console.error('=== HIRE APPLICANT ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndDelete(req.params.id);

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    res.json({ success: true, message: 'Applicant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

