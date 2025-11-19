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
  checkEmailExists,
  checkChildExists,
  buildUserData,
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

// ========== CORE REUSABLE METHOD FOR PROCESSING USERS ==========
const processUsers = async (usersData, options) => {
  const {
    isParentChildFlow,      // true if first user is parent, rest are children
    parentEmail,            // parent's email (if already exists)
    parentId,               // parent's ID (if already exists)
    createdBy,              // who created these users
    updatedBy,              // who updated these users
    skipEmailCheck,         // skip email uniqueness check for children
  } = options;

  const processedUsers = [];
  let primaryUser = null;
  let currentParentId = parentId || null;
  let currentParentEmail = parentEmail || null;

  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i];
    const isFirstUser = i === 0;
    
    // Determine if this user is a parent or child
    const isParent = isParentChildFlow && isFirstUser;
    const isChild = !isParent;
    
    // Determine role and context
    const role = isParent ? 'Parent' : 'Student';
    const userContext = isParent ? 'Parent' : `Child ${isParentChildFlow ? i : i + 1}`;
    
    // Build required fields
    const requiredFields = ['firstName', 'lastName', 'password'];
    
    // Email is required for parent and adult students, optional for children
    if (isParent || (!isParentChildFlow && isChild)) {
      requiredFields.push('email');
    }
    
    // DOB is REQUIRED for all children and adult students
    if (isChild) {
      requiredFields.push('dob');
    }
    
    // Validate required fields
    validateRequiredFields(userData, requiredFields, userContext);

    // Handle email for children - use parent's email if not provided
    let userEmail = userData.email;
    if (isChild) {
      if (!userEmail || userEmail.trim() === '') {
        if (!currentParentEmail) {
          throw new AppError(`${userContext}: Parent email is required when child email is not provided`, 400);
        }
        userEmail = currentParentEmail;
      }
    }

    // Check if email already exists (only for parent and adult students)
    if (isParent || (!isParentChildFlow && isChild)) {
      const emailErrorMessage = isParent
        ? 'Parent account already exists.'
        : 'Email already exists. Try to login.';
      
      await checkEmailExists(prisma, userEmail, emailErrorMessage);
    }

    // Parse and validate DOB
    let dobDate = null;
    if (userData.dob) {
      const dobFieldName = userContext ? `${userContext.toLowerCase()} dob` : 'dob';
      dobDate = parseDate(userData.dob, dobFieldName);
      
      // Age validation
      const age = calculateAge(dobDate);
      
      // For adult students (single registration), verify age is 18+
      if (!isParentChildFlow && isChild) {
        if (age < 18) {
          throw new AppError(
            `You need a guardian to proceed. Age must be 18 or above for independent registration. Your age: ${age} years.`,
            403
          );
        }
      }
      
      // For children in parent-child flow, verify age is below 18
      if (isParentChildFlow && isChild) {
        if (age >= 18) {
          throw new AppError(
            `${userContext} must be under 18 years old. Age calculated: ${age} years. Students 18+ should register independently.`,
            400
          );
        }
      }
    }

    // Check if child already exists (by name and DOB) - only for children with guardians
    if (isChild && currentParentId && dobDate) {
      await checkChildExists(
        prisma,
        userData.firstName,
        userData.lastName,
        dobDate,
        currentParentId,
        userContext
      );
    }

    // Generate userId automatically
    const generatedUserId = await generateNextUserId(prisma);

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const newUser = await prisma.user.create({
      data: buildUserData(
        { ...userData, email: userEmail, dob: dobDate },
        role,
        isParent ? null : currentParentId,
        hashedPassword,
        generatedUserId,
        createdBy,
        updatedBy
      ),
    });

    processedUsers.push(newUser);

    // Capture primary user and parent info
    if (isFirstUser) {
      primaryUser = newUser;
      if (isParent) {
        currentParentId = newUser.id;
        currentParentEmail = newUser.email;
      }
    }
  }

  return { users: processedUsers, primaryUser };
};

