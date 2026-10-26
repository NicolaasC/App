import { InfoPageView, infoPageMetadata } from "@/components/layout/InfoPageView";

export const metadata = infoPageMetadata("preguntas-frecuentes");

export default function Page() {
  return <InfoPageView slug="preguntas-frecuentes" />;
}
