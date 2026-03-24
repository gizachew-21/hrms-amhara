const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');

exports.getAllLeaveRequests = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'department_head') {
      const deptId = req.user.employee?.department;
      if (deptId) {
        const deptEmployees = await Employee.find({ department: deptId }).select('_id');
        const deptEmployeeIds = deptEmployees.map(emp => emp._id);

        if (req.query.my_requests === 'true') {
          filter.employee = req.user.employee?._id;
        } else {
          filter.employee = { $in: deptEmployeeIds };
        }
      } else {
        return res.json([]);
      }
    } else if (req.user.role !== 'hr_officer') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) filter.employee = employee._id;
      else return res.json([]);
    } else if (req.query.my_requests === 'true') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) filter.employee = employee._id;
    }

    const leaves = await LeaveRequest.find(filter).populate('employee');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeaveRequestById = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('employee');
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLeaveRequest = async (req, res) => {
  try {
    const leaveData = { ...req.body };
    console.log('--- DEBUG: Processing Leave Request ---');
    console.log('User ID from request:', req.user._id);
    console.log('Initial leaveData:', leaveData);

    // 1. Try to get employee from req.user (if already populated/available)
    let employeeId = req.user.employee;

    // 2. If not found, try to find in Employee collection
    if (!employeeId) {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        employeeId = employee._id;
      }
    }

    if (employeeId) {
      leaveData.employee = employeeId;
      console.log('Employee identified as:', employeeId);
    } else if (!leaveData.employee) {
      console.log('CRITICAL: No employee profile found for user!');
      return res.status(404).json({ error: 'Employee profile not found. Please ensure your profile is set up.' });
    }

    const newLeave = new LeaveRequest(leaveData);
    console.log('Saving leave request with data:', newLeave);
    await newLeave.save();
    console.log('Leave request saved successfully');
    res.status(201).json(newLeave);
  } catch (err) {
    console.error('ERROR in createLeaveRequest:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateLeaveRequest = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id).populate('employee');
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    // Scoped access check for Department Head
    if (req.user.role === 'department_head') {
      if (leave.employee?.department?.toString() !== req.user.employee?.department?.toString()) {
        return res.status(403).json({ error: 'Unauthorized to manage leave requests from other departments' });
      }
    }

    const updated = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteLeaveRequest = async (req, res) => {
  try {
    const deleted = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Leave request not found' });
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
