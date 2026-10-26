import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "sage" | "sand" | "ink" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-paper text-ink",
  sage: "bg-sage-soft text-ink",
  sand: "bg-sand text-ink",
  ink: "bg-ink text-paper",
  outline: "border border-line-strong text-muted",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm px-2 text-[0.6875rem] font-medium uppercase tracking-[0.1em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
