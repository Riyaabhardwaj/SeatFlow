import { Router } from "express";

import {
  getCurrentUser,
  login,
  register,
} from "./auth.controller.js";

import {
  requireAuth,
} from "../../middleware/auth.middleware.js";

import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get(
  "/me",
  requireAuth,
  getCurrentUser
);


export default router;