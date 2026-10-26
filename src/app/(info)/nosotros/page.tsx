import { InfoPageView, infoPageMetadata } from "@/components/layout/InfoPageView";

export const metadata = infoPageMetadata("nosotros");

export default function Page() {
  return <InfoPageView slug="nosotros" />;
}
