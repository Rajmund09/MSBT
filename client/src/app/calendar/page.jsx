"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, ChevronLeft, ChevronRight, Plus, Search, 
  Trash2, Check, CheckSquare, Square, User, Users, Wallet, 
  Briefcase, Clock, AlertCircle, FileText, Bell, CheckCircle2 
} from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  PageHeader, FormField, Input, Textarea, SubmitButton, Select, Skeleton
} from "@/components/ui/index";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { playCinematicImpact } from "@/utils/audio";

// ─── Date Helpers ──────────────────────────────────────────────────────────
const formatDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay(); // 0 = Sunday, 6 = Saturday
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CalendarPage() {
  const toast = useToast();
  const { user } = useAuth();
  const checkPerm = usePermission();

  const [currentDate, setCurrentDate] = useState(new Date()); // Navigated month/year
  const [selectedDateStr, setSelectedDateStr] = useState(formatDateString(new Date())); // Active day
  const [searchQuery, setSearchQuery] = useState("");

  // Events & State
  const [events, setEvents] = useState({ tasks: [], payments: [], entries: [] });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [staffUsers, setStaffUsers] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Modals & Submitting
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Quick Task Form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    due_date: formatDateString(new Date()),
    due_time: "",
    assigned_to: "",
    customer_id: "",
  });

  // Fetch helper
  const fetchCalendarData = useCallback(async (year, month) => {
    setLoadingEvents(true);
    try {
      const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${getDaysInMonth(year, month)}`;
      
      const data = await api.getCalendarEvents({ startDate: firstDay, endDate: lastDay });
      setEvents(data);
    } catch (err) {
      toast(err.message || "Failed to load calendar events", "error");
    } finally {
      setLoadingEvents(false);
    }
  }, [toast]);

  // Load initial metadata and events
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    fetchCalendarData(year, month);
  }, [currentDate, fetchCalendarData]);

  // Load dropdown resources (staff and customers)
  useEffect(() => {
    api.getUsers().then(setStaffUsers).catch(() => {});
    api.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  // Sync Quick Add form date when user clicks a date on the calendar
  useEffect(() => {
    setTaskForm(prev => ({ ...prev, due_date: selectedDateStr }));
  }, [selectedDateStr]);

  // Navigating months
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(formatDateString(today));
  };

  // Task Handlers
  const handleCreateTask = async (e) => {
    if (e) e.preventDefault();
    if (!taskForm.title.trim()) {
      toast("Task title is required", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.createTask({
        ...taskForm,
        due_time: taskForm.due_time || null,
        assigned_to: taskForm.assigned_to || null,
        customer_id: taskForm.customer_id || null,
      });

      toast("Task created successfully", "success");
      playCinematicImpact(); // Play audio cue for task creation
      setCreateOpen(false);
      setTaskForm({
        title: "",
        description: "",
        due_date: selectedDateStr,
        due_time: "",
        assigned_to: "",
        customer_id: "",
      });
      
      // Refresh current month events
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth());
    } catch (err) {
      toast(err.message || "Failed to create task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await api.updateTask(task.id, {
        ...task,
        status: nextStatus,
      });
      
      toast(`Task marked as ${nextStatus}`, "success");
      if (nextStatus === "completed") {
        playCinematicImpact(); // Satisfying feedback thud
      }
      
      // Refresh events
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth());
    } catch (err) {
      toast(err.message || "Failed to update task status", "error");
    }
  };

  const handleEditTask = async (form) => {
    setSubmitting(true);
    try {
      await api.updateTask(editTarget.id, {
        ...form,
        due_time: form.due_time || null,
        assigned_to: form.assigned_to || null,
        customer_id: form.customer_id || null,
      });

      toast("Task updated successfully", "success");
      setEditTarget(null);
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth());
    } catch (err) {
      toast(err.message || "Failed to update task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await api.deleteTask(deleteTarget.id);
      toast("Task deleted successfully", "success");
      setDeleteTarget(null);
      fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth());
    } catch (err) {
      toast(err.message || "Failed to delete task", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Filtering & Selection Calculations ─────────────────────────────────────
  
  // Index all events of the month by date for fast lookup in mini calendar
  const eventsByDate = useMemo(() => {
    const map = {};
    const add = (date, type) => {
      if (!map[date]) map[date] = { tasks: 0, payments: 0, entries: 0 };
      map[date][type]++;
    };
    
    events.tasks.forEach(t => add(t.due_date, "tasks"));
    events.payments.forEach(p => add(p.payment_date, "payments"));
    events.entries.forEach(e => add(e.entry_date, "entries"));
    
    return map;
  }, [events]);

  // Selected date events list (unfiltered)
  const selectedDateEvents = useMemo(() => {
    const tasks = events.tasks.filter(t => t.due_date === selectedDateStr);
    const payments = events.payments.filter(p => p.payment_date === selectedDateStr);
    const entries = events.entries.filter(e => e.entry_date === selectedDateStr);
    
    return { tasks, payments, entries };
  }, [events, selectedDateStr]);

  // Search Results across the whole month
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedTasks = events.tasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.assignee_name && t.assignee_name.toLowerCase().includes(q)) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(q))
    );

    const matchedPayments = events.payments.filter(p => 
      p.customer_name.toLowerCase().includes(q) || 
      p.payment_mode.toLowerCase().includes(q) ||
      String(p.amount).includes(q)
    );

    const matchedEntries = events.entries.filter(e => 
      e.customer_name.toLowerCase().includes(q) || 
      e.entry_type.toLowerCase().includes(q) ||
      String(e.total_amount).includes(q)
    );

    return { tasks: matchedTasks, payments: matchedPayments, entries: matchedEntries };
  }, [events, searchQuery]);

  // Display label for selected date
  const selectedDateLabel = useMemo(() => {
    const [year, month, day] = selectedDateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
    const mName = MONTH_NAMES[dateObj.getMonth()];
    
    // Check if it is today
    const todayStr = formatDateString(new Date());
    const isToday = selectedDateStr === todayStr;

    return `${isToday ? "Today — " : ""}${weekday}, ${day} ${mName} ${year}`;
  }, [selectedDateStr]);

  // ─── Mini Calendar Grid Calculation ───────────────────────────────────────
  const calendarDaysArray = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const totalDays = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    const days = [];

    // 1. Previous month padding days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({ dayNum, dateStr, isCurrentMonth: false });
    }

    // 2. Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: true });
    }

    // 3. Next month padding days to round up grid to multiple of 7 (maximum 42 items)
    const remaining = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remaining; i++) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12 flex flex-col gap-6 md:gap-10 pb-28"
    >
      <PageHeader
        title="Calendar"
        description="Operations scheduler, payment tracking & custom tasks"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleGoToToday}
              className="h-9 px-4 rounded-xl border border-[var(--border)] bg-white dark:bg-[#111] font-mono text-xs uppercase tracking-widest text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all"
            >
              Today
            </button>
            <button
              onClick={() => { if (checkPerm("calendar", "create")) setCreateOpen(true); }}
              className="h-9 px-4 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-1.5 font-medium"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
        }
      />

      {/* Main Dual Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: Daily Operations Timeline (70%) */}
        <section className="lg:col-span-8 flex flex-col gap-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-[var(--fg)]">{selectedDateLabel}</h2>
              <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mt-1">
                {searchQuery.trim() ? "Search results active" : "Scheduled operations & reminders"}
              </p>
            </div>
            
            {/* Show category filter counts */}
            {!searchQuery.trim() && (
              <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                  Tasks: {selectedDateEvents.tasks.length}
                </span>
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/10">
                  Payments: {selectedDateEvents.payments.length}
                </span>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10">
                  Work Logs: {selectedDateEvents.entries.length}
                </span>
              </div>
            )}
          </div>

          <div className="min-h-[400px]">
            {loadingEvents ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {searchQuery.trim() ? (
                  // Search Results View
                  <SearchResultsTimeline 
                    results={searchResults} 
                    onToggleTask={handleToggleTaskStatus}
                    onEditTask={(t) => { if (checkPerm("calendar", "edit")) setEditTarget(t); }}
                    onDeleteTask={(t) => { if (checkPerm("calendar", "delete")) setDeleteTarget(t); }}
                  />
                ) : (
                  // Daily Timeline View
                  <DayTimeline 
                    events={selectedDateEvents}
                    onToggleTask={handleToggleTaskStatus}
                    onEditTask={(t) => { if (checkPerm("calendar", "edit")) setEditTarget(t); }}
                    onDeleteTask={(t) => { if (checkPerm("calendar", "delete")) setDeleteTarget(t); }}
                  />
                )}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Interactive Mini Calendar, Search, & Quick Form (30%) */}
        <aside className="lg:col-span-4 flex flex-col gap-8 w-full">
          
          {/* 1. Month Search */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Search month's schedule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-[var(--fg)]/[0.04] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-muted)] text-sm font-mono focus:outline-none focus:border-[var(--fg)]/20 shadow-sm transition-all"
            />
          </div>

          {/* 2. Apple-Style Mini Calendar Widget */}
          <div className="p-5 rounded-3xl border border-[var(--border)] bg-white dark:bg-[#111] shadow-sm flex flex-col gap-4">
            
            {/* Calendar Month Selector Header */}
            <div className="flex justify-between items-center">
              <span className="font-display font-semibold text-lg text-[var(--fg)]">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--fg)]/5 text-[var(--fg)] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--fg)]/5 text-[var(--fg)] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center gap-y-2">
              {DAYS_OF_WEEK.map(day => (
                <span key={day} className="font-mono text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">
                  {day}
                </span>
              ))}
            </div>

            {/* Mini Month Grid */}
            <div className="grid grid-cols-7 text-center gap-y-2.5 gap-x-1.5">
              {calendarDaysArray.map(({ dayNum, dateStr, isCurrentMonth }) => {
                const isSelected = selectedDateStr === dateStr;
                const dateEvents = eventsByDate[dateStr] || { tasks: 0, payments: 0, entries: 0 };
                const hasEvents = dateEvents.tasks > 0 || dateEvents.payments > 0 || dateEvents.entries > 0;
                
                // Highlight today
                const todayStr = formatDateString(new Date());
                const isToday = dateStr === todayStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`relative aspect-square rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--fg)] text-[var(--bg)] shadow-md scale-105"
                        : isToday
                          ? "bg-[var(--fg)]/5 font-bold text-[var(--fg)] border border-[var(--fg)]/30"
                          : isCurrentMonth
                            ? "text-[var(--fg)] hover:bg-[var(--fg)]/5"
                            : "text-[var(--fg-muted)] opacity-30 hover:bg-[var(--fg)]/5"
                    }`}
                  >
                    <span className="text-xs font-mono font-medium">{dayNum}</span>
                    
                    {/* Visual Indicator Dots */}
                    {hasEvents && (
                      <div className="absolute bottom-1.5 flex gap-0.5 justify-center w-full">
                        {dateEvents.tasks > 0 && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />
                        )}
                        {dateEvents.payments > 0 && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />
                        )}
                        {dateEvents.entries > 0 && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Quick Task Creator */}
          <div className="p-6 rounded-3xl border border-[var(--border)] bg-white dark:bg-[#111] shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="font-display text-lg text-[var(--fg)]">Quick Add Task</h3>
              <p className="font-mono text-[10px] text-[var(--fg-muted)] uppercase tracking-widest mt-1">
                Link to staff & customers
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <FormField label="Task Title" required>
                <Input
                  placeholder="e.g. Call Suresh for collection"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </FormField>

              <FormField label="Time Reminders">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                  <Input
                    type="time"
                    value={taskForm.due_time}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, due_time: e.target.value }))}
                  />
                </div>
              </FormField>

              <FormField label="Assign Staff">
                <Select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Link Customer">
                <Select
                  value={taskForm.customer_id}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, customer_id: e.target.value }))}
                >
                  <option value="">None</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
                  ))}
                </Select>
              </FormField>

              <SubmitButton loading={submitting}>
                Add Task
              </SubmitButton>
            </form>
          </div>
        </aside>
      </div>

      {/* ─── Modals ───────────────────────────────────────────────────────────── */}
      
      {/* Create Task Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-5 py-2">
          <FormField label="Title" required>
            <Input
              placeholder="What needs to be done?"
              value={taskForm.title}
              onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </FormField>
          
          <FormField label="Description">
            <Textarea
              placeholder="Provide extra details..."
              value={taskForm.description}
              onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due Date" required>
              <Input
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </FormField>
            
            <FormField label="Due Time">
              <Input
                type="time"
                value={taskForm.due_time}
                onChange={(e) => setTaskForm(prev => ({ ...prev, due_time: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Assign Staff Member">
              <Select
                value={taskForm.assigned_to}
                onChange={(e) => setTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Link Customer Record">
              <Select
                value={taskForm.customer_id}
                onChange={(e) => setTaskForm(prev => ({ ...prev, customer_id: e.target.value }))}
              >
                <option value="">None</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
                ))}
              </Select>
            </FormField>
          </div>

          <SubmitButton loading={submitting}>
            Create Task
          </SubmitButton>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Task details">
        {editTarget && (
          <TaskFormWrapper 
            initial={editTarget} 
            staff={staffUsers} 
            customers={customers} 
            onSubmit={handleEditTask} 
            loading={submitting} 
          />
        )}
      </Modal>

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTask}
        loading={deleting}
        title="Delete Task?"
        message={`"${deleteTarget?.title}" will be permanently removed from your calendar schedule. This action cannot be undone.`}
        confirmLabel="Delete Task"
      />
    </motion.main>
  );
}

// ─── Subcomponents for Timeline Rendering ───────────────────────────────────

function DayTimeline({ events, onToggleTask, onEditTask, onDeleteTask }) {
  const hasEvents = events.tasks.length > 0 || events.payments.length > 0 || events.entries.length > 0;

  if (!hasEvents) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-3xl border border-dashed border-[var(--fg)]/15 shadow-[0_8px_30px_rgb(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] bg-[var(--nav-bg)] backdrop-blur-md"
      >
        <CalendarDays size={40} className="text-[var(--fg-muted)] opacity-30 animate-pulse" />
        <h3 className="font-display text-lg text-[var(--fg)] opacity-70">Clear Schedule</h3>
        <p className="text-xs font-mono text-[var(--fg-muted)] max-w-xs leading-relaxed">
          No work logs, payments, or task reminders are scheduled for this date.
        </p>
      </motion.div>
    );
  }

  // Combine and sort events
  // Tasks first, then Payments, then Entries
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4"
    >
      {/* 1. Custom Tasks Section */}
      {events.tasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mb-1 flex items-center gap-1.5">
            <Bell size={12} /> Task Reminders
          </h4>
          {events.tasks.map(t => (
            <TaskCard key={t.id} task={t} onToggle={onToggleTask} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </div>
      )}

      {/* 2. Collections (Payments) Section */}
      {events.payments.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-green-400 font-semibold mb-1 flex items-center gap-1.5">
            <Wallet size={12} /> Payment Collections
          </h4>
          {events.payments.map(p => (
            <PaymentCard key={p.id} payment={p} />
          ))}
        </div>
      )}

      {/* 3. Work Logs (Entries) Section */}
      {events.entries.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-1 flex items-center gap-1.5">
            <Briefcase size={12} /> Completed Operations
          </h4>
          {events.entries.map(e => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function SearchResultsTimeline({ results, onToggleTask, onEditTask, onDeleteTask }) {
  if (!results) return null;
  const hasResults = results.tasks.length > 0 || results.payments.length > 0 || results.entries.length > 0;

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--fg)]/[0.01]">
        <AlertCircle size={32} className="text-[var(--fg-muted)] opacity-30" />
        <h3 className="font-display text-base text-[var(--fg)] opacity-70">No Matches Found</h3>
        <p className="text-xs font-mono text-[var(--fg-muted)]">
          No records match your query this month. Try another keyword.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4"
    >
      {results.tasks.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Matched Tasks</h4>
          {results.tasks.map(t => (
            <TaskCard key={t.id} task={t} onToggle={onToggleTask} onEdit={onEditTask} onDelete={onDeleteTask} showDate />
          ))}
        </div>
      )}

      {results.payments.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-green-400 font-semibold">Matched Collections</h4>
          {results.payments.map(p => (
            <PaymentCard key={p.id} payment={p} showDate />
          ))}
        </div>
      )}

      {results.entries.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-blue-400 font-semibold">Matched Operations</h4>
          {results.entries.map(e => (
            <EntryCard key={e.id} entry={e} showDate />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Timeline Cards ─────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onEdit, onDelete, showDate }) {
  const isCompleted = task.status === "completed";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-4 transition-all shadow-sm ${
        isCompleted
          ? "border-[var(--border)] bg-[var(--fg)]/[0.01] opacity-60"
          : "border-indigo-500/10 dark:border-indigo-500/5 bg-white dark:bg-[#151520] hover:shadow-md"
      }`}
    >
      {/* Complete Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task)}
        className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
          isCompleted
            ? "bg-indigo-500 border-indigo-500 text-white"
            : "border-[var(--border)] text-transparent hover:border-indigo-400"
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h5 className={`text-sm sm:text-base font-display text-[var(--fg)] truncate ${isCompleted ? 'line-through text-[var(--fg-muted)]' : ''}`}>
          {task.title}
        </h5>
        
        {task.description && (
          <p className="text-xs font-mono text-[var(--fg-muted)] mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] font-mono text-[var(--fg-muted)]">
          {task.due_time && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {task.due_time}
            </span>
          )}
          {task.assignee_name && (
            <span className="flex items-center gap-1">
              <User size={11} /> {task.assignee_name}
            </span>
          )}
          {task.customer_name && (
            <span className="flex items-center gap-1 text-indigo-400">
              <Users size={11} /> {task.customer_name}
            </span>
          )}
          {showDate && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
              {task.due_date}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 self-center shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all cursor-pointer"
          title="Edit Task"
        >
          <FileText size={13} />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/5 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all cursor-pointer"
          title="Delete Task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function PaymentCard({ payment, showDate }) {
  const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-green-500/10 dark:border-green-500/5 bg-white dark:bg-[#121812] flex items-center justify-between gap-4 shadow-sm">
      <div className="min-w-0">
        <h5 className="text-sm sm:text-base font-display text-[var(--fg)] truncate">
          Received {fmt(payment.amount)} from {payment.customer_name}
        </h5>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-[var(--fg-muted)]">
          <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/10">
            {payment.payment_mode}
          </span>
          {showDate && (
            <span>
              {payment.payment_date}
            </span>
          )}
        </div>
      </div>
      
      {/* Details Link */}
      <div className="text-right shrink-0">
        <span className="font-mono text-xs font-semibold text-green-400">{fmt(payment.amount)}</span>
      </div>
    </div>
  );
}

