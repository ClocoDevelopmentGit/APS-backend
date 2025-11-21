// services/locationService.js
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorMiddleware.js';
import { validateRequiredFields } from '../helpers/helper.js';

const prisma = new PrismaClient();

// Create Location
export const createLocation = async (locationData, userId) => {
  const {
    name,
    addressLine1,
    addressLine2,
    suburb,
    city,
    state,
    country = 'Australia',
    postcode,
    rooms = [],
    notes = '',
    isActive = true,
  } = locationData;

  // Validate required fields
  validateRequiredFields(locationData, [
    'name',
    'addressLine1',
    'suburb',
    'city',
    'state',
    'postcode',
  ]);

  // Validate rooms array
  if (!Array.isArray(rooms)) {
    throw new AppError('Rooms must be an array', 400);
  }

  const newLocation = await prisma.location.create({
    data: {
      name,
      addressLine1,
      addressLine2: addressLine2 || null,
      suburb,
      city,
      state,
      country,
      postcode,
      rooms,
      notes: notes || '',
      isActive,
      createdBy: userId,
      updatedBy: userId,
    },
  });

  return newLocation;
};

// Get All Locations
export const getAllLocations = async (isActiveFilter) => {
  const where = {};

  // Filter by isActive if provided
  if (isActiveFilter !== undefined) {
    where.isActive = isActiveFilter === 'true';
  }

  return await prisma.location.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      events: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });
};

// Get Location By ID
export const getLocationById = async (id) => {
  if (!id) {
    throw new AppError('Location ID is required', 400);
  }

  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      events: {
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          canEnroll: true,
          availableSeats: true,
          isActive: true,
        },
        orderBy: {
          startDate: 'asc',
        },
      },
    },
  });

  if (!location) {
    throw new AppError('Location not found', 404);
  }

  return location;
};

// Update Location
export const updateLocation = async (id, updateData, userId) => {
  if (!id) {
    throw new AppError('Location ID is required', 400);
  }

  // Check if location exists
  const existingLocation = await prisma.location.findUnique({
    where: { id },
  });

  if (!existingLocation) {
    throw new AppError('Location not found', 404);
  }

  // Validate rooms array if provided
  if (updateData.rooms && !Array.isArray(updateData.rooms)) {
    throw new AppError('Rooms must be an array', 400);
  }

  const updatedLocation = await prisma.location.update({
    where: { id },
    data: {
      ...updateData,
      updatedBy: userId,
    },
  });

  return updatedLocation;
};

// Deactivate Location
export const deactivateLocation = async (id) => {
  if (!id) {
    throw new AppError('Location ID is required', 400);
  }

  // Check if location exists
  const existingLocation = await prisma.location.findUnique({
    where: { id },
    include: {
      events: {
        where: {
          isActive: true,
        },
      },
    },
  });

  if (!existingLocation) {
    throw new AppError('Location not found', 404);
  }

  // Check if location has active events
  if (existingLocation.events.length > 0) {
    throw new AppError(
      'Cannot deactivate location with active events. Please deactivate all events first.',
      400
    );
  }

  return await prisma.location.update({
    where: { id },
    data: { isActive: false },
  });
};