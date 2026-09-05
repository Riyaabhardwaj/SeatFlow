import { Schema, model, Types } from "mongoose";

export type HoldStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CONVERTED"
  | "CANCELLED";

export interface IHold {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  seatIds: Types.ObjectId[];
  expiresAt: Date;
  status: HoldStatus;
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

    seatIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Seat",
        required: true,
      },
    ],

    expiresAt: {
      type: Date,
      required: true,
      //index: true,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "EXPIRED",
        "CONVERTED",
        "CANCELLED",
      ],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// holdSchema.index(
//   { expiresAt: 1 },
//   { expireAfterSeconds: 0 }
// );

export const Hold = model<IHold>("Hold", holdSchema);