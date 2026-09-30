import { useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminQueueData } from "@/types/ops";
import { fetchLeaveRequests } from "@/lib/ops-api";
import { Users, CalendarCheck, ShieldCheck, ArrowUpRight, Building2 } from "lucide-react";

interface TeamDetailsWidgetProps {
  queue: AdminQueueData | null;
}

export function TeamDetailsWidget({ queue: _queue }: TeamDetailsWidgetProps) {
  const navigate = useNavigate();

  // Fetch leave requests for live counter
  const { data: leavesData } = useQuery({
    queryKey: ["admin_leave_requests"],
    queryFn: fetchLeaveRequests,
  });

  const pendingLeavesCount = leavesData ? leavesData.filter((l) => l.status === "pending").length : 0;

  return (
    <div
      onClick={() => navigate("/admin/team")}
      className="bg-[#161F2D] rounded-3xl border border-[#2A3446] shadow-xl hover:border-[#7FA0D6]/60 hover:shadow-[0_0_25px_rgba(127,160,214,0.15)] transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between w-full h-full font-sans cursor-pointer group hover-card-innovative overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#2A3446]/80 shrink-0">
        <div>
          <h2 className="text-sm sm:text-base font-black text-white group-hover:text-[#7FA0D6] transition-colors tracking-tight flex items-center gap-1.5">
            Team Details & Roster
            <ArrowUpRight className="w-4 h-4 text-[#97A0B3] group-hover:text-[#7FA0D6] transition-colors" />
          </h2>
          <p className="text-xs text-[#97A0B3] font-medium">Pod structure, staffing & office presence</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-extrabold text-[#7FA0D6] bg-[#7FA0D6]/15 border border-[#7FA0D6]/30 hover:bg-[#7FA0D6]/25 hover:border-[#7FA0D6]/60 hover:scale-105 transition-all cursor-pointer">
          3 Pods
        </span>
      </div>

      {/* 4 Squares (2x2 Grid Layout matching Content Engine) */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 my-2.5">
        {/* Box 1: Active Pods */}
        <Link
          to="/admin/team"
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6]/60 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(127,160,214,0.18)] rounded-2xl p-3.5 flex flex-col justify-between h-full transition-all duration-200 group/box cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-[#7FA0D6] flex items-center justify-center font-bold group-hover/box:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover/box:text-[#7FA0D6] transition-colors">
                Active Pods
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-[#7FA0D6]/15 text-[#7FA0D6] border border-[#7FA0D6]/30">
              3 Pods
            </span>
          </div>

          <div className="my-1.5 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">3</span>
            <span className="text-xs font-extrabold text-[#7FA0D6] bg-[#7FA0D6]/15 px-2.5 py-0.5 rounded-md border border-[#7FA0D6]/30">
              Pods A, B, C
            </span>
          </div>

          <p className="text-xs text-[#97A0B3] font-medium leading-tight">
            Allocated team pods managing client accounts & deliverables.
          </p>

          <div className="pt-2 mt-1 border-t border-[#2A3446]/60 flex items-center justify-between text-xs font-bold text-[#7FA0D6] group-hover/box:translate-x-0.5 transition-transform">
            <span>Pod Structure</span>
            <span>Pods →</span>
          </div>
        </Link>

        {/* Box 2: Team Members */}
        <Link
          to="/admin/team"
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6]/60 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(127,160,214,0.18)] rounded-2xl p-3.5 flex flex-col justify-between h-full transition-all duration-200 group/box cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold group-hover/box:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover/box:text-[#7FA0D6] transition-colors">
                Team Members
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              9 Active
            </span>
          </div>

          <div className="my-1.5 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">9</span>
            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
              100% Active
            </span>
          </div>

          <p className="text-xs text-[#97A0B3] font-medium leading-tight">
            Motion designers, editors & pod leads actively staffed.
          </p>

          <div className="pt-2 mt-1 border-t border-[#2A3446]/60 flex items-center justify-between text-xs font-bold text-[#7FA0D6] group-hover/box:translate-x-0.5 transition-transform">
            <span>Active Roster</span>
            <span>Roster →</span>
          </div>
        </Link>

        {/* Box 3: Leave Approvals */}
        <Link
          to="/admin/leaves"
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6]/60 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(127,160,214,0.18)] rounded-2xl p-3.5 flex flex-col justify-between h-full transition-all duration-200 group/box cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold group-hover/box:scale-110 transition-transform">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover/box:text-[#7FA0D6] transition-colors">
                Leave Approvals
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : "0 Pending"}
            </span>
          </div>

          <div className="my-1.5 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{pendingLeavesCount}</span>
            <span className="text-xs font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-md border border-amber-500/30">
              {pendingLeavesCount > 0 ? "Review Required" : "Up To Date"}
            </span>
          </div>

          <p className="text-xs text-[#97A0B3] font-medium leading-tight">
            Pending PTO leave requests & schedule management.
          </p>

          <div className="pt-2 mt-1 border-t border-[#2A3446]/60 flex items-center justify-between text-xs font-bold text-[#7FA0D6] group-hover/box:translate-x-0.5 transition-transform">
            <span>Awaiting PTO</span>
            <span>Review →</span>
          </div>
        </Link>

        {/* Box 4: Active In Office */}
        <Link
          to="/admin/team"
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0B111C] hover:bg-[#1E2D42] border border-[#2A3446] hover:border-[#7FA0D6]/60 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(127,160,214,0.18)] rounded-2xl p-3.5 flex flex-col justify-between h-full transition-all duration-200 group/box cursor-pointer shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold group-hover/box:scale-110 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover/box:text-[#7FA0D6] transition-colors">
                Active In Office
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              9 On-Site
            </span>
          </div>

          <div className="my-1.5 flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">9</span>
            <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/15 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
              On-Site Active
            </span>
          </div>

          <p className="text-xs text-[#97A0B3] font-medium leading-tight">
            Real-time physical office attendance & status sync.
          </p>

          <div className="pt-2 mt-1 border-t border-[#2A3446]/60 flex items-center justify-between text-xs font-bold text-[#7FA0D6] group-hover/box:translate-x-0.5 transition-transform">
            <span>Presence Status</span>
            <span>Synced →</span>
          </div>
        </Link>
      </div>

      {/* Footer Navigation */}
      <div className="pt-2.5 mt-2 border-t border-[#2A3446] flex items-center justify-between text-xs text-[#97A0B3] font-medium shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs">Capacity & roster synchronized</span>
        <Link
          to="/admin/team"
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold text-[#7FA0D6] hover:text-blue-300 hover:translate-x-0.5 transition-all flex items-center gap-0.5 cursor-pointer"
        >
          View Full Roster &rarr;
        </Link>
      </div>
    </div>
  );
}


