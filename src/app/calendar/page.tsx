"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Task {
  id: string; title: string; deadline: string; priority: string;
  project?: { id: string; name: string };
}

const priorityVariants: Record<string, "secondary" | "default" | "destructive"> = {
  low: "secondary", medium: "default", high: "destructive",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    const { data } = await api.get("/tasks/all-accessible");
    const withDeadline = (data.tasks as Task[]).filter((t) => t.deadline);
    setTasks(withDeadline);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function buildCalendarDays() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) { days.push(d); d = addDays(d, 1); }
    return days;
  }

  const days = buildCalendarDays();
  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function tasksForDay(day: Date) {
    return tasks.filter((t) => isSameDay(parseISO(t.deadline), day));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Takvim</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold min-w-32 text-center">
            {format(currentMonth, "MMMM yyyy", { locale: tr })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Gün başlıkları */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Günler */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayTasks = tasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={i}
                className={`min-h-24 p-1.5 border-b border-r last:border-r-0 ${!isCurrentMonth ? "bg-muted/30" : ""}`}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <Link
                      key={t.id}
                      href={t.project ? `/projects/${t.project.id}` : "#"}
                      className="block"
                    >
                      <div className={`text-xs px-1 py-0.5 rounded truncate leading-tight ${t.priority === "high" ? "bg-destructive/15 text-destructive" : t.priority === "medium" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {t.title}
                      </div>
                    </Link>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">+{dayTasks.length - 3} daha</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Renk göstergesi */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive/15" /> Zor öncelik</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary/10" /> Orta öncelik</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted" /> Kolay öncelik</div>
      </div>
    </div>
  );
}
