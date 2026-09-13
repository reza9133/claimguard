"use client";

import { useAccount } from "wagmi";
import { Settings2, PlayCircle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import { useSetPoolActive } from "@/hooks/useClaimGuardContract";
import type { Pool } from "@/lib/types";

export function CreatorControls({ pool }: { pool: Pool }) {
  const { address } = useAccount();
  const { setPoolActive, txState, isLoading } = useSetPoolActive();

  if (!address || address.toLowerCase() !== pool.creator.toLowerCase()) return null;

  return (
    <div className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
        <Settings2 className="h-4 w-4 text-emerald-400" /> Creator controls
      </p>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        Pausing only blocks new joins and renewals — existing members stay covered and can still
        file claims until their coverage naturally expires. There is no way to withdraw pooled
        funds directly; that&apos;s by design.
      </p>
      <Button
        variant={pool.active ? "destructive" : "success"}
        onClick={() => setPoolActive(pool.id, !pool.active)}
        disabled={isLoading}
      >
        {pool.active ? (
          <>
            <PauseCircle className="h-4 w-4" /> Pause new joins
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4" /> Resume pool
          </>
        )}
      </Button>
      {txState.status !== "idle" && (
        <div className="mt-3">
          <ConsensusTxStatus status={txState.status} txHash={txState.txHash} error={txState.error} />
        </div>
      )}
    </div>
  );
}
