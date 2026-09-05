import { z } from "zod";

export const createBookingSchema = z.object({
  holdId: z
    .string()
    .min(1, "Hold ID is required"),
});