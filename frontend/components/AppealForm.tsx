"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PhotoDropzone } from "@/components/PhotoDropzone";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import { useAppealClaim } from "@/hooks/useClaimGuardContract";

const EMPTY = new Uint8Array();

export function AppealForm({ claimId }: { claimId: number }) {
  const { appealClaim, txState, isLoading } = useAppealClaim();
  const [context, setContext] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [photo, setPhoto] = useState<Uint8Array | null>(null);

  const submit = async () => {
    if (context.trim().length < 10) {
      toast.error("Add a bit more context (at least 10 characters).");
      return;
    }
    const hash = await appealClaim({
      claimId,
      additionalContext: context.trim(),
      additionalEvidenceUrl: evidenceUrl.trim(),
      photo: photo ?? EMPTY,
    });
    if (hash) toast.success("Appeal submitted — this is your one re-review.");
  };

  if (txState.status === "finalized") {
    return (
      <ConsensusTxStatus
        status={txState.status}
        txHash={txState.txHash}
        error={txState.error}
        finalizingLabel="Validators are re-reviewing your claim…"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="appeal-context">Additional context</Label>
        <Textarea
          id="appeal-context"
          rows={3}
          placeholder="What should the AI reconsider? Add detail the first review may have missed."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="appeal-url">Additional evidence URL (optional)</Label>
        <Input
          id="appeal-url"
          type="url"
          placeholder="Leave blank to keep the original URL"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <PhotoDropzone onChange={setPhoto} label="New evidence photo (optional)" />

      <Button onClick={submit} disabled={isLoading} variant="success" className="w-full">
        {isLoading ? "Submitting appeal…" : "Submit one-time appeal"}
      </Button>

      {txState.status !== "idle" && (
        <ConsensusTxStatus
          status={txState.status}
          txHash={txState.txHash}
          error={txState.error}
          finalizingLabel="Validators are re-reviewing your claim…"
        />
      )}
    </div>
  );
}
