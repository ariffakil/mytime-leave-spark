import { useState, useMemo } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { StatusBadge } from "@/components/leave/StatusBadge";
import { leaveRequests, employees, leaveTypes, getEmployee, getLeaveType } from "@/data/leave-store";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  isWithinInterval,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";

interface LeaveEvent {
  request: typeof leaveRequests[0];
  employeeName: string;
  leaveTypeName: string;
  leaveColor: string;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 3, 1)); // April 2025 to show data
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const departments = useMemo(() => [...new Set(employees.map(e => e.department))], []);

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;
      const emp = getEmployee(req.employeeId);
      if (departmentFilter !== "all" && emp?.department !== departmentFilter) return false;
      return true;
    });
  }, [departmentFilter, statusFilter]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsMap = useMemo(() => {
    const map = new Map<string, LeaveEvent[]>();
    filteredRequests.forEach(req => {
      const emp = getEmployee(req.employeeId);
      const lt = getLeaveType(req.leaveTypeId);
      if (!emp || !lt) return;
      const start = parseISO(req.startDate);
      const end = parseISO(req.endDate);
      const days = eachDayOfInterval({ start, end });
      days.forEach(day => {
        const key = format(day, "yyyy-MM-dd");
        const existing = map.get(key) || [];
        existing.push({
          request: req,
          employeeName: emp.name,
          leaveTypeName: lt.name,
          leaveColor: lt.color,
        });
        map.set(key, existing);
      });
    });
    return map;
  }, [filteredRequests]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Timeline view data
  const timelineEmployees = useMemo(() => {
    const empIds = new Set(filteredRequests.map(r => r.employeeId));
    return employees.filter(e => empIds.has(e.id));
  }, [filteredRequests]);

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div>
      <PageHeader
        title="Team Calendar"
        description="Visualize leave schedules and team availability"
        actions={
          <div className="flex items-center gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground min-w-[180px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {leaveTypes.slice(0, 4).map(lt => (
            <div key={lt.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: lt.color }} />
              <span>{lt.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden mb-6">
        <div className="grid grid-cols-7">
          {weekDays.map(day => (
            <div key={day} className="px-2 py-2.5 text-xs font-medium text-muted-foreground text-center border-b border-border bg-muted/30">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const key = format(day, "yyyy-MM-dd");
            const events = eventsMap.get(key) || [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r border-border p-1.5 transition-colors ${
                  !inMonth ? "bg-muted/20" : "bg-card hover:bg-muted/30"
                } ${today ? "ring-2 ring-inset ring-primary/30" : ""}`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  today ? "text-primary font-bold" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map((ev, j) => (
                    <div
                      key={j}
                      className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate text-white font-medium"
                      style={{
                        backgroundColor: ev.request.status === "rejected"
                          ? "hsl(var(--muted-foreground))"
                          : ev.leaveColor,
                        opacity: ev.request.status === "pending" ? 0.7 : 1,
                      }}
                      title={`${ev.employeeName} — ${ev.leaveTypeName} (${ev.request.status})`}
                    >
                      {ev.employeeName.split(" ")[0]}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-[10px] text-muted-foreground font-medium px-1">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Team Timeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Employee leave schedule for {format(currentMonth, "MMMM yyyy")}</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-border">
              <div className="w-[180px] shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                Employee
              </div>
              <div className="flex-1 flex">
                {daysInMonth.map((day, i) => {
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                  return (
                    <div
                      key={i}
                      className={`flex-1 min-w-[28px] text-center py-2 text-[10px] font-medium border-l border-border ${
                        isWeekend ? "bg-muted/40 text-muted-foreground/60" : isToday(day) ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Rows */}
            {timelineEmployees.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No leave events this month
              </div>
            ) : (
              timelineEmployees.map(emp => {
                const empRequests = filteredRequests.filter(r => r.employeeId === emp.id);
                return (
                  <div key={emp.id} className="flex border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="w-[180px] shrink-0 px-4 py-2.5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground">
                        {emp.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex relative">
                      {daysInMonth.map((day, i) => {
                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                        return (
                          <div
                            key={i}
                            className={`flex-1 min-w-[28px] border-l border-border ${isWeekend ? "bg-muted/20" : ""}`}
                          />
                        );
                      })}
                      {/* Overlay leave bars */}
                      {empRequests.map(req => {
                        const lt = getLeaveType(req.leaveTypeId);
                        const start = parseISO(req.startDate);
                        const end = parseISO(req.endDate);
                        const monthStartDay = monthStart.getDate();
                        const totalDays = daysInMonth.length;

                        const barStart = Math.max(0, start.getDate() - monthStartDay);
                        const barEnd = Math.min(totalDays - 1, end.getDate() - monthStartDay);
                        if (barStart > totalDays - 1 || barEnd < 0) return null;
                        if (!isSameMonth(start, currentMonth) && !isSameMonth(end, currentMonth)) return null;

                        const leftPct = (barStart / totalDays) * 100;
                        const widthPct = ((barEnd - barStart + 1) / totalDays) * 100;

                        return (
                          <div
                            key={req.id}
                            className="absolute top-1/2 -translate-y-1/2 h-5 rounded-md"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: lt?.color || "hsl(var(--primary))",
                              opacity: req.status === "pending" ? 0.6 : req.status === "rejected" ? 0.3 : 0.85,
                            }}
                            title={`${lt?.name} (${req.status}): ${req.startDate} → ${req.endDate}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
