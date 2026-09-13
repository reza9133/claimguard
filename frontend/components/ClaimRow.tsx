import Link from "next/link";
import { ImageIcon, Link as LinkIcon, Flag } from "lucide-react";
import { VerdictBadge } from "@/components/VerdictBadge";
import { formatGEN, formatUnixDateTime, truncateAddress } from "@/lib/utils";
import type { Claim } from "@/lib/types";

export function ClaimRow({ claim, showPool = false }: { claim: Claim; showPool?: boolean }) {
  return (
    <Link
      href={`/claims/${claim.id}`}
      className="flex flex-col gap-2 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 transition-colors hover:border-emerald-500/35 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <VerdictBadge status={claim.status} />
          {showPool && (
            <span className="text-[11px] text-[var(--text-muted)]">Pool #{claim.pool_id}</span>
          )}
          {claim.appeal_used && (
            <span className="text-[11px] font-semibold text-amber-400">appealed</span>
          )}
          {claim.ai_red_flags?.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
              <Flag className="w-3 h-3" /> {claim.ai_red_flags.length} flag{claim.ai_red_flags.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-[var(--text-primary)]">{claim.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
          <span>by {truncateAddress(claim.claimant)}</span>
          <span>{formatUnixDateTime(claim.created_at)}</span>
          {claim.has_photo && (
            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> photo</span>
          )}
          {claim.evidence_url && (
            <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" /> url</span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Requested</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{formatGEN(claim.requested_amount)}</p>
        {claim.status === "approved" && (
          <p className="text-xs font-semibold text-emerald-400">paid {formatGEN(claim.payout_amount)}</p>
        )}
      </div>
    </Link>
  );
}
