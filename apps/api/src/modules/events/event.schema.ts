import { z } from "zod";

export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Event name must contain at least 3 characters")
    .max(200),

  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters")
    .max(5000),

  category: z
    .string()
    .trim()
    .min(2)
    .max(100),

  venue: z
    .string()
    .trim()
    .min(2)
    .max(200),

  city: z
    .string()
    .trim()
    .min(2)
    .max(100),

  eventDate: z
    .string()
    .datetime(),

  startTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Start time must use HH:mm format"
    ),

  endTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "End time must use HH:mm format"
    )
    .optional(),

  banner: z
    .string()
    .url()
    .optional(),

  capacity: z
    .number()
    .int()
    .positive()
    .max(100000),
});

export const updateEventSchema =
  createEventSchema.partial();