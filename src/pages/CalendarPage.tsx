import { useState, useMemo, useCallback, useRef } from "react";
import { PageHeader } from "@/components/leave/PageHeader";
import { DrawerPanel } from "@/components/leave/DrawerPanel";
import { leaveRequests, employees, leaveTypes, getEmployee, getLeaveType, LeaveRequest } from "@/data/leave-store";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  isBefore,
  differenceInCalendarDays,
} from "date-fns";

interface LeaveEvent {
  request: LeaveRequest;
  employeeName: string;
  leaveTypeName: string;
  leaveColor: string;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 3, 1));
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Drag state
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const isDragging = useRef(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [formEmployee, setFormEmployee] = useState<string>("");
  const [formLeaveType, setFormLeaveType] = useState<string>("");
  const [formReason, setFormReason] = useState("");

  // Local requests state (to allow adding new ones)
  const [localRequests, setLocalRequests] = useState<LeaveRequest[]>(leaveRequests);

  const departments = useMemo(() => [...new Set(employees.map(e => e.department))], []);

  const filteredRequests = useMemo(() => {
    return localRequests.filter(req => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;
      const emp = getEmployee(req.employeeId);
      if (departmentFilter !== "all" && emp?.department !== departmentFilter) return false;
      return true;
    });
  }, [departmentFilter, statusFilter, localRequests]);

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
        existing.push({ request: req, employeeName: emp.name, leaveTypeName: lt.name, leaveColor: lt.color });
        map.set(key, existing);
      });
    });
    return map;
  }, [filteredRequests]);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const timelineEmployees = useMemo(() => {
    const empIds = new Set(filteredRequests.map(r => r.employeeId));
    return employees.filter(e => empIds.has(e.id));
  }, [filteredRequests]);

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Drag selection helpers
  const dragRange = useMemo(() => {
    if (!dragStart || !dragEnd) return null;
    const s = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
    const e = isBefore(dragStart, dragEnd) ? dragEnd : dragStart;
    return { start: s, end: e };
  }, [dragStart, dragEnd]);

  const isInDragRange = useCallback(
    (day: Date) => {
      if (!dragRange) return false;
      return day >= dragRange.start && day <= dragRange.end;
    },
    [dragRange]
  );

  const handleMouseDown = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    isDragging.current = true;
    setDragStart(day);
    setDragEnd(day);
  };

  const handleMouseEnter = (day: Date) => {
    if (!isDragging.current || !isSameMonth(day, currentMonth)) return;
    setDragEnd(day);
  };

  const handleMouseUp = () => {
    if (!isDragging.current || !dragStart || !dragEnd) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;
    const s = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
    const e = isBefore(dragStart, dragEnd) ? dragEnd : dragStart;
    setSelectedStartDate(s);
    setSelectedEndDate(e);
    setFormEmployee("");
    setFormLeaveType("");
    setFormReason("");
    setDrawerOpen(true);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleSubmit = () => {
    if (!selectedStartDate || !selectedEndDate || !formEmployee || !formLeaveType) {
      toast.error("Please fill all required fields");
      return;
    }
    const days = differenceInCalendarDays(selectedEndDate, selectedStartDate) + 1;
    const newReq: LeaveRequest = {
      id: `lr${Date.now()}`,
      employeeId: formEmployee,
      leaveTypeId: formLeaveType,
      startDate: format(selectedStartDate, "yyyy-MM-dd"),
      endDate: format(selectedEndDate, "yyyy-MM-dd"),
      days,
      reason: formReason,
      status: "pending",
      appliedOn: format(new Date(), "yyyy-MM-dd"),
      approvalChain: [
        { level: 1, role: "Department Head", status: "pending" },
        { level: 2, role: "HR Manager", status: "pending" },
        { level: 3, role: "General Manager", status: "pending" },
      ],
    };
    setLocalRequests(prev => [...prev, newReq]);
    setDrawerOpen(false);
    const emp = getEmployee(formEmployee);
    toast.success(`Leave request created for ${emp?.name}`, {
      description: `${format(selectedStartDate, "MMM d")} – ${format(selectedEndDate, "MMM d")} (${days} day${days > 1 ? "s" : ""})`,
    });
  };

  return (
    <div onMouseUp={handleMouseUp}>
      <PageHeader
        title="Team Calendar"
        description="Drag across dates to create a leave request"
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
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden mb-6 select-none">
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
            const inDrag = isInDragRange(day) && inMonth;

            return (
              <div
                key={i}
                onMouseDown={() => handleMouseDown(day)}
                onMouseEnter={() => handleMouseEnter(day)}
                className={`min-h-[100px] border-b border-r border-border p-1.5 transition-colors cursor-crosshair ${
                  inDrag
                    ? "bg-primary/15 ring-1 ring-inset ring-primary/40"
                    : !inMonth
                    ? "bg-muted/20 cursor-default"
                    : "bg-card hover:bg-muted/30"
                } ${today ? "ring-2 ring-inset ring-primary/30" : ""}`}
              >
                <div
                  className={`text-xs font-medium mb-1 ${
                    today ? "text-primary font-bold" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map((ev, j) => (
                    <div
                      key={j}
                      className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate text-white font-medium pointer-events-none"
                      style={{
                        backgroundColor:
                          ev.request.status === "rejected" ? "hsl(var(--muted-foreground))" : ev.leaveColor,
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Employee leave schedule for {format(currentMonth, "MMMM yyyy")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
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
                        isWeekend
                          ? "bg-muted/40 text-muted-foreground/60"
                          : isToday(day)
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>
            {timelineEmployees.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No leave events this month</div>
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
                          <div key={i} className={`flex-1 min-w-[28px] border-l border-border ${isWeekend ? "bg-muted/20" : ""}`} />
                        );
                      })}
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

      {/* Create Leave Request Drawer */}
      <DrawerPanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Leave Request"
        description={
          selectedStartDate && selectedEndDate
            ? `${format(selectedStartDate, "MMM d, yyyy")} – ${format(selectedEndDate, "MMM d, yyyy")} (${differenceInCalendarDays(selectedEndDate, selectedStartDate) + 1} day${differenceInCalendarDays(selectedEndDate, selectedStartDate) > 0 ? "s" : ""})`
            : undefined
        }
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-1" />
              Create Request
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Date display */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <div className="mt-1 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-medium text-foreground">
                {selectedStartDate ? format(selectedStartDate, "MMM d, yyyy") : "—"}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <div className="mt-1 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm font-medium text-foreground">
                {selectedEndDate ? format(selectedEndDate, "MMM d, yyyy") : "—"}
              </div>
            </div>
          </div>

          {/* Employee */}
          <div>
            <Label className="text-xs text-muted-foreground">Employee *</Label>
            <Select value={formEmployee} onValueChange={setFormEmployee}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent inline-flex items-center justify-center text-[9px] font-semibold text-accent-foreground">
                        {emp.avatar}
                      </span>
                      {emp.name}
                      <span className="text-muted-foreground">· {emp.department}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Type */}
          <div>
            <Label className="text-xs text-muted-foreground">Leave Type *</Label>
            <Select value={formLeaveType} onValueChange={setFormLeaveType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(lt => (
                  <SelectItem key={lt.id} value={lt.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: lt.color }} />
                      {lt.name}
                      {!lt.paid && <span className="text-muted-foreground text-xs">(Unpaid)</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <Label className="text-xs text-muted-foreground">Reason</Label>
            <Textarea
              className="mt-1 min-h-[80px]"
              placeholder="Optional reason for leave…"
              value={formReason}
              onChange={e => setFormReason(e.target.value)}
            />
          </div>

          {/* Info hint */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-primary">Tip:</span> Drag across multiple days on the calendar grid to quickly select a date range, then fill in the details here.
          </div>
        </div>
      </DrawerPanel>
    </div>
  );
}
