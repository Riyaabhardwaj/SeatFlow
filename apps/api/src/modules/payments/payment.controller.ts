import { Request, Response } from "express";

import { createRazorpayOrder } from "./payment.service.js";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export async function createPaymentOrderController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { bookingId } = req.body;

    if (
      typeof bookingId !== "string" ||
      bookingId.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const order = await createRazorpayOrder(
      bookingId,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "You do not have permission to pay for this booking"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (
      message ===
        "Booking is not awaiting payment" ||
      message ===
        "Payment has already been processed"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}