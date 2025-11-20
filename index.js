import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import bannerRoutes from "./routes/bannerRoute.js";
import testimonialRoutes from "./routes/testimonialRoute.js";
// import instagramRoutes from "./routes/instagramRoute.js";
import categoryRoutes from "./routes/categoryRoute.js";
import userRoutes from "./routes/userRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import "./cron/testimonialCron.js";
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://aps-frontend-11757167141.us-central1.run.app",
      "https://apsdev.cloco.com.au",
      "https://apsuat.cloco.com.au",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(errorHandler);

app.use("/api/banner", bannerRoutes);
app.use("/api/testimonial", testimonialRoutes);
app.use("/api/users", userRoutes)
app.use("/api/users", loginRoutes);
// app.use("/api/instagram", instagramRoutes);
app.use("/api/category", categoryRoutes);

export default app;
