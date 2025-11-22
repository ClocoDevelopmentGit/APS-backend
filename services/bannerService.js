import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createBanner = async (data) => {
  try {
    const {
      mediaUrl,
      mediaType,
      title,
      subtitle,
      button1Text,
      button1Link,
      button2Text,
      button2Link,
      createdBy,
      order,
    } = data;

    const requiredFields = {
      title,
      mediaUrl,
      mediaType,
    };

    for (const key in requiredFields) {
      if (!requiredFields[key]) {
        return { success: false, message: `${key} is required` };
      }
    }

    const banner = await prisma.banner.create({
      data: {
        mediaUrl,
        mediaType,
        title,
        subtitle,
        button1Text,
        button1Link,
        button2Text,
        button2Link,
        createdBy,
        order,
      },
    });

    return { success: true, banner };
  } catch (error) {
    console.error("Error creating banner:", error);
    return { success: false, message: "Failed to create banner", error };
  }
};

export const getAllBanners = async () => {
  try {
    const banner = await prisma.banner.findMany({ orderBy: { order: "asc" } });
    if (!banner || banner.length === 0) {
      return { success: false, message: "No banners found" };
    }

    return { success: true, banner };
  } catch (error) {
    console.error("Error fetching banners:", error);
    return { success: false, message: "Failed to fetch banners", error };
  }
};

export const getBannerById = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return { success: false, message: "Banner not found" };
    }

    return { success: true, banner };
  } catch (error) {
    console.error("Error fetching banner:", error);
    return { success: false, message: "Failed to fetch banner", error };
  }
};

export const updateBanner = async (id, data) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const {
      mediaUrl,
      mediaType,
      title,
      subtitle,
      button1Text,
      button1Link,
      button2Text,
      button2Link,
      updatedBy,
      order,
    } = data;

    const requiredFields = {
      title,
      mediaUrl,
      mediaType,
    };

    for (const key in requiredFields) {
      if (!requiredFields[key]) {
        return { success: false, message: `${key} is required` };
      }
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        mediaUrl,
        mediaType,
        title,
        subtitle,
        button1Text,
        button1Link,
        button2Text,
        button2Link,
        updatedBy,
        order,
      },
    });

    return { success: true, banner };
  } catch (error) {
    console.error("Error updating banner:", error);
    return { success: false, message: "Failed to update banner", error };
  }
};

export const deleteBanner = async (id) => {
  try {
    if (!id) {
      return { success: false, message: "id is required" };
    }

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return { success: false, message: "Banner not found" };
    }

    await prisma.banner.delete({ where: { id } });
    return { success: true, message: "Banner deleted successfully" };
  } catch (error) {
    console.error("Error deleting banner:", error);
    return { success: false, message: "Failed to delete banner".error };
  }
};
