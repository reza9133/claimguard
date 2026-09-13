import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatEther } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formats a wei-denominated amount as "12.5 GEN". Accepts a bigint, a
 * decimal numeric string (the contract stores its wei-scale fields as
 * strings precisely so they survive JSON.parse without float64 precision
 * loss -- see the contract's Design Notes), or a plain number for
 * already-small values.
 */
export function formatGEN(wei: bigint | number | string | undefined | null): string {
  if (wei === undefined || wei === null) return "0 GEN";
  try {
    const asBigInt =
      typeof wei === "bigint"
        ? wei
        : typeof wei === "string"
        ? BigInt(wei)
        : BigInt(Math.trunc(wei));
    const gen = Number(formatEther(asBigInt));
    return (
      gen.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " GEN"
    );
  } catch {
    return "0 GEN";
  }
}

export function formatUnixSeconds(ts: number | undefined | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatUnixDateTime(ts: number | undefined | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function isPastUnix(ts: number | undefined | null): boolean {
  if (!ts) return false;
  return ts * 1000 < Date.now();
}

/** "3 days left" / "expired 2 days ago" */
export function relativeToNow(ts: number | undefined | null): string {
  if (!ts) return "—";
  const diffMs = ts * 1000 - Date.now();
  const abs = Math.abs(diffMs);
  const day = 86_400_000;
  const hour = 3_600_000;

  let value: number;
  let unit: string;
  if (abs >= day) {
    value = Math.round(abs / day);
    unit = value === 1 ? "day" : "days";
  } else if (abs >= hour) {
    value = Math.round(abs / hour);
    unit = value === 1 ? "hour" : "hours";
  } else {
    value = Math.max(1, Math.round(abs / 60_000));
    unit = value === 1 ? "minute" : "minutes";
  }

  return diffMs >= 0 ? `${value} ${unit} left` : `expired ${value} ${unit} ago`;
}

/** Sums an array of wei-scale numeric strings (or bigints) without ever
 * passing through a JS `number`, so precision is preserved regardless of
 * how large the total gets. */
export function sumWei(values: Array<string | bigint | number>): bigint {
  return values.reduce<bigint>((total, v) => {
    try {
      const asBigInt = typeof v === "bigint" ? v : typeof v === "string" ? BigInt(v) : BigInt(Math.trunc(v));
      return total + asBigInt;
    } catch {
      return total;
    }
  }, 0n);
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  try {
    if (raw === null || raw === undefined || raw === "") return fallback;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as T;
  } catch {
    return fallback;
  }
}
