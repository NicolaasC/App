import Link from "next/link";
import { siteConfig } from "@/config/site";

/** Franja superior opcional. Solo se activa con información confirmada. */
export function AnnouncementBar() {
  const { enabled, message, href } = siteConfig.announcement;
  if (!enabled || !message) return null;
  const content = <span className="text-xs tracking-[0.08em]">{message}</span>;
  return (
    <div className="bg-sage-soft px-4 py-2 text-center text-ink">
      {href ? (
        <Link href={href} className="underline-offset-4 hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
