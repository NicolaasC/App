import type { OrderStatus, PaymentStatus } from "./types";

/**
 * Reglas de transición de pagos. Un pago aprobado solo puede pasar a anulado
 * (reverso); los estados fallidos no vuelven a "pendiente". Los eventos que
 * llegan fuera de orden y no representan un avance se ignoran ("stale").
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["approved", "declined", "voided", "error"],
  approved: ["voided"],
  declined: [],
  voided: [],
  error: ["approved", "declined"],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export interface OrderEffect {
  status: OrderStatus;
  releaseStock: boolean;
}

/** Efecto de un nuevo estado de pago sobre el pedido. null = sin cambios. */
export function orderEffectOfPayment(order: OrderStatus, payment: PaymentStatus): OrderEffect | null {
  if (payment === "approved" && (order === "pending_payment" || order === "payment_failed")) {
    return { status: "paid", releaseStock: false };
  }
  if ((payment === "declined" || payment === "error") && order === "pending_payment") {
    return { status: "payment_failed", releaseStock: true };
  }
  if (payment === "voided") {
    if (order === "pending_payment") return { status: "cancelled", releaseStock: true };
    // Un reverso después de pagar requiere revisión manual (devolución, logística).
    if (order === "paid") return { status: "refunded", releaseStock: false };
  }
  return null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  payment_failed: "Pago no completado",
  cancelled: "Cancelado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  refunded: "Reembolsado",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  declined: "Rechazado",
  voided: "Anulado",
  error: "Error",
};
