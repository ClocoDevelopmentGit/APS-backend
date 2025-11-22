import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createCourse = async (data) => {
  try {
    const {
      title,
      courseCategoryId,
      ageRange,
      mediaUrl,
      mediaType,
      description,
      isActive,
      createdBy,
    } = data;

    const requiredFields = {
      title,
      courseCategoryId,
      mediaUrl,
      mediaType,
    };

    for (const key in requiredFields) {
      if (!requiredFields[key]) {
        return { success: false, message: `${key} is required` };
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        courseCategoryId,
        ageRange,
        mediaUrl,
        mediaType,
        description,
        isActive,
        createdBy,
      },
      include: {
        courseCategory: true,
        classes: true,
      },
    });

    return { success: true, course };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, message: "Failed to create course", error };
  }
};

export const getAllCourses = async (filters = {}) => {
  try {
    const { title, courseCategoryId, isActive, ageRange, location } = filters;

    const course = await prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      where: {
        name: title ? { contains: title, mode: "insensitive" } : undefined,
        courseCategoryId: courseCategoryId || undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        ageRange: ageRange || undefined,
        classes: location
          ? {
              some: {
                location: {
                  contains: location,
                  mode: "insensitive",
                },
              },
            }
          : undefined,
      },
      include: {
        courseCategory: true,
        classes: true,
      },
    });

    if (!course || course.length === 0) {
      return { success: false, message: "No courses found" };
    }

    return { success: true, course };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      message: "Failed to fetch courses",
      error,
    };
  }
};

export const getCourseById = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        courseCategory: true,
        classes: true,
      },
    });
    if (!course) {
      return { success: false, message: "Course not found" };
    }

    return { success: true, course };
  } catch (error) {
    console.error("Error fetching course:", error);
    return { success: false, message: "Failed to fetch course", error };
  }
};

export const updateCourse = async (id, data) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const {
      title,
      courseCategoryId,
      ageRange,
      mediaUrl,
      mediaType,
      description,
      isActive,
      createdBy,
    } = data;

    const requiredFields = {
      title,
      courseCategoryId,
      mediaUrl,
      mediaType,
    };

    for (const key in requiredFields) {
      if (!requiredFields[key]) {
        return { success: false, message: `${key} is required` };
      }
    }

    const courseExists = await prisma.course.findUnique({
      where: { id },
    });

    if (!courseExists) {
      return { success: false, message: "Course not found" };
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        title,
        courseCategoryId,
        ageRange,
        mediaUrl,
        mediaType,
        description,
        isActive,
        createdBy,
      },
      include: {
        courseCategory: true,
        classes: true,
      },
    });

    return { success: true, course };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, message: "Failed to update course", error };
  }
};

export const deleteCourse = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return { success: false, message: "Course not found" };
    }

    await prisma.course.delete({ where: { id } });
    return { success: true, message: "Course deleted successfully" };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { success: false, message: "Failed to delete course".error };
  }
};
