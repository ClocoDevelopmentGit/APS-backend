// routes/eventRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  updateEventController,
  deactivateEventController,
} from '../controllers/eventController.js';
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Multer configuration for event media
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mkv"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"), false);
    }
  },
});

// Admin-only routes (with file upload)
router.post('/', authenticateToken, authorizeAdmin, upload.single("media"), createEventController);
router.put('/:id', authenticateToken, authorizeAdmin, upload.single("media"), updateEventController);
router.patch('/:id/deactivate', authenticateToken, authorizeAdmin, deactivateEventController);

// Authenticated routes (all roles can view)
router.get('/', authenticateToken, getAllEventsController);
router.get('/:id', authenticateToken, getEventByIdController);

export default router;