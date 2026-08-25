import { Schema, model } from "mongoose";

export interface IWebhookEvent {
  provider: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processedAt?: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: {
      type: String,
      required: true,
      default: "RAZORPAY",
    },

    eventId: {
      type: String,
      required: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },

    processed: {
      type: Boolean,
      default: false,
      index: true,
    },

    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index(
  {
    provider: 1,
    eventId: 1,
  },
  {
    unique: true,
  }
);

export const WebhookEvent = model<IWebhookEvent>(
  "WebhookEvent",
  webhookEventSchema
);