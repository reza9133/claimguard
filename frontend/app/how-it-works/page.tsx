"use client";

import Link from "next/link";
import {
  ShieldPlus,
  Coins,
  Camera,
  Scale,
  Wallet,
  Bot,
  Gavel,
  RotateCcw,
  Lock,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const lifecycle = [
  {
    icon: ShieldPlus,
    title: "1. Someone creates a pool",
    body: "Anyone writes coverage terms in plain English — what's covered, what's excluded, what evidence is expected — plus a premium, a coverage period, and payout limits per claim and per period. These terms become the yardstick every future claim is measured against.",
  },
  {
    icon: Coins,
    title: "2. Members join by paying the premium",
    body: "Paying the exact premium opens (or renews) a policy for one coverage period. Renewing before expiry extends from the current expiry date, so early renewals never waste paid-for time.",
  },
  {
    icon: Camera,
    title: "3. A member files a claim",
    body: "One transaction: a description of what happened, a requested amount, and evidence — a photo, a URL (like a tracking or repair-quote page), or both. There's no separate upload step; the evidence travels with the transaction itself.",
  },
  {
    icon: Bot,
    title: "4. GenLayer validators adjudicate — atomically",
    body: "In the same transaction, independent AI validators read the pool's terms alongside the claim's evidence — a vision-capable model inspects the photo, and the URL (if any) is rendered live as text — and reach consensus on whether it's covered and what percentage of the requested amount is justified.",
  },
  {
    icon: Gavel,
    title: "5. Approved claims pay out instantly",
    body: "If covered, GEN moves to the claimant immediately, capped by the requested amount, the pool's per-claim maximum, and whatever the pool actually has. If denied, the claimant gets exactly one appeal.",
  },
];

const consensusSteps = [
  {
    title: "The leader proposes a verdict",
    body: "One validator (the leader) runs the AI evaluation first: it reads the pool's terms, the claim description, the fetched URL text, and the photo (if any), and proposes { covered, payout_percent, reasoning, red_flags }.",
  },
  {
    title: "Validators independently re-derive it",
    body: "Other validators don't just check the leader's formatting — each one re-runs the same evaluation from scratch, independently, using the identical inputs.",
  },
  {
    title: "Only the decision fields need to agree",
    body: "Validators compare covered (must match exactly) and payout_percent (must be within 15 percentage points) — never the free-text reasoning, which two honest reviewers will always phrase differently even in full agreement.",
  },
  {
    title: "Majority agreement → accepted",
    body: "If enough validators agree within tolerance, the verdict is accepted and the payout executes. If not, the network rotates to a new leader and tries again.",
  },
];

const faqs = [
  {
    q: "Why can the claimant trigger their own claim's evaluation?",
    a: "In a two-party escrow, letting the payee trigger their own payout is a real trust smell. But a mutual pool has no counterparty to favor — the verdict comes from independent AI-validator consensus, not from who called the method — so there's no self-approval vector to guard against, and filing can safely resolve atomically in the claimant's own transaction.",
  },
  {
    q: "What stops someone from draining a pool with one claim?",
    a: "Three independent caps, enforced in contract code before the AI is ever asked anything: the claim's own requested amount, the pool's max_payout_per_claim, and the pool's live balance. A payout is the minimum of all three, multiplied by the AI's payout percentage.",
  },
  {
    q: "Can the pool creator withdraw the funds?",
    a: "No — there is no withdrawal function anywhere in the contract, for anyone, including the creator. The only way GEN ever leaves a pool is through an AI-approved claim. Pausing a pool (creator-only) only blocks new joins and renewals; it can't touch existing funds or strip anyone's coverage.",
  },
  {
    q: "What happens to a denied claim?",
    a: "The claimant gets exactly one appeal, where they can add context and/or fresh evidence. The AI re-adjudicates with the combined description. A second appeal on the same claim is rejected by the contract.",
  },
  {
    q: "Why doesn't the contract just store the photo permanently?",
    a: "Storage is expensive and the photo is only needed transiently, at the moment of evaluation. It's included directly in the transaction's calldata (so every validator sees the exact same bytes) and used immediately — never persisted in contract state.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8">
      {/* Header */}
      <div className="mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-pill border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
          <Layers className="h-3.5 w-3.5" /> The full mechanics
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
          How ClaimGuard works
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
          From pooling GEN to an AI-approved payout — every step happens on-chain, in the
          open, with no human in the loop.
        </p>
      </div>

      {/* Lifecycle */}
      <section className="mb-20">
        <h2 className="mb-8 font-display text-xl font-bold text-[var(--text-primary)]">
          The claim lifecycle
        </h2>
        <div className="space-y-4">
          {lifecycle.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/12">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                {i < lifecycle.length - 1 && <div className="mt-2 h-full w-px flex-1 bg-[var(--border-mid)]" />}
              </div>
              <div className="pb-8">
                <h3 className="mb-1.5 font-display text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Consensus mechanics */}
      <section className="mb-20">
        <div className="mb-8 flex items-center gap-3">
          <Scale className="h-6 w-6 text-emerald-400" />
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
            How AI validators reach consensus
          </h2>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)]">
          GenLayer&apos;s validators don&apos;t just trust one model&apos;s output — they use a
          custom leader/validator pattern (
          <code className="rounded bg-[var(--surface-raised)] px-1.5 py-0.5 text-xs text-emerald-400">
            gl.vm.run_nondet_unsafe
          </code>
          ) built specifically so independent reviewers can agree on a <em>decision</em>{" "}
          even when their free-text reasoning never matches word for word.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {consensusSteps.map((step, i) => (
            <Card key={step.title} className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">{step.title}</h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">{step.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-5">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <MiniStat label="covered" value="exact match" icon={CheckCircle2} />
            <MiniStat label="payout_percent" value="±15 points" icon={Scale} />
            <MiniStat label="reasoning" value="allowed to vary" icon={Bot} />
            <MiniStat label="red_flags" value="allowed to vary" icon={XCircle} />
          </div>
        </div>
      </section>

      {/* Trust & security */}
      <section className="mb-20">
        <div className="mb-8 flex items-center gap-3">
          <Lock className="h-6 w-6 text-emerald-400" />
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
            Why it&apos;s safe to pool funds here
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TrustPoint
            icon={Wallet}
            title="Per-pool balance isolation"
            body="Every pool tracks its own balance internally. A payout from one pool can never draw down another pool's funds, even though the contract holds all of them together."
          />
          <TrustPoint
            icon={Lock}
            title="No admin withdrawal, anywhere"
            body="There is no function in the contract — not for the creator, not for anyone — that moves pooled GEN except an AI-approved claim payout."
          />
          <TrustPoint
            icon={Gavel}
            title="Structural spend limits"
            body="max_payout_per_claim and max_claims_per_member_per_period are enforced in contract code before the AI is asked anything — a bad verdict is capped in blast radius regardless."
          />
          <TrustPoint
            icon={RotateCcw}
            title="One appeal, evidence-based"
            body="A denied claim gets exactly one re-review, with room for fresh evidence — enough to correct a genuine miss, not enough to spam the pool."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="mb-8 font-display text-xl font-bold text-[var(--text-primary)]">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 open:border-emerald-500/30"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-primary)] marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col items-center gap-4 rounded-card-lg border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
        <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Ready to see it in action?</h3>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/pools">
              Browse pools <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pools/new">Start your own pool</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CheckCircle2 }) {
  return (
    <div>
      <Icon className="mx-auto mb-1.5 h-4 w-4 text-emerald-400" />
      <p className="font-mono text-[11px] text-[var(--text-muted)]">{label}</p>
      <p className="text-xs font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function TrustPoint({ icon: Icon, title, body }: { icon: typeof Wallet; title: string; body: string }) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/12">
        <Icon className="h-4.5 w-4.5 text-emerald-400" />
      </div>
      <h3 className="mb-1.5 font-display text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
    </Card>
  );
}
