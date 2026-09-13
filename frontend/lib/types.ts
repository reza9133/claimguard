export interface Pool {
  id: number;
  creator: string;
  name: string;
  description: string;
  // Wei-scale amounts are strings, not numbers — the contract stores them
  // that way specifically so JSON.parse (which uses JS's float64 number
  // type) can't silently lose precision on anything past 2^53. Always
  // route these through formatGEN() or BigInt(...), never Number(...).
  premium: string;
  coverage_period_days: number;
  max_payout_per_claim: string;
  max_claims_per_member_per_period: number;
  balance: string;
  member_count: number;
  claims_filed: number;
  claims_approved: number;
  claims_denied: number;
  total_paid_out: string;
  total_donated: string;
  active: boolean;
  created_at: number;
}

export interface Policy {
  pool_id: number;
  member: string;
  active: boolean;
  expires_at_ts: number;
  period_started_at_ts: number;
  claims_this_period: number;
  claims_filed: number;
  claims_approved: number;
  claims_denied: number;
  joined_at: number;
}

export type ClaimStatus = "approved" | "denied";

export interface Claim {
  id: number;
  pool_id: number;
  claimant: string;
  description: string;
  // Wei-scale — string, same reasoning as Pool's amount fields.
  requested_amount: string;
  evidence_url: string;
  has_photo: boolean;
  status: ClaimStatus;
  ai_covered: boolean;
  ai_payout_percent: number;
  ai_reasoning: string;
  ai_red_flags: string[];
  payout_amount: string;
  appeal_used: boolean;
  created_at: number;
  resolved_at: number;
}
