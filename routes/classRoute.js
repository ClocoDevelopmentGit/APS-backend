import express from "express";
import {
  createClassController,
  getAllClassesController,
  getClassByIdController,
  updateClassController,
  deleteClassController,
} from "../controllers/classController.js";

const router = express.Router();

router.post("/add", createClassController);
router.get("/get", getAllClassesController);
router.get("/get/:id", getClassByIdController);
router.put("/update/:id", updateClassController);
router.delete("/delete/:id", deleteClassController);

export default router;
