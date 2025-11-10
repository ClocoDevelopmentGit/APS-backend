// services/userService.js
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateAge, getCookieNameByRole } from '../helpers/helper.js';

const prisma = new PrismaClient();

// Create user by admin (explicit role)
export const adminCreateUser = async (userData) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    details,
    specialNeeds,
    password,
    specialization = [],
    guardianId = null,
    photoPath = null,
    isActive = true,
    createdBy = null,
    updatedBy = null,
    role, // This is a string like "Student"
  } = userData;

  const validRoles = ['Admin', 'Staff', 'Student', 'Parent'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  let dobDate = null;
  if (dob) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      throw new Error('Invalid date format. Use dd-MM-YYYY for dob.');
    }
    const [day, month, year] = dob.split('-');
    dobDate = new Date(`${year}-${month}-${day}`);
    if (isNaN(dobDate.getTime())) {
      throw new Error('Invalid date value for dob.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      userId,
      firstName,
      lastName,
      email,
      phone,
      dob: dobDate,
      gender,
      details,
      specialNeeds,
      password: hashedPassword,
      role: UserRole[role],
      specialization,
      guardianId: guardianId || null,
      photoPath,
      isActive,
      createdBy,
      updatedBy,
    },
  });

  return newUser;
};

// Register a new user (auto-role by age)
export const registerUser = async (userData) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    details,
    specialNeeds,
    password,
    specialization = [],
    guardianId = null,
    photoPath = null,
    isActive = true,
    createdBy = null,
    updatedBy = null,
  } = userData;

  let dobDate = null;
  if (dob) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      throw new Error('Invalid date format. Use dd-MM-YYYY for dob.');
    }
    const [day, month, year] = dob.split('-');
    dobDate = new Date(`${year}-${month}-${day}`);
    if (isNaN(dobDate.getTime())) {
      throw new Error('Invalid date value for dob.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Always set role to Student for registration
  const newUser = await prisma.user.create({
    data: {
      userId,
      firstName,
      lastName,
      email,
      phone,
      dob: dobDate,
      gender,
      details,
      specialNeeds,
      password: hashedPassword,
      role: UserRole.Student, 
      specialization,
      guardianId: guardianId || null,
      photoPath,
      isActive,
      createdBy,
      updatedBy,
    },
  });

  return newUser;
};

// Login user
export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new Error('Invalid credentials or inactive account.');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials.');
  }

  return user;
};

// Get all users
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dob: true,
      gender: true,
      details: true,
      specialNeeds: true,
      role: true,
      specialization: true,
      guardianId: true,
      photoPath: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Get user by ID
export const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dob: true,
      gender: true,
      details: true,
      specialNeeds: true,
      role: true,
      specialization: true,
      guardianId: true,
      photoPath: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Update user
export const updateUser = async (id, updateData) => {
  const { password, ...rest } = updateData;

  let hashedPassword = undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(hashedPassword && { password: hashedPassword }),
    },
  });
};

// Deactivate user (Admin only)
export const deactivateUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
};

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
export const clearAuthCookie = async (res, prismaClient, userId) => {
  const user = await prismaClient.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const cookieName = getCookieNameByRole(user.role);
  res.clearCookie(cookieName, COOKIE_OPTIONS);
};