const Promotion = require('../models/Promotion');
const Employee = require('../models/Employee');

exports.getAllPromotions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const currentEmployee = await Employee.findOne({ user: req.user._id });
    if (req.user.role === 'department_head') {
      if (currentEmployee?.department) {
        filter.currentDepartment = currentEmployee.department;

        if (req.query.my_requests === 'true') {
          filter.employee = currentEmployee._id;
        }
      } else {
        return res.json({ success: true, count: 0, data: [] });
      }
    } else if (req.user.role !== 'hr_officer') {
      if (currentEmployee) filter.employee = currentEmployee._id;
      else return res.json({ success: true, count: 0, data: [] });
    } else if (req.query.my_requests === 'true' && currentEmployee) {
      filter.employee = currentEmployee._id;
    }

    const promotions = await Promotion.find(filter)
      .populate('employee', 'firstName middleName lastName employeeId position')
      .populate('currentDepartment', 'name')
      .populate('proposedDepartment', 'name')
      .populate('proposedDepartment', 'name')
      .populate({
        path: 'requestedBy',
        select: 'email role employee',
        populate: {
          path: 'employee',
          select: 'firstName middleName lastName'
        }
      })
      .sort({ requestDate: -1 });

    res.json({ success: true, count: promotions.length, data: promotions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('employee')
      .populate('currentDepartment')
      .populate('proposedDepartment')
      .populate('requestedBy', 'email role')
      .populate('departmentHeadRecommendation.recommendedBy', 'email')
      .populate('hrApproval.approvedBy', 'email');

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ success: true, data: promotion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create({
      ...req.body,
      requestedBy: req.user._id
    });

    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.recommendPromotion = async (req, res) => {
  try {
    const { status, comments } = req.body;

    // Scoped access check for Department Head
    if (req.user.role === 'department_head') {
      const promotionCheck = await Promotion.findById(req.params.id);
      if (!promotionCheck) return res.status(404).json({ error: 'Promotion not found' });

      if (promotionCheck.currentDepartment?.toString() !== req.user.employee?.department?.toString()) {
        return res.status(403).json({ error: 'Unauthorized to recommend promotions for employees from other departments' });
      }
    }

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        'departmentHeadRecommendation.status': status,
        'departmentHeadRecommendation.comments': comments,
        'departmentHeadRecommendation.recommendedBy': req.user._id,
        'departmentHeadRecommendation.recommendedAt': Date.now(),
        'departmentHeadRecommendation.recommendedAt': Date.now(),
        status: status === 'recommended' ? 'recommended' : 'rejected'
      },
      { new: true }
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ success: true, data: promotion });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.approvePromotion = async (req, res) => {
  try {
    const { status, comments, effectiveDate } = req.body;

    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        'hrApproval.status': status,
        'hrApproval.comments': comments,
        'hrApproval.approvedBy': req.user._id,
        'hrApproval.approvedAt': Date.now(),
        status: status === 'approved' ? 'approved' : 'rejected',
        effectiveDate: status === 'approved' ? effectiveDate : null
      },
      { new: true }
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    if (status === 'approved') {
      await Employee.findByIdAndUpdate(promotion.employee, {
        position: promotion.proposedPosition,
        department: promotion.proposedDepartment,
        basicSalary: promotion.proposedSalary,
        lastPromotionDate: effectiveDate
      });

      promotion.status = 'implemented';
      promotion.implementedAt = Date.now();
      await promotion.save();
    }

    res.json({ success: true, data: promotion });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
