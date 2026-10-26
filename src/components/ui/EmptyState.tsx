import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      {icon ? <div className="mb-6 text-stone">{icon}</div> : null}
      <h2 className="font-serif text-3xl">{title}</h2>
      {description ? <p className="mt-3 max-w-md text-sm text-muted text-pretty">{description}</p> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
