import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/roleMiddleware.js';
import {
  createStaff,
  getStaffs,
  updateStaff,
  deleteStaff,
} from '../controllers/staffController.js';

const router = express.Router();

// Admin Staff CRUD Routes
router.post(
  '/admin/staffs',
  protect,
  isAdmin,
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('employeeId').notEmpty().withMessage('Employee ID is required').trim(),
    body('department').notEmpty().withMessage('Department is required').trim(),
    body('designation').notEmpty().withMessage('Designation is required').trim(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
  ],
  createStaff
);

router.get('/admin/staffs', protect, isAdmin, getStaffs);

router.put(
  '/admin/staffs/:id',
  protect,
  isAdmin,
  [
    param('id').isMongoId().withMessage('Invalid staff ID format'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
    body('email').optional().isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('employeeId').optional().notEmpty().withMessage('Employee ID cannot be empty').trim(),
    body('department').optional().notEmpty().withMessage('Department cannot be empty').trim(),
    body('designation').optional().notEmpty().withMessage('Designation cannot be empty').trim(),
    body('phone').optional().notEmpty().withMessage('Phone number cannot be empty').trim(),
  ],
  updateStaff
);

router.delete(
  '/admin/staffs/:id',
  protect,
  isAdmin,
  [param('id').isMongoId().withMessage('Invalid staff ID format')],
  deleteStaff
);

export default router;
