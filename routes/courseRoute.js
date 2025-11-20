import express from "express";
import multer from "multer";
import path from "path";
import {
  createCourseController,
  getAllCoursesController,
  getCourseByIdController,
  updateCourseController,
  deleteCourseController,
} from "../controllers/courseController.js";

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
router.post("/add", upload.single("course"), createCourseController);
router.get("/get", getAllCoursesController);
router.get("/get/:id", getCourseByIdController);
router.put("/update/:id", upload.single("course"), updateCourseController);
router.delete("/delete/:id", deleteCourseController);

export default router;
