// controllers/userController.js
import {
  createStaffUser ,
  registerUser as registerUserService,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  createParentAndChildrenByAdmin,
  addOrUpdateChildren,
  createAdultStudentsByAdmin,
} from '../services/userService.js';


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
    console.log(error)
    next(error);
  }
};

// Admin Create User Controller - Creates Staff only
export const createStaffUserController = async (req, res, next) => {
  try {
    const user = await createStaffUser(req.body, req, res);
    
    res.status(201).json({
      success: true,
      message: 'Staff user created successfully by admin.',
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
    console.log(error)
    next(error);
  }
};

export const createParentAndChildrenController = async (req, res, next) => {
  try {
    const { users, parentUser, totalUsersCreated } = await createParentAndChildrenByAdmin(req.body, req);
    
    res.status(201).json({
      success: true,
      message: 'Parent and children created successfully by admin.',
      parentUser: {
        id: parentUser.id,
        userId: parentUser.userId,
        firstName: parentUser.firstName,
        lastName: parentUser.lastName,
        email: parentUser.email,
        role: parentUser.role,
        guardianId: parentUser.guardianId,
        isActive: parentUser.isActive,
      },
      totalUsersCreated,
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
    console.log(error)
    next(error);
  }
};

// CASE 2: Parent adds or updates their children
export const addOrUpdateChildrenController = async (req, res, next) => {
  try {
    const { children, totalProcessed } = await addOrUpdateChildren(req.body, req);
    
    res.status(200).json({
      success: true,
      message: 'Children processed successfully.',
      totalProcessed,
      children: children.map(child => ({
        id: child.id,
        userId: child.userId,
        firstName: child.firstName,
        lastName: child.lastName,
        email: child.email,
        role: child.role,
        guardianId: child.guardianId,
        isActive: child.isActive,
      })),
    });
  } catch (error) {
    console.log(error)
    console.log(error)
    next(error);
  }
};

export const createAdultStudentsController = async (req, res, next) => {
  try {
    const { students, totalStudentsCreated } = await createAdultStudentsByAdmin(req.body, req);
    
    res.status(201).json({
      success: true,
      message: 'Adult students created successfully by admin.',
      totalStudentsCreated,
      students: students.map(student => ({
        id: student.id,
        userId: student.userId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        role: student.role,
        guardianId: student.guardianId,
        isActive: student.isActive,
        createdBy: student.createdBy,
        updatedBy: student.updatedBy,
      })),
    });
  } catch (error) {
    console.log(error);
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
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
    console.log(error)
    next(error);
  }
};