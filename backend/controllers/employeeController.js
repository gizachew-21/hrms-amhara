const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const Department = require('../models/Department');

exports.getAllEmployees = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'department_head') {
      if (req.user.employee?.department) {
        filter.department = req.user.employee.department;
      } else {
        // If head has no department, they see nothing
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    const employees = await Employee.find(filter).populate('department', 'name');
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department', 'name');
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Scoped access check for Department Head
    if (req.user.role === 'department_head') {
      if (employee.department?._id.toString() !== req.user.employee?.department?.toString()) {
        return res.status(403).json({ success: false, error: 'Unauthorized to view employees from other departments' });
      }
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEmployeeMe = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).populate('department', 'name');
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee profile not found' });
    }
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const User = require('../models/User');

exports.createEmployee = async (req, res) => {
  try {
    console.log('--- CREATE EMPLOYEE DATA RECEIVED ---');
    console.log(req.body);
    const { email, password, hireDate, firstName, lastName } = req.body;
    console.log(`Processing employee for: ${email}, hireDate: ${hireDate}`);


    // 1. Generate Employee ID
    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;

    // 2. Create User Account
    // Default password for new employees if not provided
    const defaultPassword = password || 'Welcome123';

    const existingUser = await User.findOne({ email });
    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      user = await User.create({
        email,
        password: defaultPassword,
        role: 'employee'
      });
    }

    // 3. Map hireDate to dateJoined and Add Generated Fields
    const employeeData = {
      ...req.body,
      employeeId,
      user: user._id,
      dateJoined: hireDate || new Date()
    };

    const newEmployee = new Employee(employeeData);
    await newEmployee.save();

    // Update Department employeeCount
    if (newEmployee.department) {
      await Department.findByIdAndUpdate(newEmployee.department, { $inc: { employeeCount: 1 } });
    }

    // 4. Update User with Employee Reference
    user.employee = newEmployee._id;
    await user.save();

    // 5. Log Action
    await AuditLog.create({
      user: req.user._id,
      action: 'Create Employee',
      module: 'employee',
      targetId: newEmployee._id,
      targetModel: 'Employee',
      details: { employeeId: newEmployee.employeeId, name: `${newEmployee.firstName} ${newEmployee.lastName}` }
    });

    res.status(201).json({ success: true, data: newEmployee });
  } catch (err) {
    console.error('Error in createEmployee:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    console.log('--- UPDATE EMPLOYEE DATA RECEIVED ---');
    console.log(`ID: ${req.params.id}`);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    const oldEmployee = await Employee.findById(req.params.id);
    if (!oldEmployee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Scoped access check for Department Head
    if (req.user.role === 'department_head') {
      if (oldEmployee.department?.toString() !== req.user.employee?.department?.toString()) {
        return res.status(403).json({ success: false, error: 'Unauthorized to manage employees from other departments' });
      }
    }

    // Update Department employeeCount if department changed
    if (req.body.department && oldEmployee.department?.toString() !== req.body.department.toString()) {
      // Decrement old
      if (oldEmployee.department) {
        await Department.findByIdAndUpdate(oldEmployee.department, { $inc: { employeeCount: -1 } });
      }
      // Increment new
      await Department.findByIdAndUpdate(req.body.department, { $inc: { employeeCount: 1 } });
    }

    // Log Action
    await AuditLog.create({
      user: req.user._id,
      action: 'Update Employee',
      module: 'employee',
      targetId: updated._id,
      targetModel: 'Employee',
      details: { employeeId: updated.employeeId, name: `${updated.firstName} ${updated.lastName}` }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Scoped access check for Department Head
    if (req.user.role === 'department_head') {
      if (employee.department?.toString() !== req.user.employee?.department?.toString()) {
        return res.status(403).json({ success: false, error: 'Unauthorized to delete employees from other departments' });
      }
    }

    const deleted = await Employee.findByIdAndDelete(req.params.id);

    // Update Department employeeCount
    if (deleted.department) {
      await Department.findByIdAndUpdate(deleted.department, { $inc: { employeeCount: -1 } });
    }

    // Log Action
    await AuditLog.create({
      user: req.user._id,
      action: 'Delete Employee',
      module: 'employee',
      targetId: deleted._id,
      targetModel: 'Employee',
      details: { employeeId: deleted.employeeId, name: `${deleted.firstName} ${deleted.lastName}` }
    });

    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
