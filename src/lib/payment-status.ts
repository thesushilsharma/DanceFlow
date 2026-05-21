/** Payment record statuses that count toward revenue / completed income */
export const REVENUE_PAYMENT_STATUSES = ["completed"] as const;

export type PaymentDisplayStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "cancelled"
  | "completed"
  | "failed"
  | "refunded";

export function normalizePaymentDisplayStatus(
  status: string,
): PaymentDisplayStatus {
  if (status === "completed") return "paid";
  return status as PaymentDisplayStatus;
}
