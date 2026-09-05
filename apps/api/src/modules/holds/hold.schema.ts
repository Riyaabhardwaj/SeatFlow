import { z } from "zod";

export const createHoldSchema = z.object({
  seatIds: z
    .array(z.string().min(1))
    .min(1, "At least one seat must be selected")
    .max(10, "You can hold a maximum of 10 seats at once"),
});