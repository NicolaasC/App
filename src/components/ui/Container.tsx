import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Ancho máximo y márgenes laterales comunes a toda la tienda. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-shop px-4 sm:px-6 lg:px-10", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted", className)} {...props} />
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
  id,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-6 md:mb-10", className)}>
      <div>
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h2 id={id} className="font-serif text-headline text-balance">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
