import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import bannerRoutes from "./routes/bannerRoute.js";
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/api/banner", bannerRoutes);

export default app;
