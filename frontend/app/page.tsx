"use client";

import Link from "next/link";
import {
  Camera,
  Scale,
  Coins,
  ArrowRight,
  Sparkles,
  Lock,
  Wallet,
  Gavel,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PoolCard } from "@/components/PoolCard";
import { useGetAllPools } from "@/hooks/useClaimGuardContract";
import { formatGEN, sumWei } from "@/lib/utils";
import { PROJECT_LINKS } from "@/lib/links";

const trustPoints = [
  {
    icon: Wallet,
    title: "Balance isolation",
    body: "Every pool tracks its own balance — a payout can never touch another pool's funds.",
  },
  {
    icon: Lock,
    title: "No admin withdrawal",
    body: "Nothing in the contract can move pooled GEN except an AI-approved claim payout.",
  },
  {
    icon: Gavel,
    title: "Structural spend limits",
    body: "Per-claim and per-period caps are enforced in contract code, not just prompted.",
  },
];

export default function HomePage() {
  const { data: pools = [], isLoading } = useGetAllPools();

  const totals = pools.reduce(
    (acc, p) => {
      acc.members += p.member_count;
      acc.claimsFiled += p.claims_filed;
      return acc;
    },
    { members: 0, claimsFiled: 0 }
  );
  const totalPaidOut = sumWei(pools.map((p) => p.total_paid_out));

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-20 md:px-8 md:pt-28">
        {/* Ambient glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-120px] h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-[110px]"
          style={{ background: "radial-gradient(circle, #14b881 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-120px] top-[180px] h-[280px] w-[280px] rounded-full opacity-20 blur-[100px]"
          style={{ background: "radial-gradient(circle, #4fd8a8 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-pill border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" /> Live on GenLayer Studionet
          </div>
          <h1
            className="animate-fade-up font-display text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl"
            style={{ animationDelay: "0.05s" }}
          >
            Mutual coverage, <span className="text-emerald-400">adjudicated by AI</span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-5 max-w-2xl text-base text-[var(--text-secondary)] md:text-lg"
            style={{ animationDelay: "0.1s" }}
          >
            Pool GEN with others, file a claim with a photo or a link, and let GenLayer&apos;s
            validator consensus decide — no adjuster, no claims desk, no admin who can touch the
            pool.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "0.15s" }}
          >
            <Button asChild size="lg">
              <Link href="/pools">
                Browse Pools <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pools/new">Start a Pool</Link>
            </Button>
          </div>
          <div
            className="animate-fade-up mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-muted)]"
            style={{ animationDelay: "0.2s" }}
          >
            <Link href="/how-it-works" className="hover:text-emerald-400 transition-colors">
              How it works →
            </Link>
            <span className="opacity-30">·</span>
            <a
              href={PROJECT_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <Github className="h-3.5 w-3.5" /> Open source
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Coverage pools", value: isLoading ? "—" : String(pools.length) },
            { label: "Members covered", value: isLoading ? "—" : String(totals.members) },
            { label: "Claims filed", value: isLoading ? "—" : String(totals.claimsFiled) },
            { label: "Paid out", value: isLoading ? "—" : formatGEN(totalPaidOut) },
          ].map((s, i) => (
            <div
              key={s.label}
              className="card-surface animate-scale-in rounded-card p-4 text-center"
              style={{ animationDelay: `${0.25 + i * 0.05}s` }}
            >
              <p className="font-display text-2xl font-bold text-emerald-400">{s.value}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works (summary) */}
      <section className="mx-auto max-w-5xl px-5 py-16 md:px-8">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            How it works
          </h2>
          <p className="max-w-lg text-sm text-[var(--text-muted)]">
            Three steps, all on-chain — no forms, no claims desk, no waiting.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Coins,
              title: "1. Join a pool",
              body: "Pay a premium in GEN to open coverage under a pool's plain-English terms — what's covered, what's excluded, and the limits per claim and per period.",
            },
            {
              icon: Camera,
              title: "2. File a claim",
              body: "Something happens — describe it, attach a photo and/or a link (e.g. a tracking page). One transaction, submitted directly by you.",
            },
            {
              icon: Scale,
              title: "3. AI validators decide",
              body: "GenLayer's validators independently read the evidence against the pool's terms and reach consensus on coverage and payout — paid out immediately, atomically.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="transition-transform duration-200 hover:-translate-y-1">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/12">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="ghost">
            <Link href="/how-it-works">
              See the full mechanics — consensus, security, FAQ <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Trust points */}
      <section className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
            Built so no one can touch the pool but the AI
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/12">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mb-1.5 font-display text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--text-muted)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured pools */}
      {pools.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Recent pools</h2>
            <Link href="/pools" className="text-sm font-semibold text-emerald-400 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pools.slice(0, 6).map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        </section>
      )}

      {/* Open source CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-4 md:px-8">
        <div className="flex flex-col items-center gap-4 rounded-card-lg border border-emerald-500/20 bg-emerald-500/5 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Fully open source
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Read the contract, the tests, and this frontend — or fork it and deploy your own pools.
            </p>
          </div>
          <Button asChild>
            <a href={PROJECT_LINKS.github} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" /> View on GitHub
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
