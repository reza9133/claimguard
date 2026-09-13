"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ExternalLink, ImageIcon, ArrowLeft, ShieldQuestion } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { VerdictBadge } from "@/components/VerdictBadge";
import { AiVerdictCard } from "@/components/AiVerdictCard";
import { AppealForm } from "@/components/AppealForm";
import { useGetClaim } from "@/hooks/useClaimGuardContract";
import { formatGEN, formatUnixDateTime, truncateAddress } from "@/lib/utils";

export function ClaimDetailClient() {
  const pathname = usePathname();
  const claimId = Number(pathname.split("/").filter(Boolean).pop() ?? "0");
  const { address } = useAccount();

  const { data: claim, isLoading } = useGetClaim(claimId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <div className="h-64 animate-pulse rounded-card-lg bg-[var(--surface-subtle)]" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <ShieldQuestion className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-lg text-[var(--text-secondary)]">Claim #{claimId} doesn&apos;t exist.</p>
      </div>
    );
  }

  const isClaimant = address?.toLowerCase() === claim.claimant.toLowerCase();
  const canAppeal = isClaimant && claim.status === "denied" && !claim.appeal_used;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <Link
        href={`/pools/${claim.pool_id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-emerald-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to pool #{claim.pool_id}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Claim #{claim.id}</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            filed by {truncateAddress(claim.claimant)} · {formatUnixDateTime(claim.created_at)}
          </p>
        </div>
        <VerdictBadge status={claim.status} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="block">
            <CardTitle>Claim details</CardTitle>
          </CardHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
            {claim.description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoStat label="Requested" value={formatGEN(claim.requested_amount)} />
            <InfoStat label="Paid out" value={formatGEN(claim.payout_amount)} />
            <InfoStat label="Appeal used" value={claim.appeal_used ? "Yes" : "No"} />
          </div>

          {(claim.evidence_url || claim.has_photo) && (
            <div className="mt-5 flex flex-wrap gap-3">
              {claim.evidence_url && (
                <a
                  href={claim.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs text-emerald-400 hover:border-emerald-500/40"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Evidence URL
                </a>
              )}
              {claim.has_photo && (
                <span className="flex items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
                  <ImageIcon className="h-3.5 w-3.5" /> Photo evidence was submitted
                </span>
              )}
            </div>
          )}
        </Card>

        <AiVerdictCard claim={claim} />

        {canAppeal && (
          <Card>
            <CardHeader className="block">
              <CardTitle>Appeal this claim</CardTitle>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                One appeal is allowed per claim. Add context or fresh evidence for the AI to reconsider.
              </p>
            </CardHeader>
            <AppealForm claimId={claim.id} />
          </Card>
        )}

        {isClaimant && claim.status === "denied" && claim.appeal_used && (
          <p className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 text-center text-sm text-[var(--text-muted)]">
            This claim has already used its one appeal.
          </p>
        )}
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