function EntryCard({ entry, showDate }) {
  const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-blue-500/10 dark:border-blue-500/5 bg-white dark:bg-[#12151c] flex items-center justify-between gap-4 shadow-sm">
      <div className="min-w-0">
        <h5 className="text-sm sm:text-base font-display text-[var(--fg)] truncate">
          {entry.entry_type} for {entry.customer_name}
        </h5>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] font-mono text-[var(--fg-muted)]">
          <span>Qty: {entry.quantity}</span>
          <span>•</span>
          <span>Rate: {fmt(entry.rate)}</span>
          {showDate && (
            <>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                {entry.entry_date}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="font-mono text-xs font-semibold text-blue-400">{fmt(entry.total_amount)}</span>
      </div>
    </div>
  );
}

// ─── Inner Edit Task Form wrapper ───────────────────────────────────────────

function TaskFormWrapper({ initial, staff, customers, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: initial.title || "",
    description: initial.description || "",
    due_date: initial.due_date || "",
    due_time: initial.due_time || "",
    assigned_to: initial.assigned_to || "",
    customer_id: initial.customer_id || "",
    status: initial.status || "pending",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
      <FormField label="Title" required>
        <Input
          placeholder="Title details..."
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
        />
      </FormField>

      <FormField label="Description">
        <Textarea
          placeholder="Provide extra details..."
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Due Date" required>
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
          />
        </FormField>
        
        <FormField label="Due Time">
          <Input
            type="time"
            value={form.due_time}
            onChange={(e) => setForm(prev => ({ ...prev, due_time: e.target.value }))}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Assign Staff Member">
          <Select
            value={form.assigned_to}
            onChange={(e) => setForm(prev => ({ ...prev, assigned_to: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {staff.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Link Customer Record">
          <Select
            value={form.customer_id}
            onChange={(e) => setForm(prev => ({ ...prev, customer_id: e.target.value }))}
          >
            <option value="">None</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Status">
        <Select
          value={form.status}
          onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </Select>
      </FormField>

      <SubmitButton loading={loading}>
        Save Changes
      </SubmitButton>
    </form>
  );
}
