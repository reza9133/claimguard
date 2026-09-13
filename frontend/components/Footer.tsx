import Link from "next/link";
import { ShieldCheck, Github, Twitter, ExternalLink } from "lucide-react";
import { PROJECT_LINKS } from "@/lib/links";

const productLinks = [
  { href: "/pools", label: "Browse Pools" },
  { href: "/pools/new", label: "Start a Pool" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/how-it-works", label: "How It Works" },
];

const resourceLinks = [
  { href: "/about", label: "About ClaimGuard" },
  { href: "https://docs.genlayer.com", label: "GenLayer Docs", external: true },
  { href: "https://studio.genlayer.com", label: "GenLayer Studio", external: true },
  { href: PROJECT_LINKS.explorerContract, label: "Contract Explorer", external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-24">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #14b881 0%, #0d5f45 100%)",
                  boxShadow: "0 0 14px rgba(20,184,129,0.35)",
                }}
              >
                <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-bold text-[var(--text-primary)]">
                CLAIMGUARD
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              Peer-funded mutual coverage pools, adjudicated by GenLayer&apos;s AI-validator
              consensus. No adjuster, no claims desk, and no admin withdrawal path — the
              contract only ever pays out through an AI-approved claim.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink href={PROJECT_LINKS.github} icon={Github} label="GitHub" />
              <SocialLink href={PROJECT_LINKS.twitter} icon={Twitter} label="Twitter / X" />
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Product
            </p>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Resources
            </p>
            <ul className="space-y-2.5">
              {resourceLinks.map((l) =>
                l.external ? (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
                    >
                      {l.label}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-emerald-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row">
          <p>Built on GenLayer Studionet — the adjudication layer for the agentic economy.</p>
          <p>
            Built by{" "}
            <a
              href={PROJECT_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 hover:underline"
            >
              @amirhp771
            </a>{" "}
            ·{" "}
            <a
              href={PROJECT_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-400 hover:underline"
            >
              source on GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Github;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
