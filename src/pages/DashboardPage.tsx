import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { KpiCard } from "@/components/leave/KpiCard";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { leaveRequests, employees, leaveTypes, leaveBalances, getEmployee, getLeaveType, LeaveRequest } from "@/data/leave-store";
import { CalendarDays, Clock, CheckCircle2, XCircle, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const monthlyData = [
  { month: "Jan", approved: 12, rejected: 2, pending: 1 },
  { month: "Feb", approved: 15, rejected: 3, pending: 2 },
  { month: "Mar", approved: 18, rejected: 1, pending: 4 },
  { month: "Apr", approved: 10, rejected: 2, pending: 3 },
  { month: "May", approved: 8, rejected: 1, pending: 0 },
  { month: "Jun", approved: 20, rejected: 4, pending: 2 },
];

const typeDistribution = leaveTypes.slice(0, 4).map((lt, i) => ({
  name: lt.name,
  value: [35, 25, 20, 20][i],
  color: lt.color,
}));

export default function DashboardPage() {
  const [localRequests, setLocalRequests] = useState(leaveRequests);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [managerComment, setManagerComment] = useState("");

  const pendingCount = localRequests.filter(r => r.status === "pending").length;
  const approvedCount = localRequests.filter(r => r.status === "approved").length;
  const rejectedCount = localRequests.filter(r => r.status === "rejected").length;
  const totalEmployees = employees.length;

  const openDetail = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setManagerComment("");
    setDrawerOpen(true);
  };

  const handleAction = (action: "approved" | "rejected") => {
    if (!selectedRequest) return;
    const updated = localRequests.map(r =>
      r.id === selectedRequest.id
        ? { ...r, status: action as LeaveRequest["status"], reviewedBy: "HR Manager", reviewedOn: new Date().toISOString().split("T")[0] }
        : r
    );
    setLocalRequests(updated);
    setSelectedRequest({ ...selectedRequest, status: action, reviewedBy: "HR Manager", reviewedOn: new Date().toISOString().split("T")[0] });
  };

  return (
    <div>
      <PageHeader title="Leave Dashboard" description="Overview of leave management across your organization" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Pending Requests" value={pendingCount} subtitle="Awaiting approval" icon={Clock} trend={{ value: 12, positive: false }} />
        <KpiCard title="Approved This Month" value={approvedCount} subtitle="Leaves approved" icon={CheckCircle2} trend={{ value: 8, positive: true }} />
        <KpiCard title="Total Employees" value={totalEmployees} subtitle="Active workforce" icon={Users} />
        <KpiCard title="Avg. Utilization" value="62%" subtitle="Leave utilization rate" icon={TrendingUp} trend={{ value: 5, positive: true }} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Leave Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 20%, 90%)", fontSize: 13 }} />
              <Bar dataKey="approved" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leave Type Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {typeDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {typeDistribution.map(t => (
              <div key={t.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                <span>{t.name}</span>
                <span className="ml-auto font-medium text-foreground">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Leave Requests</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Double-click a row to view details and take action</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Employee</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Type</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Duration</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Days</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
                <th className="text-left font-medium text-muted-foreground px-5 py-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {localRequests.slice(0, 6).map(req => {
                const emp = getEmployee(req.employeeId);
                const lt = getLeaveType(req.leaveTypeId);
                return (
                  <tr
                    key={req.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer select-none"
                    onDoubleClick={() => openDetail(req)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                          {emp?.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{emp?.name}</p>
                          <p className="text-xs text-muted-foreground">{emp?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-foreground">{lt?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{req.startDate} → {req.endDate}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{req.days}</td>
                    <td className="px-5 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{req.appliedOn}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Drawer */}
      <DrawerPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Leave Request Detail"
        description={selectedRequest ? `Request #${selectedRequest.id}` : ""}
        width="w-[520px]"
        footer={
          selectedRequest?.status === "pending" ? (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleAction("rejected")} className="gap-1.5">
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button onClick={() => handleAction("approved")} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
            </div>
          )
        }
      >
        {selectedRequest && (() => {
          const emp = getEmployee(selectedRequest.employeeId);
          const lt = getLeaveType(selectedRequest.leaveTypeId);
          const balance = leaveBalances.find(b => b.employeeId === selectedRequest.employeeId && b.leaveTypeId === selectedRequest.leaveTypeId);
          return (
            <div className="space-y-5">
              {/* Employee Info */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">
                  {emp?.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{emp?.name}</p>
                  <p className="text-xs text-muted-foreground">{emp?.department} · {emp?.category}</p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Leave Type</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: lt?.color }} />
                    <span className="text-sm font-medium text-foreground">{lt?.name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-medium text-foreground">{selectedRequest.days} day{selectedRequest.days > 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="text-sm text-foreground">{selectedRequest.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">End Date</p>
                  <p className="text-sm text-foreground">{selectedRequest.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Applied On</p>
                  <p className="text-sm text-foreground">{selectedRequest.appliedOn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm text-foreground">{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Balance Summary */}
              {balance && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Balance Summary ({lt?.name})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Entitled", value: balance.entitled },
                      { label: "Used", value: balance.used },
                      { label: "Pending", value: balance.pending },
                      { label: "Remaining", value: balance.remaining },
                    ].map(item => (
                      <div key={item.label} className="text-center p-2.5 rounded-lg bg-muted/40 border border-border">
                        <p className="text-lg font-bold text-foreground">{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {balance.remaining < selectedRequest.days && selectedRequest.status === "pending" && (
                    <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                      ⚠ Insufficient balance — only {balance.remaining} day(s) remaining
                    </div>
                  )}
                </div>
              )}

              {/* Review Info (if already reviewed) */}
              {selectedRequest.reviewedBy && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Reviewed By</p>
                  <p className="text-sm font-medium text-foreground">{selectedRequest.reviewedBy}</p>
                  <p className="text-xs text-muted-foreground mt-1">on {selectedRequest.reviewedOn}</p>
                </div>
              )}

              {/* Manager Comments */}
              {selectedRequest.status === "pending" && (
                <div>
                  <Label className="text-xs">Manager Comments</Label>
                  <Textarea
                    className="mt-1.5 text-sm"
                    placeholder="Add comments for approval or rejection reason..."
                    value={managerComment}
                    onChange={e => setManagerComment(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </DrawerPanel>
    </div>
  );
}
