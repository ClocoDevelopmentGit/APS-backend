// services/userService.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateAge, getCookieNameByRole } from '../helpers/helper.js';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorMiddleware.js';

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
export const clearAuthCookie = async (res, prismaClient, userId) => {
  const user = await prismaClient.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const cookieName = getCookieNameByRole(user.role);
  res.clearCookie(cookieName, COOKIE_OPTIONS);
};

// Register user(s) - Supports both parent-child and  student registration
export const registerUser = async (usersData, res) => {
  // Validate input is an array
  if (!Array.isArray(usersData) || usersData.length === 0) {
    throw new AppError('Invalid registration data. Expected an array of users.', 400);
  }

  let registeredUsers = [];

  // CASE 1: Single user registration (Student without guardian)
  if (usersData.length === 1) {
    const userData = usersData[0];
    
    // Required fields validation
    if (!userData.userId || !userData.firstName || !userData.lastName || 
        !userData.email || !userData.password || !userData.dob) {
      throw new AppError(
        'Required fields are missing: userId, firstName, lastName, email, password, dob', 
        400
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AppError('Email already exists. Try to login.', 409);
    }

    // Validate and parse DOB
    if (!/^\d{2}-\d{2}-\d{4}$/.test(userData.dob)) {
      throw new AppError('Invalid date format. Use dd-MM-YYYY for dob.', 400);
    }
    
    const [day, month, year] = userData.dob.split('-');
    const dobDate = new Date(`${year}-${month}-${day}`);
    
    if (isNaN(dobDate.getTime())) {
      throw new AppError('Invalid date value for dob.', 400);
    }

    // Calculate age and check if adult (18+)
    const age = calculateAge(dobDate);
    
    if (age < 18) {
      throw new AppError(
        'You need a guardian to proceed. Age must be 18 or above for independent registration.', 
        403
      );
    }

    // Create student with age 18+
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        userId: userData.userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || null,
        dob: dobDate,
        gender: userData.gender || null,
        details: userData.details || null,
        specialNeeds: userData.specialNeeds === true || userData.specialNeeds === false ? userData.specialNeeds : false,
        password: hashedPassword,
        role: 'Student',
        specialization: userData.specialization || [],
        guardianId: null, // No guardian for adult student
        photoPath: userData.photoPath || null,
        isActive: true,
        createdBy: null,
        updatedBy: null,
      },
    });

    registeredUsers.push(newUser);

    // Generate JWT token for the adult student
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    setAuthCookie(res, newUser, token);

    return { users: registeredUsers, primaryUser: newUser };
  }

  // CASE 2: Parent with children registration (Array length > 1)
  if (usersData.length > 1) {
    const parentData = usersData[0]; // First element is parent
    
    // Validate parent required fields
    if (!parentData.userId || !parentData.firstName || !parentData.lastName || 
        !parentData.email || !parentData.password) {
      throw new AppError(
        'Parent required fields are missing: userId, firstName, lastName, email, password', 
        400
      );
    }

    // Check if parent already exists
    const existingParent = await prisma.user.findUnique({
      where: { email: parentData.email },
    });

    if (existingParent) {
      throw new AppError('Parent account already exists. Try to login.', 409);
    }

    // Validate parent DOB if provided
    let parentDobDate = null;
    if (parentData.dob) {
      if (!/^\d{2}-\d{2}-\d{4}$/.test(parentData.dob)) {
        throw new AppError('Invalid date format for parent. Use dd-MM-YYYY for dob.', 400);
      }
      const [day, month, year] = parentData.dob.split('-');
      parentDobDate = new Date(`${year}-${month}-${day}`);
      if (isNaN(parentDobDate.getTime())) {
        throw new AppError('Invalid date value for parent dob.', 400);
      }
    }

    // Create parent with role "Parent"
    const parentHashedPassword = await bcrypt.hash(parentData.password, 10);
    
    const parent = await prisma.user.create({
      data: {
        userId: parentData.userId,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        email: parentData.email,
        phone: parentData.phone || null,
        dob: parentDobDate,
        gender: parentData.gender || null,
        details: parentData.details || null,
        specialNeeds: parentData.specialNeeds === true || parentData.specialNeeds === false ? parentData.specialNeeds : false,
        password: parentHashedPassword,
        role: 'Parent',
        specialization: parentData.specialization || [],
        guardianId: null,
        photoPath: parentData.photoPath || null,
        isActive: true,
        createdBy: null,
        updatedBy: null,
      },
    });

    registeredUsers.push(parent);

    // Create children (remaining elements in array)
    for (let i = 1; i < usersData.length; i++) {
      const childData = usersData[i];
      
      // Validate child required fields
      if (!childData.userId || !childData.firstName || !childData.lastName || 
          !childData.email || !childData.password) {
        throw new AppError(
          `Child ${i} required fields are missing: userId, firstName, lastName, email, password`, 
          400
        );
      }

      // Check if child email already exists
      const existingChild = await prisma.user.findUnique({
        where: { email: childData.email },
      });

      if (existingChild) {
        throw new AppError(`Email already exists for child ${i}: ${childData.email}`, 409);
      }

      // Validate child DOB if provided
      let childDobDate = null;
      if (childData.dob) {
        if (!/^\d{2}-\d{2}-\d{4}$/.test(childData.dob)) {
          throw new AppError(`Invalid date format for child ${i}. Use dd-MM-YYYY for dob.`, 400);
        }
        const [day, month, year] = childData.dob.split('-');
        childDobDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(childDobDate.getTime())) {
          throw new AppError(`Invalid date value for child ${i} dob.`, 400);
        }
      }

      // Create child with parent as guardian
      const childHashedPassword = await bcrypt.hash(childData.password, 10);
      
      const child = await prisma.user.create({
        data: {
          userId: childData.userId,
          firstName: childData.firstName,
          lastName: childData.lastName,
          email: childData.email,
          phone: childData.phone || null,
          dob: childDobDate,
          gender: childData.gender || null,
          details: childData.details || null,
          specialNeeds: childData.specialNeeds === true || childData.specialNeeds === false ? childData.specialNeeds : false,
          password: parentHashedPassword,
          role: 'Student',
          specialization: childData.specialization || [],
          guardianId: parent.id, // Link to parent
          photoPath: childData.photoPath || null,
          isActive: true,
          createdBy: null,
          updatedBy: null,
        },
      });

      registeredUsers.push(child);
    }

    // Generate JWT token for parent (primary user who logs in)
    const token = jwt.sign(
      { id: parent.id, email: parent.email, role: parent.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    setAuthCookie(res, parent, token);

    return { users: registeredUsers, primaryUser: parent };
  }
};

