import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createClass = async (data) => {
  try {
    const {
      courseId,
      termId,
      locationId,
      tutorId,
      day,
      startDate,
      endDate,
      startTime,
      endTime,
      room,
      notes,
      availableSeats,
      createdBy,
      isActive,
    } = data;

    const requiredFields = {
      courseId,
      termId,
      locationId,
      tutorId,
      day,
      startDate,
      endDate,
      startTime,
      endTime,
      room,
      availableSeats,
    };

    for (const key in requiredFields) {
      if (!requiredFields[key]) {
        return { success: false, message: `${key} is required` };
      }
    }

    const classDetails = await prisma.class.create({
      data: {
        courseId,
        termId,
        locationId,
        tutorId,
        day,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        startTime:
          startDate && startTime
            ? new Date(`${startDate}T${startTime}`)
            : undefined,
        endTime:
          endDate && endTime ? new Date(`${endDate}T${endTime}`) : undefined,
        room,
        notes,
        availableSeats: Number(availableSeats),
        createdBy,
        isActive: isActive ?? true,
      },
      include: {
        course: true,
        term: true,
        location: true,
        tutor: true,
        fees: true,
      },
    });

    return { success: true, class: classDetails };
  } catch (error) {
    console.error("Error creating class:", error);
    return { success: false, message: "Failed to create class", error };
  }
};

export const getAllClasses = async () => {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        course: true,
        term: true,
        location: true,
        tutor: true,
        fees: true,
      },
    });

    if (!classes.length) {
      return { success: false, message: "No classes found" };
    }

    return { success: true, classes };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { success: false, message: "Failed to fetch classes", error };
  }
};

export const getClassById = async (id) => {
  try {
    if (!id) return { success: false, message: "id is required" };

    const classDetails = await prisma.class.findUnique({
      where: { id },
      include: {
        course: true,
        term: true,
        location: true,
        tutor: true,
        fees: true,
      },
    });

    if (!classDetails) return { success: false, message: "Class not found" };

    return { success: true, class: classDetails };
  } catch (error) {
    console.error("Error fetching class:", error);
    return { success: false, message: "Failed to fetch class", error };
  }
};

export const updateClass = async (id, data) => {
  try {
    if (!id) return { success: false, message: "id is required" };

    const classExists = await prisma.class.findUnique({ where: { id } });

    if (!classExists) return { success: false, message: "Class not found" };

    const {
      courseId,
      termId,
      locationId,
      tutorId,
      day,
      startDate,
      endDate,
      startTime,
      endTime,
      room,
      notes,
      availableSeats,
      isActive,
      updatedBy,
    } = data;

    const requiredFields = {
      courseId,
      termId,
      locationId,
      tutorId,
      day,
      startDate,
      endDate,
      startTime,
      endTime,
      room,
      availableSeats,
    };

    for (const key in requiredFields) {
      if (!requiredFields[key]) {
        return { success: false, message: `${key} is required` };
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        courseId,
        termId,
        locationId,
        tutorId,
        day,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        startTime:
          startDate && startTime
            ? new Date(`${startDate}T${startTime}`)
            : undefined,
        endTime:
          endDate && endTime ? new Date(`${endDate}T${endTime}`) : undefined,
        room,
        notes,
        availableSeats:
          availableSeats !== undefined ? Number(availableSeats) : undefined,
        isActive,
        updatedBy,
      },
      include: {
        course: true,
        term: true,
        location: true,
        tutor: true,
        fees: true,
      },
    });

    return { success: true, class: updatedClass };
  } catch (error) {
    console.error("Error updating class:", error);
    return { success: false, message: "Failed to update class", error };
  }
};

export const deleteClass = async (id) => {
  try {
    if (!id) return { success: false, message: "id is required" };

    const classDetails = await prisma.class.findUnique({ where: { id } });

    if (!classDetails) return { success: false, message: "Class not found" };

    await prisma.class.delete({ where: { id } });

    return { success: true, message: "Class deleted successfully" };
  } catch (error) {
    console.error("Error deleting class:", error);
    return { success: false, message: "Failed to delete class", error };
  }
};
