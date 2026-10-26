import { siteConfig } from "@/config/site";
import { demoImage, isDemoPhotoId } from "@/data/demo/images";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Container";
import { ProductImage } from "@/components/ui/ProductImage";

export function Hero() {
  const { hero } = siteConfig;
  const image = isDemoPhotoId(hero.imageId) ? demoImage(hero.imageId) : null;

  return (
    <section className="relative">
      <div className="grid min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-4.5rem)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="order-2 flex flex-col justify-end px-4 pb-12 pt-8 sm:px-6 md:order-1 md:justify-center md:px-10 md:pb-16 lg:px-16">
          <Eyebrow className="mb-6">{hero.eyebrow}</Eyebrow>
          <h1 className="font-serif text-display text-balance">{hero.title}</h1>
          <p className="mt-6 max-w-sm text-base text-ink/80 text-pretty md:text-lg">{hero.subtitle}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
        <div className="relative order-1 aspect-[5/4] overflow-hidden bg-sand sm:aspect-[4/3] md:order-2 md:aspect-auto">
          <ProductImage
            src={image?.src}
            alt={image?.alt ?? ""}
            focal={image?.focal}
            sizes="(min-width: 768px) 58vw, 100vw"
            priority
            fallbackLabel="Imagen editorial pendiente"
          />
        </div>
      </div>
    </section>
  );
}
