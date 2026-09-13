"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import { useTopUpPool } from "@/hooks/useClaimGuardContract";

export function TopUpWidget({ poolId }: { poolId: number }) {
  const { topUpPool, txState, isLoading } = useTopUpPool();
  const [amount, setAmount] = useState("");

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter an amount of GEN to donate.");
      return;
    }
    const hash = await topUpPool(poolId, amount);
    if (hash) {
      toast.success("Thanks for supporting this pool!");
      setAmount("");
    }
  };

  return (
    <div className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
        <HandCoins className="h-4 w-4 text-emerald-400" /> Support this pool
      </p>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        Anyone can donate GEN into the reserve — helps a new pool get started or keeps an active one solvent.
      </p>
      <div className="flex gap-2">
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="Amount in GEN"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={submit} disabled={isLoading} variant="outline">
          {isLoading ? "…" : "Top up"}
        </Button>
      </div>
      {txState.status !== "idle" && (
        <div className="mt-3">
          <ConsensusTxStatus status={txState.status} txHash={txState.txHash} error={txState.error} />
        </div>
      )}
    </div>
  );
}
