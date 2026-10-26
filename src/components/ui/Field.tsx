import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full rounded-sm border bg-paper px-3.5 text-[0.9375rem] text-ink placeholder:text-stone transition-colors duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink disabled:bg-sand-soft disabled:text-muted";

function describedBy(...ids: Array<string | false | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, optional, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional ? <span className="ml-1 font-normal text-muted">(opcional)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  containerClassName?: string;
}

export function TextField({ label, hint, error, optional, containerClassName, className, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={containerClassName}>
      <input
        id={id}
        className={cn(control, "h-12", error ? "border-danger" : "border-line-strong", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && !error ? `${id}-hint` : undefined, error && `${id}-error`)}
        required={!optional}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<ComponentProps<"select">, "id"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  containerClassName?: string;
}

export function SelectField({ label, hint, error, optional, containerClassName, className, children, ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={containerClassName}>
      <select
        id={id}
        className={cn(control, "h-12 appearance-none bg-[url('/icons/chevron.svg')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10", error ? "border-danger" : "border-line-strong", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && !error ? `${id}-hint` : undefined, error && `${id}-error`)}
        required={!optional}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface CheckboxFieldProps extends Omit<ComponentProps<"input">, "id" | "type"> {
  label: ReactNode;
  error?: string;
}

export function CheckboxField({ label, error, className, ...props }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-4.5 shrink-0 cursor-pointer appearance-none rounded-[2px] border border-line-strong bg-paper bg-center bg-no-repeat checked:border-ink checked:bg-ink checked:bg-[url('/icons/check.svg')] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <label htmlFor={id} className="text-sm leading-snug text-ink/90">
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="pl-7.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
