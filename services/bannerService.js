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
        order,
      },
    });

    return { success: true, banner };
  } catch (error) {
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
        order,
      },
    });

    return { success: true, banner };
  } catch (error) {
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
    return { success: false, message: "Failed to delete banner".error };
  }
};
