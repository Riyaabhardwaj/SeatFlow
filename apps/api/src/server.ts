import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import eventRoutes from "./modules/events/event.routes.js";
import { connectDatabase } from "./config/database.js";
import seatRoutes from "./modules/seats/seat.routes.js";
import redisClient from "./config/redis.js";
import holdRoutes from "./modules/holds/hold.routes.js";
import bookingRoutes from "./modules/bookings/booking.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";


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
app.use("/api/events", eventRoutes);
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SeatFlow API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", seatRoutes);
app.use("/api", holdRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentRoutes);
const PORT = process.env.PORT || 5000;

async function startServer(){
  await connectDatabase();
await redisClient.connect();

  app.listen(PORT, () => {
  console.log(`SeatFlow API running on port ${PORT}`);
});
}



startServer();
