const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Vacancy = require('../models/Vacancy');
const Applicant = require('../models/Applicant');
const Promotion = require('../models/Promotion');
const LeaveRequest = require('../models/LeaveRequest');
const Incident = require('../models/Incident');
const ServiceRequest = require('../models/ServiceRequest');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const totalVacancies = await Vacancy.countDocuments({ status: 'published' });
    const totalApplications = await Applicant.countDocuments();
    const pendingPromotionsData = await Promotion.countDocuments({ status: 'pending' });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyPayroll = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, total: { $sum: '$netSalary' } } }
    ]);

    const slaCompliance = await calculateSLA();

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalVacancies,
        totalApplications,
        pendingPromotions: pendingPromotionsData,
        monthlyPayrollTotal: monthlyPayroll[0]?.total || 0,
        slaCompliance: `${slaCompliance}%`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateSLA = async () => {
  try {
    const targets = {
      leave: 24 * 60 * 60 * 1000,
      promotion: 48 * 60 * 60 * 1000,
      incident: 8 * 60 * 60 * 1000,
      serviceRequest: 24 * 60 * 60 * 1000
    };

    let totalResolved = 0;
    let withinSLA = 0;

    // 1. Leaves
    const leaves = await LeaveRequest.find({ status: { $in: ['approved', 'rejected'] } });
    leaves.forEach(l => {
      totalResolved++;
      const duration = new Date(l.updatedAt || l.appliedAt) - new Date(l.appliedAt);
      if (duration <= targets.leave) withinSLA++;
    });

    // 2. Promotions
    const promotions = await Promotion.find({ status: { $in: ['approved', 'rejected', 'implemented'] } });
    promotions.forEach(p => {
      totalResolved++;
      const resolvedAt = p.hrApproval?.approvedAt || p.implementedAt || p.requestDate;
      const duration = new Date(resolvedAt) - new Date(p.requestDate);
      if (duration <= targets.promotion) withinSLA++;
    });

    // 3. Incidents
    const incidents = await Incident.find({ status: { $in: ['resolved', 'closed'] } });
    incidents.forEach(i => {
      totalResolved++;
      const resolvedAt = i.resolvedAt || i.updatedAt;
      const duration = new Date(resolvedAt) - new Date(i.createdAt);
      if (duration <= targets.incident) withinSLA++;
    });

    // 4. Service Requests
    const serviceRequests = await ServiceRequest.find({ status: { $in: ['fulfilled', 'closed', 'rejected'] } });
    serviceRequests.forEach(sr => {
      totalResolved++;
      const resolvedAt = sr.fulfillmentDate || sr.updatedAt;
      const duration = new Date(resolvedAt) - new Date(sr.createdAt);
      if (duration <= targets.serviceRequest) withinSLA++;
    });

    if (totalResolved === 0) return 100;
    const compliance = Math.round((withinSLA / totalResolved) * 100);
    return isNaN(compliance) ? 100 : compliance;
  } catch (error) {
    console.error('Error calculating SLA:', error);
    return 100;
  }
};


exports.getEmployeeDashboardStats = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const [leaveCount, promoCount, payrollCount] = await Promise.all([
      LeaveRequest.countDocuments({ employee: employee._id }),
      Promotion.countDocuments({ employee: employee._id }),
      Payroll.countDocuments({ employee: employee._id })
    ]);

    const recentPayroll = await Payroll.findOne({ employee: employee._id })
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data: {
        totalLeaves: leaveCount,
        totalPromotions: promoCount,
        totalPayrolls: payrollCount,
        lastNetSalary: recentPayroll?.netSalary || 0,
        performanceRating: employee.performanceRating || 0,
        status: employee.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeReport = async (req, res) => {
  try {
    const { department, status, startDate, endDate } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.dateJoined = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const employees = await Employee.find(filter)
      .populate('department', 'name')
      .populate('user', 'email role')
      .select('-documents');

    const summary = {
      total: employees.length,
      byDepartment: {},
      byStatus: {},
      averageSalary: 0
    };

    let totalSalary = 0;
    employees.forEach(emp => {
      const deptName = emp.department?.name || 'Unassigned';
      summary.byDepartment[deptName] = (summary.byDepartment[deptName] || 0) + 1;
      summary.byStatus[emp.status] = (summary.byStatus[emp.status] || 0) + 1;
      totalSalary += emp.totalSalary;
    });

    summary.averageSalary = employees.length > 0 ? totalSalary / employees.length : 0;

    res.json({ success: true, data: employees, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPayrollReport = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    const filter = {};

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    let payrolls = await Payroll.find(filter)
      .populate({
        path: 'employee',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ year: -1, month: -1 });

    if (department) {
      payrolls = payrolls.filter(p => p.employee?.department?._id.toString() === department);
    }

    const summary = {
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      count: payrolls.length
    };

    payrolls.forEach(p => {
      summary.totalGross += p.grossSalary;
      summary.totalDeductions += p.totalDeductions;
      summary.totalNet += p.netSalary;
    });

    res.json({ success: true, data: payrolls, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVacancyReport = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.announcementDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const vacancies = await Vacancy.find(filter)
      .populate('department', 'name')
      .populate('postedBy', 'email');

    const summary = {
      total: vacancies.length,
      totalPositions: 0,
      totalApplications: 0,
      totalHired: 0,
      byStatus: {}
    };

    vacancies.forEach(v => {
      summary.totalPositions += v.numberOfPositions;
      summary.totalApplications += v.totalApplications;
      summary.totalHired += v.hiredCount;
      summary.byStatus[v.status] = (summary.byStatus[v.status] || 0) + 1;
    });

    res.json({ success: true, data: vacancies, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const { module, user, startDate, endDate } = req.query;
    const filter = {};

    if (module) filter.module = module;
    if (user) filter.user = user;
    if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(200);

    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
