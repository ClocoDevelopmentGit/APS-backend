// services/eventService.js
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorMiddleware.js';
import { parseDate, parseTime, validateRequiredFields } from '../helpers/helper.js';

const prisma = new PrismaClient();

// Create Event
export const createEvent = async (eventData, userId) => {
  const {
    locationId,
    categoryId,
    title,
    description,
    mediaUrl,
    mediaType,
    canEnroll = false,
    startDate,
    endDate,
    startTime,
    endTime,
    timezone = 'Australia/Melbourne',
    room,
    notes,
    availableSeats,
    fees,
    isActive = true,
  } = eventData;

  // Validate required fields
  validateRequiredFields(eventData, [
    'locationId',
    'categoryId',
    'title',
    'mediaUrl',
    'mediaType',
    'startDate',
    'endDate',
    'startTime',
    'endTime',
    'room',
    'availableSeats',
    'fees',
  ]);

  // Verify location exists
  const location = await prisma.location.findUnique({
    where: { id: locationId },
  });

  if (!location) {
    throw new AppError('Location not found', 404);
  }

  if (!location.isActive) {
    throw new AppError('Cannot create event in an inactive location', 400);
  }

  // Verify category exists
  const category = await prisma.courseCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (!category.isActive) {
    throw new AppError('Cannot create event with an inactive category', 400);
  }

  // Verify room exists in location
  if (!location.rooms.includes(room)) {
    throw new AppError(`Room "${room}" does not exist in this location`, 400);
  }

  // Parse dates using helper function
  const parsedStartDate = parseDate(startDate, 'startDate');
  const parsedEndDate = parseDate(endDate, 'endDate');

  // Validate date range
  if (parsedEndDate < parsedStartDate) {
    throw new AppError('End date cannot be before start date', 400);
  }

  // Parse times using helper function
  const parsedStartTime = parseTime(startTime, 'startTime');
  const parsedEndTime = parseTime(endTime, 'endTime');

  // Validate availableSeats
  if (availableSeats < 0) {
    throw new AppError('Available seats cannot be negative', 400);
  }

  // Validate fees
  if (fees < 0) {
    throw new AppError('Fees cannot be negative', 400);
  }

  const newEvent = await prisma.event.create({
    data: {
      locationId,
      categoryId,
      title,
      description: description || null,
      mediaUrl,
      mediaType,
      canEnroll,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      timezone,
      room,
      notes: notes || null,
      availableSeats,
      fees,
      isActive,
      createdBy: userId,
      updatedBy: userId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  return newEvent;
};

// Get All Events
export const getAllEvents = async (filters = {}) => {
  const where = {};

  // Filter by isActive
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true';
  }

  // Filter by canEnroll
  if (filters.canEnroll !== undefined) {
    where.canEnroll = filters.canEnroll === 'true';
  }

  // Filter by locationId
  if (filters.locationId) {
    where.locationId = filters.locationId;
  }

  // Filter by categoryId
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  return await prisma.event.findMany({
    where,
    orderBy: {
      startDate: 'asc',
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          state: true,
          postcode: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
};

// Get Event By ID
export const getEventById = async (id) => {
  if (!id) {
    throw new AppError('Event ID is required', 400);
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      location: true,
      category: true,
    },
  });

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  return event;
};

// Update Event
export const updateEvent = async (id, updateData, userId) => {
  if (!id) {
    throw new AppError('Event ID is required', 400);
  }

  // Check if event exists
  const existingEvent = await prisma.event.findUnique({
    where: { id },
    include: {
      location: true,
      category: true,
    },
  });

  if (!existingEvent) {
    throw new AppError('Event not found', 404);
  }

  // Prepare update object
  const dataToUpdate = { ...updateData };

  // If categoryId is being updated, verify it exists
  if (updateData.categoryId && updateData.categoryId !== existingEvent.categoryId) {
    const newCategory = await prisma.courseCategory.findUnique({
      where: { id: updateData.categoryId },
    });

    if (!newCategory) {
      throw new AppError('New category not found', 404);
    }

    if (!newCategory.isActive) {
      throw new AppError('Cannot assign event to an inactive category', 400);
    }
  }

  // If locationId is being updated, verify it exists
  if (updateData.locationId && updateData.locationId !== existingEvent.locationId) {
    const newLocation = await prisma.location.findUnique({
      where: { id: updateData.locationId },
    });

    if (!newLocation) {
      throw new AppError('New location not found', 404);
    }

    if (!newLocation.isActive) {
      throw new AppError('Cannot move event to an inactive location', 400);
    }

    // If room is being updated, verify it exists in the new location
    if (updateData.room && !newLocation.rooms.includes(updateData.room)) {
      throw new AppError(`Room "${updateData.room}" does not exist in the new location`, 400);
    }
  }

  // If room is being updated but location is not, verify room exists in current location
  if (updateData.room && !updateData.locationId) {
    if (!existingEvent.location.rooms.includes(updateData.room)) {
      throw new AppError(`Room "${updateData.room}" does not exist in this location`, 400);
    }
  }

  // Parse dates if provided using helper function
  if (updateData.startDate) {
    dataToUpdate.startDate = parseDate(updateData.startDate, 'startDate');
  }

  if (updateData.endDate) {
    dataToUpdate.endDate = parseDate(updateData.endDate, 'endDate');
  }

  // Validate date range if both dates are provided
  const finalStartDate = dataToUpdate.startDate || existingEvent.startDate;
  const finalEndDate = dataToUpdate.endDate || existingEvent.endDate;

  if (finalEndDate < finalStartDate) {
    throw new AppError('End date cannot be before start date', 400);
  }

  // Parse times if provided using helper function
  if (updateData.startTime) {
    dataToUpdate.startTime = parseTime(updateData.startTime, 'startTime');
  }

  if (updateData.endTime) {
    dataToUpdate.endTime = parseTime(updateData.endTime, 'endTime');
  }

  // Validate availableSeats
  if (updateData.availableSeats !== undefined && updateData.availableSeats < 0) {
    throw new AppError('Available seats cannot be negative', 400);
  }

  // Validate fees
  if (updateData.fees !== undefined && updateData.fees < 0) {
    throw new AppError('Fees cannot be negative', 400);
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      ...dataToUpdate,
      updatedBy: userId,
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  return updatedEvent;
};

// Deactivate Event
export const deactivateEvent = async (id) => {
  if (!id) {
    throw new AppError('Event ID is required', 400);
  }

  // Check if event exists
  const existingEvent = await prisma.event.findUnique({
    where: { id },
  });

  if (!existingEvent) {
    throw new AppError('Event not found', 404);
  }

  return await prisma.event.update({
    where: { id },
    data: { isActive: false },
  });
};