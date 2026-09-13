"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, FileText, LayoutGrid, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClaimRow } from "@/components/ClaimRow";
import { PoolCard } from "@/components/PoolCard";
import {
  useGetAllPools,
  useGetMyPolicies,
  useGetClaimsByMember,
} from "@/hooks/useClaimGuardContract";
import { formatGEN, relativeToNow, sumWei } from "@/lib/utils";

type Tab = "coverage" | "claims" | "created";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("coverage");

  const { data: allPools = [] } = useGetAllPools();
  const { data: myPolicies = [], isLoading: loadingPolicies } = useGetMyPolicies(address);
  const { data: myClaims = [], isLoading: loadingClaims } = useGetClaimsByMember(address);

  const myPools = allPools.filter((p) => p.creator.toLowerCase() === address?.toLowerCase());

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center md:px-8">
        <Wallet className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
        <h1 className="mb-2 font-display text-2xl font-bold text-[var(--text-primary)]">Your Dashboard</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Connect your wallet to see your coverage, claims, and pools you&apos;ve created.
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button onClick={openConnectModal}>Connect Wallet</Button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof ShieldCheck; count: number }[] = [
    { key: "coverage", label: "My Coverage", icon: ShieldCheck, count: myPolicies.length },
    { key: "claims", label: "My Claims", icon: FileText, count: myClaims.length },
    { key: "created", label: "Pools I Created", icon: LayoutGrid, count: myPools.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <h1 className="mb-1 font-display text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
      <p className="mb-8 text-sm text-[var(--text-muted)]">Everything tied to your connected wallet.</p>

      <div className="mb-8 flex gap-2 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-400"
                : "border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <Badge variant={tab === key ? "success" : "neutral"}>{count}</Badge>
          </button>
        ))}
      </div>

      {tab === "coverage" &&
        (loadingPolicies ? (
          <SkeletonGrid />
        ) : myPolicies.length === 0 ? (
          <EmptyState text="You're not covered by any pool yet." ctaHref="/pools" ctaLabel="Browse pools" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myPolicies.map(({ pool, policy }) => (
              <Card key={pool.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/pools/${pool.id}`} className="font-display font-semibold text-[var(--text-primary)] hover:text-emerald-400">
                      {pool.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">Pool #{pool.id}</p>
                  </div>
                  <Badge variant={policy.active ? "success" : "danger"}>
                    {policy.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[var(--text-muted)]">Expires</p>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {relativeToNow(policy.expires_at_ts)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Claims used</p>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {policy.claims_this_period}/{pool.max_claims_per_member_per_period}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link href={`/pools/${pool.id}`}>Manage coverage</Link>
                </Button>
              </Card>
            ))}
          </div>
        ))}

      {tab === "claims" &&
        (loadingClaims ? (
          <SkeletonGrid />
        ) : myClaims.length === 0 ? (
          <EmptyState text="You haven't filed any claims yet." ctaHref="/pools" ctaLabel="Find a covered pool" />
        ) : (
          <div className="space-y-3">
            {[...myClaims]
              .sort((a, b) => b.id - a.id)
              .map((claim) => (
                <ClaimRow key={claim.id} claim={claim} showPool />
              ))}
          </div>
        ))}

      {tab === "created" &&
        (myPools.length === 0 ? (
          <EmptyState text="You haven't created any pools yet." ctaHref="/pools/new" ctaLabel="Start a pool" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ))}

      {tab === "created" && myPools.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoStat label="Total balance" value={formatGEN(sumWei(myPools.map((p) => p.balance)))} />
          <InfoStat label="Total members" value={String(myPools.reduce((s, p) => s + p.member_count, 0))} />
          <InfoStat label="Claims filed" value={String(myPools.reduce((s, p) => s + p.claims_filed, 0))} />
          <InfoStat label="Total paid out" value={formatGEN(sumWei(myPools.map((p) => p.total_paid_out)))} />
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-card-lg bg-[var(--surface-subtle)]" />
      ))}
    </div>
  );
}

function EmptyState({ text, ctaHref, ctaLabel }: { text: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card-lg border border-dashed border-[var(--border-mid)] py-16 text-center">
      <p className="text-[var(--text-secondary)]">{text}</p>
      <Button asChild variant="outline">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface rounded-card p-3.5 text-center">
      <p className="font-display text-lg font-bold text-emerald-400">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