// Login user
export const loginUser = async (email, password, req, res) => {
  // Validate required fields
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if(user.guardianId) {
    throw new AppError('Please login using guardian account', 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

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

// Create user by admin (explicit role)
export const adminCreateUser = async (userData, req, res) => {
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
    createdBy = req.user.id,
    updatedBy = req.user.id,
    role,
  } = userData;

  // Validate required fields
  if (!userId || !firstName || !lastName || !email || !password || !role) {
    throw new AppError(
      'Required fields are missing: userId, firstName, lastName, email, password, role', 
      400
    );
  }

  const validRoles = ['Admin', 'Staff', 'Student', 'Parent'];
  if (!validRoles.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already exists', 409);
  }

  let dobDate = null;
  if (dob) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
      throw new AppError('Invalid date format. Use dd-MM-YYYY for dob.', 400);
    }
    const [day, month, year] = dob.split('-');
    dobDate = new Date(`${year}-${month}-${day}`);
    if (isNaN(dobDate.getTime())) {
      throw new AppError('Invalid date value for dob.', 400);
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
      specialNeeds: specialNeeds === true || specialNeeds === false ? specialNeeds : false,
      password: hashedPassword,
      role: role, // Use the string role directly
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
  if (!id) {
    throw new AppError('User ID is required', 400);
  }

  const user = await prisma.user.findUnique({
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

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// Update user
export const updateUser = async (id, updateData) => {
  if (!id) {
    throw new AppError('User ID is required', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // If email is being updated, check if it's already taken
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: updateData.email },
    });
    if (emailExists) {
      throw new AppError('Email already exists', 409);
    }
  }

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
  if (!id) {
    throw new AppError('User ID is required', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  return await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
};