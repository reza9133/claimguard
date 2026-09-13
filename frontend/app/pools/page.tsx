"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PoolCard } from "@/components/PoolCard";
import { useGetAllPools } from "@/hooks/useClaimGuardContract";

export default function PoolsPage() {
  const { data: pools = [], isLoading } = useGetAllPools();
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const filtered = useMemo(() => {
    return pools
      .filter((p) => (activeOnly ? p.active : true))
      .filter((p) =>
        query.trim() ? (p.name + " " + p.description).toLowerCase().includes(query.toLowerCase()) : true
      )
      .sort((a, b) => b.id - a.id);
  }, [pools, query, activeOnly]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">Coverage Pools</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isLoading ? "Loading…" : `${pools.length} pool${pools.length === 1 ? "" : "s"} on Studionet`}
          </p>
        </div>
        <Button asChild>
          <Link href="/pools/new">
            <PlusCircle className="h-4 w-4" /> Start a pool
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search pools by name or coverage terms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-mid)] accent-emerald-500"
          />
          Active only
        </label>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-card-lg bg-[var(--surface-subtle)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card-lg border border-dashed border-[var(--border-mid)] py-20 text-center">
          <ShieldOff className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">No pools match your search yet.</p>
          <Button asChild variant="outline">
            <Link href="/pools/new">Create the first one</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
