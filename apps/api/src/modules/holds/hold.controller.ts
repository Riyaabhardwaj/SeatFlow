import { Request, Response } from "express";

import { createHoldSchema } from "./hold.schema.js";
import { createHold,cancelHold } from "./hold.service.js";

interface AuthenticatedRequest<
  Params extends Record<string, string> = { eventId: string }
> extends Request<Params> {
  user?: {
    userId: string;
  };
}

export async function createHoldController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { eventId } = req.params;

    // Make sure authentication middleware
    // has attached the logged-in user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate request body
    const validation = createHoldSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: validation.error.flatten(),
      });
    }

    const hold = await createHold(
      eventId,
      req.user.userId,
      validation.data.seatIds
    );

    return res.status(201).json({
      success: true,
      message: "Seats held successfully",
      data: {
        holdId: hold._id,
        eventId: hold.eventId,
        seatIds: hold.seatIds,
        expiresAt: hold.expiresAt,
        status: hold.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (message === "Invalid event ID") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "Invalid seat ID") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "Duplicate seat IDs are not allowed") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "Event not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Event is not available for booking") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "One or more seats do not belong to this event"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message.includes("is not available")) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "One or more seats are temporarily held by another user"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Create hold error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function cancelHoldController(
  req: AuthenticatedRequest<{ holdId: string }>,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { holdId } = req.params;

    const hold = await cancelHold(
      holdId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Hold cancelled successfully",
      data: {
        holdId: hold._id,
        status: hold.status,
        seatIds: hold.seatIds,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (message === "Invalid hold ID") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "Invalid user ID") {
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
      "You do not have permission to cancel this hold"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (message === "Hold has already expired") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message.startsWith("Hold cannot be cancelled")) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Cancel hold error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}