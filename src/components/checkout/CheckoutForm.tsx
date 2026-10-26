"use client";

import { AlertTriangle, Lock, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { placeOrderAction, previewCheckoutAction, type CheckoutPreview, type PlaceOrderResponse } from "@/app/actions/checkout";
import { BOGOTA, COLOMBIA_DEPARTMENTS } from "@/lib/geo/colombia";
import { checkoutSchema, toFieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import { useCart, useCartHydrated } from "@/lib/cart/store";
import { reconcile } from "@/lib/cart/use-cart-quote";
import { formatCOP, pluralize } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

interface CheckoutFormProps {
  shippingMethods: { id: string; label: string }[];
  shippingIsDemo: boolean;
  paymentsEnabled: boolean;
}

function newKey() {
  return crypto.randomUUID();
}

export function CheckoutForm({ shippingMethods, shippingIsDemo, paymentsEnabled }: CheckoutFormProps) {
  const cart = useCart();
  const hydrated = useCartHydrated();
  const [department, setDepartment] = useState<string>("");
  const [shippingMethodId, setShippingMethodId] = useState(shippingMethods[0]?.id ?? "");
  const [preview, setPreview] = useState<{ key: string; data: CheckoutPreview } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<PlaceOrderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cartKey = cart.items.map((i) => `${i.sku}:${i.quantity}`).join("|");
  const previewKey = `${cartKey}#${department}#${shippingMethodId}`;

  // Una clave de idempotencia por contenido de carrito: un doble clic no duplica el pedido.
  const [idempotency, setIdempotency] = useState(() => ({ cartKey, key: "" }));
  if (idempotency.cartKey !== cartKey) setIdempotency({ cartKey, key: "" });

  useEffect(() => {
    if (!hydrated || !cart.items.length) return;
    let cancelled = false;
    previewCheckoutAction({
      lines: cart.items.map((i) => ({ sku: i.sku, quantity: i.quantity, expectedUnitPrice: i.snapshot.unitPrice })),
      department,
      shippingMethodId,
    })
      .then((data) => !cancelled && setPreview({ key: previewKey, data }))
      .catch(() => !cancelled && setPreview({ key: previewKey, data: { ok: false, error: "Sin conexión. Revisa tu internet." } }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, previewKey]);

  if (!hydrated) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Cargando" />
      </div>
    );
  }
  if (!cart.items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-8" strokeWidth={1.2} />}
        title="Tu carrito está vacío"
        description="Agrega productos antes de continuar al pago."
        action={<ButtonLink href="/catalogo">Explorar catálogo</ButtonLink>}
      />
    );
  }

  const currentPreview = preview?.key === previewKey ? preview.data : null;
  const quote = currentPreview?.ok ? currentPreview.quote : null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const key = idempotency.key || newKey();
    if (!idempotency.key) setIdempotency({ cartKey, key });
    const payload = {
      address: {
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone"),
        department: form.get("department"),
        city: form.get("city"),
        address: form.get("address"),
        addressDetails: form.get("addressDetails") ?? "",
        postalCode: form.get("postalCode") ?? "",
      },
      shippingMethodId: form.get("shippingMethodId"),
      paymentMethod: form.get("paymentMethod"),
      acceptTerms: form.get("acceptTerms") === "on",
      lines: cart.items.map((i) => ({ sku: i.sku, quantity: i.quantity, expectedUnitPrice: i.snapshot.unitPrice })),
      idempotencyKey: key,
    };

    // Validación inmediata en el navegador (el servidor vuelve a validar todo).
    const local = checkoutSchema.safeParse(payload);
    if (!local.success) {
      const fieldErrors = toFieldErrors(local.error);
      setErrors(fieldErrors);
      setResult({ status: "invalid", fieldErrors, message: "Revisa los campos marcados." });
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    setResult(null);
    setSubmitting(true);
    try {
      const res = await placeOrderAction(payload);
      setResult(res);
      if (res.status === "invalid") {
        setErrors(res.fieldErrors);
        focusFirstError(res.fieldErrors);
      } else if (res.status === "cart_changed") {
        reconcile(res.quote);
      } else if (res.status === "redirect") {
        window.location.assign(res.url);
        return;
      }
    } catch {
      setResult({ status: "error", message: "Sin conexión con la tienda. Tu pedido no se envió; inténtalo de nuevo." });
    }
    setSubmitting(false);
  };

  const err = (path: string) => errors[path];

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
      <div className="space-y-12">
        <ResultBanner result={result} />

        <fieldset className="space-y-5">
          <legend className="mb-6 font-serif text-3xl">Contacto</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Nombre" name="firstName" autoComplete="given-name" maxLength={60} error={err("address.firstName")} />
            <TextField label="Apellido" name="lastName" autoComplete="family-name" maxLength={60} error={err("address.lastName")} />
          </div>
          <TextField label="Correo electrónico" name="email" type="email" autoComplete="email" inputMode="email" maxLength={120} error={err("address.email")} hint="Te enviaremos la confirmación del pedido." />
          <TextField label="Celular" name="phone" type="tel" autoComplete="tel-national" inputMode="tel" maxLength={20} placeholder="300 123 4567" error={err("address.phone")} hint="Para coordinar la entrega." />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-6 font-serif text-3xl">Entrega</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Departamento"
              name="department"
              autoComplete="address-level1"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              error={err("address.department")}
            >
              <option value="">Selecciona…</option>
              {COLOMBIA_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectField>
            <TextField
              key={department === BOGOTA ? "bogota" : "otra"}
              label="Ciudad o municipio"
              name="city"
              autoComplete="address-level2"
              maxLength={80}
              defaultValue={department === BOGOTA ? "Bogotá" : undefined}
              error={err("address.city")}
            />
          </div>
          <TextField label="Dirección" name="address" autoComplete="street-address" maxLength={160} placeholder="Calle 72 # 10-34" error={err("address.address")} />
          <TextField label="Indicaciones adicionales" name="addressDetails" optional maxLength={160} placeholder="Apartamento, torre, conjunto, barrio…" error={err("address.addressDetails")} />
          <TextField label="Código postal" name="postalCode" optional inputMode="numeric" maxLength={6} autoComplete="postal-code" error={err("address.postalCode")} containerClassName="sm:max-w-48" />

          <div role="radiogroup" aria-label="Método de entrega" className="space-y-2 pt-2">
            <p className="text-sm font-medium">Método de entrega</p>
            {shippingMethods.map((m) => (
              <label key={m.id} className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-sm border bg-paper px-4 py-3.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-ink", shippingMethodId === m.id ? "border-ink" : "border-line-strong")}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="shippingMethodId" value={m.id} checked={shippingMethodId === m.id} onChange={() => setShippingMethodId(m.id)} className="size-4 accent-ink" />
                  {m.label}
                </span>
                <span className="tabular-nums text-muted">
                  {quote?.shipping ? formatCOP(quote.shipping.amount) : "Según destino"}
                </span>
              </label>
            ))}
            {shippingIsDemo ? <p className="text-xs text-muted">Tarifas de demostración: transportadora y tiempos de entrega por confirmar.</p> : null}
            {err("shippingMethodId") ? <p className="text-xs font-medium text-danger">{err("shippingMethodId")}</p> : null}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-6 font-serif text-3xl">Pago</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-ink bg-paper px-4 py-4 text-sm has-focus-visible:outline-2 has-focus-visible:outline-ink">
            <input type="radio" name="paymentMethod" value="wompi" defaultChecked className="mt-0.5 size-4 accent-ink" />
            <span>
              <span className="font-medium">Pago en línea con Wompi</span>
              <span className="mt-1 block text-muted">
                Serás redirigido a la pasarela para pagar. La tienda no recibe ni guarda los datos de tu tarjeta o cuenta.
              </span>
              {!paymentsEnabled ? (
                <span className="mt-2 block text-xs font-medium text-ink">Pasarela aún no configurada: no se realizará ningún cobro.</span>
              ) : null}
            </span>
          </label>
          {err("paymentMethod") ? <p className="text-xs font-medium text-danger">{err("paymentMethod")}</p> : null}
        </fieldset>

        <CheckboxField
          name="acceptTerms"
          error={err("acceptTerms")}
          label={
            <>
              Acepto los{" "}
              <Link href="/terminos" target="_blank" className="underline underline-offset-4">
                términos y condiciones
              </Link>{" "}
              y autorizo el tratamiento de mis datos para gestionar el pedido según la{" "}
              <Link href="/privacidad" target="_blank" className="underline underline-offset-4">
                política de privacidad
              </Link>
              .
            </>
          }
        />
      </div>

      <aside aria-labelledby="checkout-resumen" className="h-fit bg-paper p-6 sm:p-8 lg:sticky lg:top-24">
        <h2 id="checkout-resumen" className="font-serif text-3xl">
          Tu pedido
        </h2>
        <ul className="mt-6 divide-y divide-line text-sm">
          {cart.items.map((item) => {
            const line = quote?.lines.find((l) => l.sku === item.sku);
            return (
              <li key={item.sku} className="flex justify-between gap-4 py-3">
                <span>
                  {item.snapshot.name}
                  <span className="block text-xs text-muted">
                    {item.snapshot.colorName} · Talla {item.snapshot.size} · {item.quantity} ud.
                  </span>
                </span>
                <span className="tabular-nums">{line ? formatCOP(line.lineTotal) : "—"}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm" aria-busy={!currentPreview}>
          <div className="flex justify-between">
            <dt>Subtotal{quote ? ` (${pluralize(quote.itemCount, "artículo", "artículos")})` : ""}</dt>
            <dd className="tabular-nums">{quote ? formatCOP(quote.subtotal) : <Spinner className="size-4" />}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="text-right tabular-nums">
              {quote?.shipping ? (
                <>
                  {formatCOP(quote.shipping.amount)}
                  {quote.shipping.isDemo ? <span className="block text-xs text-muted">Tarifa de demostración</span> : null}
                </>
              ) : (
                <span className="text-muted">{currentPreview?.ok ? (currentPreview.shippingMessage ?? "—") : "—"}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{quote ? formatCOP(quote.total) : "—"}</dd>
          </div>
        </dl>
        {currentPreview && !currentPreview.ok ? (
          <p role="alert" className="mt-3 text-xs text-danger">
            {currentPreview.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="mt-8 w-full" loading={submitting} icon={<Lock className="size-4" aria-hidden="true" />}>
          {paymentsEnabled ? "Ir a pagar" : "Validar pedido"}
        </Button>
        <p className="mt-4 text-xs text-muted">
          El total se calcula en nuestros servidores con precios y existencias vigentes.
        </p>
        <Link href="/carrito" className="mt-4 inline-block text-sm underline underline-offset-4">
          Volver al carrito
        </Link>
      </aside>
    </form>
  );
}

function focusFirstError(errors: FieldErrors) {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus();
    if (!el && Object.keys(errors).length) window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function ResultBanner({ result }: { result: PlaceOrderResponse | null }) {
  if (!result || result.status === "redirect") return null;
  const tone = result.status === "unavailable" ? "info" : "warn";
  const title = {
    invalid: "Faltan datos",
    error: "No pudimos procesar el pedido",
    cart_changed: "Tu carrito cambió",
    shipping_unavailable: "Envío no disponible",
    unavailable: "Pedido validado (modo demostración)",
  }[result.status];
  const message =
    result.status === "cart_changed"
      ? "Revisa el resumen actualizado antes de continuar."
      : "message" in result
        ? result.message
        : "";
  return (
    <div role="alert" className={cn("rounded-sm border p-4 text-sm", tone === "info" ? "border-sage bg-sage-soft" : "border-danger/40 bg-paper")}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="font-medium">{title}</p>
          {message ? <p className="mt-1 text-ink/80">{message}</p> : null}
          {result.status === "cart_changed" ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
              {result.issues.map((i) => (
                <li key={`${i.sku}-${i.code}`}>{i.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
