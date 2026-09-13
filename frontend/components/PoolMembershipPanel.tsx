"use client";

import { useAccount } from "wagmi";
import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import { useGetPolicy, useIsCovered, useJoinPool, useCancelPolicy } from "@/hooks/useClaimGuardContract";
import { formatGEN, formatUnixDateTime, relativeToNow } from "@/lib/utils";
import type { Pool } from "@/lib/types";

export function PoolMembershipPanel({ pool }: { pool: Pool }) {
  const { address, isConnected } = useAccount();
  const { data: policy } = useGetPolicy(pool.id, address);
  const { data: covered } = useIsCovered(pool.id, address);
  const { joinPool, txState: joinState, isLoading: joining } = useJoinPool();
  const { cancelPolicy, txState: cancelState, isLoading: cancelling } = useCancelPolicy();

  if (!isConnected) {
    return (
      <div className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4 text-center">
        <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">Connect your wallet to join this pool.</p>
      </div>
    );
  }

  const hasPolicy = !!policy;
  const premium = BigInt(pool.premium);

  return (
    <div className="space-y-4">
      {covered ? (
        <div className="flex items-start gap-3 rounded-card border border-emerald-500/25 bg-emerald-500/10 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">You&apos;re covered</p>
            <p className="text-xs text-[var(--text-muted)]">
              Coverage {relativeToNow(policy?.expires_at_ts)} · expires{" "}
              {formatUnixDateTime(policy?.expires_at_ts)}
            </p>
            {policy && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {policy.claims_this_period}/{pool.max_claims_per_member_per_period} claims used this period
              </p>
            )}
          </div>
        </div>
      ) : hasPolicy ? (
        <div className="flex items-start gap-3 rounded-card border border-red-500/25 bg-red-500/10 p-4">
          <ShieldX className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">Coverage expired</p>
            <p className="text-xs text-[var(--text-muted)]">Renew below to file claims again.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--text-muted)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Not covered yet</p>
            <p className="text-xs text-[var(--text-muted)]">
              Join for {formatGEN(pool.premium)} to get {pool.coverage_period_days} days of coverage.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => joinPool(pool.id, premium)}
          disabled={joining || !pool.active}
          className="flex-1"
        >
          {joining ? "Confirming…" : hasPolicy ? `Renew for ${formatGEN(pool.premium)}` : `Join for ${formatGEN(pool.premium)}`}
        </Button>
        {covered && (
          <Button
            variant="destructive"
            onClick={() => cancelPolicy(pool.id)}
            disabled={cancelling}
          >
            {cancelling ? "Confirming…" : "Cancel coverage"}
          </Button>
        )}
      </div>

      {!pool.active && !covered && (
        <p className="text-xs text-amber-400">This pool is paused — new joins and renewals aren&apos;t accepted right now.</p>
      )}

      {joinState.status !== "idle" && (
        <ConsensusTxStatus status={joinState.status} txHash={joinState.txHash} error={joinState.error} />
      )}
      {cancelState.status !== "idle" && (
        <ConsensusTxStatus status={cancelState.status} txHash={cancelState.txHash} error={cancelState.error} />
      )}
    </div>
  );
}
