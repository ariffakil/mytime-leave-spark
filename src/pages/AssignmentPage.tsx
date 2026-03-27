import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { employees, leaveGroups, getLeaveGroup, Employee } from "@/data/leave-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AssignmentPage() {
  const [items, setItems] = useState(employees);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [bulkGroup, setBulkGroup] = useState("");

  const departments = [...new Set(employees.map(e => e.department))];
  const filtered = items.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.id)));
  };

  const bulkAssign = () => {
    if (!bulkGroup || selected.size === 0) return;
    setItems(items.map(e => selected.has(e.id) ? { ...e, leaveGroupId: bulkGroup } : e));
    toast.success(`Assigned ${selected.size} employee(s) to leave group. Balances auto-generated.`);
    setSelected(new Set());
    setBulkGroup("");
  };

  return (
    <div>
      <PageHeader title="Employee Assignment" description="Assign leave groups to employees and manage their policies" />

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
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
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Select value={bulkGroup} onValueChange={setBulkGroup}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Assign to group..." /></SelectTrigger>
              <SelectContent>
                {leaveGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={bulkAssign} className="gap-1.5"><UserPlus className="h-4 w-4" /> Assign</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Employee</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Department</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Category</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Leave Group</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const group = emp.leaveGroupId ? getLeaveGroup(emp.leaveGroupId) : null;
              return (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3"><Checkbox checked={selected.has(emp.id)} onCheckedChange={() => toggleSelect(emp.id)} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">{emp.avatar}</div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-foreground">{emp.department}</td>
                  <td className="px-5 py-3 text-muted-foreground">{emp.category}</td>
                  <td className="px-5 py-3">
                    {group ? (
                      <span className="text-sm font-medium text-foreground">{group.name}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={group ? "active" : "inactive"} label={group ? "Assigned" : "Unassigned"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
