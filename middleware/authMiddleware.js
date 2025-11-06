// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_COOKIE_NAMES = ['token_admin', 'token_tutor', 'token_staff', 'token_parent', 'token_adult'];

export const authenticateToken = async (req, res, next) => {
  let token = null;

  // Check all possible role-based cookies
  for (const cookieName of ROLE_COOKIE_NAMES) {
    if (req.cookies[cookieName]) {
      token = req.cookies[cookieName];
      break;
    }
  }

  // Fallback to Authorization header
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
      return res.status(403).json({ message: 'Invalid user.' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Now only Admin can manage users
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
};