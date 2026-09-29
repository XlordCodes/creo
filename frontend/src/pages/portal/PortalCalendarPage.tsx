import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { request } from "../../lib/http";
import { useAuth } from "../../lib/auth-context";
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

const MOCK_ENTRIES: CalendarEntry[] = [
  { id: "1", date: "2026-10-01", format: "Reel", title: "The 36-hour dough", hasThumbnail: true, thumbnail_url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80", status: "Needs your review", time: "12:30" },
  { id: "2", date: "2026-10-02", format: "Carousel", hasThumbnail: true, thumbnail_url: "https://images.unsplash.com/photo-1556910110-a5a63dfd393c?auto=format&fit=crop&q=80" },
  { id: "3", date: "2026-10-03", format: "Post" },
  { id: "5", date: "2026-10-05", format: "Story" },
  { id: "6", date: "2026-10-06", format: "Reel" },
  { id: "7", date: "2026-10-07", format: "Story" },
  { id: "8", date: "2026-10-08", format: "Post" },
  { id: "9", date: "2026-10-09", format: "Carousel", hasThumbnail: true, thumbnail_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80" },
  { id: "10", date: "2026-10-10", format: "Story" },
  { id: "12", date: "2026-10-12", format: "Reel" },
  { id: "13", date: "2026-10-13", format: "Story" },
  { id: "14", date: "2026-10-14", format: "Post" },
  { id: "15", date: "2026-10-15", format: "Reel", hasThumbnail: true, thumbnail_url: "https://images.unsplash.com/photo-1509376602029-79878262243f?auto=format&fit=crop&q=80" },
  { id: "16", date: "2026-10-16", format: "Carousel" },
  { id: "17", date: "2026-10-17", format: "Story" },
  { id: "19", date: "2026-10-19", format: "Post" },
  { id: "20", date: "2026-10-20", format: "Reel" },
  { id: "21", date: "2026-10-21", format: "Story" },
  { id: "22", date: "2026-10-22", format: "Carousel", hasThumbnail: true, thumbnail_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80" },
  { id: "23", date: "2026-10-23", format: "Post" },
  { id: "24", date: "2026-10-24", format: "Story" },
  { id: "26", date: "2026-10-26", format: "Reel" },
  { id: "27", date: "2026-10-27", format: "Story" },
  { id: "28", date: "2026-10-28", format: "Post" },
  { id: "29", date: "2026-10-29", format: "Carousel", hasThumbnail: true, thumbnail_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80" },
  { id: "30", date: "2026-10-30", format: "Reel" },
  { id: "31", date: "2026-10-31", format: "Story" },
];

const FORMAT_COLORS = {
  Reel: "bg-[#3B82F6]",
  Carousel: "bg-[#F97316]",
  Post: "bg-[#10B981]",
  Story: "bg-[#A855F7]"
};

export function PortalCalendarPage() {
  const { user } = useAuth();
  
  const { data: rawEntries = [] } = useQuery({
    queryKey: ["calendar-entries", user?.id],
    queryFn: async () => {
      try {
        const res = await request<any[]>("/api/v1/calendar/entries");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    }
  });

  const { data: dashboard } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
  });
  
  const subscriptionActive = !!dashboard?.active_plan && ["active", "trialing"].includes(dashboard?.active_plan?.status);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [viewMode, setViewMode] = useState<"Month" | "Week" | "List">("Month");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!subscriptionActive && dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SubscriptionLockedState />
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

  // Mix backend data with mock data (to preserve demo feel if backend is empty for the month)
  const allEntries = [...MOCK_ENTRIES, ...rawEntries.map(e => ({
    id: e.id,
    date: e.date?.split("T")[0] || e.date,
    format: e.type === "reel" || e.file_type?.includes("video") ? "Reel" 
          : e.type === "carousel" ? "Carousel" 
          : e.type === "story" ? "Story" : "Post",
    title: e.title,
    hasThumbnail: !!(e.thumbnail_url || e.file_url),
    thumbnail_url: e.thumbnail_url || e.file_url,
    status: e.status === "pending_approval" ? "Needs your review" : e.status,
    time: e.scheduled_time || "12:00"
  }))];

  const monthStr = (month + 1).toString().padStart(2, '0');
  const monthEntries = allEntries.filter(e => e.date.startsWith(`${year}-${monthStr}`));

  const getEntryForDay = (day: number) => {
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    return allEntries.find(e => e.date === dateStr);
  };

  const selectedEntry = getEntryForDay(selectedDate);
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

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
          <p className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#6B7280] mb-2">
            YOUR PUBLISHING PLAN
          </p>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">{monthName} {year}</h1>
            <div className="flex items-center bg-[#1E2536] rounded-full border border-white/[0.05] p-0.5">
              <button onClick={handlePrev} className="p-1.5 hover:text-white text-[#9CA3AF] hover:bg-white/[0.05] rounded-full transition-colors"><ChevronLeft className="w-5 h-5"/></button>
              <button onClick={handleNext} className="p-1.5 hover:text-white text-[#9CA3AF] hover:bg-white/[0.05] rounded-full transition-colors"><ChevronRight className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-[#1E2536] rounded-full border border-white/[0.05]">
            <button onClick={() => setViewMode("Month")} className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${viewMode === "Month" ? "bg-[#374151] text-white shadow-sm border border-white/[0.1]" : "text-[#9CA3AF] hover:text-white"}`}>Month</button>
            <button onClick={() => setViewMode("Week")} className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${viewMode === "Week" ? "bg-[#374151] text-white shadow-sm border border-white/[0.1]" : "text-[#9CA3AF] hover:text-white"}`}>Week</button>
            <button onClick={() => setViewMode("List")} className={`px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors ${viewMode === "List" ? "bg-[#374151] text-white shadow-sm border border-white/[0.1]" : "text-[#9CA3AF] hover:text-white"}`}>List</button>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>



      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
        
        {/* Left Col: Calendar Grid (col-span-8) */}
        <div className="xl:col-span-8 2xl:col-span-9 bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-sm font-bold text-white">Scheduled posts</h3>
            <div className="flex items-center gap-4">
              {Object.entries(FORMAT_COLORS).map(([format, color]) => (
                <div key={format} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${color}`} />
                  <span className="text-[11px] font-medium text-[#9CA3AF]">{format}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {/* Days Header */}
            {viewMode !== "List" && (
              <div className="grid grid-cols-7 gap-4 mb-4 shrink-0">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(day => (
                  <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Grid Cells */}
            {viewMode === "Month" ? (
              <div className="grid grid-cols-7 gap-px bg-white/[0.05] border border-white/[0.05] rounded-xl flex-1 overflow-hidden">
                {Array.from({ length: totalCells }).map((_, idx) => {
                  const dayNum = idx - emptyPrefix + 1;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const entry = isCurrentMonth ? getEntryForDay(dayNum) : null;
                  const isSelected = isCurrentMonth && dayNum === selectedDate;

                  return (
                    <div 
                      key={idx} 
                      onClick={() => isCurrentMonth && setSelectedDate(dayNum)}
                      className={`bg-[#161C2D] p-3 relative flex flex-col transition-colors ${
                        isCurrentMonth ? "cursor-pointer hover:bg-[#1E2536]" : "opacity-50 pointer-events-none"
                      } ${isSelected ? 'ring-1 ring-white/[0.2] z-10 bg-[#1E2536]' : ''}`}
                    >
                      {isCurrentMonth && (
                        <span className={`text-[13px] font-medium mb-2 ${isSelected ? 'text-white' : 'text-[#9CA3AF]'}`}>
                          {dayNum}
                        </span>
                      )}

                      {entry && (
                        <div className="flex-1 flex flex-col justify-end">
                          {entry.hasThumbnail ? (
                            <div className="relative w-full aspect-video rounded-md overflow-hidden mb-1.5">
                              <img src={entry.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
                                <div className={`w-1.5 h-1.5 rounded-sm ${FORMAT_COLORS[entry.format as keyof typeof FORMAT_COLORS]}`} />
                                {entry.format}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-sm shrink-0 ${FORMAT_COLORS[entry.format as keyof typeof FORMAT_COLORS]}`} />
                              <span className="text-[11px] font-medium text-[#9CA3AF] truncate">
                                {entry.format}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : viewMode === "Week" ? (
              <div className="grid grid-cols-7 gap-px bg-white/[0.05] border border-white/[0.05] rounded-xl flex-1 overflow-hidden h-64 shrink-0">
                {Array.from({ length: 7 }).map((_, idx) => {
                  // Simplified week logic: show the week of the selected date
                  const weekStart = selectedDate - ((selectedDate + emptyPrefix - 1) % 7);
                  const dayNum = weekStart + idx;
                  const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                  const entry = isCurrentMonth ? getEntryForDay(dayNum) : null;
                  const isSelected = isCurrentMonth && dayNum === selectedDate;
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => isCurrentMonth && setSelectedDate(dayNum)}
                      className={`bg-[#161C2D] p-3 relative flex flex-col transition-colors ${
                        isCurrentMonth ? "cursor-pointer hover:bg-[#1E2536]" : "opacity-50 pointer-events-none"
                      } ${isSelected ? 'ring-1 ring-white/[0.2] z-10 bg-[#1E2536]' : ''}`}
                    >
                      {isCurrentMonth && (
                        <span className={`text-[13px] font-medium mb-2 ${isSelected ? 'text-white' : 'text-[#9CA3AF]'}`}>
                          {dayNum}
                        </span>
                      )}
                      {entry && (
                        <div className="flex-1 flex flex-col justify-start mt-2">
                          {entry.hasThumbnail ? (
                            <div className="relative w-full aspect-video rounded-md overflow-hidden mb-1.5">
                              <img src={entry.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
                                <div className={`w-1.5 h-1.5 rounded-sm ${FORMAT_COLORS[entry.format as keyof typeof FORMAT_COLORS]}`} />
                                {entry.format}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-white/[0.05] px-2 py-1.5 rounded">
                              <div className={`w-2 h-2 rounded-sm shrink-0 ${FORMAT_COLORS[entry.format as keyof typeof FORMAT_COLORS]}`} />
                              <span className="text-[11px] font-medium text-white truncate">
                                {entry.title || entry.format}
                              </span>
                            </div>
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
                  <div key={entry.id} className="bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/[0.05] rounded-xl p-4 flex items-center justify-between cursor-pointer" onClick={() => setSelectedDate(parseInt(entry.date.split('-')[2]))}>
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
                           <p className="text-[#9CA3AF] text-xs mt-1">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {entry.time || "12:00"} · {entry.format}</p>
                        </div>
                     </div>
                     <span className="text-white text-[11px] font-medium px-3 py-1 bg-white/[0.1] rounded-full">{entry.status || "Scheduled"}</span>
                  </div>
                ))}
                {allEntries.filter(e => e.date.startsWith(`${year}-${monthStr}`)).length === 0 && (
                  <div className="p-8 text-center text-[#6B7280] text-sm border border-dashed border-white/[0.1] rounded-xl">
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
          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide">
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
                <p className="text-[12px] text-[#9CA3AF] mb-3">
                  {selectedEntry.format} · {selectedEntry.time || "12:00"} · Instagram
                </p>
                {selectedEntry.status && (
                  <span className="inline-block px-3 py-1 rounded-full bg-[#B45309]/90 text-white text-[11px] font-bold mb-6">
                    {selectedEntry.status}
                  </span>
                )}
                
                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={() => showToast("Rescheduling modal opened...")}
                    className="flex-1 px-4 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors"
                  >
                    Move date
                  </button>
                  <Link 
                    to="/portal/deliverables"
                    className="flex-1 text-center px-4 py-2.5 rounded-full bg-[#E2E8F0] text-[#0E1420] text-[13px] font-bold hover:bg-[#E2E8F0]/90 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[13px] text-[#6B7280]">
                No posts scheduled
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 shrink-0">
            <h3 className="text-sm font-bold text-white mb-6">This month</h3>
            <div className="space-y-4">
              {[
                { label: "Reels", count: monthEntries.filter(e => e.format === "Reel").length, max: Math.max(15, monthEntries.filter(e => e.format === "Reel").length), color: "bg-[#3B82F6]" },
                { label: "Carousels", count: monthEntries.filter(e => e.format === "Carousel").length, max: Math.max(15, monthEntries.filter(e => e.format === "Carousel").length), color: "bg-[#F97316]" },
                { label: "Posts", count: monthEntries.filter(e => e.format === "Post").length, max: Math.max(15, monthEntries.filter(e => e.format === "Post").length), color: "bg-[#10B981]" },
                { label: "Stories", count: monthEntries.filter(e => e.format === "Story").length, max: Math.max(15, monthEntries.filter(e => e.format === "Story").length), color: "bg-[#A855F7]" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between group">
                  <span className="text-[13px] text-[#9CA3AF] w-20">{stat.label}</span>
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#161C2D] text-white px-5 py-3 rounded-xl shadow-2xl border border-white/[0.1] text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6EE7B7]" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
