import { PoolDetailClient } from "./PoolDetailClient";

// Static export needs at least one concrete value to emit a physical
// HTML file for this route shape. The real id is resolved client-side
// (inside PoolDetailClient) from the actual URL — this placeholder file
// is only ever served as a shell (see public/_redirects) and never
// shown to users as-is.
//
// This must live in a Server Component file: Next.js does not allow
// generateStaticParams() inside a "use client" file, which is exactly
// what was causing the Cloudflare build to fail.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function PoolDetailPage() {
  return <PoolDetailClient />;
}
