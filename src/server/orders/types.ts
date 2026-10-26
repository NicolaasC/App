/** Estados del pedido (operación) y del pago (proveedor), separados a propósito. */
export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "payment_failed",
  "cancelled",
  "preparing",
  "shipped",
  "delivered",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "approved", "declined", "voided", "error"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  department: string;
  city: string;
  address: string;
  addressDetails: string;
  postalCode: string;
}

export interface NewOrderInput {
  idempotencyKey: string;
  reference: string;
  accessTokenHash: string;
  customer: { email: string; name: string; phone: string };
  address: ShippingAddress;
  lines: { sku: string; quantity: number; expectedUnitPrice: number }[];
  shipping: { methodId: string; zoneLabel: string; amount: number };
  expiresAt: Date;
}

export interface OrderSummary {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  accessTokenHash: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  shippingZone: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  isDemo: boolean;
  createdAt: string;
  items: { sku: string; productName: string; colorName: string; size: number; unitPrice: number; quantity: number; lineTotal: number }[];
}

export type PlaceOrderResult =
  | { ok: true; order: OrderSummary; duplicate: boolean }
  | { ok: false; reason: "not_found" | "insufficient_stock" | "price_changed"; sku: string };

/** Evento de pago ya verificado y normalizado (independiente del proveedor). */
export interface PaymentEvent {
  provider: "wompi";
  /** Clave única del evento para idempotencia. */
  eventKey: string;
  eventType: string;
  reference: string;
  transactionId: string;
  status: PaymentStatus;
  amountCop: number;
  currency: string;
  statusDetail: string | null;
  payload: unknown;
}

export type PaymentEventResult =
  | "applied"
  | "duplicate"
  | "stale"
  | "unknown_reference"
  | "amount_mismatch"
  | "needs_review";

export interface OrderRepository {
  placeOrder(input: NewOrderInput): Promise<PlaceOrderResult>;
  getOrderByReference(reference: string): Promise<OrderSummary | null>;
  processPaymentEvent(event: PaymentEvent): Promise<PaymentEventResult>;
  /** Cancela pedidos sin pagar vencidos y libera existencias. Devuelve cuántos. */
  expireStaleOrders(now?: Date): Promise<number>;
}
