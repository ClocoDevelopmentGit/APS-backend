// services/userService.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: Calculate age from DOB
const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

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
    role, // ← Explicit role from admin
  } = userData;

  // Validate role
  const validRoles = ['Adult', 'Parent', 'Staff', 'Tutor'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Validate DOB format if provided
  let dobDate = null;
  if (dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD for dob.');
    }
    dobDate = new Date(dob);
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
      role, // ← Admin-provided role
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

// Register a new user (auto-role by age, guardian optional)
// services/userService.js — inside registerUser
export const registerUser = async (userData) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    phone,
    dob, // This is a string like "2005-03-15"
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

  // ✅ Convert dob string to Date object (if provided)
  let dobDate = null;
  if (dob) {
    // Ensure it's a valid date string in YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD for dob.');
    }
    dobDate = new Date(dob); // This creates a Date at 00:00 UTC
    if (isNaN(dobDate.getTime())) {
      throw new Error('Invalid date value for dob.');
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Determine role based on age
  let role = 'Adult';
  if (dobDate) {
    const age = calculateAge(dobDate);
    if (age < 18) {
      role = 'Parent';
    }
  }

  const newUser = await prisma.user.create({
    data: {
      userId,
      firstName,
      lastName,
      email,
      phone,
      dob: dobDate, // ← Pass Date object, NOT string
      gender,
      details,
      specialNeeds,
      password: hashedPassword,
      role,
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

// Get all users (admin only)
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

// Update user (admin or self)
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

// Delete user (admin only)
export const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id },
  });
};