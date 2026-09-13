import Link from "next/link";
import { ShieldCheck, Users, Calendar, PauseCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGEN } from "@/lib/utils";
import type { Pool } from "@/lib/types";

export function PoolCard({ pool }: { pool: Pool }) {
  return (
    <Link href={`/pools/${pool.id}`} className="block group">
      <Card className="h-full transition-all duration-200 hover:border-emerald-500/40 hover:-translate-y-0.5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 border border-emerald-500/25">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="group-hover:text-emerald-400 transition-colors">{pool.name}</CardTitle>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Pool #{pool.id}</p>
            </div>
          </div>
          {!pool.active && <Badge variant="warning"><PauseCircle className="w-3 h-3" /> Paused</Badge>}
        </CardHeader>

        <CardContent>
          <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{pool.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Premium</p>
              <p className="font-semibold text-[var(--text-primary)]">{formatGEN(pool.premium)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Max payout</p>
              <p className="font-semibold text-[var(--text-primary)]">{formatGEN(pool.max_payout_per_claim)}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {pool.member_count} member{pool.member_count === 1 ? "" : "s"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {pool.coverage_period_days}d coverage
          </span>
          <span className="font-semibold text-emerald-400">{formatGEN(pool.balance)} pooled</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
