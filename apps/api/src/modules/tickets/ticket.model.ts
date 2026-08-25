import { Schema, model, Types } from "mongoose";

export type CheckInStatus =
  | "NOT_CHECKED_IN"
  | "CHECKED_IN";

export interface ITicket {
  bookingId: Types.ObjectId;
  ticketNumber: string;
  qrToken: string;
  checkInStatus: CheckInStatus;
  checkedInAt?: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    checkInStatus: {
      type: String,
      enum: ["NOT_CHECKED_IN", "CHECKED_IN"],
      default: "NOT_CHECKED_IN",
    },

    checkedInAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Ticket = model<ITicket>("Ticket", ticketSchema);