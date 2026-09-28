import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import { Types } from "mongoose";

import { Booking } from "../bookings/booking.model.js";
import { Hold } from "../holds/hold.model.js";
import { Seat } from "../seats/seat.model.js";
export async function createRazorpayOrder(
  bookingId: string,
  userId: string
) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.userId.toString() !== userId) {
    throw new Error(
      "You do not have permission to pay for this booking"
    );
  }

  if (booking.bookingStatus !== "PENDING_PAYMENT") {
    throw new Error("Booking is not awaiting payment");
  }

  if (booking.paymentStatus !== "PENDING") {
    throw new Error("Payment has already been processed");
  }

  // If a Razorpay order already exists for this booking,
  // return the same order instead of creating a duplicate.
  if (booking.razorpayOrderId) {
    const existingOrder = await razorpay.orders.fetch(
      booking.razorpayOrderId
    );

    return {
      orderId: existingOrder.id,
      amount: existingOrder.amount,
      currency: existingOrder.currency,
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
    };
  }

  // Razorpay expects the amount in paise.
  const amountInPaise = Math.round(
    booking.totalAmount * 100
  );

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: booking.bookingReference,
    notes: {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
    },
  });

  booking.razorpayOrderId = order.id;

  await booking.save();

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    bookingId: booking._id,
    bookingReference: booking.bookingReference,
  };
}

export async function verifyRazorpayPayment(
  bookingId: string,
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  // 1. Validate IDs
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // 2. Find booking
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // 3. Verify booking ownership
  if (booking.userId.toString() !== userId) {
    throw new Error(
      "You do not have permission to verify this payment"
    );
  }

  // 4. Booking must be awaiting payment
  if (booking.bookingStatus !== "PENDING_PAYMENT") {
    throw new Error(
      "Booking is not awaiting payment"
    );
  }

  // 5. Payment must still be pending
  if (booking.paymentStatus !== "PENDING") {
    throw new Error(
      "Payment has already been processed"
    );
  }

  // 6. Verify Razorpay order belongs to booking
  if (
    booking.razorpayOrderId !== razorpayOrderId
  ) {
    throw new Error(
      "Razorpay order does not match this booking"
    );
  }

  // 7. Get Razorpay secret
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error(
      "Razorpay key secret is missing"
    );
  }

  // 8. Generate expected signature
  const payload =
    `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature =
    crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

  // 9. Timing-safe signature comparison
  const signaturesMatch =
    expectedSignature.length ===
      razorpaySignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpaySignature)
    );

  if (!signaturesMatch) {
    throw new Error(
      "Invalid Razorpay payment signature"
    );
  }

  // 10. Fetch actual payment from Razorpay
  const payment =
    await razorpay.payments.fetch(
      razorpayPaymentId
    );

  // 11. Verify payment belongs to same order
  if (payment.order_id !== razorpayOrderId) {
    throw new Error(
      "Razorpay payment does not belong to this order"
    );
  }

  // 12. Verify amount
  const expectedAmount = Math.round(
    booking.totalAmount * 100
  );

  if (payment.amount !== expectedAmount) {
    throw new Error(
      "Razorpay payment amount does not match booking amount"
    );
  }

  // 13. Payment must be captured
  if (payment.status !== "captured") {
    throw new Error(
      `Payment is not captured. Current status: ${payment.status}`
    );
  }

  // 14. Start MongoDB transaction
  const session =
    await Booking.startSession();

  try {
    await session.withTransaction(async () => {
      // Re-read booking inside transaction
      const currentBooking =
        await Booking.findById(
          bookingId
        ).session(session);

      if (!currentBooking) {
        throw new Error("Booking not found");
      }

      // Prevent duplicate processing
      if (
        currentBooking.paymentStatus !==
        "PENDING"
      ) {
        throw new Error(
          "Payment has already been processed"
        );
      }

      // Find seats
      const seats = await Seat.find({
        _id: {
          $in: currentBooking.seatIds,
        },
        eventId: currentBooking.eventId,
      }).session(session);

      if (
        seats.length !==
        currentBooking.seatIds.length
      ) {
        throw new Error(
          "One or more booking seats no longer exist"
        );
      }

      // Seats must still be available
      const unavailableSeat = seats.find(
        (seat) => seat.status !== "AVAILABLE"
      );

      if (unavailableSeat) {
        throw new Error(
          `Seat ${unavailableSeat.label} is no longer available`
        );
      }

      // 15. Mark seats as BOOKED
      await Seat.updateMany(
        {
          _id: {
            $in: currentBooking.seatIds,
          },
          eventId: currentBooking.eventId,
          status: "AVAILABLE",
        },
        {
          $set: {
            status: "BOOKED",
          },
        },
        { session }
      );

      // 16. Update booking
      currentBooking.razorpayPaymentId =
        razorpayPaymentId;

      currentBooking.paymentStatus =
        "PAID";

      currentBooking.bookingStatus =
        "CONFIRMED";

      await currentBooking.save({
        session,
      });

      // 17. Update hold
      await Hold.findByIdAndUpdate(
        currentBooking.holdId,
        {
          $set: {
            status: "CONVERTED",
          },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // 18. Return updated booking
  return await Booking.findById(bookingId);
}