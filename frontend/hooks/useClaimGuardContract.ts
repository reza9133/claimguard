"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { toast } from "sonner";
import type { CalldataEncodable, TransactionHash } from "genlayer-js/types";
import { isDecidedState, transactionsStatusNumberToName } from "genlayer-js/types";
import {
  genLayerClient,
  createClient,
  studionet,
  CONTRACT_ADDRESS,
  readContract,
  invalidateReadCache,
} from "@/lib/genlayer/client";
import type { Pool, Policy, Claim } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";
import { friendlyError } from "@/lib/errors";

export { parseEther };

// ─── Read hooks: pools ────────────────────────────────────────────────────────

export function useGetAllPools() {
  return useQuery({
    queryKey: ["claimguard", "allPools"],
    queryFn: async () => {
      const raw = await readContract("get_all_pools");
      return safeJsonParse<Pool[]>(raw, []);
    },
    staleTime: 30_000,
    refetchInterval: 45_000,
    retry: 2,
  });
}

export function useGetPool(id: number | undefined) {
  return useQuery({
    queryKey: ["claimguard", "pool", id],
    queryFn: async () => {
      if (id === undefined) return null;
      const raw = await readContract("get_pool", [id]);
      return safeJsonParse<Pool | null>(raw, null);
    },
    enabled: id !== undefined,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useGetPoolCount() {
  return useQuery({
    queryKey: ["claimguard", "poolCount"],
    queryFn: () => readContract("get_pool_count"),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

// ─── Read hooks: policies ─────────────────────────────────────────────────────

export function useGetPolicy(poolId: number | undefined, member: string | undefined) {
  return useQuery({
    queryKey: ["claimguard", "policy", poolId, member?.toLowerCase()],
    queryFn: async () => {
      if (poolId === undefined || !member) return null;
      const raw = await readContract("get_policy", [poolId, member]);
      const parsed = safeJsonParse<Partial<Policy>>(raw, {});
      return Object.keys(parsed).length ? (parsed as Policy) : null;
    },
    enabled: poolId !== undefined && !!member,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useIsCovered(poolId: number | undefined, member: string | undefined) {
  return useQuery({
    queryKey: ["claimguard", "isCovered", poolId, member?.toLowerCase()],
    queryFn: async () => {
      if (poolId === undefined || !member) return false;
      return (await readContract("is_covered", [poolId, member])) as boolean;
    },
    enabled: poolId !== undefined && !!member,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

/**
 * Fetches every policy the given member holds across all pools by checking
 * each pool individually. There's no reverse index in the contract for
 * "all policies of a member" (policies are keyed by pool_id + member), so
 * this is the client-side equivalent — fine at the scale a UI needs, same
 * approach the companion escrow contract's frontend uses for "my jobs".
 */
export function useGetMyPolicies(member: string | undefined) {
  const { data: pools = [] } = useGetAllPools();
  return useQuery({
    queryKey: ["claimguard", "myPolicies", member?.toLowerCase(), pools.map((p) => p.id).join(",")],
    queryFn: async () => {
      if (!member || pools.length === 0) return [];
      const results = await Promise.all(
        pools.map(async (pool) => {
          const raw = await readContract("get_policy", [pool.id, member]);
          const parsed = safeJsonParse<Partial<Policy>>(raw, {});
          if (!Object.keys(parsed).length) return null;
          return { pool, policy: parsed as Policy };
        })
      );
      return results.filter((r): r is { pool: Pool; policy: Policy } => r !== null);
    },
    enabled: !!member && pools.length > 0,
    staleTime: 15_000,
  });
}

// ─── Read hooks: claims ───────────────────────────────────────────────────────

export function useGetClaim(id: number | undefined) {
  return useQuery({
    queryKey: ["claimguard", "claim", id],
    queryFn: async () => {
      if (id === undefined) return null;
      const raw = await readContract("get_claim", [id]);
      return safeJsonParse<Claim | null>(raw, null);
    },
    enabled: id !== undefined,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useGetClaimCount() {
  return useQuery({
    queryKey: ["claimguard", "claimCount"],
    queryFn: () => readContract("get_claim_count"),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useGetClaimsByPool(poolId: number | undefined) {
  return useQuery({
    queryKey: ["claimguard", "claimsByPool", poolId],
    queryFn: async () => {
      if (poolId === undefined) return [] as Claim[];
      const raw = await readContract("get_claims_by_pool", [poolId]);
      return safeJsonParse<Claim[]>(raw, []);
    },
    enabled: poolId !== undefined,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useGetClaimsByMember(member: string | undefined) {
  return useQuery({
    queryKey: ["claimguard", "claimsByMember", member?.toLowerCase()],
    queryFn: async () => {
      if (!member) return [] as Claim[];
      const raw = await readContract("get_claims_by_member", [member]);
      return safeJsonParse<Claim[]>(raw, []);
    },
    enabled: !!member,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

// ─── Write hook factory ───────────────────────────────────────────────────────
// GenLayer write flow:
//   1. writeClient.writeContract() → encodes args, submits to the consensus
//      contract, returns a txId (bytes32 hash)
//   2. pollStatus() → polls genLayerClient.getTransaction() until a decided
//      consensus state is reached
//   3. On decided: invalidate React Query + the module-level read cache

interface TxState {
  txHash: TransactionHash | null;
  status: "idle" | "pending" | "finalizing" | "finalized" | "error";
  consensusStatus: string | null;
  error: string | null;
}

const IDLE: TxState = {
  txHash: null,
  status: "idle",
  consensusStatus: null,
  error: null,
};

const WRITE_INVALIDATES = [
  "get_all_pools",
  "get_pool",
  "get_pool_count",
  "get_policy",
  "is_covered",
  "get_claim",
  "get_claim_count",
  "get_claims_by_pool",
  "get_claims_by_member",
];

/**
 * A transaction reaching a decided consensus state (ACCEPTED / FINALIZED /
 * UNDETERMINED) only means validators agreed on an outcome — it does NOT
 * mean the contract call itself succeeded. A call that reverts (wrong wei
 * amount, expired policy, claim limit reached, etc.) still reaches
 * consensus normally: every validator independently hits the same
 * gl.vm.UserError and agrees on THAT. See the GenLayerJS docs, "Writing to
 * Intelligent Contracts / Checking execution results" — always check the
 * execution result, not just the consensus status.
 *
 * leader_receipt can come back as a single object or an array depending on
 * the code path, so both are handled defensively. Returns the raw failure
 * message if the call reverted, or null if it succeeded.
 */
function getLeaderFailureMessage(tx: Record<string, unknown>): string | null {
  const consensusData = tx.consensus_data as Record<string, unknown> | undefined;
  const rawReceipt = consensusData?.leader_receipt;
  const receipts = Array.isArray(rawReceipt) ? rawReceipt : rawReceipt ? [rawReceipt] : [];
  const receipt = receipts[0] as Record<string, unknown> | undefined;
  if (!receipt) return null;

  const error = receipt.error;
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  const executionResult = receipt.execution_result;
  if (typeof executionResult === "string" && executionResult.toUpperCase() !== "SUCCESS") {
    return executionResult;
  }

  return null;
}

function useContractWrite() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const writeClientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [txState, setTxState] = useState<TxState>(IDLE);

  const reset = useCallback(() => setTxState(IDLE), []);

  const pollStatus = useCallback(
    async (hash: TransactionHash, maxRetries: number) => {
      setTxState((s) => ({ ...s, status: "finalizing", consensusStatus: "PENDING" }));

      // Give the transaction a moment to land before the first poll.
      await new Promise((r) => setTimeout(r, 2_000));

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const tx = await genLayerClient.getTransaction({ hash });
          const statusNum = String(tx.status);
          const statusName =
            transactionsStatusNumberToName[
              statusNum as keyof typeof transactionsStatusNumberToName
            ] ?? "PENDING";

          setTxState((s) => ({ ...s, consensusStatus: statusName }));

          if (isDecidedState(statusNum)) {
            const failureMessage = getLeaderFailureMessage(tx as Record<string, unknown>);

            if (failureMessage) {
              const msg = friendlyError(new Error(failureMessage));
              setTxState((s) => ({ ...s, status: "error", consensusStatus: statusName, error: msg }));
              toast.error(msg);
              return;
            }

            invalidateReadCache(...WRITE_INVALIDATES);
            queryClient.invalidateQueries({ queryKey: ["claimguard"] });

            setTxState((s) => ({
              ...s,
              status: "finalized",
              consensusStatus: statusName,
            }));
            return;
          }
        } catch {
          // getTransaction may briefly 404 right after submission — keep polling
        }

        await new Promise((r) => setTimeout(r, 500));
      }

      const timeoutMsg = `Timed out after ${2 + maxRetries * 0.5}s waiting for consensus`;
      setTxState((s) => ({ ...s, status: "error", error: timeoutMsg }));
      toast.error(friendlyError(new Error(timeoutMsg)));
    },
    [queryClient]
  );

  const send = useCallback(
    async ({
      functionName,
      args,
      value,
      retries = 180,
    }: {
      functionName: string;
      args: CalldataEncodable[];
      value?: bigint;
      retries?: number;
    }) => {
      if (!address || !walletClient) {
        setTxState((s) => ({ ...s, status: "error", error: "Wallet not connected" }));
        toast.error("Connect your wallet to continue.");
        return null;
      }

      setTxState({ ...IDLE, status: "pending" });

      try {
        if (!writeClientRef.current) {
          writeClientRef.current = createClient({
            chain: studionet,
            provider: walletClient,
            account: address,
          });
        }

        const txHash = await writeClientRef.current.writeContract({
          address: CONTRACT_ADDRESS,
          functionName,
          args,
          value: value ?? 0n,
        });

        setTxState((s) => ({ ...s, txHash: txHash as TransactionHash }));
        pollStatus(txHash as TransactionHash, retries);
        return txHash;
      } catch (err: unknown) {
        const msg = friendlyError(err);
        setTxState({ ...IDLE, status: "error", error: msg });
        toast.error(msg);
        return null;
      }
    },
    [address, walletClient, pollStatus]
  );

  const isConnected = !!address;
  const isLoading = txState.status === "pending" || txState.status === "finalizing";

  return { send, txState, reset, isConnected, isLoading };
}

// ─── Pool write hooks ─────────────────────────────────────────────────────────

export function useCreatePool() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const createPool = useCallback(
    (params: {
      name: string;
      description: string;
      premiumGen: string;
      coveragePeriodDays: number;
      maxPayoutGen: string;
      maxClaimsPerPeriod: number;
    }) =>
      send({
        functionName: "create_pool",
        args: [
          params.name,
          params.description,
          parseEther(params.premiumGen || "0"),
          params.coveragePeriodDays,
          parseEther(params.maxPayoutGen || "0"),
          params.maxClaimsPerPeriod,
        ],
      }),
    [send]
  );

  return { createPool, txState, reset, isConnected, isLoading };
}

export function useTopUpPool() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const topUpPool = useCallback(
    (poolId: number, amountGen: string) =>
      send({
        functionName: "top_up_pool",
        args: [poolId],
        value: parseEther(amountGen || "0"),
      }),
    [send]
  );

  return { topUpPool, txState, reset, isConnected, isLoading };
}

export function useSetPoolActive() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const setPoolActive = useCallback(
    (poolId: number, active: boolean) =>
      send({ functionName: "set_pool_active", args: [poolId, active] }),
    [send]
  );

  return { setPoolActive, txState, reset, isConnected, isLoading };
}

// ─── Membership write hooks ───────────────────────────────────────────────────

export function useJoinPool() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const joinPool = useCallback(
    (poolId: number, premiumWei: bigint) =>
      send({ functionName: "join_pool", args: [poolId], value: premiumWei }),
    [send]
  );

  return { joinPool, txState, reset, isConnected, isLoading };
}

export function useCancelPolicy() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const cancelPolicy = useCallback(
    (poolId: number) => send({ functionName: "cancel_policy", args: [poolId] }),
    [send]
  );

  return { cancelPolicy, txState, reset, isConnected, isLoading };
}

// ─── Claim write hooks ─────────────────────────────────────────────────────────

export function useFileClaim() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const fileClaim = useCallback(
    (params: {
      poolId: number;
      description: string;
      requestedAmountGen: string;
      evidenceUrl: string;
      photo: Uint8Array;
    }) =>
      send({
        functionName: "file_claim",
        args: [
          params.poolId,
          params.description,
          parseEther(params.requestedAmountGen || "0"),
          params.evidenceUrl,
          params.photo,
        ],
      }),
    [send]
  );

  return { fileClaim, txState, reset, isConnected, isLoading };
}

export function useAppealClaim() {
  const { send, txState, reset, isConnected, isLoading } = useContractWrite();

  const appealClaim = useCallback(
    (params: {
      claimId: number;
      additionalContext: string;
      additionalEvidenceUrl: string;
      photo: Uint8Array;
    }) =>
      send({
        functionName: "appeal_claim",
        args: [
          params.claimId,
          params.additionalContext,
          params.additionalEvidenceUrl,
          params.photo,
        ],
      }),
    [send]
  );

  return { appealClaim, txState, reset, isConnected, isLoading };
}
