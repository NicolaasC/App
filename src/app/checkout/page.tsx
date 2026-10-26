import type { Metadata } from "next";
import { shippingConfig } from "@/config/shipping";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Container } from "@/components/ui/Container";
import { isDatabaseConfigured, isWompiConfigured } from "@/server/env";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  // Solo se envían banderas booleanas al cliente, nunca credenciales.
  const paymentsEnabled = isWompiConfigured() && isDatabaseConfigured();
  return (
    <Container className="pt-10 md:pt-14">
      <h1 className="mb-10 font-serif text-headline">Finalizar compra</h1>
      <CheckoutForm
        shippingMethods={shippingConfig.methods.map((m) => ({ id: m.id, label: m.label }))}
        shippingIsDemo={shippingConfig.mode === "demo"}
        paymentsEnabled={paymentsEnabled}
      />
    </Container>
  );
}
