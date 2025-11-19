// routes/loginRoutes.js
import express from 'express';
import {
  loginController,
  logoutController
} from '../controllers/loginController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route
router.post('/login', loginController);

// Protected route
router.post('/logout', authenticateToken, logoutController);

export default router;