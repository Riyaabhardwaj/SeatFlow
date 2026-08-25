import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

import {
  createEventController,
  getEventByIdController,
  getEventsController,
    getMyEventsController,
    updateEventController,
    publishEventController,
} from "./event.controller.js";

const router = Router();
router.get("/", getEventsController);
router.get(
  "/my",
  requireAuth,
  requireRole("ORGANIZER", "SUPER_ADMIN"),
  getMyEventsController
);

router.patch(
  "/:eventId/publish",
  requireAuth,
  requireRole("ORGANIZER", "SUPER_ADMIN"),
  publishEventController
);
router.get(
  "/:eventId",
  getEventByIdController
);
router.post(
  "/",
  requireAuth,
  requireRole("ORGANIZER", "SUPER_ADMIN"),
  createEventController
);
router.patch(
  "/:eventId",
  requireAuth,
  requireRole("ORGANIZER", "SUPER_ADMIN"),
  updateEventController
);
export default router;