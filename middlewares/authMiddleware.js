// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Updated cookie names for Staff (was Tutor)
const ROLE_COOKIE_NAMES = ['token_admin', 'token_staff', 'token_student', 'token_parent'];

export const authenticateToken = async (req, res, next) => {
  let token = null;

  for (const cookieName of ROLE_COOKIE_NAMES) {
    if (req.cookies[cookieName]) {
      token = req.cookies[cookieName];
      break;
    }
  }

  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!req.user || !req.user.isActive) {
      return res.status(403).json({ message: 'Invalid or inactive user.' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Only Admin can manage users
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
};

// Admin or Parent can access
export const authorizeAdminOrParent = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Parent') {
    return res.status(403).json({ message: 'Forbidden: Admin or Parent access required.' });
  }
  next();
};