import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getVisibleCategories } from "@/server/catalog/queries";
import { Container } from "@/components/ui/Container";
import { CartButton } from "./CartButton";
import { MobileMenu } from "./MobileMenu";
import { SearchButton } from "./SearchButton";
import { NavLink } from "./NavLink";

export async function Header() {
  const categories = await getVisibleCategories();
  const navCategories = categories.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur-sm supports-[backdrop-filter]:bg-ivory/85">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Saltar al contenido
      </a>
      <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-18">
        <div className="flex items-center gap-1">
          <MobileMenu categories={navCategories} />
          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[0.8125rem] tracking-[0.04em]">
              <li>
                <NavLink href="/catalogo">Catálogo</NavLink>
              </li>
              {navCategories.map((c) => (
                <li key={c.slug}>
                  <NavLink href={`/catalogo/${c.slug}`}>{c.name}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link
          href="/"
          className="justify-self-center font-serif text-[1.65rem] leading-none tracking-[-0.01em] md:text-[1.9rem]"
          aria-label={`${siteConfig.brand.name} — inicio`}
        >
          {siteConfig.brand.wordmark}
        </Link>

        <div className="flex items-center justify-end gap-1">
          <SearchButton />
          <CartButton />
        </div>
      </Container>
    </header>
  );
}
