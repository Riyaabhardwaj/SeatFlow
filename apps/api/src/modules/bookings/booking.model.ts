import { Schema, model, Types } from "mongoose";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface IBooking {
  bookingReference: string;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  seatIds: Types.ObjectId[];
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  idempotencyKey: string;
  expiresAt?: Date;
  cancelledAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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

    seatIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      },
    ],

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "FAILED",
        "EXPIRED",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "CREATED",
        "PENDING",
        "AUTHORIZED",
        "CAPTURED",
        "FAILED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
      default: "CREATED",
      index: true,
    },

    idempotencyKey: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      index: true,
    },

    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index(
  {
    userId: 1,
    idempotencyKey: 1,
  },
  {
    unique: true,
  }
);

export const Booking = model<IBooking>("Booking", bookingSchema);