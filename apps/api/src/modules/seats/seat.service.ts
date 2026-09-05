import { Types } from "mongoose";
import { Seat } from "./seat.model.js";
import { Event } from "../events/event.model.js";

interface SeatSectionInput {
  category: string;
  rows: number;
  seatsPerRow: number;
  price: number;
}

export async function generateSeats(
  eventId: string,
  userId: string,
  sections: SeatSectionInput[]
) {
  // 1. Validate event ID
  if (!Types.ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  // 2. Validate user ID
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // 3. Find the event
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  // 4. Check ownership
  const isOwner =
    event.createdBy.toString() === userId;

  if (!isOwner) {
    throw new Error(
      "You do not have permission to manage seats for this event"
    );
  }

  // 5. Seats should only be generated while event is a draft
  if (event.status !== "DRAFT") {
    throw new Error(
      "Seats can only be generated for draft events"
    );
  }

  // 6. Prevent generating seats twice
  const existingSeat = await Seat.findOne({
    eventId: new Types.ObjectId(eventId),
  });

  if (existingSeat) {
    throw new Error(
      "Seats have already been generated for this event"
    );
  }

  const seats = [];

  let rowIndex = 0;

  // 7. Generate seats section by section
  for (const section of sections) {
    for (
      let row = 0;
      row < section.rows;
      row++
    ) {
      const rowLabel = String.fromCharCode(
        65 + rowIndex
      );

      for (
        let number = 1;
        number <= section.seatsPerRow;
        number++
      ) {
        seats.push({
          eventId: new Types.ObjectId(eventId),
          row: rowLabel,
          number,
          label: `${rowLabel}${number}`,
          category: section.category,
          price: section.price,
          status: "AVAILABLE" as const,
        });
      }

      rowIndex++;
    }
  }

  // 8. Make sure something was generated
  if (seats.length === 0) {
    throw new Error("No seats to generate");
  }

  // 9. Save all seats
  return Seat.insertMany(seats);
}

export async function getEventSeats(eventId: string) {
  if (!Types.ObjectId.isValid(eventId)) {
    throw new Error("Invalid event ID");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  const seats = await Seat.find({
    eventId: new Types.ObjectId(eventId),
  })
    .sort({
      row: 1,
      number: 1,
    })
    .lean();

  return seats;
}

export async function updateSeatStatus(
  seatId: string,
  userId: string,
  status: "AVAILABLE" | "BLOCKED"
) {
  if (!Types.ObjectId.isValid(seatId)) {
    throw new Error("Invalid seat ID");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const seat = await Seat.findById(seatId);

  if (!seat) {
    throw new Error("Seat not found");
  }

  const event = await Event.findById(seat.eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  const isOwner =
    event.createdBy.toString() === userId;

  if (!isOwner) {
    throw new Error(
      "You do not have permission to manage this seat"
    );
  }

  if (seat.status === "BOOKED") {
    throw new Error(
      "Booked seats cannot be manually modified"
    );
  }

  seat.status = status;

  await seat.save();

  return seat;
}