import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../../lib/http";
import { useAuth } from "../../lib/auth-context";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";

/* ── Types ── */
export interface TeamHandler {
  id: string;
  name: string;
  email: string;
  raw_role: string;
  role: string;
  is_primary?: boolean;
  pod_name?: string;
}

interface DashboardData {
  pending_deliverable_count: number;
  open_ticket_count: number;
  ai_summary_line: string | null;
  onboarding_stage: number;
  brand_summary: string | null;
  account_status?: string;
  active_plan?: {
    status: string;
    name?: string;
    price_minor?: number;
    monthly_price?: number;
    poster_quota?: number;
    reel_quota?: number;
    story_quota?: number;
    current_period_end?: string | null;
  } | null;
  company?: { name?: string } | null;
  created_at?: string | null;
  assigned_team?: TeamHandler[];
}



/* ── Batch Progress Steps ── */
const BATCH_STEPS = [
  { label: "Brief", completed: true },
  { label: "Production", completed: true },
  { label: "Internal QA", completed: true },
  { label: "Your review", completed: false, active: true },
  { label: "Scheduled", completed: false },
];

export function PortalDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: async () => {
      return await request<DashboardData>("/api/v1/portal/dashboard");
    },
    refetchInterval: 15000,
  });

  const subscriptionActive = !!dashboard?.active_plan && ["active", "trialing"].includes(dashboard?.active_plan?.status);

  const { data: deliverablesData } = useQuery<{ items: any[]; waiting_on_you: number }>({
    queryKey: ["portal-dashboard-deliverables", user?.id],
    queryFn: async () => {
      try {
        return await request<any>("/api/v1/portal/deliverables?limit=6");
      } catch {
        return { items: [], waiting_on_you: 0 };
      }
    },
    enabled: subscriptionActive,
    refetchInterval: 15000,
  });

  if (!subscriptionActive && dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SubscriptionLockedState />
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveDeliverable = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await request(`/api/v1/deliverables/${id}/approve`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      queryClient.invalidateQueries({ queryKey: ["portal-dashboard-deliverables"] });
      queryClient.invalidateQueries({ queryKey: ["portal-dashboard"] });
      showToast("Deliverable approved!");
    } catch {
      showToast("Approval failed or already processed");
    }
  };

  const handleDeclineDeliverable = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await request(`/api/v1/deliverables/${id}/request-changes?rejection_comment=Changes requested from dashboard`, {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["portal-dashboard-deliverables"] });
      queryClient.invalidateQueries({ queryKey: ["portal-dashboard"] });
      showToast("Revision requested from pod");
    } catch {
      showToast("Change request failed");
    }
  };

  const pendingDeliverables = (deliverablesData?.items || []).filter(
    (d: any) => d.status === "pending_approval" || d.status === "in_production"
  );

  const companyName = dashboard?.company?.name || user?.company_name || user?.full_name || "Brand";
  const pendingCount = pendingDeliverables.length;
  const dayName = "MON";
  const dateStr = "28 SEP";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {/* Context date */}
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7280] mb-3">
            {dayName} {dateStr} · CYCLE DAY 16 OF 30
          </p>
          {/* Hero Title */}
          <h1 className="text-3xl sm:text-4xl font-normal text-white leading-tight">
            Good morning, {companyName}.{" "}
            <span className="font-bold italic">
              {pendingCount > 0
                ? `${pendingCount} piece${pendingCount > 1 ? "s are" : " is"} waiting for you.`
                : "All clear for now."}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-1">
          <Link to="/portal/creative-pod" className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-medium text-white hover:bg-white/[0.05] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message your pod
          </Link>
          {pendingCount > 0 && (
            <Link
              to="/portal/deliverables"
              className="px-5 py-2.5 rounded-full bg-[#93C5FD] text-[#0E1420] text-[13px] font-bold hover:bg-[#93C5FD]/90 transition-colors"
            >
              Review now
            </Link>
          )}
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Batch Status + Asset List (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Batch Status Card */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">Batch 05 · this week</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#93C5FD]/10 text-[#93C5FD]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#93C5FD]" />
                On track · 2 days early
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex gap-2 mb-8">
              {BATCH_STEPS.map((step) => (
                <div key={step.label} className="flex-1 flex flex-col">
                  <div
                    className={`h-1.5 w-full rounded-full mb-3 ${
                      step.completed || step.active
                        ? "bg-[#3B82F6]"
                        : "bg-white/[0.08]"
                    }`}
                  />
                  <span
                    className={`text-[12px] text-center tracking-wide ${
                      step.active
                        ? "text-white font-bold"
                        : step.completed
                        ? "text-[#9CA3AF] font-medium"
                        : "text-[#6B7280] font-medium"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Alert Box */}
            <div className="bg-[#1E2536] rounded-xl p-4 mb-8">
              <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                Please review by <span className="text-white font-medium">Wed 30 Sep, 18:00</span>. Reviewing on time keeps your batch on its SLA; if we're late, your next cycle is credited automatically.
              </p>
            </div>

            {/* Asset List */}
            {pendingDeliverables.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-[#6B7280]">No deliverables pending review right now.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-white/[0.05]">
                {pendingDeliverables.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-[#1E2536] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.thumbnail_url || item.file_url ? (
                        <img
                          src={item.thumbnail_url || item.file_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase text-[#9CA3AF] font-medium tracking-wider">
                        {item.asset_type || "Reel"} · {item.duration || "0:30"}
                      </p>
                      <p className="text-[15px] font-medium text-white truncate mt-0.5">
                        {item.title || "Untitled"}
                      </p>
                      <p className="text-[12px] text-[#6B7280] truncate mt-0.5">
                        {item.description || "Ready for your review"}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDeclineDeliverable(item.id, e)}
                        className="px-4 py-2 rounded-full border border-white/[0.12] text-[13px] font-medium text-white hover:bg-white/[0.05] transition-colors"
                      >
                        Request change
                      </button>
                      <button
                        onClick={(e) => handleApproveDeliverable(item.id, e)}
                        className="px-4 py-2 rounded-full bg-[#E2E8F0] text-[#0E1420] text-[13px] font-bold hover:bg-[#E2E8F0]/90 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coming Up */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Coming up</h3>
              <span className="text-[11px] font-medium text-[#6B7280]">
                next 7 days
              </span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 text-[10px] uppercase tracking-[0.1em] text-[#6B7280] font-bold pb-2 border-b border-white/[0.08]">
              <span>When</span>
              <span>Format</span>
              <span>Post</span>
              <span className="text-right">Status</span>
            </div>

            {/* Table Rows - Using mock data from screenshot instead of rawEntries to match design exactly */}
            <div className="divide-y divide-white/[0.04]">
              {[
                { day: "Tue 29 · 19:00", format: "Story", post: "Pre-order reminder", status: "Scheduled", badgeColor: "bg-[#1E3A8A]/90 text-[#93C5FD]" },
                { day: "Thu 1 · 12:30", format: "Reel", post: "The 36-hour dough", status: "Needs you", badgeColor: "bg-[#B45309]/90 text-white" },
                { day: "Fri 2 · 18:00", format: "Carousel", post: "Diwali pre-order guide", status: "Needs you", badgeColor: "bg-[#B45309]/90 text-white" },
                { day: "Sat 3 · 10:00", format: "Post", post: "Weekend bake list", status: "In production", badgeColor: "bg-white/[0.05] text-[#9CA3AF]" },
                { day: "Mon 5 · 19:00", format: "Story", post: "Behind the oven", status: "In production", badgeColor: "bg-white/[0.05] text-[#9CA3AF]" },
              ].map((entry, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 py-3 text-sm items-center hover:bg-white/[0.02] transition-colors -mx-2 px-2 rounded-lg cursor-pointer">
                  <span className="text-[#9CA3AF] text-[13px]">{entry.day}</span>
                  <span className="text-white text-[13px] capitalize">{entry.format}</span>
                  <span className="text-[#9CA3AF] text-[13px] truncate">{entry.post}</span>
                  <span className="text-right">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${entry.badgeColor}`}>
                      {entry.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Plan + Results + Pod */}
        <div className="space-y-6">
          {/* Your plan this cycle */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            <h3 className="text-base font-semibold text-white mb-5">Your plan this cycle</h3>
            <div className="space-y-4">
              {[
                { label: "Reels", used: 3, total: dashboard?.active_plan?.reel_quota || 8 },
                { label: "Posts", used: 2, total: dashboard?.active_plan?.poster_quota || 4 },
                { label: "Stories", used: 4, total: dashboard?.active_plan?.story_quota || 8 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#9CA3AF]">{item.label}</span>
                    <span className="text-sm text-white font-medium">
                      {item.used} <span className="text-[#6B7280]">/ {item.total}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B82F6] rounded-full transition-all duration-500"
                      style={{ width: `${(item.used / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.05]">
              <p className="text-[11px] text-[#6B7280]">
                Renews 12 Oct · <span className="text-white">+4 reels</span> available as an add-on
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            <h3 className="text-base font-semibold text-white mb-2">Results</h3>
            <p className="text-sm text-[#9CA3AF] mb-5 leading-relaxed">
              Connect Instagram to see reach and saves for every post we publish. Until then we show nothing here rather than guess.
            </p>
            <Link to="/portal/account?tab=integrations" className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#E2E8F0] text-[13px] font-bold text-[#0E1420] hover:bg-[#E2E8F0]/90 transition-colors w-max">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              @ Connect Instagram
            </Link>
          </div>
          {/* From your pod */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">From your pod</h3>
              <Link
                to="/portal/creative-pod"
                className="px-4 py-1.5 rounded-full border border-white/[0.12] text-[12px] font-medium text-white hover:bg-white/[0.05] transition-colors"
              >
                Open chat
              </Link>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#93C5FD] flex items-center justify-center text-[#0E1420] text-[10px] font-bold shrink-0">
                  NI
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-white">Nisha</span>
                    <span className="text-[11px] text-[#6B7280]">2h</span>
                  </div>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    v2 of the dough reel is up. We cut frame 2 down to one line like you asked.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  AR
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-white">Arjun</span>
                    <span className="text-[11px] text-[#6B7280]">Yesterday</span>
                  </div>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    Shooting the Diwali boxes on Thursday. Anything you want in the frame?
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  SN
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold text-white">Sneha</span>
                    <span className="text-[11px] text-[#6B7280]">Fri</span>
                  </div>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    November plan draft is ready for your review in <Link to="/portal/calendar" className="text-[#93C5FD] hover:underline">Calendar</Link>.
                  </p>
                </div>
              </div>
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
