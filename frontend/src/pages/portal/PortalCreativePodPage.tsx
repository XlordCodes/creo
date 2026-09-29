import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { request } from "../../lib/http";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";
import { MessageCircle, Send, Check } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  raw_role: string;
  role: string;
  is_primary?: boolean;
}

interface DashboardData {
  assigned_team?: TeamMember[];
  active_plan?: { status: string; name?: string; price_minor?: number } | null;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  team_lead: "Strategy, briefs, and client communication. Mon-Fri, 10am-7pm IST.",
  creative_lead: "Art direction, quality control, and brand consistency.",
  editor: "Reels, motion graphics, and video editing. Mon-Fri, 10am-7pm IST.",
  designer: "Static posts, carousels, and brand design. Mon-Fri, 10am-7pm IST.",
  copywriter: "Captions, hooks, and messaging. Mon-Fri, 10am-7pm IST.",
  strategist: "Content planning and research. Mon-Fri, 10am-7pm IST.",
};

function getRoleDesc(role: string): string {
  const key = role.toLowerCase().replace(/\s+/g, "_");
  return ROLE_DESCRIPTIONS[key] || "Creative execution and support. Mon-Fri, 10am-7pm IST.";
}

export function PortalCreativePodPage() {
  const { user } = useAuth();
  const [chatMessage, setChatMessage] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "pod",
      name: "NI",
      text: "Hey! The reels batch for this week is in final QA. Should hit your review queue by tonight. 🎬",
      time: "2:30 PM",
      isUser: false
    },
    {
      id: "2",
      sender: "user",
      name: "U",
      text: "Perfect, thanks Nisha! Also can we try a different hook for the sourdough reel?",
      time: "2:45 PM",
      isUser: true
    },
    {
      id: "3",
      sender: "pod",
      name: "NI",
      text: "Absolutely! Arjun is already testing a new hook variation. I'll have it in your V2 by tomorrow.",
      time: "2:52 PM",
      isUser: false
    }
  ]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        name: user?.full_name?.charAt(0)?.toUpperCase() || "U",
        text: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        isUser: true
      }
    ]);
    setChatMessage("");
    
    // Simulate pod reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "pod",
          name: "NI",
          text: "Got it! Our team is on it. We'll update you soon.",
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          isUser: false
        }
      ]);
    }, 2000);
  };

  const handleBookSlot = (slotId: string) => {
    if (!bookedSlots.includes(slotId)) {
      setBookedSlots(prev => [...prev, slotId]);
    }
  };

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<DashboardData>("/api/v1/portal/dashboard"),
    enabled: !!user?.id,
  });

  const { data: subData } = useQuery({
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

  const assignedTeam = dashboard?.assigned_team || [];
  const podLead = assignedTeam.find((m) => m.is_primary || m.raw_role === "team_lead" || m.raw_role === "creative_lead");
  const allMembers = podLead ? [podLead, ...assignedTeam.filter((m) => m.id !== podLead.id)] : assignedTeam;

  // Avatar color palette
  const AVATAR_COLORS = [
    "bg-gradient-to-br from-pink-500 to-orange-400",
    "bg-[#6366F1]",
    "bg-[#10B981]",
    "bg-[#F59E0B]",
    "bg-[#EF4444]",
    "bg-[#8B5CF6]",
  ];

  if (!isSubscribed && !isLoading) {
    return (
      <div className="space-y-5">
        <SubscriptionLockedState
          title={isExpired ? "Creative Pod Access Expired" : "Creative Pod Locked"}
          description={isExpired
            ? "Your retainer has expired. Renew to regain access to your dedicated creative team."
            : "An active subscription is required to access your Creative Pod team directory."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-semibold text-white">Your pod</h1>

      {/* ── Team Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#93C5FD] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allMembers.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-sm text-[#6B7280]">Your creative pod hasn't been assembled yet.</p>
            <p className="text-xs text-[#6B7280] mt-1">Team members will appear here once onboarding is complete.</p>
          </div>
        ) : (
          allMembers.map((member, i) => {
            const initials = member.name.split(" ").filter(w => w.length > 0).map(w => w[0]).join("").toUpperCase().slice(0, 2);
            const roleDesc = getRoleDesc(member.raw_role);

            return (
              <div
                key={member.id}
                className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05] flex flex-col animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{member.name}</h3>
                    <p className="text-[13px] text-[#9CA3AF]">{member.role}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#6B7280] leading-relaxed mb-4 flex-1">
                  {roleDesc}
                </p>

                {/* Working hours */}
                <p className="text-[11px] text-[#6B7280] mb-4">
                  Working hours: <span className="text-[#9CA3AF]">Mon-Fri, 10am-7pm IST</span>
                </p>

                {/* Message Button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-medium text-white hover:bg-white/[0.05] transition-colors mt-auto">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
                  Message {member.name.split(" ")[0]}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Bottom Section: Chat + Booking ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat (2 cols) */}
        <div className="lg:col-span-2 bg-[#161C2D] rounded-2xl border border-white/[0.05] flex flex-col" style={{ minHeight: "400px" }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <h3 className="text-base font-semibold text-white">Chat with your pod</h3>
            <span className="text-[12px] text-[#6B7280]">average reply 1h 50m</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto scrollbar-hide">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.isUser ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${msg.isUser ? "bg-[#93C5FD] text-[#0E1420]" : "bg-gradient-to-br from-pink-500 to-orange-400 text-white"}`}>
                  {msg.name}
                </div>
                <div className={msg.isUser ? "text-right" : ""}>
                  <div className={`p-3 rounded-2xl text-sm inline-block text-left ${msg.isUser ? "bg-white text-[#0E1420] rounded-tr-sm" : "bg-[#1E2536] text-white rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                  <span className={`text-[10px] text-[#6B7280] mt-1 block ${msg.isUser ? "text-right" : ""}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="px-4 py-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-2 bg-[#0E1420] rounded-full px-4 py-2 border border-white/[0.06]">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-white placeholder-[#6B7280] outline-none"
              />
              <button onClick={handleSendMessage} className="px-4 py-1.5 bg-white text-[#0E1420] rounded-full text-[13px] font-medium hover:bg-white/90 transition-colors flex items-center gap-1.5 shrink-0">
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Booking (1 col) */}
        <div className="bg-[#161C2D] rounded-2xl p-6 border border-white/[0.05]">
          <h3 className="text-base font-semibold text-white mb-1">Book a call</h3>
          <p className="text-[12px] text-[#6B7280] mb-5">15-minute slots with your pod lead</p>

          <div className="space-y-0 divide-y divide-white/[0.05]">
            {[
              { id: "slot-1", date: "Mon, 30 Sep", time: "10:30 AM" },
              { id: "slot-2", date: "Tue, 1 Oct", time: "2:00 PM" },
              { id: "slot-3", date: "Wed, 2 Oct", time: "11:00 AM" },
              { id: "slot-4", date: "Thu, 3 Oct", time: "3:30 PM" },
              { id: "slot-5", date: "Fri, 4 Oct", time: "10:00 AM" },
            ].map((slot) => {
              const isBooked = bookedSlots.includes(slot.id);
              return (
                <div key={slot.id} className="flex items-center justify-between py-4">
                  <span className="text-sm text-[#9CA3AF]">{slot.date}</span>
                  <button 
                    onClick={() => handleBookSlot(slot.id)}
                    disabled={isBooked}
                    className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                      isBooked 
                        ? "bg-[#047857]/20 text-[#34D399] cursor-default" 
                        : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                    }`}
                  >
                    {isBooked ? <><Check className="w-3.5 h-3.5"/> Booked</> : slot.time}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
