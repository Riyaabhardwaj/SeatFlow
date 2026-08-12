export type UserRole =
  | "CUSTOMER"
  | "ORGANIZER"
  | "SUPER_ADMIN";

export type SeatStatus =
  | "AVAILABLE"
  | "BLOCKED";

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