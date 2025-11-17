// services/userService.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorMiddleware.js';
import {
  calculateAge,
  getCookieNameByRole,
  parseDate,
  validateRequiredFields,
  hashPassword,
  comparePassword,
  validateArrayInput,
  generateNextUserId,
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

// Check if email already exists
const checkEmailExists = async (email, errorMessage = 'Email already exists') => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(errorMessage, 409);
  }
};

// Helper to create user data object
const buildUserData = (userData, role, guardianId, hashedPassword, generatedUserId, createdBy = null, updatedBy = null) => ({
  userId: generatedUserId,
  firstName: userData.firstName,
  lastName: userData.lastName,
  email: userData.email,
  phone: userData.phone || null,
  dob: userData.dob || null,
  gender: userData.gender || null,
  details: userData.details || null,
  specialNeeds: userData.specialNeeds === true || userData.specialNeeds === false 
    ? userData.specialNeeds 
    : false,
  password: hashedPassword,
  role,
  specialization: userData.specialization || [],
  guardianId,
  photoPath: userData.photoPath || null,
  isActive: true,
  createdBy,
  updatedBy,
});

// Register user(s) - Supports both parent-child and student registration
export const registerUser = async (usersData, res) => {
  // Validate input is an array with at least one user
  validateArrayInput(usersData, 1, 'Invalid registration data. Expected at least one user.');

  const registeredUsers = [];
  let primaryUser = null;
  let parentId = null;

  // Determine registration type
  const isParentChildRegistration = usersData.length > 1;

  // Process each user in the array
  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i];
    const isFirstUser = i === 0;
    
    // Determine user context for error messages
    const userContext = isParentChildRegistration 
      ? (isFirstUser ? 'Parent' : `Child ${i}`)
      : '';
    
    // Determine role: Parent (if first in multi-user), otherwise Student
    const role = isParentChildRegistration && isFirstUser ? 'Parent' : 'Student';
    
    // Build required fields list
    const requiredFields = ['firstName', 'lastName', 'email', 'password'];
    
    // DOB is required for single user registration (to verify age 18+)
    if (!isParentChildRegistration) {
      requiredFields.push('dob');
    }
    
    // Validate required fields
    validateRequiredFields(userData, requiredFields, userContext);

    // Check if email already exists
    const emailErrorMessage = isParentChildRegistration && isFirstUser
      ? 'Parent account already exists. Try to login.'
      : isParentChildRegistration
        ? `Email already exists for child ${i}: ${userData.email}`
        : 'Email already exists. Try to login.';
    
    await checkEmailExists(userData.email, emailErrorMessage);

    // Parse and validate DOB if provided
    let dobDate = null;
    if (userData.dob) {
      const dobFieldName = userContext ? `${userContext.toLowerCase()} dob` : 'dob';
      dobDate = parseDate(userData.dob, dobFieldName);
    }

    // For single user registration, verify age is 18+
    if (!isParentChildRegistration && dobDate) {
      const age = calculateAge(dobDate);
      if (age < 18) {
        throw new AppError(
          'You need a guardian to proceed. Age must be 18 or above for independent registration.',
          403
        );
      }
    }

    // Generate userId automatically
    const generatedUserId = await generateNextUserId(prisma);

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user with appropriate role and guardianId
    const newUser = await prisma.user.create({
      data: buildUserData(
        { ...userData, dob: dobDate },
        role,
        isFirstUser ? null : parentId,
        hashedPassword,
        generatedUserId
      ),
    });

    registeredUsers.push(newUser);

    // Set primary user (first user) and capture parent ID for children
    if (isFirstUser) {
      primaryUser = newUser;
      if (isParentChildRegistration) {
        parentId = newUser.id;
      }
    }
  }

  // Generate JWT token for the primary user (parent or adult student)
  const token = jwt.sign(
    { id: primaryUser.id, email: primaryUser.email, role: primaryUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  setAuthCookie(res, primaryUser, token);

  return { users: registeredUsers, primaryUser };
};

// Login user
export const loginUser = async (email, password, req, res) => {
  // Validate required fields
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

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

// Create user by admin - CREATES STAFF ONLY
export const adminCreateUser = async (userData, req, res) => {
  const {
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
    photoPath = null,
    isActive = true,
    createdBy = req.user.id,
    updatedBy = req.user.id,
  } = userData;

  // Validate required fields
  validateRequiredFields(userData, [
    'firstName',
    'lastName',
    'email',
    'password',
  ]);

  // Check if email already exists
  await checkEmailExists(email);

  // Parse DOB if provided
  let dobDate = null;
  if (dob) {
    dobDate = parseDate(dob, 'dob');
  }

  // Generate userId automatically
  const generatedUserId = await generateNextUserId(prisma);

  const hashedPassword = await hashPassword(password);

  // ALWAYS create as Staff
  const newUser = await prisma.user.create({
    data: {
      userId: generatedUserId,
      firstName,
      lastName,
      email,
      phone,
      dob: dobDate,
      gender,
      details,
      specialNeeds: specialNeeds === true || specialNeeds === false ? specialNeeds : false,
      password: hashedPassword,
      role: 'Staff', // Hardcoded as Staff
      specialization,
      guardianId: null, // Staff has no guardian
      photoPath,
      isActive,
      createdBy,
      updatedBy,
    },
  });

  return newUser;
};

// Create Dependents - Admin creates Parent+Children OR Parent adds Children
export const createDependents = async (usersData, req, res) => {
  // Validate input is an array with at least one user
  validateArrayInput(usersData, 1, 'Invalid data. Expected at least one user.');

  const createdUsers = [];
  let primaryUser = null;
  let parentId = null;

  const isAdmin = req.user.role === 'Admin';
  const isParent = req.user.role === 'Parent';

  // CASE 1: Parent adding children
  if (isParent) {
    // Parent can only add children, not create another parent
    // All users in array should be children
    
    parentId = req.user.id; // Use logged-in parent's ID

    for (let i = 0; i < usersData.length; i++) {
      const childData = usersData[i];
      
      // Validate child required fields
      validateRequiredFields(
        childData,
        ['firstName', 'lastName', 'email', 'password'],
        `Child ${i + 1}`
      );

      // Check if email already exists
      await checkEmailExists(
        childData.email,
        `Email already exists for child ${i + 1}: ${childData.email}`
      );

      // Parse child DOB if provided
      let childDobDate = null;
      if (childData.dob) {
        childDobDate = parseDate(childData.dob, `child ${i + 1} dob`);
      }

      // Generate userId automatically
      const generatedUserId = await generateNextUserId(prisma);

      // Hash password
      const hashedPassword = await hashPassword(childData.password);

      // Create child linked to logged-in parent
      const child = await prisma.user.create({
        data: buildUserData(
          { ...childData, dob: childDobDate },
          'Student',
          parentId, // Link to logged-in parent
          hashedPassword,
          generatedUserId,
          req.user.id, // createdBy
          req.user.id  // updatedBy
        ),
      });

      createdUsers.push(child);
    }

    return { 
      users: createdUsers, 
      primaryUser: null, // No primary user for parent adding children
      totalUsersCreated: createdUsers.length 
    };
  }

  // CASE 2: Admin creating Parent + Children
  if (isAdmin) {
    // Must have at least 2 users (parent + at least 1 child)
    if (usersData.length < 2) {
      throw new AppError('Admin must provide at least one parent and one child (minimum 2 users)', 400);
    }

    const parentData = usersData[0]; // First element is parent
    
    // Validate parent required fields
    validateRequiredFields(
      parentData,
      ['firstName', 'lastName', 'email', 'password'],
      'Parent'
    );

    // Check if parent already exists
    await checkEmailExists(parentData.email, 'Parent account already exists.');

    // Parse parent DOB if provided
    let parentDobDate = null;
    if (parentData.dob) {
      parentDobDate = parseDate(parentData.dob, 'parent dob');
    }

    // Generate userId for parent
    const parentUserId = await generateNextUserId(prisma);

    // Hash parent password
    const parentHashedPassword = await hashPassword(parentData.password);

    // Create parent
    const parent = await prisma.user.create({
      data: buildUserData(
        { ...parentData, dob: parentDobDate },
        'Parent',
        null, // No guardian for parent
        parentHashedPassword,
        parentUserId,
        req.user.id, // createdBy (admin)
        req.user.id  // updatedBy (admin)
      ),
    });

    createdUsers.push(parent);
    primaryUser = parent;
    parentId = parent.id;

    // Create children (remaining elements in array)
    for (let i = 1; i < usersData.length; i++) {
      const childData = usersData[i];
      
      // Validate child required fields
      validateRequiredFields(
        childData,
        ['firstName', 'lastName', 'email', 'password'],
        `Child ${i}`
      );

      // Check if child email already exists
      await checkEmailExists(
        childData.email,
        `Email already exists for child ${i}: ${childData.email}`
      );

      // Parse child DOB if provided
      let childDobDate = null;
      if (childData.dob) {
        childDobDate = parseDate(childData.dob, `child ${i} dob`);
      }

      // Generate userId for child
      const childUserId = await generateNextUserId(prisma);

      // Hash child password
      const childHashedPassword = await hashPassword(childData.password);

      // Create child linked to parent
      const child = await prisma.user.create({
        data: buildUserData(
          { ...childData, dob: childDobDate },
          'Student',
          parentId, // Link to parent
          childHashedPassword,
          childUserId,
          req.user.id, // createdBy (admin)
          req.user.id  // updatedBy (admin)
        ),
      });

      createdUsers.push(child);
    }

    return { 
      users: createdUsers, 
      primaryUser, 
      totalUsersCreated: createdUsers.length 
    };
  }
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

  // Prevent email updates
  if (updateData.email && updateData.email !== existingUser.email) {
    throw new AppError('Email cannot be changed', 400);
  }

  // Prevent userId updates
  if (updateData.userId) {
    throw new AppError('User ID cannot be changed', 400);
  }

  const { password, email, userId, ...rest } = updateData;

  let hashedPassword;
  if (password) {
    hashedPassword = await hashPassword(password);
  }

  return await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(hashedPassword && { password: hashedPassword }),
      // email and userId are intentionally excluded
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