import razorpay from "../../config/razorpay.js";
import { Booking } from "../bookings/booking.model.js";

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
    throw new Error(
      "Booking is not awaiting payment"
    );
  }

  if (booking.paymentStatus !== "PENDING") {
    throw new Error(
      "Payment has already been processed"
    );
  }

  // Razorpay expects the amount in the smallest
  // currency unit. For INR, this is paise.
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