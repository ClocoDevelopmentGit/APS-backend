import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createCourse = async (data) => {
  try {
    const { name, description, isActive, createdBy } = data;

    if (!name) {
      return {
        success: false,
        message: "name is required",
      };
    }

    const course = await prisma.course.create({
      data: {
        name,
        description,
        isActive,
        createdBy,
      },
    });

    return { success: true, course };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, message: "Failed to create course", error };
  }
};

export const getAllCategories = async () => {
  try {
    const course = await prisma.course.findMany({
      orderBy: { createdAt: "asc" },
    });
    if (!course || course.length === 0) {
      return { success: false, message: "No courses found" };
    }

    return { success: true, course };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, message: "Failed to fetch courses", error };
  }
};

export const getCourseById = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const course = await prisma.course.findUnique({ where: { id } });
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

    const { name, description, isActive, updatedBy } = data;

    if (!name) {
      return {
        success: false,
        message: "name is required",
      };
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        updatedBy,
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
