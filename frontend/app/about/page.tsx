"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Github,
  Twitter,
  ExternalLink,
  Sparkles,
  Code2,
  Boxes,
  Blocks,
  Palette,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PROJECT_LINKS } from "@/lib/links";

const stack = [
  {
    icon: Blocks,
    title: "GenLayer Intelligent Contract",
    body: "Python, deployed on GenLayer Studionet. Uses a custom leader/validator equivalence pattern for AI consensus, live web reads, and vision-model image evaluation.",
  },
  {
    icon: Code2,
    title: "Next.js 16 + React 19",
    body: "App Router, TypeScript throughout, built and verified with a real production build — not just written and assumed to work.",
  },
  {
    icon: Boxes,
    title: "wagmi + RainbowKit + genlayer-js",
    body: "Wallet connection and consensus-aware transaction handling, with a rate-limit-safe read client (caching, dedup, retry with backoff) for GenLayer's shared RPC.",
  },
  {
    icon: Palette,
    title: "Tailwind CSS v4",
    body: "A custom emerald/teal design system with full light and dark themes, built from CSS variables rather than hardcoded colors.",
  },
];

const principles = [
  "No adjuster, no claims desk — AI-validator consensus decides every claim.",
  "No admin withdrawal exists anywhere in the contract, for anyone.",
  "Every pool tracks its own balance — one pool's claim can never touch another's funds.",
  "Fully open source — read the contract, the tests, and the frontend yourself.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      {/* Header */}
      <div className="mb-16 text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #14b881 0%, #0d5f45 100%)",
            boxShadow: "0 0 32px rgba(20,184,129,0.35)",
          }}
        >
          <ShieldCheck className="h-8 w-8 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          About ClaimGuard
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
          ClaimGuard is an experiment in letting AI-validator consensus — not a company, not
          an adjuster — decide whether a claim against a shared pool of funds is legitimate.
          It&apos;s built end-to-end on GenLayer, the first blockchain where smart contracts
          can natively read images, browse the web, and reach agreement on a judgment call.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-16">
        <Card className="p-7">
          <div className="mb-3 flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Why this exists</h2>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Traditional insurance needs a company to hold the pool, an adjuster to review
            evidence, and weeks to settle a claim. GenLayer removes the middle two: an
            Intelligent Contract can read a photo, fetch a live web page, and have
            independent AI validators reach consensus on coverage — all inside a single
            transaction. ClaimGuard is a concrete demonstration of that idea, built as a
            companion piece to a freelance-escrow Intelligent Contract that uses the same
            core principle (AI-validator consensus adjudicating a contested outcome) for a
            different shape of problem: a shared pool serving many members over time,
            reviewed with photo evidence, using a deliberately more robust equivalence
            pattern under the hood.
          </p>
        </Card>
      </section>

      {/* Principles */}
      <section className="mb-16">
        <h2 className="mb-5 font-display text-lg font-bold text-[var(--text-primary)]">
          What we optimized for
        </h2>
        <ul className="space-y-3">
          {principles.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
              <span className="text-sm text-[var(--text-secondary)]">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tech stack */}
      <section className="mb-16">
        <h2 className="mb-5 font-display text-lg font-bold text-[var(--text-primary)]">
          Built with
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {stack.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-5">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/12">
                <Icon className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <h3 className="mb-1.5 font-display text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Open source & creator */}
      <section className="mb-8">
        <Card className="p-7 text-center">
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text-primary)]">
            Open source, end to end
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-muted)]">
            The Intelligent Contract, the test suite, and this entire frontend are public.
            Read it, fork it, deploy your own pools.
          </p>

          <div className="mb-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href={PROJECT_LINKS.github} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" /> View source on GitHub
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={PROJECT_LINKS.explorerContract} target="_blank" rel="noopener noreferrer">
                View contract on Explorer <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Built by
            </p>
            <a
              href={PROJECT_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
            >
              <Twitter className="h-4 w-4" /> @amirhp771
            </a>
          </div>
        </Card>
      </section>

      <div className="text-center">
        <Button asChild variant="ghost">
          <Link href="/how-it-works">
            See exactly how it works <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
