import type { Metadata } from "next";
import { demoImage, demoPhotos, type DemoPhotoId } from "@/data/demo/images";
import { Container, Eyebrow } from "@/components/ui/Container";
import { PhotoCredit } from "@/components/ui/PhotoCredit";

export const metadata: Metadata = {
  title: "Créditos de fotografías",
  description: "Autores de las fotografías de demostración.",
  alternates: { canonical: "/creditos" },
};

export default function CreditsPage() {
  const images = (Object.keys(demoPhotos) as DemoPhotoId[]).map((id) => demoImage(id));
  return (
    <Container className="pt-12 md:pt-20">
      <article className="mx-auto max-w-prose">
        <Eyebrow className="mb-4">Información</Eyebrow>
        <h1 className="font-serif text-headline">Créditos de fotografías</h1>
        <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink/80">
          Las fotografías de esta tienda de demostración provienen de Unsplash y se usan bajo la Unsplash License. Son
          imágenes de referencia: no muestran los productos que se venden.
        </p>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {images.map((img) => (
            <li key={img.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <span className="text-sm">{img.alt}</span>
              <PhotoCredit credit={img.credit} className="shrink-0" />
            </li>
          ))}
        </ul>
      </article>
    </Container>
  );
}
