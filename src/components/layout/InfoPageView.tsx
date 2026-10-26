import type { Metadata } from "next";
import { infoPages, type InfoPageSlug } from "@/content/pages";
import { Badge } from "@/components/ui/Badge";
import { Container, Eyebrow } from "@/components/ui/Container";

const statusLabel = { pendiente: "Contenido pendiente", borrador: "Borrador · pendiente de revisión", aprobado: null };

export function infoPageMetadata(slug: InfoPageSlug): Metadata {
  const page = infoPages[slug];
  return { title: page.title, description: page.description, alternates: { canonical: `/${page.slug}` } };
}

export function InfoPageView({ slug }: { slug: InfoPageSlug }) {
  const page = infoPages[slug];
  const label = statusLabel[page.status];
  return (
    <Container className="pt-12 md:pt-20">
      <article className="mx-auto max-w-prose">
        <Eyebrow className="mb-4">Información</Eyebrow>
        <h1 className="font-serif text-headline text-balance">{page.title}</h1>
        {label ? (
          <Badge tone="sand" className="mt-5">
            {label}
          </Badge>
        ) : null}
        <div className="mt-12 space-y-10">
          {page.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-medium">{s.title}</h2>
              <div className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-ink/80">
                {s.paragraphs.map((p) => (
                  <p key={p} className="text-pretty">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </Container>
  );
}
