// routes/locationRoutes.js
import express from 'express';
import {
  createLocationController,
  getAllLocationsController,
  getLocationByIdController,
  updateLocationController,
  deactivateLocationController,
} from '../controllers/locationController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin-only routes
router.post('/', authenticateToken, authorizeAdmin, createLocationController);
router.put('/:id', authenticateToken, authorizeAdmin, updateLocationController);
router.patch('/:id/deactivate', authenticateToken, authorizeAdmin, deactivateLocationController);

// Authenticated routes (all roles can view)
router.get('/', authenticateToken, getAllLocationsController);
router.get('/:id', authenticateToken, getLocationByIdController);

export default router;