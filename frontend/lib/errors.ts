// Maps raw contract/RPC error strings to user-friendly messages.
// Patterns are tested in order — first match wins.

interface ErrorMapping {
  pattern: RegExp;
  message: string;
}

const CONTRACT_ERRORS: ErrorMapping[] = [
  // ── Pools ─────────────────────────────────────────────────────────────────
  { pattern: /Pool \d+ does not exist/i, message: "This pool doesn't exist on-chain." },
  { pattern: /at least 3 characters/i, message: "Pool name is too short — use at least 3 characters." },
  { pattern: /at least 30 characters/i, message: "Coverage terms are too short — describe what's covered in at least 30 characters." },
  { pattern: /Premium must be positive/i, message: "Set a premium greater than zero." },
  { pattern: /Coverage period must be between/i, message: "Coverage period must be between 1 and 365 days." },
  { pattern: /Max payout per claim must be positive/i, message: "Set a per-claim payout cap greater than zero." },
  { pattern: /Max claims per member/i, message: "Max claims per member per period must be between 1 and 100." },
  { pattern: /Only the pool creator/i, message: "Only this pool's creator can do that." },
  { pattern: /not accepting new members/i, message: "This pool is currently paused for new joins and renewals." },
  { pattern: /Must send GEN to top up/i, message: "Enter an amount of GEN to top up." },

  // ── Membership ────────────────────────────────────────────────────────────
  { pattern: /Must send exactly (\d+) wei/i, message: "Send exactly the pool's premium amount to join or renew." },
  { pattern: /No active policy to cancel/i, message: "You don't have an active policy in this pool." },
  { pattern: /do not have an active policy/i, message: "You need an active policy in this pool before filing a claim." },
  { pattern: /coverage has expired/i, message: "Your coverage has expired — renew before filing a claim." },

  // ── Claims ────────────────────────────────────────────────────────────────
  { pattern: /Claim limit reached/i, message: "You've used all your claims for this coverage period." },
  { pattern: /at least 15 characters/i, message: "Describe what happened in at least 15 characters." },
  { pattern: /Requested amount must be positive/i, message: "Enter a requested amount greater than zero." },
  { pattern: /Provide at least a photo/i, message: "Attach a photo and/or an evidence URL before filing." },
  { pattern: /Claim \d+ does not exist/i, message: "This claim doesn't exist on-chain." },

  // ── Appeals ───────────────────────────────────────────────────────────────
  { pattern: /Only the claimant can appeal/i, message: "Only the person who filed this claim can appeal it." },
  { pattern: /Only denied claims can be appealed/i, message: "Only a denied claim can be appealed." },
  { pattern: /already been appealed/i, message: "This claim has already used its one appeal." },
  { pattern: /at least 10 characters/i, message: "Add a bit more context for your appeal (at least 10 characters)." },

  // ── Wallet / network ──────────────────────────────────────────────────────
  { pattern: /Wallet not connected/i, message: "Connect your wallet to continue." },
  { pattern: /user rejected/i, message: "Transaction cancelled." },
  { pattern: /rejected by user/i, message: "Transaction cancelled." },
  { pattern: /insufficient funds/i, message: "Insufficient GEN balance to cover this transaction." },
  { pattern: /rate limit exceeded/i, message: "Too many requests — please wait a moment and try again." },
  { pattern: /Timed out after \d+s/i, message: "Consensus is taking longer than expected. Check the explorer for status." },
  { pattern: /network|fetch|Failed to fetch|ECONNREFUSED/i, message: "Network error — check your connection and try again." },
];

const FALLBACK = "Something went wrong. Please try again.";

/** Extracts the deepest human-readable string from any error shape thrown by genlayer-js, viem, or the contract VM. */
export function extractRawMessage(err: unknown): string {
  if (!err) return FALLBACK;

  const e = err as Record<string, unknown>;
  const candidates = [
    e.details,
    e.shortMessage,
    (e.cause as Record<string, unknown> | undefined)?.message,
    (e.cause as Record<string, unknown> | undefined)?.details,
    e.message,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const m = String(raw).match(/UserError[^:]*:\s*(.+?)(?:\n|$)/);
    if (m) return m[1].trim();
  }

  return candidates[0] ? String(candidates[0]) : FALLBACK;
}

/** Returns a user-friendly message for any contract/wallet error. Always logs the raw error for debugging. */
export function friendlyError(err: unknown): string {
  console.error("[ClaimGuard error]", err);

  const raw = extractRawMessage(err);

  for (const { pattern, message } of CONTRACT_ERRORS) {
    if (pattern.test(raw)) return message;
  }

  const cleaned = raw
    .replace(/^(ContractFunctionExecutionError|ContractFunctionRevertedError|Error):\s*/i, "")
    .replace(/\n.*/s, "")
    .trim();

  return cleaned || FALLBACK;
}
