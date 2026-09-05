import { Schema, model, Types } from "mongoose";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface IBooking {
  bookingReference: string;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  holdId: Types.ObjectId;
  seatIds: Types.ObjectId[];
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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

    holdId: {
      type: Schema.Types.ObjectId,
      ref: "Hold",
      required: true,
      unique: true,
    },

    seatIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "FAILED",
        "CANCELLED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    razorpayOrderId: {
  type: String,
  sparse: true,
  index: true,
},

razorpayPaymentId: {
  type: String,
  sparse: true,
  index: true,
},
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  userId: 1,
  createdAt: -1,
});

bookingSchema.index({
  eventId: 1,
  bookingStatus: 1,
});

export const Booking = model<IBooking>(
  "Booking",
  bookingSchema
);