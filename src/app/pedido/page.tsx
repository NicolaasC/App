import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Spinner } from "@/components/ui/Spinner";
import { formatCOP } from "@/lib/format";
import { orderRepository } from "@/server/orders";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/server/orders/state";
import { verifyAccessToken } from "@/server/orders/tokens";

export const metadata: Metadata = {
  title: "Estado del pedido",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function NotFoundMessage() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-serif text-headline">No encontramos el pedido</h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-muted">
        El enlace puede estar incompleto o haber expirado. Usa el enlace exacto que recibiste al pagar.
      </p>
      <ButtonLink href="/" variant="secondary" className="mt-8">
        Ir al inicio
      </ButtonLink>
    </div>
  );
}

async function OrderDetails({ searchParams }: { searchParams: PageProps<"/pedido">["searchParams"] }) {
  const params = await searchParams;
  const reference = typeof params.referencia === "string" ? params.referencia : "";
  const token = typeof params.t === "string" ? params.t : "";
  if (!/^PED-[A-Z0-9]{8,16}$/.test(reference) || !token) return <NotFoundMessage />;

  const repo = orderRepository();
  const order = repo ? await repo.getOrderByReference(reference) : null;
  // Misma respuesta si no existe o si el token no coincide: no revela qué pedidos existen.
  if (!order || !verifyAccessToken(token, order.accessTokenHash)) return <NotFoundMessage />;

  const paid = order.status === "paid";
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted">Pedido {order.reference}</p>
      <h1 className="mt-3 font-serif text-headline">{paid ? "¡Gracias por tu compra!" : ORDER_STATUS_LABELS[order.status]}</h1>
      <p className="mt-4 text-sm text-ink/80">
        {paid
          ? "Recibimos la confirmación del pago."
          : order.status === "pending_payment"
            ? "Aún no hemos recibido la confirmación del pago. Esta página se actualiza cuando la pasarela nos notifica; puedes recargarla en unos minutos."
            : "Si tienes dudas sobre este pedido, contáctanos indicando la referencia."}
      </p>
      <dl className="mt-10 grid gap-4 bg-paper p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Estado del pedido</dt>
          <dd className="mt-1 font-medium">{ORDER_STATUS_LABELS[order.status]}</dd>
        </div>
        <div>
          <dt className="text-muted">Estado del pago</dt>
          <dd className="mt-1 font-medium">{order.paymentStatus ? PAYMENT_STATUS_LABELS[order.paymentStatus] : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Entrega</dt>
          <dd className="mt-1">
            {order.shippingAddress.city}, {order.shippingAddress.department}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Total</dt>
          <dd className="mt-1 tabular-nums">{formatCOP(order.total)}</dd>
        </div>
      </dl>
      <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
        {order.items.map((i) => (
          <li key={i.sku} className="flex justify-between gap-4 py-3">
            <span>
              {i.productName}
              <span className="block text-xs text-muted">
                {i.colorName} · Talla {i.size} · {i.quantity} ud.
              </span>
            </span>
            <span className="tabular-nums">{formatCOP(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OrderPage({ searchParams }: PageProps<"/pedido">) {
  return (
    <Container className="pt-12 md:pt-20">
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <Spinner label="Consultando pedido" />
          </div>
        }
      >
        <OrderDetails searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
