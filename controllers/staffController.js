import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

// @desc    Create a new staff
// @route   POST /api/admin/staffs
// @access  Private/Admin
export const createStaff = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, employeeId, department, designation, phone } = req.body;

  let createdUserId = null;

  try {
    // Check if user email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Check if employee ID already exists
    const employeeIdExists = await Staff.findOne({ employeeId });
    if (employeeIdExists) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID already exists',
      });
    }

    // 1. Create User
    const user = new User({
      name,
      email,
      password,
      role: 'staff',
      isActive: true,
    });

    await user.save();
    createdUserId = user._id;

    // 2. Create Staff
    const staff = new Staff({
      userId: user._id,
      employeeId,
      department,
      designation,
      phone,
    });

    await staff.save();

    res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
      data: {
        staffId: staff._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        employeeId: staff.employeeId,
        department: staff.department,
        designation: staff.designation,
        phone: staff.phone,
      },
    });
  } catch (error) {
    // Rollback User creation if Staff creation failed
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }
    next(error);
  }
};

// @desc    Get all staffs
// @route   GET /api/admin/staffs
// @access  Private/Admin
export const getStaffs = async (req, res, next) => {
  try {
    const staffs = await Staff.find({}).populate('userId', 'name email role isActive');
    res.json({
      success: true,
      count: staffs.length,
      data: staffs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff details
// @route   PUT /api/admin/staffs/:id
// @access  Private/Admin
export const updateStaff = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, employeeId, department, designation, phone } = req.body;
  const staffId = req.params.id;

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff record not found',
      });
    }

    const user = await User.findById(staff.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Associated staff user account not found',
      });
    }

    // Check email uniqueness if email is changed
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account',
        });
      }
      user.email = email;
    }

    // Check employee ID uniqueness if changed
    if (employeeId && employeeId !== staff.employeeId) {
      const employeeIdExists = await Staff.findOne({ employeeId });
      if (employeeIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already in use by another staff member',
        });
      }
      staff.employeeId = employeeId;
    }

    // Update user fields
    if (name) user.name = name;
    if (password) user.password = password;
    await user.save();

    // Update staff fields
    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (phone) staff.phone = phone;
    await staff.save();

    res.json({
      success: true,
      message: 'Staff record updated successfully',
      data: {
        staffId: staff._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        employeeId: staff.employeeId,
        department: staff.department,
        designation: staff.designation,
        phone: staff.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete staff details
// @route   DELETE /api/admin/staffs/:id
// @access  Private/Admin
export const deleteStaff = async (req, res, next) => {
  const staffId = req.params.id;

  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff record not found',
      });
    }

    // Delete Staff record
    await Staff.findByIdAndDelete(staffId);

    // Delete associated User
    await User.findByIdAndDelete(staff.userId);

    res.json({
      success: true,
      message: 'Staff record and associated user deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
