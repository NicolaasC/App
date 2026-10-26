import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getVisibleCategories } from "@/server/catalog/queries";
import { Container } from "@/components/ui/Container";
import { footerNav } from "./nav";

function Column({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="mb-4 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted">{title}</h2>
      <ul className="flex flex-col gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink/85 hover:text-ink hover:underline hover:underline-offset-4">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  const categories = await getVisibleCategories();
  const { contact, legal, social, brand } = siteConfig;
  const contactLines = [contact.email, contact.phone, contact.address, contact.hours].filter(Boolean);

  return (
    <footer className="mt-24 border-t border-line bg-paper">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <p className="font-serif text-3xl">{brand.wordmark}</p>
          <p className="mt-3 text-sm text-muted text-pretty">{brand.description}</p>
          {contactLines.length ? (
            <ul className="mt-6 space-y-1 text-sm">
              {contactLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-xs text-muted">Datos de contacto pendientes de confirmar.</p>
          )}
        </div>
        <Column title="Tienda" links={[...footerNav.shop, ...categories.map((c) => ({ label: c.name, href: `/catalogo/${c.slug}` }))]} />
        <Column title="Compañía" links={footerNav.company} />
        <Column title="Ayuda" links={footerNav.help} />
        <Column title="Legal" links={footerNav.legal} />
      </Container>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>
          {legal.companyName ?? brand.name}
          {legal.nit ? ` · NIT ${legal.nit}` : ""}
          {brand.isProvisional ? " · Nombre comercial provisional" : ""}
        </p>
        <p>Sitio en desarrollo: productos, precios y existencias son de demostración.</p>
        {social.length ? (
          <ul className="flex gap-4">
            {social.map((s) => (
              <li key={s.href}>
                <a href={s.href} rel="noopener noreferrer" target="_blank" className="hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </footer>
  );
}
