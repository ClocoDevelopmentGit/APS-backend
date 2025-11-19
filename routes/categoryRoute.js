import express from "express";
import {
  createCategoryController,
  getAllCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/categoryController.js";

const router = express.Router();

router.post("/add", createCategoryController);
router.get("/get", getAllCategoriesController);
router.get("/get/:id", getCategoryByIdController);
router.put("/update/:id", updateCategoryController);
router.delete("/delete/:id", deleteCategoryController);

export default router;
