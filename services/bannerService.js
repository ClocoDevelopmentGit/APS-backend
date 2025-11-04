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
    } = data;

    if (!title || !mediaType || !mediaUrl) {
      return {
        success: false,
        message: "title, mediaType, and mediaUrl are required",
      };
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
      },
    });

    return { success: true, banner };
  } catch {
    return { success: false, message: "Failed to create banner" };
  }
};

export const getAllBanners = async () => {
  try {
    const banner = await prisma.banner.findMany({ orderBy: { title: "asc" } });
    if (!banner || banner.length === 0) {
      return { success: false, message: "No banners found" };
    }

    return { success: true, banner };
  } catch {
    return { success: false, message: "Failed to fetch banners" };
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
  } catch {
    return { success: false, message: "Failed to fetch banner" };
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
    } = data;

    if (!title || !mediaType || !mediaUrl) {
      return {
        success: false,
        message: "title, mediaType, and mediaUrl are required",
      };
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
      },
    });

    return { success: true, banner };
  } catch {
    return { success: false, message: "Failed to update banner" };
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
  } catch {
    return { success: false, message: "Failed to delete banner" };
  }
};
