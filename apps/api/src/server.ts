import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes.js";

import { connectDatabase } from "./config/database.js";
dotenv.config();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SeatFlow API is running",
  });
});

app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 5000;

async function startServer(){
  await connectDatabase();

  app.listen(PORT, () => {
  console.log(`SeatFlow API running on port ${PORT}`);
});
}

startServer();
