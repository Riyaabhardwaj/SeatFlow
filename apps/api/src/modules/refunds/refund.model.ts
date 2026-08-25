import { Schema, model, Types } from "mongoose";

export type RefundStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface IRefund {
  bookingId: Types.ObjectId;
  paymentId: Types.ObjectId;
  razorpayRefundId?: string;
  amount: number;
  status: RefundStatus;
  reason: string;
  initiatedBy: Types.ObjectId;
}

const refundSchema = new Schema<IRefund>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },

    razorpayRefundId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "PENDING",
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Refund = model<IRefund>("Refund", refundSchema);