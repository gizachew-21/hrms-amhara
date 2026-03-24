const Department = require('../models/Department');
const User = require('../models/User');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');

exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find().populate('head', 'firstName lastName');
        res.json({ success: true, count: departments.length, data: departments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id).populate('head');
        if (!department) return res.status(404).json({ success: false, error: 'Department not found' });
        res.json({ success: true, data: department });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const newDepartment = new Department(req.body);
        await newDepartment.save();

        // Sync Role for the new head
        if (newDepartment.head) {
            const headEmployee = await Employee.findById(newDepartment.head);
            if (headEmployee) {
                console.log('Promoting Head of NEW Department:', headEmployee.user);
                await User.findByIdAndUpdate(headEmployee.user, { role: 'department_head' });
            }
        }

        res.status(201).json({ success: true, data: newDepartment });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { head: newHeadId } = req.body;
        const oldDept = await Department.findById(req.params.id);
        if (!oldDept) return res.status(404).json({ success: false, error: 'Department not found' });

        const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Handle Role Synchronization
        // 1. Promote current head
        if (updated.head) {
            const headEmployee = await Employee.findById(updated.head);
            if (headEmployee) {
                await User.findByIdAndUpdate(headEmployee.user, { role: 'department_head' });
            }
        }

        // 2. Demote old head if they changed and are no longer a head anywhere
        const headChanged = (oldDept.head?.toString() || '') !== (newHeadId || '');
        if (headChanged && oldDept.head) {
            const isStillHead = await Department.findOne({ head: oldDept.head });
            if (!isStillHead) {
                const oldHeadEmployee = await Employee.findById(oldDept.head);
                if (oldHeadEmployee) {
                    await User.findByIdAndUpdate(oldHeadEmployee.user, { role: 'employee' });
                }
            }
        }

        // Log Action
        await AuditLog.create({
            user: req.user._id,
            action: 'Update Department',
            module: 'department',
            targetId: updated._id,
            targetModel: 'Department',
            details: { name: updated.name, head: updated.head }
        });

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('Error in updateDepartment:', err);
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const deleted = await Department.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Department not found' });
        res.json({ message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
