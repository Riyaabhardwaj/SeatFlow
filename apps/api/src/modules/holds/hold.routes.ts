import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {  cancelHoldController,
  createHoldController, } from "./hold.controller.js";

const router = Router();

router.post(
  "/events/:eventId/holds",
  requireAuth,
  requireRole("CUSTOMER"),
  createHoldController
);

router.delete(
  "/holds/:holdId",
  requireAuth,
  requireRole("CUSTOMER"),
  cancelHoldController
);

export default router;