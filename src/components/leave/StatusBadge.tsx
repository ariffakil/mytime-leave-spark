import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "pending" | "approved" | "rejected" | "paid" | "unpaid" | "active" | "inactive";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "Approved", className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30" },
  paid: { label: "Paid", className: "bg-success/15 text-success border-success/30" },
  unpaid: { label: "Unpaid", className: "bg-muted text-muted-foreground border-border" },
  active: { label: "Active", className: "bg-success/15 text-success border-success/30" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status, label }: { status: StatusType; label?: string }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {label || config.label}
    </Badge>
  );
}
