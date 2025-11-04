import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bannerRoutes from "./routes/bannerRoutes.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 9000;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
