import { z } from "zod";

const seatSectionSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1)
    .max(50),

  rows: z
    .number()
    .int()
    .min(1)
    .max(26),

  seatsPerRow: z
    .number()
    .int()
    .min(1)
    .max(100),

  price: z
    .number()
    .min(0),
});

export const generateSeatsSchema = z.object({
  sections: z
    .array(seatSectionSchema)
    .min(1)
    .max(20),
});

export const updateSeatStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "BLOCKED"]),
});