import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { leaveTypes, LeaveType } from "@/data/leave-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function LeaveTypesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [items, setItems] = useState(leaveTypes);

  const openNew = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (lt: LeaveType) => { setEditing(lt); setDrawerOpen(true); };
  const handleDelete = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const description = fd.get("description") as string;
    if (editing) {
      setItems(items.map(i => i.id === editing.id ? { ...i, name, description } : i));
    } else {
      setItems([...items, { id: `lt${Date.now()}`, name, description, paid: true, carryForward: false, color: "hsl(174, 62%, 40%)" }]);
    }
    setDrawerOpen(false);
  };

  return (
    <div>
      <PageHeader title="Leave Types" description="Manage the types of leave available to employees" actions={
        <Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Leave Type</Button>
      } />

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Name</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Description</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Paid</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Carry Forward</th>
              <th className="text-right font-medium text-muted-foreground px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(lt => (
              <tr key={lt.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: lt.color }} />
                    <span className="font-medium text-foreground">{lt.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{lt.description}</td>
                <td className="px-5 py-3"><StatusBadge status={lt.paid ? "paid" : "unpaid"} /></td>
                <td className="px-5 py-3"><StatusBadge status={lt.carryForward ? "active" : "inactive"} label={lt.carryForward ? "Yes" : "No"} /></td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(lt)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lt.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DrawerPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Leave Type" : "New Leave Type"}
        description={editing ? "Update leave type details" : "Add a new leave type to the system"}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" form="lt-form">Save</Button>
          </div>
        }
      >
        <form id="lt-form" onSubmit={handleSave} className="space-y-4">
          <div><Label>Name</Label><Input name="name" defaultValue={editing?.name || ""} required className="mt-1.5" /></div>
          <div><Label>Description</Label><Input name="description" defaultValue={editing?.description || ""} className="mt-1.5" /></div>
          <div className="flex items-center justify-between py-2">
            <Label>Paid Leave</Label>
            <Switch defaultChecked={editing?.paid ?? true} />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label>Carry Forward</Label>
            <Switch defaultChecked={editing?.carryForward ?? false} />
          </div>
        </form>
      </DrawerPanel>
    </div>
  );
}
