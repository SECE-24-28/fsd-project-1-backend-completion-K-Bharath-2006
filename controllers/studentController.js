import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Student from '../models/Student.js';

// @desc    Create a new student
// @route   POST /api/admin/students
// @access  Private/Admin
export const createStudent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, rollNumber, department, year, phone, attendance, marks, remarks } = req.body;

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

    // Check if roll number already exists
    const rollExists = await Student.findOne({ rollNumber });
    if (rollExists) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists',
      });
    }

    // 1. Create User
    const user = new User({
      name,
      email,
      password,
      role: 'student',
      isActive: true,
    });

    await user.save();
    createdUserId = user._id;

    // 2. Create Student
    const student = new Student({
      userId: user._id,
      rollNumber,
      department,
      year,
      phone,
      attendance: attendance !== undefined ? Number(attendance) : 0,
      marks: marks !== undefined ? Number(marks) : 0,
      remarks: remarks || '',
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        studentId: student._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        phone: student.phone,
      },
    });
  } catch (error) {
    // Manual rollback if User was created but Student failed
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
    }
    next(error);
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
export const getStudents = async (req, res, next) => {
  try {
    const students = await Student.find({}).populate('userId', 'name email role isActive');
    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
export const updateStudent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, rollNumber, department, year, phone, attendance, marks, remarks } = req.body;
  const studentId = req.params.id;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    const user = await User.findById(student.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Associated student user account not found',
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

    // Check rollNumber uniqueness if changed
    if (rollNumber && rollNumber !== student.rollNumber) {
      const rollExists = await Student.findOne({ rollNumber });
      if (rollExists) {
        return res.status(400).json({
          success: false,
          message: 'Roll number already in use by another student',
        });
      }
      student.rollNumber = rollNumber;
    }

    // Update user fields
    if (name) user.name = name;
    if (password) user.password = password; // pre-save hashes it if modified
    await user.save();

    // Update student fields
    if (department) student.department = department;
    if (year) student.year = year;
    if (phone) student.phone = phone;
    if (attendance !== undefined) student.attendance = Number(attendance);
    if (marks !== undefined) student.marks = Number(marks);
    if (remarks !== undefined) student.remarks = remarks;
    await student.save();

    res.json({
      success: true,
      message: 'Student record updated successfully',
      data: {
        studentId: student._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        phone: student.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student details
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
export const deleteStudent = async (req, res, next) => {
  const studentId = req.params.id;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    // Delete Student first
    await Student.findByIdAndDelete(studentId);

    // Delete associated User credentials
    await User.findByIdAndDelete(student.userId);

    res.json({
      success: true,
      message: 'Student record and associated user deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student profile
// @route   GET /api/student/profile
// @access  Private/Student
export const getStudentProfile = async (req, res, next) => {
  try {
    // Find Student linked to logged in User ID
    const student = await Student.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role isActive'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students for staff view
// @route   GET /api/staff/students
// @access  Private/Staff
export const getStudentsForStaff = async (req, res, next) => {
  try {
    // Staff can view all students
    const students = await Student.find({}).populate('userId', 'name email role isActive');
    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student academic metrics by Staff
// @route   PUT /api/staff/students/:id
// @access  Private/Staff
export const updateStudentMetricsForStaff = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { marks, attendance, remarks } = req.body;
  const studentId = req.params.id;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    if (marks !== undefined) student.marks = Number(marks);
    if (attendance !== undefined) student.attendance = Number(attendance);
    if (remarks !== undefined) student.remarks = remarks;

    await student.save();

    res.json({
      success: true,
      message: 'Student metrics updated successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

