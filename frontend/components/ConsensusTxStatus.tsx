"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TxPhase = "idle" | "pending" | "finalizing" | "finalized" | "error";

interface Props {
  status: TxPhase;
  txHash: string | null;
  error?: string | null;
  finalizingLabel?: string;
}

const PHASES = [
  { key: "submitting", label: "Submitting to network" },
  { key: "pending", label: "Picked up by consensus" },
  { key: "proposing", label: "Leader proposing" },
  { key: "committing", label: "Validators committing" },
  { key: "revealing", label: "Validators revealing" },
  { key: "accepted", label: "Consensus reached" },
];

function phasesComplete(status: TxPhase): number {
  if (status === "pending") return 1;
  if (status === "finalizing") return 3;
  if (status === "finalized") return PHASES.length;
  return 0;
}

const EXPLORER_BASE = "https://explorer-studio.genlayer.com";

export function ConsensusTxStatus({ status, txHash, error, finalizingLabel }: Props) {
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    if (status !== "finalizing") {
      setAnimPhase(phasesComplete(status));
      return;
    }
    setAnimPhase(1);
    const timings = [800, 1800, 3200, 5000];
    const timers = timings.map((delay, i) => setTimeout(() => setAnimPhase(i + 2), delay));
    return () => timers.forEach(clearTimeout);
  }, [status]);

  if (status === "idle") return null;

  return (
    <div className="animate-fade-up rounded-card border border-[var(--border-mid)] bg-[var(--surface-subtle)] p-4">
      <div className="flex items-center gap-2.5 mb-3">
        {status === "finalized" ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-400 text-sm">Consensus reached</span>
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-red-400 text-sm">Transaction failed</span>
          </>
        ) : (
          <>
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="font-semibold text-emerald-400 text-sm">
              {status === "pending"
                ? "Waiting for wallet confirmation…"
                : finalizingLabel ?? "GenLayer validators reaching consensus…"}
            </span>
          </>
        )}
      </div>

      {status !== "error" && (
        <div className="space-y-0">
          {PHASES.map((phase, i) => {
            const done = i < animPhase;
            const active = i === animPhase - 1 && status !== "finalized";
            return (
              <div key={phase.key} className="flex items-center gap-2.5 relative pb-2.5 last:pb-0">
                {i > 0 && (
                  <span
                    className={cn(
                      "absolute left-[7px] -top-2.5 h-2.5 w-px",
                      done ? "bg-emerald-500/60" : "bg-[var(--border-mid)]"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                    done && "border-emerald-500 bg-emerald-500/20",
                    active && "border-emerald-400 shadow-[0_0_8px_rgba(20,184,129,0.5)]",
                    !done && !active && "border-[var(--border-mid)]"
                  )}
                >
                  {done && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    done && "text-emerald-400",
                    active && "font-semibold text-emerald-300",
                    !done && !active && "text-[var(--text-muted)] opacity-60"
                  )}
                >
                  {phase.label}
                  {active && "…"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {status === "error" && error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {txHash && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-black/10 px-2.5 py-1.5">
          <Hash className="w-3 h-3 flex-shrink-0 text-[var(--text-muted)]" />
          <code className="flex-1 truncate font-mono text-[10px] text-emerald-400">{txHash}</code>
          <a
            href={`${EXPLORER_BASE}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View on explorer"
            className="text-[var(--text-muted)] hover:text-emerald-400"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
