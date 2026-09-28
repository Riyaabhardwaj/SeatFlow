import {
  Types,
  startSession,
} from "mongoose";

import { Hold } from "../holds/hold.model.js";
import { Seat } from "../seats/seat.model.js";
import { Booking } from "./booking.model.js";

function generateBookingReference(): string {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `SF-${timestamp}-${random}`;
}

export async function createBooking(
  holdId: string,
  userId: string
) {
  // 1. Validate IDs
  if (!Types.ObjectId.isValid(holdId)) {
    throw new Error("Invalid hold ID");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const session = await startSession();

  try {
    let createdBooking;

    await session.withTransaction(async () => {
      // 2. Find hold inside transaction
      const hold = await Hold.findById(holdId).session(
        session
      );

      if (!hold) {
        throw new Error("Hold not found");
      }

      // 3. Verify ownership
      if (hold.userId.toString() !== userId) {
        throw new Error(
          "You do not have permission to use this hold"
        );
      }

      // 4. Hold must be active
      if (hold.status !== "ACTIVE") {
        throw new Error(
          `Hold cannot be used because it is ${hold.status.toLowerCase()}`
        );
      }

      // 5. Check expiration
      if (hold.expiresAt.getTime() <= Date.now()) {
        hold.status = "EXPIRED";

        await hold.save({ session });

        throw new Error("Hold has expired");
      }

      // 6. Fetch seats inside transaction
      const seats = await Seat.find({
        _id: {
          $in: hold.seatIds,
        },
        eventId: hold.eventId,
      }).session(session);

      // 7. Make sure all seats exist
      if (seats.length !== hold.seatIds.length) {
        throw new Error(
          "One or more seats from the hold no longer exist"
        );
      }

      // 8. Seats must still be AVAILABLE
      const unavailableSeat = seats.find(
        (seat) => seat.status !== "AVAILABLE"
      );

      if (unavailableSeat) {
        throw new Error(
          `Seat ${unavailableSeat.label} is no longer available`
        );
      }

      // 9. Calculate amount from database
      const totalAmount = seats.reduce(
        (total, seat) => total + seat.price,
        0
      );

      // 10. Generate booking reference
      const bookingReference =
        generateBookingReference();

      // 11. Create booking inside transaction
      const booking = new Booking({
        bookingReference,
        userId: hold.userId,
        eventId: hold.eventId,
        holdId: hold._id,
        seatIds: hold.seatIds,
        totalAmount,
        bookingStatus: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
      });

      await booking.save({ session });

      // 12. Convert hold inside same transaction
      hold.status = "CONVERTED";

      await hold.save({ session });

      createdBooking = booking;
    });

    return createdBooking;
  } finally {
    await session.endSession();
  }
}