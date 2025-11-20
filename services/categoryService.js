import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createCategory = async (data) => {
  try {
    const { name, description, isActive, createdBy } = data;

    if (!name) {
      return {
        success: false,
        message: "name is required",
      };
    }

    const categoryNameCheck = await prisma.courseCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (categoryNameCheck) {
      return { success: false, message: "Category name already exists" };
    }

    const category = await prisma.courseCategory.create({
      data: {
        name,
        description,
        isActive,
        createdBy,
      },
    });

    return { success: true, category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, message: "Failed to create category", error };
  }
};

export const getAllCategories = async () => {
  try {
    const category = await prisma.courseCategory.findMany({
      orderBy: { createdAt: "asc" },
    });
    if (!category || category.length === 0) {
      return { success: false, message: "No categorys found" };
    }

    return { success: true, category };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, message: "Failed to fetch categorys", error };
  }
};

export const getCategoryById = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const category = await prisma.courseCategory.findUnique({ where: { id } });
    if (!category) {
      return { success: false, message: "Category not found" };
    }

    return { success: true, category };
  } catch (error) {
    console.error("Error fetching category:", error);
    return { success: false, message: "Failed to fetch category", error };
  }
};

export const updateCategory = async (id, data) => {
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

    const categoryExists = await prisma.courseCategory.findUnique({
      where: { id },
    });

    if (!categoryExists) {
      return { success: false, message: "Category not found" };
    }

    const categoryNameCheck = await prisma.courseCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (categoryNameCheck) {
      return { success: false, message: "Category name already exists" };
    }

    const category = await prisma.courseCategory.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        updatedBy,
      },
    });

    return { success: true, category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, message: "Failed to update category", error };
  }
};

export const deleteCategory = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const category = await prisma.courseCategory.findUnique({ where: { id } });
    if (!category) {
      return { success: false, message: "Category not found" };
    }

    await prisma.courseCategory.delete({ where: { id } });
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, message: "Failed to delete category".error };
  }
};