// Register user(s) - Supports both parent-child and student registration
export const registerUser = async (usersData, res) => {
  // Validate input is an array with at least one user
  validateArrayInput(usersData, 1, 'Invalid registration data. Expected at least one user.');

  // Determine registration type
  const isParentChildRegistration = usersData.length > 1;

  // Process users using core method
  const { users, primaryUser } = await processUsers(usersData, {
    isParentChildFlow: isParentChildRegistration,
    parentEmail: null,
    parentId: null,
    createdBy: null,
    updatedBy: null,
    skipEmailCheck: false,
  });

  // Generate JWT token for the primary user (parent or adult student)
  const token = jwt.sign(
    { id: primaryUser.id, email: primaryUser.email, role: primaryUser.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  setAuthCookie(res, primaryUser, token);

  return { users, primaryUser };
};

// Admin creates Parent + Children
export const createParentAndChildrenByAdmin = async (usersData, req) => {
  // Validate input is an array with at least 2 users (parent + at least 1 child)
  validateArrayInput(usersData, 2, 'Admin must provide at least one parent and one child (minimum 2 users)');

  // Process users using core method
  const { users, primaryUser } = await processUsers(usersData, {
    isParentChildFlow: true,
    parentEmail: null,
    parentId: null,
    createdBy: req.user.id,
    updatedBy: req.user.id,
    skipEmailCheck: false,
  });

  return { 
    users, 
    parentUser: primaryUser,
    totalUsersCreated: users.length 
  };
};

// Parent adds or updates their children
export const addOrUpdateChildren = async (childrenData, req) => {
  // Validate input is an array with at least 1 child
  validateArrayInput(childrenData, 1, 'Invalid data. Expected at least one child.');

  const parentId = req.user.id;
  const processedChildren = [];

  // Get parent user to retrieve email
  const parent = await prisma.user.findUnique({ 
    where: { id: parentId },
    select: { email: true }
  });

  if (!parent) {
    throw new AppError('Parent not found', 404);
  }

  // Process each child
  for (let i = 0; i < childrenData.length; i++) {
    const childData = childrenData[i];
    const userContext = `Child ${i + 1}`;
    
    // Check if this is an update (has 'id') or a new child creation
    const isUpdate = !!childData.id;
    
    if (isUpdate) {
      // ========== UPDATE EXISTING CHILD ==========
      
      const existingChild = await prisma.user.findUnique({ 
        where: { id: childData.id } 
      });
      
      if (!existingChild) {
        throw new AppError(`${userContext} with ID ${childData.id} not found`, 404);
      }
      
      if (existingChild.guardianId !== parentId) {
        throw new AppError(`${userContext} does not belong to you. Unauthorized access.`, 403);
      }
      
      if (existingChild.role !== 'Student') {
        throw new AppError(`Cannot update user with role ${existingChild.role}. Only students can be updated.`, 400);
      }

      // Prevent email and userId updates
      if (childData.email && childData.email !== existingChild.email) {
        throw new AppError(`${userContext}: Email cannot be changed`, 400);
      }
      
      if (childData.userId) {
        throw new AppError(`${userContext}: User ID cannot be changed`, 400);
      }

      // Handle password update if provided
      let hashedPassword;
      if (childData.password) {
        hashedPassword = await hashPassword(childData.password);
      }

      // Handle DOB update if provided
      let dobDate = existingChild.dob;
      if (childData.dob) {
        dobDate = parseDate(childData.dob, `${userContext.toLowerCase()} dob`);
        
        // Validate age is still under 18
        const age = calculateAge(dobDate);
        if (age >= 18) {
          throw new AppError(
            `${userContext} must be under 18 years old. Age calculated: ${age} years.`,
            400
          );
        }

        // Check if another child with same name and DOB exists (excluding current child)
        const duplicateChild = await prisma.user.findFirst({
          where: {
            firstName: childData.firstName || existingChild.firstName,
            lastName: childData.lastName || existingChild.lastName,
            dob: dobDate,
            guardianId: parentId,
            role: 'Student',
            id: { not: childData.id }, // Exclude current child
          },
        });

        if (duplicateChild) {
          throw new AppError(
            `${userContext}: Another child with same name and DOB already exists.`,
            409
          );
        }
      }

      // Prepare update data
      const { id, email, userId, password, guardianId, role, isActive, ...updateFields } = childData;

      // Update child
      const updatedChild = await prisma.user.update({
        where: { id: childData.id },
        data: {
          ...updateFields,
          dob: dobDate,
          ...(hashedPassword && { password: hashedPassword }),
          updatedBy: req.user.id,
        },
      });

      processedChildren.push(updatedChild);
      
    } else {
      // ========== CREATE NEW CHILD ==========
      
      // Use core method to create new children
      const newChildren = [childData];
      const { users } = await processUsers(newChildren, {
        isParentChildFlow: true,
        parentEmail: parent.email,
        parentId: parentId,
        createdBy: req.user.id,
        updatedBy: req.user.id,
        skipEmailCheck: true,
      });

      processedChildren.push(...users);
    }
  }

  return { 
    children: processedChildren,
    totalProcessed: processedChildren.length 
  };
};

export const createAdultStudentsByAdmin = async (studentsData, req) => {
  // Validate input is an array with at least 1 student
  validateArrayInput(studentsData, 1, 'Invalid data. Expected at least one student.');

  const createdStudents = [];

  // Process each student in the array
  for (let i = 0; i < studentsData.length; i++) {
    const studentData = studentsData[i];
    const userContext = `Student ${i + 1}`;
    
    // Required fields for adult students
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'dob'];
    
    // Validate required fields
    validateRequiredFields(studentData, requiredFields, userContext);

    // Check if email already exists
    await checkEmailExists(
      prisma,
      studentData.email,
      `${userContext}: Email already exists: ${studentData.email}`
    );

    // Parse and validate DOB
    const dobFieldName = `${userContext.toLowerCase()} dob`;
    const dobDate = parseDate(studentData.dob, dobFieldName);
    
    // Validate age is 18 or above
    const age = calculateAge(dobDate);
    if (age < 18) {
      throw new AppError(
        `${userContext} must be 18 years or older. Age calculated: ${age} years. Students under 18 need a guardian.`,
        400
      );
    }

    // Generate userId automatically
    const generatedUserId = await generateNextUserId(prisma);

    // Hash password
    const hashedPassword = await hashPassword(studentData.password);

    // Create adult student with no guardian
    const newStudent = await prisma.user.create({
      data: buildUserData(
        { ...studentData, dob: dobDate },
        'Student',
        null, // No guardianId - independent student
        hashedPassword,
        generatedUserId,
        req.user.id, // createdBy (admin)
        req.user.id  // updatedBy (admin)
      ),
    });

    createdStudents.push(newStudent);
  }

  return { 
    students: createdStudents,
    totalStudentsCreated: createdStudents.length 
  };
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
export const createStaffUser = async (userData, req, res) => {
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
  await checkEmailExists(prisma, email);

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
      role: 'Staff',
      specialization,
      guardianId: null,
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
    },
  });
};

// Deactivate user (Admin only)
export const deactivateUser = async (id) => {
  if (!id) {
    throw new AppError('User ID is required', 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  return await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
};