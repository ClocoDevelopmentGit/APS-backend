// controllers/loginController.js
import {
  loginUser as loginUserService,
  logoutUser as logoutUserService
} from '../services/loginService.js';

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
    console.log(error)
    next(error);
  }
};

// Logout Controller
export const logoutController = async (req, res, next) => {
  try {
    await logoutUserService(req.user.id, res);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};