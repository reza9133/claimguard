"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import { useFileClaim } from "@/hooks/useClaimGuardContract";
import { readContract } from "@/lib/genlayer/client";
import { formatGEN } from "@/lib/utils";
import type { Pool } from "@/lib/types";

const EMPTY = new Uint8Array();

export function FileClaimForm({ pool, onFiled }: { pool: Pool; onFiled?: (claimId: number) => void }) {
  const { fileClaim, txState, reset, isLoading } = useFileClaim();
  const [description, setDescription] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [photo, setPhoto] = useState<Uint8Array | null>(null);

  const submit = async () => {
    if (description.trim().length < 15) {
      toast.error("Describe what happened in at least 15 characters.");
      return;
    }
    if (!requestedAmount || Number(requestedAmount) <= 0) {
      toast.error("Enter how much GEN you're requesting.");
      return;
    }
    if (!evidenceUrl.trim() && !photo) {
      toast.error("Attach a photo and/or an evidence URL.");
      return;
    }

    const hash = await fileClaim({
      poolId: pool.id,
      description: description.trim(),
      requestedAmountGen: requestedAmount,
      evidenceUrl: evidenceUrl.trim(),
      photo: photo ?? EMPTY,
    });

    if (hash) {
      toast.success("Claim submitted — AI validators are adjudicating it now.");
    }
  };

  const isDone = txState.status === "finalized";

  useEffect(() => {
    if (!isDone || !onFiled) return;
    // Same reasoning as pools/new/page.tsx: read the new claim's id back
    // directly rather than trying to decode it out of the write receipt.
    let cancelled = false;
    (async () => {
      try {
        const count = Number(await readContract("get_claim_count"));
        if (!cancelled) onFiled(count - 1);
      } catch {
        // Non-fatal — the claim was still filed successfully; the caller
        // just won't get auto-navigated to it.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  if (isDone) {
    return (
      <div className="space-y-4">
        <ConsensusTxStatus
          status={txState.status}
          txHash={txState.txHash}
          error={txState.error}
          finalizingLabel="Validators are reviewing your evidence…"
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              setDescription("");
              setRequestedAmount("");
              setEvidenceUrl("");
              setPhoto(null);
            }}
          >
            File another claim
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="claim-desc">What happened?</Label>
        <Textarea
          id="claim-desc"
          rows={4}
          placeholder="Describe the loss or damage in detail — this is what the AI weighs against the pool's coverage terms."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="claim-amount">Requested amount (GEN)</Label>
          <Input
            id="claim-amount"
            type="number"
            min="0"
            step="any"
            placeholder="0.0"
            value={requestedAmount}
            onChange={(e) => setRequestedAmount(e.target.value)}
            disabled={isLoading}
          />
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Capped at {formatGEN(pool.max_payout_per_claim)} per claim by this pool.
          </p>
        </div>
        <div>
          <Label htmlFor="claim-url">Evidence URL (optional)</Label>
          <Input
            id="claim-url"
            type="url"
            placeholder="https://tracking.example.com/..."
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <PhotoDropzone onChange={setPhoto} />

      <Button onClick={submit} disabled={isLoading} className="w-full">
        {isLoading ? "Submitting…" : "Submit claim for AI review"}
      </Button>

      {txState.status !== "idle" && (
        <ConsensusTxStatus
          status={txState.status}
          txHash={txState.txHash}
          error={txState.error}
          finalizingLabel="Validators are reviewing your evidence…"
        />
      )}
    </div>
  );
}
