import { InfoPageView, infoPageMetadata } from "@/components/layout/InfoPageView";

export const metadata = infoPageMetadata("privacidad");

export default function Page() {
  return <InfoPageView slug="privacidad" />;
}
