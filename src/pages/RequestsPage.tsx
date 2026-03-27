import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { leaveRequests, getEmployee, getLeaveType, getEmployeeBalances, LeaveRequest } from "@/data/leave-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function RequestsPage() {
  const [requests, setRequests] = useState(leaveRequests);
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const rejected = requests.filter(r => r.status === "rejected");

  const approve = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "approved" as const, reviewedBy: "HR Admin", reviewedOn: new Date().toISOString().split("T")[0] } : r));
    toast.success("Leave approved. Balance updated.");
    setSelectedReq(null);
  };

  const reject = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: "rejected" as const, reviewedBy: "HR Admin", reviewedOn: new Date().toISOString().split("T")[0] } : r));
    toast.error("Leave rejected.");
    setSelectedReq(null);
  };

  const RequestTable = ({ data }: { data: LeaveRequest[] }) => (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Employee</th>
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Type</th>
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Duration</th>
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Days</th>
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
            <th className="text-right font-medium text-muted-foreground px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No requests found</td></tr>
          ) : data.map(req => {
            const emp = getEmployee(req.employeeId);
            const lt = getLeaveType(req.leaveTypeId);
            return (
              <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedReq(req)}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">{emp?.avatar}</div>
                    <span className="font-medium text-foreground">{emp?.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground">{lt?.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{req.startDate} → {req.endDate}</td>
                <td className="px-5 py-3 font-medium text-foreground">{req.days}</td>
                <td className="px-5 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-5 py-3 text-right">
                  {req.status === "pending" && (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={(e) => { e.stopPropagation(); approve(req.id); }}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); reject(req.id); }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const emp = selectedReq ? getEmployee(selectedReq.employeeId) : null;
  const lt = selectedReq ? getLeaveType(selectedReq.leaveTypeId) : null;
  const balances = selectedReq ? getEmployeeBalances(selectedReq.employeeId) : [];
  const balance = balances.find(b => b.leaveTypeId === selectedReq?.leaveTypeId);
  const insufficientBalance = balance && selectedReq && balance.remaining < selectedReq.days;

  return (
    <div>
      <PageHeader title="Leave Requests" description="Review and manage employee leave requests" />

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><RequestTable data={pending} /></TabsContent>
        <TabsContent value="approved"><RequestTable data={approved} /></TabsContent>
        <TabsContent value="rejected"><RequestTable data={rejected} /></TabsContent>
      </Tabs>

      {/* Detail Side Panel */}
      <DrawerPanel
        open={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title="Leave Request Details"
        footer={selectedReq?.status === "pending" ? (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => reject(selectedReq.id)} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button onClick={() => approve(selectedReq.id)} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
          </div>
        ) : undefined}
      >
        {selectedReq && emp && lt && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">{emp.avatar}</div>
              <div>
                <p className="font-semibold text-foreground">{emp.name}</p>
                <p className="text-xs text-muted-foreground">{emp.department} · {emp.category}</p>
              </div>
            </div>

            {insufficientBalance && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning font-medium">Insufficient balance! Only {balance?.remaining} days remaining.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Leave Type</p><p className="text-sm font-medium text-foreground">{lt.name}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={selectedReq.status} /></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Start Date</p><p className="text-sm text-foreground">{selectedReq.startDate}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">End Date</p><p className="text-sm text-foreground">{selectedReq.endDate}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Days</p><p className="text-sm font-semibold text-foreground">{selectedReq.days}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Applied On</p><p className="text-sm text-foreground">{selectedReq.appliedOn}</p></div>
            </div>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">Reason</p><p className="text-sm text-foreground">{selectedReq.reason}</p></div>

            {balance && (
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground mb-3">LEAVE BALANCE — {lt.name}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="text-lg font-bold text-foreground">{balance.entitled}</p><p className="text-xs text-muted-foreground">Entitled</p></div>
                  <div><p className="text-lg font-bold text-foreground">{balance.used}</p><p className="text-xs text-muted-foreground">Used</p></div>
                  <div><p className="text-lg font-bold text-warning">{balance.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                  <div><p className="text-lg font-bold text-success">{balance.remaining}</p><p className="text-xs text-muted-foreground">Remaining</p></div>
                </div>
              </div>
            )}

            {selectedReq.reviewedBy && (
              <div className="text-xs text-muted-foreground">
                Reviewed by <span className="font-medium text-foreground">{selectedReq.reviewedBy}</span> on {selectedReq.reviewedOn}
              </div>
            )}
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
