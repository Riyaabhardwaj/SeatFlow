import { Request,Response } from "express";
import {
  AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";

import { createEventSchema,updateEventSchema } from "./event.schema.js";
import { createEvent, getMyEvents,getPublishedEventById,getPublishedEvents,updateEvent,publishEvent } from "./event.service.js";

export async function createEventController(
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

    const validation = createEventSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const event = await createEvent(
      validation.data,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Event date must be in the future" ||
      message === "Invalid event date"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Create event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getEventsController(
  _req: Request,
  res: Response
) {
  try {
    const events = await getPublishedEvents();

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getEventByIdController(
  req: Request,
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

const event = await getPublishedEventById(eventId);
    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid event ID" ||
      message === "Event not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    console.error("Get event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getMyEventsController(
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

    const events = await getMyEvents(req.user.userId);

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get my events error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function updateEventController(
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

    const validation = updateEventSchema.safeParse(
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const event = await updateEvent(
      eventId,
      req.user.userId,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid event ID" ||
      message === "Invalid user ID" ||
      message === "Event not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "You do not have permission to modify this event"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (
      message === "Invalid event date" ||
      message ===
        "Event date must be in the future"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Update event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function publishEventController(
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

    const event = await publishEvent(
      eventId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: event,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (
      message === "Invalid event ID" ||
      message === "Invalid user ID" ||
      message === "Event not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
        "You do not have permission to publish this event" ||
      message === "Only draft events can be published" ||
      message === "Cannot publish an event in the past"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Publish event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
 