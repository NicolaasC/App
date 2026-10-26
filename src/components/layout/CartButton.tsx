"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { itemCount } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";

export function CartButton() {
  const count = itemCount(useCart());
  return (
    <Link
      href="/carrito"
      className="relative inline-flex size-11 items-center justify-center rounded-sm hover:bg-sand-soft"
      aria-label={count ? `Carrito, ${count} ${count === 1 ? "artículo" : "artículos"}` : "Carrito vacío"}
    >
      <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden="true" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-ink px-1 text-[0.625rem] font-semibold leading-4.5 text-paper"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
