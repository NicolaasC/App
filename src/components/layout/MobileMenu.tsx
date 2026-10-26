"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { footerNav } from "./nav";

interface MobileMenuProps {
  categories: { slug: string; name: string }[];
}

export function MobileMenu({ categories }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú al navegar.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm hover:bg-tone-soft"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menú" side="left">
        <nav aria-label="Menú móvil" className="px-5 py-6">
          <ul className="flex flex-col">
            <li>
              <Link href="/catalogo" className="flex h-14 items-center border-b border-line font-serif text-2xl">
                Todo el catálogo
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/catalogo/${c.slug}`}
                  className="flex h-14 items-center border-b border-line font-serif text-2xl"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-muted">
            {footerNav.help.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </div>
  );
}
