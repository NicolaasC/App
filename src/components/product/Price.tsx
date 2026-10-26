import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Price({
  price,
  compareAtPrice,
  className,
}: {
  price: number;
  compareAtPrice?: number;
  className?: string;
}) {
  const onSale = compareAtPrice !== undefined && compareAtPrice > price;
  return (
    <p className={cn("tabular-nums", className)}>
      <span className="sr-only">Precio: </span>
      <span>{formatCOP(price)}</span>
      {onSale ? (
        <>
          <span className="sr-only">, precio anterior: </span>
          <s className="ml-2 text-muted">{formatCOP(compareAtPrice)}</s>
        </>
      ) : null}
    </p>
  );
}
