import { Types } from "mongoose";

import { Event } from "../events/event.model.js";
import { Seat } from "../seats/seat.model.js";
import { Hold } from "./hold.model.js";
import redisClient from "../../config/redis.js";

const HOLD_DURATION_SECONDS = 5 * 60;

/**
 * Atomically acquires all requested seat locks.
 *
 * Returns:
 * 1 → all seats were successfully locked
 * 0 → at least one seat was already locked
 */
const acquireSeatsScript = `
  for i = 1, #KEYS do
    if redis.call("EXISTS", KEYS[i]) == 1 then
      return 0
    end
  end

  for i = 1, #KEYS do
    redis.call(
      "SET",
      KEYS[i],
      ARGV[1],
      "EX",
      ARGV[2]
    )
  end

  return 1
`;

export async function createHold(
  eventId: string,
  userId: string,
  seatIds: string[]
) {
  // 1. Validate event ID
  if (!Types.ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  // 2. Validate user ID
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // 3. Validate every seat ID
  const validSeatIds = seatIds.filter((seatId) =>
    Types.ObjectId.isValid(seatId)
  );

  if (validSeatIds.length !== seatIds.length) {
    throw new Error("Invalid seat ID");
  }

  // 4. Prevent duplicate seat selection
  const uniqueSeatIds = [...new Set(validSeatIds)];

  if (uniqueSeatIds.length !== validSeatIds.length) {
    throw new Error("Duplicate seat IDs are not allowed");
  }

  // 5. Find the event
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  // 6. Only published events can accept bookings
  if (event.status !== "PUBLISHED") {
    throw new Error("Event is not available for booking");
  }

  // 7. Find all requested seats belonging to this event
  const seats = await Seat.find({
    _id: {
      $in: uniqueSeatIds.map(
        (seatId) => new Types.ObjectId(seatId)
      ),
    },
    eventId: new Types.ObjectId(eventId),
  });

  // 8. Make sure every requested seat exists
  //    and belongs to this event
  if (seats.length !== uniqueSeatIds.length) {
    throw new Error(
      "One or more seats do not belong to this event"
    );
  }

  // 9. Check persistent MongoDB seat status
  const unavailableSeat = seats.find(
    (seat) => seat.status !== "AVAILABLE"
  );

  if (unavailableSeat) {
    throw new Error(
      `Seat ${unavailableSeat.label} is not available`
    );
  }

  // 10. Calculate hold expiration
  const expiresAt = new Date(
    Date.now() + HOLD_DURATION_SECONDS * 1000
  );

  // 11. Create the Hold document
  const hold = await Hold.create({
    userId: new Types.ObjectId(userId),
    eventId: new Types.ObjectId(eventId),
    seatIds: seats.map((seat) => seat._id),
    expiresAt,
    status: "ACTIVE",
  });

  try {
    // 12. Create one Redis key for every seat
    const seatKeys = seats.map(
      (seat) => `seat:hold:${eventId}:${seat._id}`
    );

    // 13. Atomically acquire ALL seat locks
    const result = await redisClient.eval(
      acquireSeatsScript,
      {
        keys: seatKeys,
        arguments: [
          hold._id.toString(),
          HOLD_DURATION_SECONDS.toString(),
        ],
      }
    );

    // 14. If any seat was already held,
    //     none of the requested seats are locked
    if (result !== 1) {
      await Hold.findByIdAndUpdate(hold._id, {
        status: "CANCELLED",
      });

      throw new Error(
        "One or more seats are temporarily held by another user"
      );
    }

    // 15. Everything succeeded
    return hold;
  } catch (error) {
    // 16. If anything failed, cancel the MongoDB hold
    await Hold.findByIdAndUpdate(hold._id, {
      status: "CANCELLED",
    });

    throw error;
  }
}

export async function cancelHold(
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

  // 2. Find the hold
  const hold = await Hold.findById(holdId);

  if (!hold) {
    throw new Error("Hold not found");
  }

  // 3. Make sure the logged-in user owns the hold
  if (hold.userId.toString() !== userId) {
    throw new Error(
      "You do not have permission to cancel this hold"
    );
  }

  // 4. Hold must still be active
  if (hold.status !== "ACTIVE") {
    throw new Error(
      `Hold cannot be cancelled because it is ${hold.status.toLowerCase()}`
    );
  }

  // 5. Check whether the hold has already expired
  if (hold.expiresAt.getTime() <= Date.now()) {
    hold.status = "EXPIRED";
    await hold.save();

    throw new Error("Hold has already expired");
  }

  // 6. Build Redis keys
  const seatKeys = hold.seatIds.map(
    (seatId) =>
      `seat:hold:${hold.eventId}:${seatId}`
  );

  // 7. Delete only locks belonging to THIS hold
  const releaseSeatsScript = `
    for i = 1, #KEYS do
      if redis.call("GET", KEYS[i]) == ARGV[1] then
        redis.call("DEL", KEYS[i])
      end
    end

    return 1
  `;

  await redisClient.eval(
    releaseSeatsScript,
    {
      keys: seatKeys,
      arguments: [hold._id.toString()],
    }
  );

  // 8. Mark hold as cancelled
  hold.status = "CANCELLED";
  await hold.save();

  return hold;
}