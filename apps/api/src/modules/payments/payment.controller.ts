import { Request, Response } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "./payment.service.js";
import { verifyPaymentSchema } from "./payment.schema.js";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Create Razorpay Order
export async function createPaymentOrderController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { bookingId } = req.body;

    if (
      typeof bookingId !== "string" ||
      bookingId.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const order = await createRazorpayOrder(
      bookingId,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: order,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    if (message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "You do not have permission to pay for this booking"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    if (
      message === "Booking is not awaiting payment" ||
      message === "Payment has already been processed"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Verify Razorpay Payment
export async function verifyPaymentController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { bookingId } = req.params;

    if (
      typeof bookingId !== "string" ||
      bookingId.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const validation = verifyPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification data",
        errors: validation.error.flatten(),
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = validation.data;

    const booking = await verifyRazorpayPayment(
      bookingId,
      req.user.userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and booking confirmed successfully",
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        razorpayOrderId: booking.razorpayOrderId,
        razorpayPaymentId: booking.razorpayPaymentId,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        seatIds: booking.seatIds,
        totalAmount: booking.totalAmount,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    // Validation errors
    if (
      message === "Invalid booking ID" ||
      message === "Invalid user ID"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Booking not found
    if (message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    // Authorization
    if (
      message ===
      "You do not have permission to verify this payment"
    ) {
      return res.status(403).json({
        success: false,
        message,
      });
    }

    // Booking/payment state conflicts
    if (
      message === "Booking is not awaiting payment" ||
      message === "Payment has already been processed"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    // Razorpay order/signature/payment validation
    if (
      message === "Razorpay order does not match this booking" ||
      message ===
        "Razorpay payment does not belong to this order" ||
      message ===
        "Razorpay payment amount does not match booking amount" ||
      message.startsWith("Payment is not captured.")
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    // Invalid signature
    if (message === "Invalid Razorpay payment signature") {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Seat errors
    if (
      message ===
      "One or more booking seats no longer exist"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message.includes("is no longer available")) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}