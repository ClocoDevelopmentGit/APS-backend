// src/routes/googlePlaceRoutes.js
import express from "express";
import { fetchPlaceDetails } from "../controllers/testimonialController.js";

const router = express.Router();

router.get("/", fetchPlaceDetails);

export default router;
