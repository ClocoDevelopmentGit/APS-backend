import express from 'express';
import {
  registerController,
  getAllUsersController,
  getParticularUserController,
  updateUserProfileController,
  deactivateUserProfileController,
  createStaffUserController,
  createParentAndChildrenController,
  addOrUpdateChildrenController,
} from '../controllers/userController.js';
import { authenticateToken, authorizeAdmin, authorizeParent } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerController);

// Admin-only routes
router.post('/admin/create-staff', authenticateToken, authorizeAdmin, createStaffUserController);
router.post('/admin/create-parent-children', authenticateToken, authorizeAdmin, createParentAndChildrenController);
router.get('/', authenticateToken, authorizeAdmin, getAllUsersController);
router.get('/:id', authenticateToken, authorizeAdmin, getParticularUserController);
router.put('/:id', authenticateToken, authorizeAdmin, updateUserProfileController);
router.patch('/:id/deactivate', authenticateToken, authorizeAdmin, deactivateUserProfileController);

// Parent-only routes
router.post('/parent/children', authenticateToken, authorizeParent, addOrUpdateChildrenController);

export default router;