// routes/userRoutes.js
import express from 'express';
import {
  registerController,
  loginController,
  getAllUsersController,
  getParticularUserController,
  updateUserProfileController,
  deactivateUserProfileController,
  adminCreateUserController,
  createDependentsController,
  logoutController
} from '../controllers/userController.js';
import { authenticateToken, authorizeAdmin, authorizeAdminOrParent } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/logout', authenticateToken, logoutController);

// Admin-only routes
router.post('/admin/create', authenticateToken, authorizeAdmin, adminCreateUserController);
router.get('/', authenticateToken, authorizeAdmin, getAllUsersController);
router.get('/:id', authenticateToken, authorizeAdmin, getParticularUserController);
router.put('/:id', authenticateToken, authorizeAdmin, updateUserProfileController);
router.patch('/:id/deactivate', authenticateToken, authorizeAdmin, deactivateUserProfileController); 

// Admin or Parent routes
router.post('/dependents', authenticateToken, authorizeAdminOrParent, createDependentsController);

export default router;