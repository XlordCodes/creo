import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPortalDeliverables, approveDeliverable, requestChanges } from "../../lib/deliverables-api";
import { Check, Play, Loader2 } from "lucide-react";
import { request } from "../../lib/http";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";

export function PortalDeliverablesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const clientId = user?.id || "00000000-0000-0000-0000-000000000001";

  // Query deliverables
  const { data: deliverablesData, isLoading } = useQuery({
    queryKey: ["portal", "deliverables", clientId],
    queryFn: () => fetchPortalDeliverables(clientId),
    refetchInterval: 15000,
  });

  const deliverables = deliverablesData?.items || [];
  const countAwaiting = deliverables.filter((d: any) => d.status === "pending_approval").length;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-select first pending deliverable, or just first one
  useEffect(() => {
    if (deliverables.length > 0 && !selectedId) {
      const firstPending = deliverables.find((d: any) => d.status === "pending_approval");
      setSelectedId(firstPending ? firstPending.id : (deliverables[0]?.id || null));
    }
  }, [deliverables, selectedId]);

  const { data: dashboard } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
  });
  
  const subscriptionActive = !!dashboard?.active_plan && ["active", "trialing"].includes(dashboard?.active_plan?.status);

  if (!subscriptionActive && dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SubscriptionLockedState />
      </div>
    );
  }

  const selectedItem: any = deliverables.find((d: any) => d.id === selectedId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const idempotencyKey = crypto.randomUUID();
      return await approveDeliverable(id, clientId, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "deliverables", clientId] });
      showToast("Approved! Assets synced.");
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      return await requestChanges(id, clientId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "deliverables", clientId] });
      showToast("Revision requested.");
      setCommentText("");
    },
  });

  const handleApprove = () => {
    if (selectedId) approveMutation.mutate(selectedId);
  };

  const handleRequestChange = () => {
    if (selectedId) requestChangesMutation.mutate({ id: selectedId, comment: commentText });
  };

  const handleApproveAll = () => {
    const pendingIds = deliverables.filter((d: any) => d.status === "pending_approval").map((d: any) => d.id);
    pendingIds.forEach((id: string) => approveMutation.mutate(id));
    showToast(`Approving ${pendingIds.length} items...`);
  };

  // Mock comments based on the design
  const comments = [
    {
      id: 1,
      author: "You",
      timestamp: "at 0:04",
      text: "Love this shot. Can the steam be a touch longer?",
      marker: 1,
      top: "40%",
      left: "60%"
    },
    {
      id: 2,
      author: "You - v1",
      timestamp: "at 0:17",
      text: "Frame 2 has too much text. Keep just the first line.",
      fixed: true,
      marker: 2,
      top: "70%",
      left: "80%"
    }
  ];

  if (isLoading && deliverables.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7280] mb-2">
            BATCH 05 · {countAwaiting} WAITING FOR YOU
          </p>
          <h1 className="text-3xl font-bold text-white">Review</h1>
        </div>
        {countAwaiting > 0 && (
          <button onClick={handleApproveAll} className="text-[13px] text-[#9CA3AF] hover:text-white transition-colors">
            Approve everything in one tap: <span className="font-bold text-white cursor-pointer hover:underline">Approve all {countAwaiting}</span>
          </button>
        )}
      </div>

      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
        
        {/* Left Column: Batch List */}
        <div className="col-span-3 bg-[#161C2D] rounded-[24px] border border-white/[0.05] p-4 flex flex-col overflow-hidden">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B7280] mb-4 pl-3 pt-2">
            THIS BATCH
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {deliverables.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#6B7280]">
                No deliverables in this batch.
              </div>
            ) : (
              deliverables.map((d: any, idx: number) => {
                const isSelected = selectedId === d.id;
                const isApproved = d.status === "approved" || d.status === "scheduled";
                const isNeedsYou = d.status === "pending_approval";
                
                // Fallbacks mimicking design
                const title = d.title || `Asset ${idx + 1}`;
                const meta = `${d.asset_type || "Reel"} · v${d.revision_round || 1}`;
                const thumb = d.thumbnail_url || d.file_url || "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=200&h=200";

                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? "bg-[#1E2536] border-white/[0.1] shadow-lg" 
                        : "border-transparent hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-black overflow-hidden shrink-0 border border-white/[0.05]">
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[13px] font-bold truncate ${isSelected ? 'text-white' : 'text-[#E5E7EB]'}`}>
                        {title}
                      </h4>
                      <p className="text-[11px] text-[#9CA3AF] truncate mb-2">{meta}</p>
                      
                      {isNeedsYou ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#B45309]/90 text-white">
                          Needs you
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E3A8A]/90 text-[#93C5FD]">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-[#9CA3AF]">
                          In production
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Middle Column: Player */}
        <div className="col-span-5 bg-[#161C2D] rounded-[24px] border border-white/[0.05] flex flex-col relative overflow-hidden">
          {/* Version Switcher */}
          {selectedItem && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex p-1 bg-[#0E1420]/80 backdrop-blur-md rounded-full border border-white/[0.08]">
              {Array.from({ length: selectedItem.revision_round || 1 }).map((_, i) => {
                const isLatest = i + 1 === (selectedItem.revision_round || 1);
                return (
                  <button
                    key={i}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                      isLatest 
                        ? "bg-[#1E2536] text-white shadow-sm border border-white/[0.05]" 
                        : "text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    v{i + 1} {isLatest && "· latest"}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-8 bg-[#0E1420]/30 relative">
            {selectedItem ? (
              <div className="relative w-full max-w-[280px] aspect-[9/16] bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-[#1E2536]">
                <img 
                  src={selectedItem.file_url || "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80"} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
                
                {/* Simulated Comment Markers on Video */}
                {comments.map(c => (
                  <div 
                    key={c.id} 
                    className="absolute size-6 rounded-full bg-[#E2E8F0] border-2 border-black flex items-center justify-center text-[10px] font-bold text-black shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{ top: c.top, left: c.left }}
                  >
                    {c.marker}
                  </div>
                ))}
                
                <div className="absolute bottom-6 inset-x-0 text-center">
                  <p className="text-white text-[13px] font-bold drop-shadow-md">
                    {selectedItem.title || "36 hours before you order."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#6B7280]">Select an asset to view</div>
            )}
          </div>
          
          {/* Player Controls Mock */}
          <div className="h-[72px] shrink-0 border-t border-white/[0.05] px-6 flex items-center gap-4 bg-[#0E1420]/30">
            <button className="size-8 rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 text-[#0E1420] fill-current ml-0.5" />
            </button>
            <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <div className="w-[35%] h-full bg-[#3B82F6] rounded-full" />
            </div>
            <span className="text-[11px] font-bold text-[#6B7280] tabular-nums shrink-0">
              0:09 / 0:24
            </span>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="col-span-4 bg-[#161C2D] rounded-[24px] border border-white/[0.05] p-6 flex flex-col h-full overflow-hidden">
          {selectedItem ? (
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
              {/* Header Info */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6B7280] mb-2">
                  {selectedItem.asset_type || "REEL"} · 9:16 · PUBLISHES THU 1 OCT, 12:30
                </p>
                <h2 className="text-2xl font-normal text-white">{selectedItem.title || selectedItem.file_url?.split("/").pop()?.replace(/[-_.]/g, " ") || "The 36-hour dough"}</h2>
              </div>

              {/* What changed */}
              {(selectedItem.revision_round || 1) > 1 && (
                <div className="bg-[#1E2536] rounded-xl p-4 border border-white/[0.03]">
                  <h4 className="text-[12px] font-bold text-white mb-1.5">What changed in v{selectedItem.revision_round}</h4>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    Frame 2 cut to one line · steam shot extended by 1.2s · end card now links to pre-orders.
                  </p>
                </div>
              )}

              {/* Revision rounds */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-white">Revision rounds</span>
                  <span className="text-[11px] text-[#9CA3AF]">{selectedItem.revision_round || 1} of 2 used</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.08] rounded-full flex gap-1">
                  <div className="h-full flex-1 bg-[#3B82F6] rounded-full" />
                  <div className={`h-full flex-1 rounded-full ${(selectedItem.revision_round || 1) > 1 ? "bg-[#3B82F6]" : ""}`} />
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4 className="text-[12px] font-bold text-white mb-4">Comments</h4>
                <div className="space-y-4">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="size-6 rounded-full bg-[#E2E8F0] shrink-0 flex items-center justify-center text-[10px] font-bold text-black border border-white/[0.1]">
                        {c.marker}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                          <span className="font-bold text-white">{c.author}</span> - {c.timestamp}
                        </p>
                        <p className="text-[13px] text-[#9CA3AF] leading-relaxed mb-1">
                          {c.text}
                        </p>
                        {c.fixed && (
                          <p className="text-[11px] font-bold text-[#9CA3AF] flex items-center gap-1">
                            <Check className="w-3 h-3" /> Fixed in v2
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-[#6B7280] pt-2 border-t border-white/[0.05]">
                    Click anywhere on the video to pin a comment to that moment.
                  </p>
                </div>
              </div>

              {/* Interaction Form */}
              <div className="pt-2">
                <h4 className="text-[12px] font-bold text-white mb-3">Asking for a change?</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Less text", "Different music", "Stronger hook", "Colour feels off-brand", "Wrong product"].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setCommentText(prev => prev ? `${prev} · ${tag}` : tag)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-[11px] font-bold text-[#9CA3AF] transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tell Arjun what to change..."
                  className="w-full bg-[#0E1420]/50 border border-white/[0.08] rounded-xl p-4 text-[13px] text-white placeholder:text-[#6B7280] resize-none focus:outline-none focus:border-white/[0.2] transition-colors h-24 mb-4"
                />
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRequestChange}
                    disabled={requestChangesMutation.isPending || !commentText}
                    className="flex-1 px-4 py-3 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestChangesMutation.isPending ? "Sending..." : "Request change"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || selectedItem.status === "approved"}
                    className="flex-1 px-4 py-3 rounded-full bg-[#E2E8F0] text-[#0E1420] text-[13px] font-bold hover:bg-[#E2E8F0]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {approveMutation.isPending ? "Approving..." : "Approve"}
                  </button>
                </div>
              </div>

            </div>
          ) : null}
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
