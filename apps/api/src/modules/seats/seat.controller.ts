import { Request,Response } from "express";

import {
  AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";

import {
  generateSeatsSchema,
  updateSeatStatusSchema,
} from "./seat.schema.js";

import {
  generateSeats, getEventSeats,updateSeatStatus,
} from "./seat.service.js";

export async function generateSeatsController(
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

    const { eventId } = req.params;

    if (!eventId || Array.isArray(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const validation =
      generateSeatsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const seats = await generateSeats(
      eventId,
      req.user.userId,
      validation.data.sections
    );

    return res.status(201).json({
      success: true,
      message: "Seats generated successfully",
      data: {
        count: seats.length,
        seats,
      },
    });
  } catch (error) {
    console.error(
      "Generate seats error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid event ID" ||
      message === "Invalid user ID"
    ) {
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

    if (
      message ===
      "You do not have permission to manage seats for this event"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Seats can only be generated for draft events"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Seats have already been generated for this event"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message === "No seats to generate") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate seat detected",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getEventSeatsController(
  req: Request<{ eventId: string }>,
  res: Response
) {
  try {
    const { eventId } = req.params;

    if (!eventId || Array.isArray(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const seats = await getEventSeats(eventId);

    return res.status(200).json({
      success: true,
      data: {
        count: seats.length,
        seats,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid event ID"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message === "Event not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error(
      "Get event seats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function updateSeatStatusController(
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

    const { seatId } = req.params;

    if (!seatId || Array.isArray(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    const validation =
      updateSeatStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const seat = await updateSeatStatus(
      seatId,
      req.user.userId,
      validation.data.status
    );

    return res.status(200).json({
      success: true,
      message: "Seat status updated successfully",
      data: seat,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid seat ID" ||
      message === "Invalid user ID"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message === "Seat not found" ||
      message === "Event not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "You do not have permission to manage this seat"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "Booked seats cannot be manually modified"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error(
      "Update seat status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}