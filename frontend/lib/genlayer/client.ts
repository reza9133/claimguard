import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";

export { studionet, createClient };
export const STUDIONET_CHAIN_ID = studionet.id;

export const genLayerClient = createClient({ chain: studionet });

// Live ClaimGuard deployment on GenLayer Studionet. Override via
// NEXT_PUBLIC_CONTRACT_ADDRESS to point at your own deployment instead
// (see ../deploy/deployStudionet.mjs).
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x67Ca1fE518e1Fa416DE2c2936094c7349b579dba"
) as `0x${string}`;

// ── Result cache ─────────────────────────────────────────────────────────────
const readCache = new Map<string, { result: unknown; ts: number }>();
const READ_CACHE_TTL = 15_000; // ms

// ── In-flight dedup ───────────────────────────────────────────────────────────
// Multiple components calling readContract with the same key at the same
// moment share one single in-flight promise instead of each firing their own
// gen_call.
const inFlight = new Map<string, Promise<unknown>>();

// ── Concurrency limiter ───────────────────────────────────────────────────────
// Studionet is a shared, rate-limited RPC endpoint. Allow at most 2
// simultaneous gen_call requests from this tab.
const MAX_CONCURRENT = 2;
let active = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function releaseSlot() {
  const next = queue.shift();
  if (next) {
    next();
  } else {
    active--;
  }
}

// ── Exponential backoff retry ─────────────────────────────────────────────────
// One concurrency slot is acquired and released exactly once per attempt. The
// backoff happens OUTSIDE the slot so a rate-limited call doesn't hold a slot
// while it waits.
async function fetchOnce(method: string, args: CalldataEncodable[]): Promise<unknown> {
  await acquireSlot();
  try {
    return await genLayerClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args,
    });
  } finally {
    releaseSlot();
  }
}

function isRateLimit(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /rate limit|429|too many requests/i.test(msg);
}

async function fetchWithRetry(
  method: string,
  args: CalldataEncodable[],
  attempt = 0
): Promise<unknown> {
  try {
    return await fetchOnce(method, args);
  } catch (err: unknown) {
    if (isRateLimit(err) && attempt < 5) {
      const delay = 800 * Math.pow(2, attempt) + Math.random() * 400;
      await new Promise((r) => setTimeout(r, delay));
      return fetchWithRetry(method, args, attempt + 1);
    }
    throw err;
  }
}

export async function readContract(
  method: string,
  args: CalldataEncodable[] = []
): Promise<unknown> {
  const key = method + JSON.stringify(args);

  const cached = readCache.get(key);
  if (cached && Date.now() - cached.ts < READ_CACHE_TTL) {
    return cached.result;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetchWithRetry(method, args)
    .then((result) => {
      readCache.set(key, { result, ts: Date.now() });
      inFlight.delete(key);
      return result;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

export function invalidateReadCache(...methods: string[]) {
  if (methods.length === 0) {
    readCache.clear();
  } else {
    for (const [key] of readCache) {
      if (methods.some((m) => key.startsWith(m))) readCache.delete(key);
    }
  }
}
