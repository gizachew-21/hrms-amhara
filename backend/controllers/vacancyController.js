const Vacancy = require('../models/Vacancy');

exports.getAllVacancies = async (req, res) => {
  console.log(`Fetching vacancies with status: ${req.query.status}`);
  try {
    const { status, vacancyType } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (vacancyType) filter.vacancyType = vacancyType;

    // If authenticated and Department Head, only show vacancies for their department
    if (req.user && req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      if (!deptId) {
        return res.status(403).json({ error: 'Department Head not assigned to a department' });
      }
      filter.department = deptId;
    }

    let vacancies = await Vacancy.find(filter)
      .populate('department')
      .populate('postedBy', 'email role')
      .sort({ createdAt: -1 });

    // For public access (no auth) or when fetching published vacancies,
    // filter out expired vacancies
    if (!req.user || status === 'published') {
      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      vacancies = vacancies.filter(v => {
        const deadlineStr = new Date(v.applicationDeadline).toISOString().split('T')[0];
        return deadlineStr >= todayStr;
      });
    }

    console.log(`Found ${vacancies.length} vacancies matching filter`);
    res.json({ success: true, count: vacancies.length, data: vacancies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVacancyById = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id)
      .populate('department')
      .populate('postedBy', 'email role');

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    // Check departmental access for Dept Heads (if authenticated)
    if (req.user && req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      if (deptId && vacancy.department?._id.toString() !== deptId.toString()) {
        return res.status(403).json({ error: 'Not authorized to view this vacancy' });
      }
    }

    res.json({ success: true, data: vacancy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createVacancy = async (req, res) => {
  try {
    const vacancyNumber = `VAC-${Date.now()}`;
    const status = req.user.role === 'department_head' ? 'pending_approval' : 'draft';

    // Enforce department matching for Dept Heads
    if (req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      
      console.log('Department Head creating vacancy:', {
        userId: req.user._id,
        userRole: req.user.role,
        employeeData: req.user.employee,
        deptId: deptId,
        requestedDept: req.body.department
      });

      if (!deptId) {
        return res.status(403).json({ 
          error: 'Department Head not assigned to a department. Please contact admin.' 
        });
      }
      
      if (req.body.department !== deptId.toString()) {
        return res.status(403).json({ 
          error: `You can only create vacancies for your own department (${deptId})` 
        });
      }
    }

    const vacancy = await Vacancy.create({
      ...req.body,
      vacancyNumber,
      status,
      postedBy: req.user._id
    });

    res.status(201).json({ success: true, data: vacancy });
  } catch (error) {
    console.error('Create vacancy error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.approveVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { status: 'draft', updatedAt: Date.now() },
      { new: true }
    );

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    res.json({ success: true, data: vacancy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    res.json({ success: true, data: vacancy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndDelete(req.params.id);

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    res.json({ success: true, message: 'Vacancy deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.publishVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { status: 'published', updatedAt: Date.now() },
      { new: true }
    );

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }

    res.json({ success: true, data: vacancy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
