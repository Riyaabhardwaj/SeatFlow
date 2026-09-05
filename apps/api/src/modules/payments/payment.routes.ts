import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

import {
  createPaymentOrderController,
} from "./payment.controller.js";

const router = Router();

router.post(
  "/payments/order",
  requireAuth,
  requireRole("CUSTOMER"),
  createPaymentOrderController
);

export default router;