import { Request, Response } from "express";

import { createBookingSchema } from "./booking.schema.js";
import { createBooking } from "./booking.service";

interface AuthenticatedRequest
  extends Request {
  user?: {
    userId: string;
  };
}

export async function createBookingController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    // 1. Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2. Validate request body
    const validation = createBookingSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: validation.error.flatten(),
      });
    }

    // 3. Create booking from the user's hold
    const booking = await createBooking(
      validation.data.holdId,
      req.user.userId
    );

    // 4. Return booking information
    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        eventId: booking.eventId,
        seatIds: booking.seatIds,
        totalAmount: booking.totalAmount,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid hold ID" ||
      message === "Invalid user ID"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "Hold not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "You do not have permission to use this hold"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (
      message === "Hold has expired" ||
      message.startsWith("Hold cannot be used because it is")
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "One or more seats from the hold no longer exist"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message.includes("is no longer available")) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}