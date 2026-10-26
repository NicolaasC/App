import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide transition-colors duration-200 ease-(--ease-soft) disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85 active:bg-ink/75 rounded-sm",
  secondary:
    "border border-ink text-ink bg-transparent hover:bg-ink hover:text-paper active:bg-ink/85 rounded-sm",
  ghost: "text-ink hover:bg-tone-soft active:bg-tone rounded-sm",
  link: "text-ink underline underline-offset-4 decoration-1 hover:decoration-2 px-0",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs uppercase",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-sm uppercase tracking-[0.12em]",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], variant !== "link" && sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
