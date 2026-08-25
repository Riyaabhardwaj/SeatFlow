import { Schema, model, Types } from "mongoose";

export type SeatStatus = "AVAILABLE" | "BLOCKED";

export interface ISeat {
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
      enum: ["AVAILABLE", "BLOCKED"],
      default: "AVAILABLE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index(
  {
    eventId: 1,
    label: 1,
  },
  {
    unique: true,
  }
);

export const Seat = model<ISeat>("Seat", seatSchema);