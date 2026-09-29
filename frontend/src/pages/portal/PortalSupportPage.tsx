import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Send,
  X,
  Plus,
} from "lucide-react";
import { request } from "../../lib/http";
import { useAuth } from "../../lib/auth-context";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";
import type { TicketItem } from "../../types/api";

interface SupportTicketData {
  id: string;
  status: "in_progress" | "resolved" | "open";
  priority: "urgent" | "medium" | "high" | "low";
  priorityLabel: string;
  timeAgo: string;
  title: string;
  description: string;
  meta: string;
  category?: string;
  messages?: Array<{ id: string; sender: string; text: string; time: string; isMe?: boolean }>;
}

const CATEGORIES = ["Content", "Billing", "Technical", "Brand", "Other"];

const FAQ_ITEMS = [
  { q: "How do I request changes on an approved asset?", a: "Once an asset is approved, it moves to the Scheduled queue. If you need a last-minute change, please open a Support ticket with the priority 'High' and mention the asset ID." },
  { q: "What happens if I miss a review deadline?", a: "Assets auto-approve after the SLA timer expires to ensure your delivery pipeline stays on schedule. You can still request a revision via support, but it may eat into your monthly quota." },
  { q: "Can I add more reels to my plan mid-cycle?", a: "Yes! You can purchase Add-on packs from the Plan & billing page. They apply immediately and do not affect your recurring billing cycle." },
  { q: "How do revision rounds work?", a: "Each asset includes 2 free revision rounds. When reviewing, select 'Request Changes' and leave detailed comments. The pod will submit a v2 within 24-48 hours." },
  { q: "What's included in the Growth plan?", a: "The Growth plan includes a dedicated creative pod, 8 Reels, 4 Posts, and 8 Stories per cycle, with a 2-hour response SLA." },
];

export function PortalSupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ["client-subscription"],
    queryFn: () => request<any>("/api/v1/payments/subscription"),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const isExpired =
    subData?.is_expired === true ||
    subData?.subscription?.status === "expired" ||
    subData?.subscription?.status === "canceled";
  const isStaffOrAdmin = user?.role && user.role !== "client";
  const isSubscribed =
    isStaffOrAdmin ||
    (!isExpired &&
      (subData?.is_active === true ||
        (!!subData?.subscription && ["active", "trialing"].includes(subData?.subscription?.status))));

  const { data: serverTickets = [] } = useQuery<TicketItem[]>({
    queryKey: ["tickets", user?.id],
    queryFn: async () => {
      try {
        const res = await request<TicketItem[]>("/api/v1/tickets");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: isSubscribed,
    refetchInterval: 12000,
  });

  // Local state
  const [ticketsList, setTicketsList] = useState<SupportTicketData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Content");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync server tickets
  React.useEffect(() => {
    if (serverTickets && serverTickets.length > 0) {
      const mapped: SupportTicketData[] = serverTickets.map((t) => ({
        id: `#TKT-${t.id.slice(0, 4).toUpperCase()}`,
        status: (t.status === "resolved" || t.status === "closed" ? "resolved" : t.status === "in_progress" ? "in_progress" : "open") as any,
        priority: ((t.priority as any) || "medium") as any,
        priorityLabel: t.priority === "urgent" ? "Urgent" : t.priority === "high" ? "High" : t.priority === "low" ? "Low" : "Medium",
        timeAgo: t.created_at ? new Date(t.created_at).toLocaleDateString() : "Recently",
        title: t.title,
        description: t.description,
        meta: `Opened by ${user?.full_name || "You"}`,
        category: "General",
      }));
      setTicketsList(mapped);
    } else {
      setTicketsList([]);
    }
  }, [serverTickets, user]);

  const createTicketMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; priority: string }) => {
      return await request("/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast("Please fill in both subject and description.");
      return;
    }

    const newTicketId = `#TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicketData = {
      id: newTicketId,
      status: "in_progress",
      priority: "medium",
      priorityLabel: "Medium",
      timeAgo: "Just now",
      title: subject.trim(),
      description: description.trim(),
      meta: `Opened by ${user?.full_name || "You"}`,
      category: selectedCategory,
    };

    setTicketsList((prev) => [newTicket, ...prev]);
    createTicketMutation.mutate({ title: subject.trim(), description: description.trim(), priority: "medium" });
    showToast(`Ticket ${newTicketId} submitted!`);
    setSubject("");
    setDescription("");
  };

  if (isSubLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#93C5FD] animate-spin" />
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <SubscriptionLockedState
        title={isExpired ? "Support Access Expired" : "Support Locked"}
        description="An active subscription is required to access the support desk."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Help</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column: Ask your pod (Form) ── */}
        <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
          <h3 className="text-base font-semibold text-white mb-5">Ask your pod</h3>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Category Pills */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">What is it about?</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-white text-[#0E1420]"
                        : "bg-transparent border border-white/[0.12] text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly summarize your request..."
                className="w-full bg-[#0E1420] border border-white/[0.08] rounded-lg p-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">Message</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue or request..."
                className="w-full bg-[#0E1420] border border-white/[0.08] rounded-lg p-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-white/[0.2] resize-none transition-colors"
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="w-10 h-10 rounded-full bg-white text-[#0E1420] flex items-center justify-center hover:bg-white/90 transition-colors"
              >
                {createTicketMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right Column: Your requests + Common questions ── */}
        <div className="space-y-6">
          {/* Your Requests */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            <h3 className="text-base font-semibold text-white mb-4">Your requests</h3>

            {ticketsList.length === 0 ? (
              <p className="text-sm text-[#6B7280] py-6 text-center">No tickets yet. Submit your first request.</p>
            ) : (
              <div className="space-y-3">
                {ticketsList.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 bg-[#0E1420] rounded-xl border border-white/[0.04]">
                    {/* Top row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-[#6B7280]">{t.id}</span>
                      <span className="text-[11px] text-[#6B7280]">· {t.category}</span>
                      <span className="text-[11px] text-[#6B7280] ml-auto">{t.timeAgo}</span>
                    </div>
                    {/* Title */}
                    <p className="text-sm font-medium text-white mb-2">{t.title}</p>
                    {/* Status */}
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-medium ${
                        t.status === "resolved"
                          ? "bg-[#93C5FD]/10 text-[#93C5FD]"
                          : t.status === "in_progress"
                          ? "bg-[#FCD34D]/10 text-[#FCD34D]"
                          : "bg-white/[0.05] text-[#9CA3AF]"
                      }`}
                    >
                      {t.status === "resolved"
                        ? "✓ Fixed in v2"
                        : t.status === "in_progress"
                        ? "In progress"
                        : "Waiting on you"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Common Questions (Accordion) */}
          <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
            <h3 className="text-base font-semibold text-white mb-4">Common questions</h3>

            <div className="divide-y divide-white/[0.05]">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <span className="text-sm text-[#9CA3AF] group-hover:text-white transition-colors pr-4">{item.q}</span>
                    <Plus
                      className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${
                        expandedFaq === i ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  {expandedFaq === i && (
                    <div className="pb-4 text-sm text-[#6B7280] animate-in fade-in slide-in-from-top-2">
                      {item.a}
                    </div>
                  )}
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
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 text-[#6B7280] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default PortalSupportPage;
