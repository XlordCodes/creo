import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { request } from "../../lib/http";
import { useOnboardingGate } from "../../lib/useOnboardingGate";
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
  onboarding_stage?: number;
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
  
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: string;
    name: string;
    text: string;
    time: string;
    isUser: boolean;
  }>>([]);

  const upcomingSlots = (() => {
    const slots = [];
    const times = ["10:30 AM", "2:00 PM", "11:00 AM", "3:30 PM", "10:00 AM"];
    let d = new Date();
    while (slots.length < 5) {
      d = new Date(d.getTime() + 86400000);
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        const dateStr = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
        slots.push({
          id: `slot-${d.toISOString().slice(0, 10)}`,
          date: dateStr,
          time: times[slots.length % times.length],
        });
      }
    }
    return slots;
  })();

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        name: user?.full_name?.charAt(0)?.toUpperCase() || "U",
        text: chatMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        isUser: true
      }
    ]);
    setChatMessage("");
  };

  const handleBookSlot = (slotId: string) => {
    if (!bookedSlots.includes(slotId)) {
      setBookedSlots(prev => [...prev, slotId]);
    }
  };

  // An expired or missing subscription drops the onboarding stage below 8, so the gate covers it
  const gate = useOnboardingGate();

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<DashboardData>("/api/v1/portal/dashboard"),
    enabled: !!user?.id && gate.isComplete,
  });

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

  if (!gate.isComplete) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-10">
        <SubscriptionLockedState
          title="Creative Pod Access Locked"
          description="Your dedicated creative specialists and lead producer will be provisioned once your account setup is completed."
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
            <div className="w-8 h-8 border-2 border-[#7FA0D6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allMembers.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-sm text-[#7E889C]">Your creative pod hasn't been assembled yet.</p>
            <p className="text-xs text-[#7E889C] mt-1">Team members will appear here once onboarding is complete.</p>
          </div>
        ) : (
          allMembers.map((member, i) => {
            const initials = member.name.split(" ").filter(w => w.length > 0).map(w => w[0]).join("").toUpperCase().slice(0, 2);
            const roleDesc = getRoleDesc(member.raw_role);

            return (
              <div
                key={member.id}
                className="bg-[#161F2D] rounded-2xl p-6 border border-[#2A3446] flex flex-col animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{member.name}</h3>
                    <p className="text-[13px] text-[#97A0B3]">{member.role}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#7E889C] leading-relaxed mb-4 flex-1">
                  {roleDesc}
                </p>

                {/* Working hours */}
                <p className="text-xs text-[#7E889C] mb-4">
                  Working hours: <span className="text-[#97A0B3]">Mon-Fri, 10am-7pm IST</span>
                </p>

                {/* Message Button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#2A3446] text-[13px] font-medium text-white hover:bg-[#1F2C3F] transition-colors mt-auto">
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
        <div className="lg:col-span-2 bg-[#161F2D] rounded-2xl border border-[#2A3446] flex flex-col" style={{ minHeight: "400px" }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3446]">
            <h3 className="text-base font-semibold text-white">Chat with your pod</h3>
            <span className="text-[13px] text-[#7E889C]">average reply 1h 50m</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto scrollbar-hide flex flex-col justify-center">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-[#7E889C]">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-white" />
                <p className="text-sm font-medium text-white/80">No messages yet</p>
                <p className="text-xs text-[#7E889C] mt-1">Send a message to start communicating directly with your pod.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.isUser ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${msg.isUser ? "bg-[#BCCCE6] text-[#0B111C]" : "bg-gradient-to-br from-pink-500 to-orange-400 text-white"}`}>
                    {msg.name}
                  </div>
                  <div className={msg.isUser ? "text-right" : ""}>
                    <div className={`p-3 rounded-2xl text-sm inline-block text-left ${msg.isUser ? "bg-[#BCCCE6] text-[#0B111C] rounded-tr-sm" : "bg-[#1F2C3F] text-white rounded-tl-sm"}`}>
                      {msg.text}
                    </div>
                    <span className={`text-[11px] text-[#7E889C] mt-1 block ${msg.isUser ? "text-right" : ""}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="px-4 py-3 border-t border-[#2A3446]">
            <div className="flex items-center gap-2 bg-[#0B111C] rounded-full px-4 py-2 border border-white/[0.06]">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-white placeholder-[#7E889C] outline-none"
              />
              <button onClick={handleSendMessage} className="px-4 py-1.5 bg-[#BCCCE6] text-[#0B111C] rounded-full text-[13px] font-medium hover:bg-white transition-colors flex items-center gap-1.5 shrink-0">
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Booking (1 col) */}
        <div className="bg-[#161F2D] rounded-2xl p-6 border border-[#2A3446]">
          <h3 className="text-base font-semibold text-white mb-1">Book a call</h3>
          <p className="text-[13px] text-[#7E889C] mb-5">15-minute slots with your pod lead</p>

          <div className="space-y-0 divide-y divide-white/[0.05]">
            {upcomingSlots.map((slot) => {
              const isBooked = bookedSlots.includes(slot.id);
              return (
                <div key={slot.id} className="flex items-center justify-between py-4">
                  <span className="text-sm text-[#97A0B3]">{slot.date}</span>
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
