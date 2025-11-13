// controllers/userController.js
import {
  adminCreateUser as createUserService,
  registerUser as registerUserService,
  loginUser as loginUserService,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  clearAuthCookie,
} from '../services/userService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Register Controller - Handles both parent-child and adult student registration
export const registerController = async (req, res, next) => {
  try {
    const { users, primaryUser } = await registerUserService(req.body, res);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      primaryUser: {
        id: primaryUser.id,
        userId: primaryUser.userId,
        firstName: primaryUser.firstName,
        lastName: primaryUser.lastName,
        email: primaryUser.email,
        role: primaryUser.role,
        guardianId: primaryUser.guardianId,
        isActive: primaryUser.isActive,
      },
      totalUsersCreated: users.length,
      users: users.map(user => ({
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        guardianId: user.guardianId,
        isActive: user.isActive,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Admin Create User Controller
export const adminCreateUserController = async (req, res, next) => {
  try {
    const user = await createUserService(req.body, req, res);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully by admin.',
      user: {
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        guardianId: user.guardianId,
        isActive: user.isActive,
        createdBy: user.createdBy,
        updatedBy: user.updatedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login Controller
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await loginUserService(email, password, req, res);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        guardianId: user.guardianId,
        isActive: user.isActive,
        createdBy: user.createdBy || null,
        updatedBy: user.updatedBy || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get All Users Controller
export const getAllUsersController = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    next(error);
  }
};

// Get Particular User Controller
export const getParticularUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update User Profile Controller
export const updateUserProfileController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedUser = await updateUser(id, req.body);

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate User Profile Controller
export const deactivateUserProfileController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deactivateUser(id);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Logout Controller
export const logoutController = async (req, res, next) => {
  try {
    await clearAuthCookie(res, prisma, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};