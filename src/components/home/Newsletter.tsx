"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/Button";
import { CheckboxField, TextField } from "@/components/ui/Field";
import { siteConfig } from "@/config/site";

const initial: NewsletterState = { status: "idle" };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initial);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <section aria-labelledby="newsletter-title" className="bg-sage-soft">
      <div className="mx-auto grid max-w-shop gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-10">
        <div>
          <h2 id="newsletter-title" className="font-serif text-headline text-balance">
            {siteConfig.newsletter.title}
          </h2>
          <p className="mt-4 max-w-md text-sm text-ink/80 text-pretty">{siteConfig.newsletter.description}</p>
        </div>
        <form action={action} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <TextField
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              error={fieldErrors?.email}
              containerClassName="flex-1"
            />
            <Button type="submit" size="lg" loading={pending} className="sm:mt-6.5">
              Suscribirme
            </Button>
          </div>
          <CheckboxField
            name="consent"
            error={fieldErrors?.consent}
            label={
              <>
                Autorizo el tratamiento de mi correo para recibir comunicaciones comerciales, según la{" "}
                <Link href="/privacidad" className="underline underline-offset-4">
                  política de privacidad
                </Link>
                .
              </>
            }
          />
          <div aria-live="polite" className="min-h-5 text-sm">
            {state.status !== "idle" && !(state.status === "error" && fieldErrors) ? (
              <p className={state.status === "success" ? "text-success" : "text-ink"}>{state.message}</p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
