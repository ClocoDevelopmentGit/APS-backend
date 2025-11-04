import express from "express";
import {
  createBannerController,
  getAllBannersController,
  getBannerByIdController,
  updateBannerController,
  deleteBannerController,
} from "../controllers/bannerController.js";

const router = express.Router();

router.post("/add", createBannerController);
router.get("/get", getAllBannersController);
router.get("/get/:id", getBannerByIdController);
router.put("/update/:id", updateBannerController);
router.delete("/delete/:id", deleteBannerController);

export default router;
