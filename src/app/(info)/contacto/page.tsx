import { InfoPageView, infoPageMetadata } from "@/components/layout/InfoPageView";

export const metadata = infoPageMetadata("contacto");

export default function Page() {
  return <InfoPageView slug="contacto" />;
}
