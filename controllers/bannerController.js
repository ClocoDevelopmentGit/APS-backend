import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "../services/bannerService.js";
import bucket from "../utils/gcsService.js";

export const createBannerController = async (req, res) => {
  try {
    let logoPath = null;
    let publicUrl = null;

    if (req.file) {
      const filename = req.file.originalname;
      logoPath = `banners/${filename}`;
      const gcsFile = bucket.file(logoPath);

      await gcsFile.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
      });

      await gcsFile.makePublic();

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${logoPath}`;
    }
    req.body.mediaUrl = publicUrl;
    req.body.mediaType = req.file.mimetype;
    const result = await createBanner(req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBannersController = async (req, res) => {
  try {
    const result = await getAllBanners();
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBannerByIdController = async (req, res) => {
  try {
    const result = await getBannerById(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBannerController = async (req, res) => {
  try {
    let logoPath = null;
    let publicUrl = null;

    if (req.file) {
      const filename = req.file.originalname;
      logoPath = `banners/${filename}`;
      const gcsFile = bucket.file(logoPath);

      await gcsFile.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
      });

      await gcsFile.makePublic();

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${logoPath}`;
    }
    req.body.mediaUrl = publicUrl;
    req.body.mediaType = req.file.mimetype;
    const result = await updateBanner(req.params.id, req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBannerController = async (req, res) => {
  try {
    const result = await deleteBanner(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
