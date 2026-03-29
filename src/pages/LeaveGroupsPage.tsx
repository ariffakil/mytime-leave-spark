import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { leaveGroups, leaveTypes, getLeaveType, LeaveGroup, LeaveGroupRule } from "@/data/leave-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronRight, Trash2, Settings2 } from "lucide-react";

export default function LeaveGroupsPage() {
  const [groups, setGroups] = useState(leaveGroups);
  const [selectedGroup, setSelectedGroup] = useState<LeaveGroup | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNew, setEditingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const openGroupDetail = (g: LeaveGroup) => { setSelectedGroup(g); setEditingNew(false); setDrawerOpen(true); };
  const openNewGroup = () => { setSelectedGroup(null); setEditingNew(true); setNewName(""); setNewDesc(""); setDrawerOpen(true); };

  const saveNewGroup = () => {
    if (!newName.trim()) return;
    const newGroup: LeaveGroup = {
      id: `lg${Date.now()}`, name: newName.trim(), description: newDesc.trim(),
      rules: [], createdAt: new Date().toISOString().split("T")[0],
    };
    setGroups([...groups, newGroup]);
    setSelectedGroup(newGroup);
    setEditingNew(false);
  };

  const addRule = () => {
    if (!selectedGroup) return;
    const newRule: LeaveGroupRule = {
      id: `r${Date.now()}`, leaveTypeId: leaveTypes[0].id,
      annualQuota: 10, accrualType: "monthly", carryForwardMax: 0, maxLimit: 10,
    };
    const updated = { ...selectedGroup, rules: [...selectedGroup.rules, newRule] };
    setSelectedGroup(updated);
    setGroups(groups.map(g => g.id === updated.id ? updated : g));
  };

  const removeRule = (ruleId: string) => {
    if (!selectedGroup) return;
    const updated = { ...selectedGroup, rules: selectedGroup.rules.filter(r => r.id !== ruleId) };
    setSelectedGroup(updated);
    setGroups(groups.map(g => g.id === updated.id ? updated : g));
  };

  const updateRule = (ruleId: string, field: keyof LeaveGroupRule, value: string | number) => {
    if (!selectedGroup) return;
    const updated = {
      ...selectedGroup,
      rules: selectedGroup.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r),
    };
    setSelectedGroup(updated);
    setGroups(groups.map(g => g.id === updated.id ? updated : g));
  };

  return (
    <div>
      <PageHeader title="Leave Groups" description="Configure leave policies and rules for different employee groups" actions={
        <Button onClick={openNewGroup} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Group</Button>
      } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => (
          <div key={g.id} className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer group" onClick={() => openGroupDetail(g)}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-accent">
                <Settings2 className="h-4 w-4 text-accent-foreground" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{g.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{g.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{g.rules.length} rules</span>
              <span>Created {g.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      <DrawerPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingNew ? "New Leave Group" : selectedGroup?.name || ""}
        description={editingNew ? "Create a new leave policy group" : "Edit policy rules"}
        width="w-[600px]"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
            <Button onClick={() => setDrawerOpen(false)}>Save Changes</Button>
          </div>
        }
      >
        {editingNew ? (
          <div className="space-y-4">
            <div><Label>Group Name</Label><Input className="mt-1.5" placeholder="e.g., Standard Full-Time" /></div>
            <div><Label>Description</Label><Input className="mt-1.5" placeholder="Brief description of this policy" /></div>
          </div>
        ) : selectedGroup ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Policy Rules</h3>
              <Button variant="outline" size="sm" onClick={addRule} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Rule</Button>
            </div>

            {/* Policy Builder - Editable Grid */}
            <div className="space-y-3">
              {selectedGroup.rules.map(rule => {
                const lt = getLeaveType(rule.leaveTypeId);
                return (
                  <div key={rule.id} className="border border-border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: lt?.color }} />
                        <span className="text-sm font-medium text-foreground">{lt?.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Leave Type</Label>
                        <Select value={rule.leaveTypeId} onValueChange={v => updateRule(rule.id, "leaveTypeId", v)}>
                          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Annual Quota</Label>
                        <Input type="number" value={rule.annualQuota} onChange={e => updateRule(rule.id, "annualQuota", +e.target.value)} className="mt-1 h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Accrual</Label>
                        <Select value={rule.accrualType} onValueChange={v => updateRule(rule.id, "accrualType", v)}>
                          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Carry Forward Max</Label>
                        <Input type="number" value={rule.carryForwardMax} onChange={e => updateRule(rule.id, "carryForwardMax", +e.target.value)} className="mt-1 h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Max Limit</Label>
                        <Input type="number" value={rule.maxLimit} onChange={e => updateRule(rule.id, "maxLimit", +e.target.value)} className="mt-1 h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedGroup.rules.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">No rules configured. Click "Add Rule" to get started.</div>
              )}
            </div>
          </div>
        ) : null}
      </DrawerPanel>
    </div>
  );
}
