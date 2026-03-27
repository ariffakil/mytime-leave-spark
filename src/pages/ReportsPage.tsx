import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { leaveTypes, employees, leaveRequests, getEmployee, getLeaveType } from "@/data/leave-store";
import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("usage");
  const [department, setDepartment] = useState("all");
  const [leaveType, setLeaveType] = useState("all");

  const departments = [...new Set(employees.map(e => e.department))];

  const filteredRequests = leaveRequests.filter(r => {
    const emp = getEmployee(r.employeeId);
    const matchDept = department === "all" || emp?.department === department;
    const matchType = leaveType === "all" || r.leaveTypeId === leaveType;
    return matchDept && matchType;
  });

  const deptData = departments.map(d => ({
    department: d,
    total: leaveRequests.filter(r => getEmployee(r.employeeId)?.department === d).reduce((a, r) => a + r.days, 0),
    approved: leaveRequests.filter(r => getEmployee(r.employeeId)?.department === d && r.status === "approved").reduce((a, r) => a + r.days, 0),
  }));

  const handleExport = () => toast.success("Report exported as CSV");

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export leave reports" actions={
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5"><Download className="h-4 w-4" /> Export CSV</Button>
      } />

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Leave Usage Summary</SelectItem>
                <SelectItem value="department">Department Breakdown</SelectItem>
                <SelectItem value="trends">Monthly Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-card mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Leave Usage by Department</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deptData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="department" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214, 20%, 90%)", fontSize: 13 }} />
            <Bar dataKey="total" name="Total Days" fill="hsl(174, 62%, 40%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="approved" name="Approved" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Detailed Records ({filteredRequests.length})</h3>
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Employee</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Department</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Leave Type</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Days</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(r => {
              const emp = getEmployee(r.employeeId);
              const lt = getLeaveType(r.leaveTypeId);
              return (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{emp?.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{emp?.department}</td>
                  <td className="px-5 py-3 text-foreground">{lt?.name}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{r.days}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-medium ${r.status === "approved" ? "text-success" : r.status === "rejected" ? "text-destructive" : "text-warning"}`}>{r.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
