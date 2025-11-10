// controllers/userController.js
import jwt from 'jsonwebtoken';
import {
  adminCreateUser as createUserService,
  registerUser as registerUserService,
  loginUser as loginUserService,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  setAuthCookie,
  clearAuthCookie,
} from '../services/userService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registerController = async (req, res) => {
  try {
    const user = await registerUserService(req.body);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    setAuthCookie(res, user, token);

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        guardianId: user.guardianId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const adminCreateUserController = async (req, res) => {
  try {
    const user = await createUserService(req.body);
    res.status(201).json({
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
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await loginUserService(email, password);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    setAuthCookie(res, user, token);

    res.json({
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
      },
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getParticularUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await updateUser(id, req.body);
    res.json({
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin deactivates user instead of deleting
export const deactivateUserProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    await deactivateUser(id);
    res.json({ message: 'User deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    await clearAuthCookie(res, prisma, req.user.id);
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed.' });
  }
};