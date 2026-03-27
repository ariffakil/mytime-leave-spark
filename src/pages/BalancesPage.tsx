import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { employees, leaveBalances, leaveTypes, leaveLedger, getLeaveType, getEmployeeLedger, getEmployeeBalances } from "@/data/leave-store";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function BalancesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const departments = [...new Set(employees.map(e => e.department))];
  const empWithBalances = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const selectedBalances = selectedEmpId ? getEmployeeBalances(selectedEmpId) : [];
  const selectedLedger = selectedEmpId ? getEmployeeLedger(selectedEmpId) : [];

  return (
    <div>
      <PageHeader title="Leave Balances" description="View employee leave entitlements and usage" />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Employee</th>
              {leaveTypes.slice(0, 4).map(lt => (
                <th key={lt.id} className="text-center font-medium text-muted-foreground px-3 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: lt.color }} />
                    {lt.name}
                  </div>
                </th>
              ))}
              <th className="text-center font-medium text-muted-foreground px-5 py-3">Total Used</th>
            </tr>
          </thead>
          <tbody>
            {empWithBalances.map(emp => {
              const balances = getEmployeeBalances(emp.id);
              const totalUsed = balances.reduce((acc, b) => acc + b.used, 0);
              return (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedEmpId(emp.id)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">{emp.avatar}</div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </div>
                    </div>
                  </td>
                  {leaveTypes.slice(0, 4).map(lt => {
                    const b = balances.find(bal => bal.leaveTypeId === lt.id);
                    return (
                      <td key={lt.id} className="px-3 py-3 text-center">
                        {b ? (
                          <div>
                            <span className="font-semibold text-foreground">{b.remaining}</span>
                            <span className="text-muted-foreground">/{b.entitled}</span>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 text-center font-semibold text-foreground">{totalUsed || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ledger Drawer */}
      <DrawerPanel
        open={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        title={selectedEmp?.name || ""}
        description="Leave balance details & ledger"
        width="w-[520px]"
      >
        {selectedEmp && (
          <div className="space-y-5">
            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-3">
              {selectedBalances.map(b => {
                const lt = getLeaveType(b.leaveTypeId);
                return (
                  <div key={b.leaveTypeId} className="border border-border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: lt?.color }} />
                      <span className="text-xs font-medium text-foreground">{lt?.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div><p className="text-lg font-bold text-foreground">{b.remaining}</p><p className="text-[10px] text-muted-foreground">Remaining</p></div>
                      <div><p className="text-lg font-bold text-muted-foreground">{b.entitled}</p><p className="text-[10px] text-muted-foreground">Entitled</p></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Used: {b.used}</span>
                      <span>Pending: {b.pending}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ledger */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Leave Ledger</h3>
              {selectedLedger.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ledger entries found.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLedger.map(entry => {
                    const lt = getLeaveType(entry.leaveTypeId);
                    return (
                      <div key={entry.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        {entry.type === "credit" ? (
                          <ArrowUpCircle className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">{lt?.name} · {entry.date}</p>
                        </div>
                        <span className={`text-sm font-semibold ${entry.type === "credit" ? "text-success" : "text-destructive"}`}>
                          {entry.type === "credit" ? "+" : "-"}{entry.amount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
