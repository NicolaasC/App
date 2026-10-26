import { siteConfig } from "@/config/site";
import { demoImage, isDemoPhotoId } from "@/data/demo/images";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Eyebrow } from "@/components/ui/Container";
import { ProductImage } from "@/components/ui/ProductImage";
import { PhotoCredit } from "@/components/ui/PhotoCredit";

export function EditorialBlock() {
  const { editorial } = siteConfig;
  const image = isDemoPhotoId(editorial.imageId) ? demoImage(editorial.imageId) : null;

  return (
    <section aria-labelledby="editorial-title" className="bg-tone-soft py-20 md:py-28">
      <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
        <div className="relative aspect-[4/5] overflow-hidden bg-tone">
          <ProductImage
            src={image?.src}
            alt={image?.alt ?? ""}
            focal={image?.focal}
            sizes="(min-width: 768px) 45vw, 100vw"
            fallbackLabel="Imagen editorial pendiente"
          />
          {image ? (
            <PhotoCredit credit={image.credit} className="absolute bottom-3 left-3 rounded-sm bg-paper/85 px-2 py-1" />
          ) : null}
        </div>
        <div className="max-w-md">
          <Eyebrow className="mb-5">{editorial.eyebrow}</Eyebrow>
          <h2 id="editorial-title" className="font-serif text-headline text-balance">
            {editorial.title}
          </h2>
          <div className="mt-6 space-y-4 text-[0.9375rem] leading-relaxed text-ink/80">
            {editorial.body.map((p) => (
              <p key={p} className="text-pretty">
                {p}
              </p>
            ))}
          </div>
          <ButtonLink href={editorial.cta.href} variant="secondary" size="lg" className="mt-10">
            {editorial.cta.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
