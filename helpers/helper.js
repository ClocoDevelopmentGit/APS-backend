// helpers/helper.js
import { AppError } from '../middlewares/errorMiddleware.js';
import bcrypt from 'bcryptjs';

// Calculate age from date of birth
export const calculateAge = (dob) => {
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

// Get cookie name by user role
export const getCookieNameByRole = (role) => `token_${role.toLowerCase()}`;

// Format date to dd-MM-yyyy
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Parse and validate date from dd-MM-yyyy format
export const parseDate = (dateString, fieldName = 'date') => {
  // Validate format
  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    throw new AppError(`Invalid date format for ${fieldName}. Use dd-MM-yyyy.`, 400);
  }
  
  const [day, month, year] = dateString.split('-');
  const date = new Date(`${year}-${month}-${day}`);
  
  // Validate if date is actually valid (e.g., not 45-13-2025)
  if (isNaN(date.getTime())) {
    throw new AppError(`Invalid date value for ${fieldName}.`, 400);
  }
  
  return date;
};

// Parse and validate time from HH:mm format
export const parseTime = (timeString, fieldName = 'time') => {
  // Validate format
  if (!/^\d{2}:\d{2}$/.test(timeString)) {
    throw new AppError(`Invalid time format for ${fieldName}. Use HH:mm.`, 400);
  }
  
  const [hours, minutes] = timeString.split(':');
  const time = new Date();
  time.setHours(parseInt(hours, 10));
  time.setMinutes(parseInt(minutes, 10));
  time.setSeconds(0);
  time.setMilliseconds(0);
  
  // Validate if time is actually valid
  if (isNaN(time.getTime())) {
    throw new AppError(`Invalid time value for ${fieldName}.`, 400);
  }
  
  return time;
};

// Validate required fields
export const validateRequiredFields = (data, requiredFields, contextMessage = '') => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    const prefix = contextMessage ? `${contextMessage}: ` : '';
    throw new AppError(
      `${prefix}Required fields are missing: ${missingFields.join(', ')}`,
      400
    );
  }
};

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare password with hash
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Validate email format (basic)
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate array input
export const validateArrayInput = (data, minLength = 1, errorMessage = 'Invalid data format') => {
  if (!Array.isArray(data) || data.length < minLength) {
    throw new AppError(errorMessage, 400);
  }
};

// Sanitize user data for response (exclude password and sensitive fields)
export const sanitizeUserData = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Generate next userId in format APS001, APS002, etc.
export const generateNextUserId = async (prisma) => {
  const PREFIX = 'APS';
  const MIN_DIGIT_LENGTH = 3; // Minimum digits, will expand if needed

  // Find the last user with userId starting with PREFIX
  const lastUser = await prisma.user.findFirst({
    where: {
      userId: {
        startsWith: PREFIX,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      userId: true,
    },
  });

  if (!lastUser) {
    // First user: return APS001
    return `${PREFIX}${String(1).padStart(MIN_DIGIT_LENGTH, '0')}`;
  }

  // Extract number from userId (e.g., "APS001" -> "001" -> 1)
  const lastNumber = parseInt(lastUser.userId.replace(PREFIX, ''), 10);

  if (isNaN(lastNumber)) {
    throw new AppError('Invalid userId format in database', 500);
  }

  // Increment and format
  const nextNumber = lastNumber + 1;
  
  // padStart will naturally expand when number exceeds MIN_DIGIT_LENGTH
  // APS001 → APS999 → APS1000 → APS1001 (expands automatically)
  const nextUserId = `${PREFIX}${String(nextNumber).padStart(MIN_DIGIT_LENGTH, '0')}`;

  return nextUserId;
};

export const checkEmailExists = async (prisma, email, errorMessage = 'Email already exists') => {
  const existingUser = await prisma.user.findFirst({ 
    where: { email } 
  });
  if (existingUser) {
    throw new AppError(errorMessage, 409);
  }
};

// Check if child already exists by firstName, lastName, and DOB
export const checkChildExists = async (prisma, firstName, lastName, dob, guardianId, userContext) => {
  const existingChild = await prisma.user.findFirst({
    where: {
      firstName,
      lastName,
      dob,
      guardianId,
      role: 'Student',
    },
  });

  if (existingChild) {
    throw new AppError(
      `${userContext} with name "${firstName} ${lastName}" and DOB "${dob.toISOString().split('T')[0]}" already exists under this guardian.`,
      409
    );
  }
};

// Helper to create user data object
export const buildUserData = (userData, role, guardianId, hashedPassword, generatedUserId, createdBy = null, updatedBy = null) => ({
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