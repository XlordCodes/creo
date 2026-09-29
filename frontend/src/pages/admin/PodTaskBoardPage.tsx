import { useState } from "react";
import { Link } from "react-router";
import { AdminTopHeader } from "../../components/admin/AdminTopHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { submitPodQAReview, fetchPodDashboard, type PodDashboardData } from "../../lib/ops-api";
import { useAuth } from "../../lib/auth-context";
import { motion } from "motion/react";
import {
  FolderKanban,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  Check,
  X,
  ArrowLeftRight,
  FileText,
} from "lucide-react";

export function PodTaskBoardPage() {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardClient, setNewCardClient] = useState("Northwind Labs");

  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);
  const [rerouteModalOpen, setRerouteModalOpen] = useState(false);
  const [rerouteTarget, setRerouteTarget] = useState("Marcus Vance");

  // Mobile column switcher for sleek phone experience
  const [activeMobileCol, setActiveMobileCol] = useState<"all" | "backlog" | "in_progress" | "review" | "dispatched">("all");

  const { data } = useQuery<PodDashboardData>({
    queryKey: ["pod_dashboard"],
    queryFn: () => fetchPodDashboard(),
  });

  const podName = data?.pod?.name || "Pod A";
  const leadName = data?.pod?.lead?.name || user?.full_name || "Maya Lin";

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const qaMutation = useMutation({
    mutationFn: ({ taskId, decision, comment }: { taskId: string; decision: "approve" | "reject"; comment?: string }) =>
      submitPodQAReview(taskId, decision, comment),
    onSuccess: (res) => {
      showToast(res.message || "QA sign-off recorded successfully", "success");
    },
    onError: (err: any) => {
      showToast(err?.message || "Failed to submit QA decision", "error");
    },
  });

  const handleExportSprintCSV = () => {
    const headers = ["Task ID", "Column / Stage", "Task Title", "Format", "Client", "Assignee", "Status Info"];
    const rows = [
      ["TASK-B1", "Backlog", "Motion Identity Guidelines Reel", "Reel", "Northwind Labs", "Elena R.", "Ready for Sprint"],
      ["TASK-B2", "Backlog", "TikTok Story Sequence (3 Panels)", "Story", "Bloom Studio", "David Kim", "High Priority"],
      ["TASK-B3", "Backlog", "Holiday Promotion Post Deck", "Post", "Atlas Commerce", "Chloe Tan", "Scheduled"],
      ["TASK-P1", "In Progress", "Render 3D Product Teaser Reel", "Reel", "Northwind Labs", "David Kim", "75% Render Complete"],
      ["TASK-P2", "In Progress", "Brand Messaging Architecture Post", "Post", "Atlas Commerce", "Marcus Vance", "55% Drafting Complete"],
      ["TASK-P3", "In Progress", "Social Carousels Deck Post", "Post", "Bloom Studio", "Elena R.", "90% Polish Phase"],
      ["TASK-QA1", "Pending Lead QA", "Fintech Reel Ad Set", "Reel", "Northwind Labs", "David Kim", "Requires Lead Sign-off"],
      ["TASK-QA2", "Pending Lead QA", "Q4 Reel Concept Kinetic Cut", "Reel", "Bloom Studio", "Chloe Tan", "Preview Ready"],
      ["TASK-QA3", "Pending Lead QA", "High-Impact Case Study Post", "Post", "Atlas Commerce", "Elena R.", "Review Draft"],
      ["TASK-D1", "Approved & Dispatched", "Fintech Hero Animation Reel", "Reel", "Northwind Labs", "David Kim", "Delivered 2h ago"],
      ["TASK-D2", "Approved & Dispatched", "Motion Reel Deliverable Set", "Reel", "Bloom Studio", "Chloe Tan", "Delivered 4h ago"],
      ["TASK-D3", "Approved & Dispatched", "Viral Hook Reel Variants", "Reel", "Atlas Commerce", "Elena R.", "Delivered Yesterday"],
    ];

    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Pod_A_Sprint_Task_Board_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Downloaded Pod A Sprint Task Board CSV report", "success");
  };

  return (
    <div data-surface="ops" className="min-h-screen bg-[#0B111C] text-white font-sans flex flex-col">
      {/* Top Header */}
      <AdminTopHeader title="Content Engine" activeTab="Content Engine" />

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-3.5 pb-20 sm:pb-6 space-y-3.5 sm:space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in ${
              toastMessage.type === "error"
                ? "bg-rose-950/80 border-rose-800 text-rose-300"
                : "bg-emerald-950/80 border-emerald-800 text-emerald-300"
            }`}
          >
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="text-current opacity-70 hover:opacity-100">
              &times;
            </button>
          </div>
        )}

        {/* 1. Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#161F2D] p-2.5 sm:px-4 sm:py-2.5 rounded-2xl border border-[#2A3446]/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#F1F5F9]">{podName} Sprint Workflow · Lead {leadName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportSprintCSV}
              className="px-3 py-1.5 rounded-xl bg-[#161F2D] border border-[#2A3446] hover:bg-[#0B111C] text-[#F1F5F9] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="size-3.5 text-[#97A0B3]" />
              Export Report
            </button>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              Assign New Task
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3"
        >
          {/* Card 1: Total Active Tasks */}
          <div className="bg-[#161F2D] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#2A3446]/80 shadow-2xs hover-card-innovative flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#97A0B3]">Total Active Tasks</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-white">18</span>
                <span className="text-[10.5px] sm:text-[11px] font-bold text-[#97A0B3]">Tasks in Sprint</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#7FA0D6] pt-0.5">
                4 In Progress · 6 Review · 8 Backlog
              </p>
            </div>
            <div className="size-7 sm:size-8 rounded-xl bg-[#7FA0D6]/15 text-[#7FA0D6] flex items-center justify-center shrink-0">
              <FolderKanban className="size-3.5 sm:size-4" />
            </div>
          </div>

          {/* Card 2: Blockers / Escalations */}
          <div className="bg-[#161F2D] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#2A3446]/80 shadow-2xs hover-card-innovative flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#97A0B3]">Blockers / Escalations</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-rose-400">1</span>
                <span className="text-[10.5px] sm:text-[11px] font-bold text-rose-400">Action Blocker</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] sm:text-[11px]">
                <span className="text-[#F1F5F9] font-medium">Atlas copy sign-off required</span>
                <button
                  onClick={() => showToast("Reminder ping dispatched to Atlas client Slack channel", "success")}
                  className="font-bold text-[#7FA0D6] hover:underline cursor-pointer"
                >
                  Ping Client
                </button>
              </div>
            </div>
            <div className="size-7 sm:size-8 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-3.5 sm:size-4" />
            </div>
          </div>
        </motion.div>

        {/* Mobile-Only Kanban Column Selector Pills */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {[
            { id: "all", label: "All Columns", count: 18 },
            { id: "backlog", label: "Backlog", count: 8 },
            { id: "in_progress", label: "In Progress", count: 4 },
            { id: "review", label: "QA Review", count: 6 },
            { id: "dispatched", label: "Dispatched", count: 3 },
          ].map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveMobileCol(col.id as any)}
              className={`px-2.5 py-1 rounded-full shrink-0 transition-all flex items-center gap-1 cursor-pointer text-xs ${
                activeMobileCol === col.id
                  ? "bg-[#7FA0D6] text-[#0B111C] font-black"
                  : "bg-[#161F2D] border border-[#2A3446] text-[#F1F5F9] hover:bg-[#0B111C]"
              }`}
            >
              <span>{col.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  activeMobileCol === col.id ? "bg-[#0B111C] text-[#7FA0D6]" : "bg-[#0B111C] text-[#F1F5F9]"
                }`}
              >
                {col.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3. Four Kanban Columns */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-start"
        >
          {/* COLUMN 1: Backlog / To Do */}
          <div
            className={`${
              activeMobileCol === "all" || activeMobileCol === "backlog" ? "block" : "hidden md:block"
            } bg-[#161F2D] rounded-2xl p-3 border border-[#2A3446] space-y-2.5`}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#F1F5F9]">Backlog</h3>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#0B111C] text-[#7FA0D6] border border-[#2A3446]">
                8
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {/* Card 1: Reel */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-[#7FA0D6]">Northwind Labs</span>
                  <span className="text-[#97A0B3]">3h</span>
                </div>
                <h4 className="text-xs font-black text-white leading-snug">Motion Reel · Brand Showcase (9:16)</h4>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2A3446] text-[10.5px]">
                  <span className="px-1.5 py-0.2 rounded bg-[#7FA0D6]/15 text-[#7FA0D6] font-bold text-[9px] border border-[#7FA0D6]/30">
                    Reel
                  </span>
                  <div className="flex items-center gap-1 text-[#F1F5F9] font-bold text-[9.5px]">
                    <span>Elena R.</span>
                    <div className="size-4.5 rounded bg-blue-600 text-white flex items-center justify-center font-black text-[8px]">
                      ER
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Story */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-purple-400">Bloom Studio</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[8.5px] font-extrabold">High Priority</span>
                </div>
                <h4 className="text-xs font-black text-white leading-snug">TikTok Story Sequence (3 Panels)</h4>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2A3446] text-[10.5px]">
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 font-bold text-[9px] border border-purple-500/30">
                    Story
                  </span>
                  <div className="flex items-center gap-1 text-[#F1F5F9] font-bold text-[9.5px]">
                    <span>David Kim</span>
                    <div className="size-4.5 rounded bg-slate-800 text-white flex items-center justify-center font-black text-[8px]">
                      DK
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Post */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-[#F1F5F9]">Atlas Commerce</span>
                  <span className="text-[#97A0B3]">2h</span>
                </div>
                <h4 className="text-xs font-black text-white leading-snug">Holiday Promotion Post Deck</h4>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2A3446] text-[10.5px]">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[9px] border border-emerald-500/30">
                    Post
                  </span>
                  <div className="flex items-center gap-1 text-[#F1F5F9] font-bold text-[9.5px]">
                    <span>Chloe Tan</span>
                    <div className="size-4.5 rounded bg-teal-600 text-white flex items-center justify-center font-black text-[8px]">
                      CT
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setAssignModalOpen(true)}
                className="w-full py-2 rounded-xl border border-dashed border-[#2A3446] text-[#97A0B3] hover:text-[#7FA0D6] hover:border-[#7FA0D6] hover:bg-[#0B111C] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="size-3" /> Add Backlog Card
              </button>
            </div>
          </div>

          {/* COLUMN 2: In Progress / Active */}
          <div
            className={`${
              activeMobileCol === "all" || activeMobileCol === "in_progress" ? "block" : "hidden md:block"
            } bg-[#161F2D] rounded-2xl p-3 border border-[#7FA0D6]/30 space-y-2.5`}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7FA0D6] animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#7FA0D6]">In Progress</h3>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#7FA0D6]/15 text-[#7FA0D6] border border-[#7FA0D6]/30">
                4
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {/* Card 1: Reel */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-[#7FA0D6]">Northwind Labs</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8.5px] font-extrabold">Reel · Urgent</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Product Launch Reel (15s)</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">Octane cinematic pass · 9:16 Vertical</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9.5px] font-bold text-[#97A0B3]">
                    <span>Rendering</span>
                    <span className="text-[#7FA0D6] font-black">75%</span>
                  </div>
                  <div className="w-full h-1 bg-[#161F2D] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full smooth-progress-fill" style={{ width: "75%" }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#2A3446] text-[9.5px] font-bold text-[#F1F5F9]">
                  <div className="size-4.5 rounded bg-slate-800 text-white flex items-center justify-center font-black text-[8px]">
                    DK
                  </div>
                  <span>David Kim · Motion</span>
                </div>
              </div>

              {/* Card 2: Story */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-[#F1F5F9]">Atlas Commerce</span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[8.5px] font-extrabold">Story</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Campaign Story Suite</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">Value propositions & hook sequences</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9.5px] font-bold text-[#97A0B3]">
                    <span>Progress</span>
                    <span className="text-emerald-400 font-black">55%</span>
                  </div>
                  <div className="w-full h-1 bg-[#161F2D] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full smooth-progress-fill" style={{ width: "55%" }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#2A3446] text-[9.5px] font-bold text-[#F1F5F9]">
                  <div className="size-4.5 rounded bg-indigo-600 text-white flex items-center justify-center font-black text-[8px]">
                    MV
                  </div>
                  <span>Marcus Vance · Copy</span>
                </div>
              </div>

              {/* Card 3: Post */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-[#F1F5F9]">Atlas Commerce</span>
                  <span className="text-rose-400 font-bold text-[9.5px] flex items-center gap-0.5">
                    <Clock className="size-2.5" /> Due in 1h
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Post Carousel · 10 Panels</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">10 static panels for feed</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9.5px] font-bold text-[#97A0B3]">
                    <span>Exporting</span>
                    <span className="text-emerald-400 font-black">90%</span>
                  </div>
                  <div className="w-full h-1 bg-[#161F2D] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full smooth-progress-fill" style={{ width: "90%" }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#2A3446] text-[9.5px] font-bold text-[#F1F5F9]">
                  <div className="size-4.5 rounded bg-blue-600 text-white flex items-center justify-center font-black text-[8px]">
                    ER
                  </div>
                  <span>Elena R. · Brand</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Pending Lead QA Review */}
          <div
            className={`${
              activeMobileCol === "all" || activeMobileCol === "review" ? "block" : "hidden md:block"
            } bg-[#161F2D] rounded-2xl p-3 border border-amber-500/40 space-y-2.5`}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Lead QA Review</h3>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                6
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {/* Card 1: Reel */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-[#7FA0D6]">Northwind Labs</span>
                  <span className="text-amber-400 font-bold text-[9.5px]">Due in 2h</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Fintech Reel · Conversion (9:16)</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">David Kim · 3 variations</p>
                </div>
                <div className="flex items-center gap-1.5 pt-1.5">
                  <Link
                    to="/lead/deliverables"
                    className="flex-1 py-1 rounded-lg bg-[#161F2D] border border-[#2A3446] hover:bg-[#1E2D42] text-[#F1F5F9] hover:text-[#7FA0D6] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="size-3" /> Inspect
                  </Link>
                  <button
                    onClick={() => {
                      qaMutation.mutate({ taskId: "t-1", decision: "approve", comment: "Direct QA sign-off from Task Board." });
                    }}
                    className="flex-1 py-1 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                  >
                    <Check className="size-3" /> Sign-off
                  </button>
                </div>
              </div>

              {/* Card 2: Story */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-purple-400">Bloom Studio</span>
                  <span className="text-[#97A0B3] text-[9.5px]">Due in 4h</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Q4 Story · Kinetic Cut</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">Chloe Tan · Audio calibrated</p>
                </div>
                <Link
                  to="/lead/deliverables"
                  className="w-full py-1 rounded-lg bg-[#161F2D] border border-[#2A3446] hover:bg-[#1E2D42] text-[#F1F5F9] hover:text-[#7FA0D6] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="size-3" /> Preview Story
                </Link>
              </div>

              {/* Card 3: Post */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-purple-400">Bloom Studio</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[8.5px] font-extrabold">Ready</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">E-commerce Post Showcase</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">Elena R. · Feed format</p>
                </div>
                <button
                  onClick={() => {
                    qaMutation.mutate({ taskId: "t-3", decision: "approve", comment: "Post showcase approved." });
                  }}
                  className="w-full py-1 rounded-lg bg-[#161F2D] border border-[#2A3446] hover:bg-[#1E2D42] text-[#F1F5F9] hover:text-[#7FA0D6] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <FileCheck className="size-3" /> Review Draft
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 4: Approved & Dispatched */}
          <div
            className={`${
              activeMobileCol === "all" || activeMobileCol === "dispatched" ? "block" : "hidden md:block"
            } bg-[#161F2D] rounded-2xl p-3 border border-emerald-500/40 space-y-2.5`}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">Dispatched</h3>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check className="size-3" /> 3
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {/* Card 1: Reel */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-emerald-400 font-bold text-[9.5px] flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-400" /> Dispatched
                  </span>
                  <span className="text-[#97A0B3] text-[9.5px]">Reel</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Fintech Reel Animation (9:16)</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">Delivered to Northwind Labs</p>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2A3446] text-[9.5px] font-bold text-[#F1F5F9]">
                  <div className="flex items-center gap-1">
                    <div className="size-4.5 rounded bg-slate-800 text-white flex items-center justify-center font-black text-[8px]">
                      DK
                    </div>
                    <span>David Kim</span>
                  </div>
                  <span className="text-emerald-400">● Accepted</span>
                </div>
              </div>

              {/* Card 2: Story */}
              <div className="bg-[#0B111C] rounded-xl p-3 border border-[#2A3446] shadow-2xs hover-card-innovative space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-bold">
                  <span className="text-emerald-400 font-bold text-[9.5px] flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-400" /> Verified
                  </span>
                  <span className="text-[#97A0B3] text-[9.5px]">Story</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-snug">Brand Story Suite Master</h4>
                  <p className="text-[9.5px] text-[#97A0B3] font-medium mt-0.5">Synced to shared Figma Library</p>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2A3446] text-[9.5px] font-bold text-[#F1F5F9]">
                  <div className="flex items-center gap-1">
                    <div className="size-4.5 rounded bg-teal-600 text-white flex items-center justify-center font-black text-[8px]">
                      CT
                    </div>
                    <span>Chloe Tan</span>
                  </div>
                  <span className="text-[#97A0B3]">Bloom</span>
                </div>
              </div>

              {/* Card 3: Summary link */}
              <div className="p-2.5 bg-[#0B111C] rounded-xl border border-dashed border-[#2A3446] text-center hover-card-innovative">
                <span className="text-[10px] text-[#97A0B3] font-medium block">
                  2 older completed tasks
                </span>
                <Link to="/lead/deliverables" className="text-[11px] font-bold text-[#7FA0D6] hover:underline mt-0.5 inline-block">
                  View History →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Bottom Footer Banner (Lead Management Controls) */}
        <div className="bg-[#161F2D] rounded-2xl p-3.5 sm:p-4 border border-[#2A3446]/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[#7FA0D6]/15 text-[#7FA0D6] flex items-center justify-center font-black">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">Lead Management Controls</h4>
              <p className="text-[10.5px] text-[#97A0B3] font-medium">{leadName} acting on {podName} Production Authority</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWorkloadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6] text-[#F1F5F9] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <ArrowLeftRight className="size-3.5 text-[#7FA0D6]" /> Balance Workload
            </button>
            <button
              onClick={() => setRerouteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6] text-[#F1F5F9] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <RefreshCw className="size-3.5 text-[#7FA0D6]" /> Re-route Blocked
            </button>
            <button
              onClick={handleExportSprintCSV}
              className="px-3.5 py-2 rounded-xl bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6] text-[#F1F5F9] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <FileCheck className="size-3.5 text-[#7FA0D6]" /> Export CSV
            </button>
          </div>
        </div>
      </main>

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#161F2D] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#2A3446] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Add Task to Sprint</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-[#97A0B3] hover:text-[#F1F5F9]">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#F1F5F9] block mb-1">Task Title</label>
                <input
                  type="text"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="e.g. Brand Launch Story Sequence"
                  className="w-full p-2.5 rounded-xl border border-[#2A3446] bg-[#0B111C] font-medium text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#F1F5F9] block mb-1">Content Format</label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-[#2A3446] bg-[#0B111C] font-medium text-white"
                  >
                    <option value="Reel">Reel</option>
                    <option value="Story">Story</option>
                    <option value="Post">Post</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#F1F5F9] block mb-1">Client</label>
                  <select
                    value={newCardClient}
                    onChange={(e) => setNewCardClient(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#2A3446] bg-[#0B111C] font-medium text-white"
                  >
                    <option value="Northwind Labs">Northwind Labs</option>
                    <option value="Bloom Studio">Bloom Studio</option>
                    <option value="Atlas Commerce">Atlas Commerce</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0B111C] text-[#F1F5F9] text-xs font-bold hover:bg-[#1E2D42] border border-[#2A3446] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast(`Added "${newCardTitle || "New Task"}" to Sprint Board`, "success");
                  setAssignModalOpen(false);
                  setNewCardTitle("");
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Workload Balancing Modal */}
      {workloadModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#161F2D] rounded-3xl p-6 shadow-2xl border border-[#2A3446] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A3446] pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-5 text-[#7FA0D6]" />
                <h3 className="text-base font-black text-white">Pod Workload Auto-Balancer</h3>
              </div>
              <button onClick={() => setWorkloadModalOpen(false)} className="text-[#97A0B3] hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-xs text-[#97A0B3] font-medium">
              Analyze capacity across Pod A specialists and balance sprint backlog allocation evenly.
            </p>
            <div className="space-y-2 text-xs">
              {[
                { name: "Elena R. (Brand Specialist)", tasks: 5, status: "Optimal", color: "text-emerald-400" },
                { name: "David Kim (Sr. Motion Designer)", tasks: 7, status: "High Load -> Rebalancing -1", color: "text-amber-400" },
                { name: "Chloe Tan (Video Specialist)", tasks: 4, status: "Available -> Rebalancing +1", color: "text-blue-400" },
                { name: "Marcus Vance (Copy Lead)", tasks: 5, status: "Optimal", color: "text-emerald-400" },
              ].map((m) => (
                <div key={m.name} className="p-3 rounded-xl bg-[#0B111C] border border-[#2A3446] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{m.name}</span>
                    <span className={`text-[10px] font-extrabold ${m.color}`}>{m.status}</span>
                  </div>
                  <span className="text-xs font-black text-white bg-[#161F2D] px-3 py-1 rounded-lg border border-[#2A3446]">
                    {m.tasks} Tasks
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#2A3446]">
              <button
                onClick={() => setWorkloadModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0B111C] border border-[#2A3446] text-[#F1F5F9] text-xs font-bold hover:bg-[#1E2D42] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("Workload balanced! Reallocated 1 task to Chloe Tan (6 tasks each).", "success");
                  setWorkloadModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
              >
                Apply Re-balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Re-route Blocked Modal */}
      {rerouteModalOpen && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#161F2D] rounded-3xl p-6 shadow-2xl border border-[#2A3446] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A3446] pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Re-route Blocked Tasks</h3>
              </div>
              <button onClick={() => setRerouteModalOpen(false)} className="text-[#97A0B3] hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-1 text-xs">
              <span className="font-extrabold text-rose-300 block">Blocked Task #1: Atlas copy sign-off required</span>
              <p className="text-[11px] text-rose-300/80">Pending client feedback for 4h. Re-assign task specialist to unblock workflow.</p>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-bold text-[#F1F5F9] block">Select Target Specialist for Re-routing</label>
              <select
                value={rerouteTarget}
                onChange={(e) => setRerouteTarget(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#2A3446] bg-[#0B111C] text-white font-bold"
              >
                <option value="Marcus Vance">Marcus Vance (Copy Specialist · 5 active)</option>
                <option value="Chloe Tan">Chloe Tan (Video Specialist · 4 active)</option>
                <option value="Elena R.">Elena R. (Brand Specialist · 5 active)</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#2A3446]">
              <button
                onClick={() => setRerouteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0B111C] border border-[#2A3446] text-[#F1F5F9] text-xs font-bold hover:bg-[#1E2D42] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast(`Re-routed blocked task to ${rerouteTarget}. Slack alert sent!`, "success");
                  setRerouteModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
              >
                Re-route Task Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
