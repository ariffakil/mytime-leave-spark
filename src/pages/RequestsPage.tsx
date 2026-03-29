import { useState, useRef } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { leaveRequests, getEmployee, getLeaveType, getEmployeeBalances, employees, LeaveRequest, ApprovalStep } from "@/data/leave-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertTriangle, Paperclip, FileText, Image, Upload, UserCheck, Clock, SkipForward } from "lucide-react";
import { toast } from "sonner";

const stepStatusIcon = (status: ApprovalStep["status"]) => {
  switch (status) {
    case "approved": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
    case "skipped": return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    default: return <Clock className="h-4 w-4 text-warning" />;
  }
};

const stepStatusLabel = (status: ApprovalStep["status"]) => {
  switch (status) {
    case "approved": return "text-success";
    case "rejected": return "text-destructive";
    case "skipped": return "text-muted-foreground";
    default: return "text-warning";
  }
};

export default function RequestsPage() {
  const [requests, setRequests] = useState(leaveRequests);
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const rejected = requests.filter(r => r.status === "rejected");

  // Find current pending step in chain
  const getCurrentStep = (chain: ApprovalStep[]) => chain.find(s => s.status === "pending");

  const approveStep = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const chain = r.approvalChain.map(s => {
        if (s.status === "pending" && s === getCurrentStep(r.approvalChain)) {
          return { ...s, status: "approved" as const, approverName: "Current User", comment: approvalComment || undefined, actionDate: new Date().toISOString().split("T")[0] };
        }
        return s;
      });
      const allApproved = chain.every(s => s.status === "approved" || s.status === "skipped");
      return { ...r, approvalChain: chain, status: allApproved ? "approved" as const : r.status, reviewedBy: allApproved ? "Final Approver" : r.reviewedBy, reviewedOn: allApproved ? new Date().toISOString().split("T")[0] : r.reviewedOn };
    }));
    toast.success("Step approved successfully.");
    setApprovalComment("");
    setSelectedReq(null);
  };

  const rejectStep = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const chain = r.approvalChain.map(s => {
        if (s.status === "pending" && s === getCurrentStep(r.approvalChain)) {
          return { ...s, status: "rejected" as const, approverName: "Current User", comment: approvalComment || "Rejected", actionDate: new Date().toISOString().split("T")[0] };
        }
        if (s.status === "pending") return { ...s, status: "skipped" as const };
        return s;
      });
      return { ...r, approvalChain: chain, status: "rejected" as const, reviewedBy: "Current User", reviewedOn: new Date().toISOString().split("T")[0] };
    }));
    toast.error("Leave request rejected.");
    setApprovalComment("");
    setSelectedReq(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedReq) return;
    const files = Array.from(e.target.files);
    const newAttachments = files.map(f => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      type: f.type.startsWith("image/") ? "image" : "pdf",
    }));
    const updatedReq = { ...selectedReq, attachments: [...(selectedReq.attachments || []), ...newAttachments] };
    setRequests(prev => prev.map(r => r.id === selectedReq.id ? updatedReq : r));
    setSelectedReq(updatedReq);
    toast.success(`${files.length} file(s) attached`);
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
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Approval</th>
            <th className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
            <th className="text-right font-medium text-muted-foreground px-5 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No requests found</td></tr>
          ) : data.map(req => {
            const emp = getEmployee(req.employeeId);
            const lt = getLeaveType(req.leaveTypeId);
            const approvedSteps = req.approvalChain.filter(s => s.status === "approved").length;
            const totalSteps = req.approvalChain.length;
            return (
              <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => { setSelectedReq(req); setApprovalComment(""); }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">{emp?.avatar}</div>
                    <span className="font-medium text-foreground">{emp?.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground">{lt?.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{req.startDate} → {req.endDate}</td>
                <td className="px-5 py-3 font-medium text-foreground">{req.days}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    {req.approvalChain.map((step, i) => (
                      <div key={i} className="flex items-center gap-0.5" title={`${step.role}: ${step.status}`}>
                        {stepStatusIcon(step.status)}
                        {i < totalSteps - 1 && <div className={`w-3 h-px ${step.status === "approved" ? "bg-success" : "bg-border"}`} />}
                      </div>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">{approvedSteps}/{totalSteps}</span>
                  </div>
                </td>
                <td className="px-5 py-3"><StatusBadge status={req.status} /></td>
                <td className="px-5 py-3 text-right">
                  {req.status === "pending" && getCurrentStep(req.approvalChain) && (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={(e) => { e.stopPropagation(); setSelectedReq(req); approveStep(req.id); }}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedReq(req); rejectStep(req.id); }}>
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
  const altEmp = selectedReq?.alternativeEmployeeId ? getEmployee(selectedReq.alternativeEmployeeId) : null;
  const currentStep = selectedReq ? getCurrentStep(selectedReq.approvalChain) : null;

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
        width="w-[520px]"
        footer={selectedReq?.status === "pending" && currentStep ? (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => rejectStep(selectedReq.id)} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
              <XCircle className="h-4 w-4" /> Reject
            </Button>
            <Button onClick={() => approveStep(selectedReq.id)} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Approve as {currentStep.role}
            </Button>
          </div>
        ) : undefined}
      >
        {selectedReq && emp && lt && (
          <div className="space-y-5">
            {/* Employee Info */}
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

            {/* Leave Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Leave Type</p><p className="text-sm font-medium text-foreground">{lt.name}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={selectedReq.status} /></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Start Date</p><p className="text-sm text-foreground">{selectedReq.startDate}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">End Date</p><p className="text-sm text-foreground">{selectedReq.endDate}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Days</p><p className="text-sm font-semibold text-foreground">{selectedReq.days}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground">Applied On</p><p className="text-sm text-foreground">{selectedReq.appliedOn}</p></div>
            </div>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">Reason</p><p className="text-sm text-foreground">{selectedReq.reason}</p></div>

            {/* Alternative Employee */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">ALTERNATIVE EMPLOYEE</p>
              </div>
              {altEmp ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">{altEmp.avatar}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{altEmp.name}</p>
                    <p className="text-xs text-muted-foreground">{altEmp.department} · {altEmp.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No alternative employee assigned</p>
              )}
            </div>

            {/* Document Attachments */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-foreground">ATTACHMENTS</p>
                </div>
                {selectedReq.status === "pending" && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3 w-3" /> Upload
                  </Button>
                )}
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileUpload} />
              </div>
              {selectedReq.attachments && selectedReq.attachments.length > 0 ? (
                <div className="space-y-2">
                  {selectedReq.attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-md bg-background border border-border">
                      {att.type === "image" ? <Image className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{att.name}</p>
                        <p className="text-xs text-muted-foreground">{att.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No documents attached</p>
              )}
            </div>

            {/* Multi-Level Approval Chain */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <p className="text-xs font-semibold text-foreground mb-3">APPROVAL WORKFLOW</p>
              <div className="space-y-0">
                {selectedReq.approvalChain.map((step, i) => (
                  <div key={i} className="relative">
                    {i < selectedReq.approvalChain.length - 1 && (
                      <div className={`absolute left-[9px] top-7 w-px h-[calc(100%-4px)] ${step.status === "approved" ? "bg-success/40" : "bg-border"}`} />
                    )}
                    <div className="flex items-start gap-3 pb-4">
                      <div className="mt-0.5">{stepStatusIcon(step.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{step.role}</p>
                          <span className={`text-xs font-medium capitalize ${stepStatusLabel(step.status)}`}>{step.status}</span>
                        </div>
                        {step.approverName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{step.approverName} · {step.actionDate}</p>
                        )}
                        {step.comment && (
                          <div className="mt-1.5 p-2 rounded-md bg-background border border-border">
                            <p className="text-xs text-foreground italic">"{step.comment}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance */}
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

            {/* Approval Comment Input */}
            {selectedReq.status === "pending" && currentStep && (
              <div>
                <Label className="text-xs">Comment as {currentStep.role}</Label>
                <Textarea
                  className="mt-1.5 text-sm"
                  placeholder="Add your approval/rejection comments..."
                  value={approvalComment}
                  onChange={e => setApprovalComment(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
