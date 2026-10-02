import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { request } from "../../lib/http";
import { useAuth } from "../../lib/auth-context";
import { useOnboardingGate } from "../../lib/useOnboardingGate";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";

interface CalendarEntry {
  id: string;
  date: string;
  format: "Reel" | "Carousel" | "Post" | "Story";
  title?: string;
  hasThumbnail?: boolean;
  thumbnail_url?: string;
  status?: string;
  time?: string;
}

type CalendarFormat = CalendarEntry["format"];

const FORMAT_COLORS = {
  Reel: "bg-[#7FA0D6]",
  Carousel: "bg-[#F97316]",
  Post: "bg-[#10B981]",
  Story: "bg-[#A855F7]"
};

export function PortalCalendarPage() {
  const { user } = useAuth();
  const gate = useOnboardingGate();

  const { data: rawEntries = [] } = useQuery({
    queryKey: ["calendar-entries", user?.id],
    enabled: gate.isComplete,
    queryFn: async () => {
      try {
        const res = await request<any[]>("/api/v1/calendar/entries");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    }
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [viewMode, setViewMode] = useState<"Month" | "Week" | "List">("Month");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!gate.isComplete) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-10">
        <SubscriptionLockedState
          title="Content Calendar Locked"
          description="Your 30-day content calendar and scheduling pipeline will activate as soon as your workspace setup is complete."
        />
      </div>
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-11
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0
  const emptyPrefix = firstDay === 0 ? 6 : firstDay - 1; 
  const totalCells = Math.ceil((emptyPrefix + daysInMonth) / 7) * 7;

  // Real backend content calendar entries only
  const allEntries: CalendarEntry[] = rawEntries.map((e: any) => ({
    id: e.id,
    date: e.date?.split("T")[0] || e.date,
    format: e.type === "reel" || e.file_type?.includes("video") || e.format === "Reel" ? "Reel" 
          : e.type === "carousel" || e.format === "Carousel" ? "Carousel" 
          : e.type === "story" || e.format === "Story" ? "Story" : "Post",
    title: e.title,
    hasThumbnail: !!(e.thumbnail_url || e.file_url),
    thumbnail_url: e.thumbnail_url || e.file_url,
    status: e.status === "pending_approval" ? "Needs your review" : e.status,
    time: e.scheduled_time || "12:00"
  }));

  const monthStr = (month + 1).toString().padStart(2, '0');
  const monthEntries = allEntries.filter(e => e.date.startsWith(`${year}-${monthStr}`));

  const getEntriesForDay = (day: number) => {
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    return allEntries
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  };

  const selectedEntries = getEntriesForDay(selectedDate);
  const selectedEntry = selectedEntries[0];
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  const renderEntryPill = (entry: CalendarEntry, compact = false) => (
    <div key={entry.id} className={`flex min-w-0 items-center gap-1.5 ${compact ? "text-[11px]" : "text-xs"}`}>
      <div className={`h-2 w-2 shrink-0 rounded-sm ${FORMAT_COLORS[entry.format as CalendarFormat]}`} />
      <span className="truncate font-medium text-[#97A0B3]">{entry.format}</span>
    </div>
  );

  const handleExport = () => {
    const csvContent = [
      ["Date", "Format", "Title", "Status", "Time"],
      ...monthEntries.map(e => [
        e.date,
        e.format,
        `"${(e.title || "").replace(/"/g, '""')}"`,
        e.status || "Scheduled",
        e.time || "12:00"
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `publishing_plan_${year}_${monthStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exporting calendar to Excel/CSV...");
  };

  const handlePrev = () => {
    if (viewMode === "Week") {
      const d = new Date(year, month, selectedDate - 7);
      setCurrentMonth(d);
      setSelectedDate(d.getDate());
    } else {
      const d = new Date(currentMonth);
      d.setMonth(d.getMonth() - 1);
      setCurrentMonth(d);
      setSelectedDate(1);
    }
  };

  const handleNext = () => {
    if (viewMode === "Week") {
      const d = new Date(year, month, selectedDate + 7);
      setCurrentMonth(d);
      setSelectedDate(d.getDate());
    } else {
      const d = new Date(currentMonth);
      d.setMonth(d.getMonth() + 1);
      setCurrentMonth(d);
      setSelectedDate(1);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-[0.16em] text-[#7E889C] mb-2">
            YOUR PUBLISHING PLAN
          </p>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">{monthName} {year}</h1>
            <div className="flex items-center bg-[#1F2C3F] rounded-full border border-[#2A3446] p-0.5">
              <button onClick={handlePrev} className="p-1.5 hover:text-white text-[#97A0B3] hover:bg-[#1F2C3F] rounded-full transition-colors"><ChevronLeft className="w-5 h-5"/></button>
              <button onClick={handleNext} className="p-1.5 hover:text-white text-[#97A0B3] hover:bg-[#1F2C3F] rounded-full transition-colors"><ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-[#1F2C3F] rounded-full border border-[#2A3446]">
            <button onClick={() => setViewMode("Month")} className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${viewMode === "Month" ? "bg-[#2A3446] text-[#F8FAFC] shadow-sm border border-white/[0.1]" : "text-[#97A0B3] hover:text-white"}`}>Month</button>
            <button onClick={() => setViewMode("Week")} className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${viewMode === "Week" ? "bg-[#2A3446] text-[#F8FAFC] shadow-sm border border-white/[0.1]" : "text-[#97A0B3] hover:text-white"}`}>Week</button>
            <button onClick={() => setViewMode("List")} className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${viewMode === "List" ? "bg-[#2A3446] text-[#F8FAFC] shadow-sm border border-white/[0.1]" : "text-[#97A0B3] hover:text-white"}`}>List</button>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#2A3446] text-[13px] font-bold text-white hover:bg-[#1F2C3F] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>



      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
        
        {/* Left Col: Calendar Grid (col-span-8) */}
        <div className="xl:col-span-8 2xl:col-span-9 bg-[#161F2D] border border-[#2A3446] rounded-[24px] p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-sm font-bold text-white">Scheduled posts</h3>
            <div className="flex items-center gap-4">
              {Object.entries(FORMAT_COLORS).map(([format, color]) => (
                <div key={format} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${color}`} />
                  <span className="text-xs font-medium text-[#97A0B3]">{format}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {/* Days Header */}
            {viewMode !== "List" && (
              <div className="grid grid-cols-7 gap-4 mb-4 shrink-0">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(day => (
                  <div key={day} className="text-[11px] font-bold uppercase tracking-wider text-[#7E889C]">
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Grid Cells */}
            {viewMode === "Month" ? (
              <div className="grid h-[408px] min-h-[408px] grid-cols-7 grid-rows-6 gap-px overflow-hidden rounded-xl border border-[#2A3446] bg-white/[0.05]">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - emptyPrefix + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const entries = isCurrentMonth ? getEntriesForDay(dayNum) : [];
                  const isSelected = isCurrentMonth && dayNum === selectedDate;

                  return (
                    <div 
                      key={idx} 
                      onClick={() => isCurrentMonth && setSelectedDate(dayNum)}
                      className={`relative flex min-h-0 flex-col bg-[#161F2D] p-3 transition-colors ${
                        isCurrentMonth ? "cursor-pointer hover:bg-[#1F2C3F]" : "opacity-50 pointer-events-none"
                      } ${isSelected ? 'ring-1 ring-white/[0.2] z-10 bg-[#1F2C3F]' : ''}`}
                    >
                      {isCurrentMonth && (
                        <span className={`text-[13px] font-medium mb-2 ${isSelected ? 'text-white' : 'text-[#97A0B3]'}`}>
                          {dayNum}
                        </span>
                      )}

                      {entries.length > 0 && (
                        <div className="mt-auto min-h-0 space-y-1 overflow-hidden">
                          {entries.slice(0, 3).map(entry => renderEntryPill(entry, true))}
                          {entries.length > 3 && (
                            <div className="text-[11px] font-bold text-[#BCCCE6]">+{entries.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : viewMode === "Week" ? (
              <div className="grid h-[256px] min-h-[256px] shrink-0 grid-cols-7 gap-px overflow-hidden rounded-xl border border-[#2A3446] bg-white/[0.05]">
                {Array.from({ length: 7 }).map((_, idx) => {
                  // Simplified week logic: show the week of the selected date
                  const weekStart = selectedDate - ((selectedDate + emptyPrefix - 1) % 7);
                  const dayNum = weekStart + idx;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const entries = isCurrentMonth ? getEntriesForDay(dayNum) : [];
                  const isSelected = isCurrentMonth && dayNum === selectedDate;
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => isCurrentMonth && setSelectedDate(dayNum)}
                      className={`bg-[#161F2D] p-3 relative flex flex-col transition-colors ${
                        isCurrentMonth ? "cursor-pointer hover:bg-[#1F2C3F]" : "opacity-50 pointer-events-none"
                      } ${isSelected ? 'ring-1 ring-white/[0.2] z-10 bg-[#1F2C3F]' : ''}`}
                    >
                      {isCurrentMonth && (
                        <span className={`text-[13px] font-medium mb-2 ${isSelected ? 'text-white' : 'text-[#97A0B3]'}`}>
                          {dayNum}
                        </span>
                      )}
                      {entries.length > 0 && (
                        <div className="mt-2 min-h-0 space-y-1.5 overflow-hidden">
                          {entries.slice(0, 4).map(entry => (
                            <div key={entry.id} className="min-w-0 rounded bg-white/[0.05] px-2 py-1.5">
                              {renderEntryPill(entry)}
                            </div>
                          ))}
                          {entries.length > 4 && (
                            <div className="text-[11px] font-bold text-[#BCCCE6]">+{entries.length - 4} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide py-2">
                {allEntries
                  .filter(e => e.date.startsWith(`${year}-${monthStr}`))
                  .sort((a,b) => a.date.localeCompare(b.date))
                  .map(entry => (
                  <div key={entry.id} className="bg-white/[0.02] hover:bg-[#1F2C3F] transition-colors border border-[#2A3446] rounded-xl p-4 flex items-center justify-between cursor-pointer" onClick={() => setSelectedDate(parseInt(entry.date.split('-')[2] || "1", 10))}>
                     <div className="flex items-center gap-4">
                        {entry.hasThumbnail ? (
                          <img src={entry.thumbnail_url} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className={`w-12 h-12 rounded flex items-center justify-center bg-white/[0.05]`}>
                            <div className={`w-3 h-3 rounded-sm ${FORMAT_COLORS[entry.format as keyof typeof FORMAT_COLORS]}`} />
                          </div>
                        )}
                        <div>
                           <p className="text-white text-sm font-bold">{entry.title || `${entry.format} Draft`}</p>
                           <p className="text-[#97A0B3] text-xs mt-1">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {entry.time || "12:00"} · {entry.format}</p>
                        </div>
                     </div>
                     <span className="text-white text-xs font-medium px-3 py-1 bg-white/[0.1] rounded-full">{entry.status || "Scheduled"}</span>
                  </div>
                ))}
                {allEntries.filter(e => e.date.startsWith(`${year}-${monthStr}`)).length === 0 && (
                  <div className="p-8 text-center text-[#7E889C] text-sm border border-dashed border-white/[0.1] rounded-xl">
                    No posts scheduled for this month.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Details & Stats (col-span-4) */}
        <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
          
          {/* Day Details Card */}
          <div className="bg-[#161F2D] border border-[#2A3446] rounded-[24px] p-6 flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            <h3 className="text-sm font-bold text-white mb-4">
              {new Date(year, month, selectedDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </h3>
            
            {selectedEntry ? (
              <div>
                {selectedEntry.hasThumbnail && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden mb-5">
                    <img src={selectedEntry.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <h4 className="text-[17px] font-bold text-white mb-1.5">
                  {selectedEntry.title || `${selectedEntry.format} Draft`}
                </h4>
                <p className="text-[13px] text-[#97A0B3] mb-3">
                  {selectedEntry.format} · {selectedEntry.time || "12:00"} · Instagram
                </p>
                {selectedEntry.status && (
                  <span className="inline-block px-3 py-1 rounded-full bg-[#D8BF9B]/15 text-[#D8BF9B] text-xs font-bold mb-6">
                    {selectedEntry.status}
                  </span>
                )}
                
                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={() => showToast("Rescheduling modal opened...")}
                    className="flex-1 px-4 py-2.5 rounded-full border border-[#2A3446] text-[13px] font-bold text-white hover:bg-[#1F2C3F] transition-colors"
                  >
                    Move date
                  </button>
                  <Link 
                    to="/portal/deliverables"
                    className="flex-1 text-center px-4 py-2.5 rounded-full bg-[#BCCCE6] text-[#0B111C] text-[13px] font-bold hover:bg-white transition-colors"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[13px] text-[#7E889C]">
                No posts scheduled
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-[#161F2D] border border-[#2A3446] rounded-[24px] p-6 shrink-0">
            <h3 className="text-sm font-bold text-white mb-6">This month</h3>
            <div className="space-y-4">
              {[
                { label: "Reels", count: monthEntries.filter(e => e.format === "Reel").length, max: Math.max(15, monthEntries.filter(e => e.format === "Reel").length), color: "bg-[#7FA0D6]" },
                { label: "Carousels", count: monthEntries.filter(e => e.format === "Carousel").length, max: Math.max(15, monthEntries.filter(e => e.format === "Carousel").length), color: "bg-[#F97316]" },
                { label: "Posts", count: monthEntries.filter(e => e.format === "Post").length, max: Math.max(15, monthEntries.filter(e => e.format === "Post").length), color: "bg-[#10B981]" },
                { label: "Stories", count: monthEntries.filter(e => e.format === "Story").length, max: Math.max(15, monthEntries.filter(e => e.format === "Story").length), color: "bg-[#A855F7]" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between group">
                  <span className="text-[13px] text-[#97A0B3] w-20">{stat.label}</span>
                  <div className="flex-1 mx-4 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${(stat.count / stat.max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-white w-4 text-right">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161F2D] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/[0.1] text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6EE7B7]" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
