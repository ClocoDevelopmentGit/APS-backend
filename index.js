import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import bannerRoutes from "./routes/bannerRoute.js";
import testimonialRoutes from "./routes/testimonialRoute.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import "./cron/testimonialCron.js";
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/api/banner", bannerRoutes);
app.use("/api/testimonial", testimonialRoutes);
app.use("/api/users", userRoutes)

// Global Error Handler (AFTER routes)
app.use(errorHandler);

export default app;
