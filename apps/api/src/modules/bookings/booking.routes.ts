import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

import {
  createBookingController,
} from "./booking.controller.js";

const router = Router();

router.post(
  "/bookings",
  requireAuth,
  requireRole("CUSTOMER"),
  createBookingController
);

export default router;