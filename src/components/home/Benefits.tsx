import { CreditCard, Headphones, RefreshCw, Truck, type LucideIcon } from "lucide-react";
import { siteConfig, type BenefitKey } from "@/config/site";
import { Container } from "@/components/ui/Container";

const icons: Record<BenefitKey, LucideIcon> = {
  pagos: CreditCard,
  cambios: RefreshCw,
  envios: Truck,
  atencion: Headphones,
};

/** Solo muestra beneficios activados (respaldados por condiciones reales). */
export function Benefits() {
  const active = siteConfig.benefits.filter((b) => b.enabled);
  if (!active.length) return null;
  return (
    <section aria-label="Beneficios" className="border-y border-line">
      <Container>
        <ul className="grid divide-line sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {active.map((b) => {
            const Icon = icons[b.key];
            return (
              <li key={b.key} className="flex items-start gap-4 py-8 sm:px-6 first:sm:pl-0">
                <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.3} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="mt-1 text-sm text-muted">{b.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
