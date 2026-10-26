import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-28 text-center md:py-40">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted">Error 404</p>
      <h1 className="mt-4 font-serif text-headline">No encontramos esta página</h1>
      <p className="mt-4 max-w-md text-sm text-muted">
        Puede que el enlace esté mal escrito o que el producto ya no esté disponible.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/catalogo">Ver catálogo</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Ir al inicio
        </ButtonLink>
      </div>
    </Container>
  );
}
