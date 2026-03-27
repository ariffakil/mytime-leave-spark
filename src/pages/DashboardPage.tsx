import { useState } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { KpiCard } from "@/components/leave/KpiCard";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { leaveRequests, employees, leaveTypes, leaveBalances, getEmployee, getLeaveType } from "@/data/leave-store";
import { CalendarDays, Clock, CheckCircle2, XCircle, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  const pendingCount = leaveRequests.filter(r => r.status === "pending").length;
  const approvedCount = leaveRequests.filter(r => r.status === "approved").length;
  const rejectedCount = leaveRequests.filter(r => r.status === "rejected").length;
  const totalEmployees = employees.length;

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
              {leaveRequests.slice(0, 6).map(req => {
                const emp = getEmployee(req.employeeId);
                const lt = getLeaveType(req.leaveTypeId);
                return (
                  <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
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
    </div>
  );
}
