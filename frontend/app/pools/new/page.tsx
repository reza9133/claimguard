"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConsensusTxStatus } from "@/components/ConsensusTxStatus";
import { useCreatePool } from "@/hooks/useClaimGuardContract";
import { readContract } from "@/lib/genlayer/client";
import { useAccount } from "wagmi";

export default function NewPoolPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { createPool, txState, isLoading } = useCreatePool();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [premium, setPremium] = useState("");
  const [periodDays, setPeriodDays] = useState("30");
  const [maxPayout, setMaxPayout] = useState("");
  const [maxClaims, setMaxClaims] = useState("2");

  useEffect(() => {
    if (txState.status !== "finalized") return;
    // The write receipt's decoded return value isn't reliable to parse
    // across networks, so the new pool's id is read back directly instead
    // — pool_count only increments once the pool this transaction created
    // exists, so count - 1 is that pool's id.
    let cancelled = false;
    (async () => {
      try {
        const count = Number(await readContract("get_pool_count"));
        if (!cancelled) {
          toast.success("Pool created!");
          router.push(`/pools/${count - 1}`);
        }
      } catch {
        if (!cancelled) toast.error("Pool created, but couldn't load it automatically — check the Pools list.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txState.status, router]);

  const submit = async () => {
    if (name.trim().length < 3) return toast.error("Pool name needs at least 3 characters.");
    if (description.trim().length < 30)
      return toast.error("Describe coverage terms in at least 30 characters — what's covered, what's excluded.");
    if (!premium || Number(premium) <= 0) return toast.error("Set a premium greater than zero.");
    if (!maxPayout || Number(maxPayout) <= 0) return toast.error("Set a max payout per claim greater than zero.");
    const days = Number(periodDays);
    if (!days || days <= 0 || days > 365) return toast.error("Coverage period must be between 1 and 365 days.");
    const claims = Number(maxClaims);
    if (!claims || claims <= 0 || claims > 100) return toast.error("Max claims per period must be between 1 and 100.");

    await createPool({
      name: name.trim(),
      description: description.trim(),
      premiumGen: premium,
      coveragePeriodDays: days,
      maxPayoutGen: maxPayout,
      maxClaimsPerPeriod: claims,
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/12">
          <ShieldPlus className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Start a coverage pool</h1>
          <p className="text-sm text-[var(--text-muted)]">Anyone can create one — you set the rules, AI enforces them.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="block">
          <CardTitle>Pool details</CardTitle>
          <CardDescription>These terms are what the AI checks every future claim against — be specific.</CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Pool name</Label>
            <Input id="name" placeholder="e.g. Package Damage Cover" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
          </div>

          <div>
            <Label htmlFor="description">Coverage terms</Label>
            <Textarea
              id="description"
              rows={5}
              placeholder="Describe exactly what's covered, what evidence is expected (photo, tracking URL, etc.), and what's excluded."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="premium">Premium (GEN)</Label>
              <Input id="premium" type="number" min="0" step="any" placeholder="10" value={premium} onChange={(e) => setPremium(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="period">Coverage period (days)</Label>
              <Input id="period" type="number" min="1" max="365" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="maxPayout">Max payout per claim (GEN)</Label>
              <Input id="maxPayout" type="number" min="0" step="any" placeholder="50" value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="maxClaims">Max claims per member / period</Label>
              <Input id="maxClaims" type="number" min="1" max="100" value={maxClaims} onChange={(e) => setMaxClaims(e.target.value)} disabled={isLoading} />
            </div>
          </div>

          <Button onClick={submit} disabled={isLoading || !isConnected} className="w-full">
            {!isConnected ? "Connect wallet to create a pool" : isLoading ? "Confirming…" : "Create pool"}
          </Button>

          {txState.status !== "idle" && (
            <ConsensusTxStatus status={txState.status} txHash={txState.txHash} error={txState.error} />
          )}
        </div>
      </Card>
    </div>
  );
}
