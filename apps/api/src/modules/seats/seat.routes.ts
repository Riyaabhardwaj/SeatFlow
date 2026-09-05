import { Router } from "express";

import {
  requireAuth,
} from "../../middleware/auth.middleware.js";

import {
  requireRole,
} from "../../middleware/role.middleware.js";

import {
  generateSeatsController,
  getEventSeatsController,
  updateSeatStatusController,
} from "./seat.controller.js";

const router = Router();

// Public — view seats for an event
router.get(
  "/events/:eventId/seats",
  getEventSeatsController
);

// Organizer/Admin — generate seats
router.post(
  "/events/:eventId/seats/generate",
  requireAuth,
  requireRole("ORGANIZER", "SUPER_ADMIN"),
  generateSeatsController
);

router.patch(
  "/seats/:seatId/status",
  requireAuth,
  requireRole("ORGANIZER", "SUPER_ADMIN"),
  updateSeatStatusController
);

export default router;