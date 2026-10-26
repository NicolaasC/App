"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Solo el identificador: nunca datos del usuario en logs del cliente.
    console.error("Error de página", error.digest ?? "");
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-28 text-center md:py-40">
      <h1 className="font-serif text-headline">Algo salió mal</h1>
      <p className="mt-4 max-w-md text-sm text-muted">
        Tuvimos un problema al cargar esta página. Tu carrito sigue guardado.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Intentar de nuevo</Button>
        <ButtonLink href="/" variant="secondary">
          Ir al inicio
        </ButtonLink>
      </div>
      {error.digest ? <p className="mt-6 text-xs text-muted">Referencia: {error.digest}</p> : null}
    </Container>
  );
}
