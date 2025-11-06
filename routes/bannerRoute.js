import express from "express";
import multer from "multer";
import path from "path";
import {
  createBannerController,
  getAllBannersController,
  getBannerByIdController,
  updateBannerController,
  deleteBannerController,
} from "../controllers/bannerController.js";

const router = express.Router();
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mkv"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"), false);
    }
  },
});
router.post("/add", upload.single("banner"), createBannerController);
router.get("/get", getAllBannersController);
router.get("/get/:id", getBannerByIdController);
router.put("/update/:id", upload.single("banner"), updateBannerController);
router.delete("/delete/:id", deleteBannerController);

export default router;
