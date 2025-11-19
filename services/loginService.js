// services/loginService.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorMiddleware.js';
import {
  getCookieNameByRole,
  comparePassword,
} from '../helpers/helper.js';

const prisma = new PrismaClient();

// Set auth cookie
export const setAuthCookie = (res, user, token) => {
  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  const cookieName = getCookieNameByRole(user.role);
  res.cookie(cookieName, token, COOKIE_OPTIONS);
};

// Clear auth cookie
export const clearAuthCookie = async (res, prisma, userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const cookieName = getCookieNameByRole(user.role);
  res.clearCookie(cookieName, COOKIE_OPTIONS);
};

// Login user
export const loginUser = async (email, password, req, res) => {
  // Validate required fields
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await prisma.user.findFirst({ where: { email } }); 

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.guardianId) {
    throw new AppError('Please login using guardian account', 403);
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('User account is deactivated. Please contact support.', 403);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  setAuthCookie(res, user, token);

  return user;
};

// Logout user
export const logoutUser = async (userId, res) => {
  await clearAuthCookie(res, prisma, userId);
};