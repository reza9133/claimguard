import { Bot, Flag } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { VerdictBadge } from "@/components/VerdictBadge";
import type { Claim } from "@/lib/types";

export function AiVerdictCard({ claim }: { claim: Claim }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/12">
            <Bot className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <CardTitle>AI Adjudication</CardTitle>
        </div>
        <VerdictBadge status={claim.status} />
      </CardHeader>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Covered</p>
          <p className={`text-lg font-bold ${claim.ai_covered ? "text-emerald-400" : "text-red-400"}`}>
            {claim.ai_covered ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Payout percentage</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">{claim.ai_payout_percent}%</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Reasoning</p>
        <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-secondary)]">
          {claim.ai_reasoning || "No reasoning was recorded."}
        </p>
      </div>

      {claim.ai_red_flags?.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-amber-400">
            <Flag className="h-3 w-3" /> Flags raised
          </p>
          <ul className="space-y-1.5">
            {claim.ai_red_flags.map((flag, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300"
              >
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-[11px] text-[var(--text-muted)]">
        Reasoning and flags are stored for transparency but are not what validators reach
        consensus on — only <code className="text-emerald-400">covered</code> and{" "}
        <code className="text-emerald-400">payout_percent</code> (within a small tolerance) have
        to match across independent AI reviewers.
      </p>
    </Card>
  );
}
