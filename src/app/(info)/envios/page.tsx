import { InfoPageView, infoPageMetadata } from "@/components/layout/InfoPageView";

export const metadata = infoPageMetadata("envios");

export default function Page() {
  return <InfoPageView slug="envios" />;
}
