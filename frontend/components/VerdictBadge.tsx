import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ClaimStatus } from "@/lib/types";

export function VerdictBadge({ status }: { status: ClaimStatus | "pending" }) {
  if (status === "approved") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </Badge>
    );
  }
  if (status === "denied") {
    return (
      <Badge variant="danger">
        <XCircle className="w-3 h-3" /> Denied
      </Badge>
    );
  }
  return (
    <Badge variant="warning">
      <Clock className="w-3 h-3" /> Pending
    </Badge>
  );
}
