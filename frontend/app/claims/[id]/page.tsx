import { ClaimDetailClient } from "./ClaimDetailClient";

// See app/pools/[id]/page.tsx for why this placeholder exists, and why
// this export has to live in a plain Server Component file rather than
// the "use client" file that actually renders the page.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function ClaimDetailPage() {
  return <ClaimDetailClient />;
}
