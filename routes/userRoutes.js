// routes/userRoutes.js
import express from 'express';
import {
  register,
  login,
  getUsers,
  getUser,
  updateUserProfile,
  deleteUserProfile,
  adminCreateUser,
  logout
} from '../controllers/userController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken,logout);

// Admin-only routes
router.post('/admin/create', authenticateToken, authorizeAdmin, adminCreateUser);
router.get('/', authenticateToken, authorizeAdmin, getUsers);
router.get('/:id', authenticateToken, authorizeAdmin, getUser);
router.put('/:id', authenticateToken, authorizeAdmin, updateUserProfile);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteUserProfile);

export default router;