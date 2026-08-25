import { Schema, model, Types } from "mongoose";

export type HoldStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "RELEASED"
  | "CONVERTED";

export interface IHold {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  seatId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  status: HoldStatus;
  expiresAt: Date;
}

const holdSchema = new Schema<IHold>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    seatId: {
      type: Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
      index: true,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "EXPIRED",
        "RELEASED",
        "CONVERTED",
      ],
      default: "ACTIVE",
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

holdSchema.index(
  {
    eventId: 1,
    seatId: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "ACTIVE",
    },
  }
);

export const Hold = model<IHold>("Hold", holdSchema);