import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import { isAdmin, isStaff, isStudent } from '../middleware/roleMiddleware.js';
import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  getStudentsForStaff,
  updateStudentMetricsForStaff,
} from '../controllers/studentController.js';

const router = express.Router();


// Admin Student CRUD Routes
router.post(
  '/admin/students',
  protect,
  isAdmin,
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('rollNumber').notEmpty().withMessage('Roll number is required').trim(),
    body('department').notEmpty().withMessage('Department is required').trim(),
    body('year').notEmpty().withMessage('Academic year is required').trim(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
  ],
  createStudent
);

router.get('/admin/students', protect, isAdmin, getStudents);

router.put(
  '/admin/students/:id',
  protect,
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid student ID format'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('email').optional().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('rollNumber').optional().notEmpty().withMessage('Roll number cannot be empty').trim(),
    body('department').optional().notEmpty().withMessage('Department cannot be empty').trim(),
    body('year').optional().notEmpty().withMessage('Academic year cannot be empty').trim(),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty').trim(),
  ],
  updateStudent
);

router.delete(
  '/admin/students/:id',
  protect,
  isAdmin,
  [param('id').isMongoId().withMessage('Invalid student ID format')],
  deleteStudent
);

// Student Profile Route
router.get('/student/profile', protect, isStudent, getStudentProfile);

// Staff Student Viewer Route
router.get('/staff/students', protect, isStaff, getStudentsForStaff);

// Staff Student Metrics Editor Route
router.put(
  '/staff/students/:id',
  protect,
  isStaff,
  [
    param('id').isMongoId().withMessage('Invalid student ID format'),
    body('marks').optional().isInt({ min: 0, max: 100 }).withMessage('Marks must be a number between 0 and 100'),
    body('attendance').optional().isInt({ min: 0, max: 100 }).withMessage('Attendance must be a number between 0 and 100'),
    body('remarks').optional().isString().trim(),
  ],
  updateStudentMetricsForStaff
);

export default router;
