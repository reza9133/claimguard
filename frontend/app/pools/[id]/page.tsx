"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ShieldCheck, Users, Calendar, TrendingUp, PauseCircle, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClaimRow } from "@/components/ClaimRow";
import { PoolMembershipPanel } from "@/components/PoolMembershipPanel";
import { TopUpWidget } from "@/components/TopUpWidget";
import { CreatorControls } from "@/components/CreatorControls";
import { FileClaimForm } from "@/components/FileClaimForm";
import { useGetPool, useGetClaimsByPool, useIsCovered } from "@/hooks/useClaimGuardContract";
import { formatGEN, formatUnixDateTime, truncateAddress } from "@/lib/utils";

export default function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const poolId = Number(id);
  const router = useRouter();
  const { address } = useAccount();

  const { data: pool, isLoading } = useGetPool(poolId);
  const { data: claims = [] } = useGetClaimsByPool(poolId);
  const { data: covered } = useIsCovered(poolId, address);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <div className="h-64 animate-pulse rounded-card-lg bg-[var(--surface-subtle)]" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <p className="text-lg text-[var(--text-secondary)]">Pool #{poolId} doesn&apos;t exist.</p>
      </div>
    );
  }

  const stats = [
    { label: "Members", value: pool.member_count, icon: Users },
    { label: "Coverage period", value: `${pool.coverage_period_days}d`, icon: Calendar },
    { label: "Claims filed", value: pool.claims_filed, icon: FileText },
    { label: "Pool balance", value: formatGEN(pool.balance), icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/12">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{pool.name}</h1>
              {!pool.active && (
                <Badge variant="warning">
                  <PauseCircle className="h-3 w-3" /> Paused
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Pool #{pool.id} · created by {truncateAddress(pool.creator)} · {formatUnixDateTime(pool.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: terms + stats + claims */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="block">
              <CardTitle>Coverage terms</CardTitle>
            </CardHeader>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {pool.description}
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="card-surface rounded-card p-3.5 text-center">
                <Icon className="mx-auto mb-1.5 h-4 w-4 text-emerald-400" />
                <p className="font-display text-lg font-bold text-[var(--text-primary)]">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
            <InfoStat label="Premium" value={formatGEN(pool.premium)} />
            <InfoStat label="Max payout / claim" value={formatGEN(pool.max_payout_per_claim)} />
            <InfoStat label="Max claims / period" value={String(pool.max_claims_per_member_per_period)} />
            <InfoStat label="Claims approved" value={String(pool.claims_approved)} />
            <InfoStat label="Claims denied" value={String(pool.claims_denied)} />
            <InfoStat label="Total paid out" value={formatGEN(pool.total_paid_out)} />
          </div>

          {covered && (
            <Card>
              <CardHeader className="block">
                <CardTitle>File a claim</CardTitle>
              </CardHeader>
              <FileClaimForm pool={pool} onFiled={(claimId) => router.push(`/claims/${claimId}`)} />
            </Card>
          )}

          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-[var(--text-primary)]">
              Claims filed against this pool
            </h2>
            {claims.length === 0 ? (
              <p className="rounded-card border border-dashed border-[var(--border-mid)] py-8 text-center text-sm text-[var(--text-muted)]">
                No claims filed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {[...claims]
                  .sort((a, b) => b.id - a.id)
                  .map((claim) => (
                    <ClaimRow key={claim.id} claim={claim} />
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: membership + top-up + creator controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="block">
              <CardTitle>Your coverage</CardTitle>
            </CardHeader>
            <PoolMembershipPanel pool={pool} />
          </Card>

          <TopUpWidget poolId={pool.id} />
          <CreatorControls pool={pool} />
        </div>
      </div>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
