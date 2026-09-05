import { Schema, model, Types } from "mongoose";

export type SeatStatus =
  | "AVAILABLE"
  | "BLOCKED"
  | "BOOKED";

export interface ISeat {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  row: string;
  number: number;
  label: string;
  category: string;
  price: number;
  status: SeatStatus;
}
const seatSchema = new Schema<ISeat>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    row: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    number: {
      type: Number,
      required: true,
      min: 1,
    },

    label: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "BOOKED",
        "BLOCKED",
      ],
      default: "AVAILABLE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate seat labels within the same event.
seatSchema.index(
  {
    eventId: 1,
    label: 1,
  },
  {
    unique: true,
  }
);

// Optimize seat-map queries and ordering.
seatSchema.index({
  eventId: 1,
  row: 1,
  number: 1,
});

export const Seat = model<ISeat>(
  "Seat",
  seatSchema
);