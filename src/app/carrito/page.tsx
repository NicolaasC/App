import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <Container className="pt-10 md:pt-14">
      <h1 className="mb-10 font-serif text-headline">Carrito</h1>
      <CartView />
    </Container>
  );
}
