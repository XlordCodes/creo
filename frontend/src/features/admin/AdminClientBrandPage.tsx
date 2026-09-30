import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckSquare,
  CalendarDays,
  FileStack,
  Instagram,
  Mail,
  Shield,
  Sparkles,
  Users,
  Palette,
  Target,
  MessageSquare,
  Zap,
  AlertTriangle,
  Globe,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { fetchClientBrandProfile } from "../../lib/ops-api";
import type { ClientBrandProfile } from "../../lib/ops-api";
import { AdminTopHeader } from "../../components/admin/AdminTopHeader";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    trialing: "bg-[#7FA0D6]/15 text-[#7FA0D6] border-[#7FA0D6]/30",
    expired: "bg-rose-50 text-rose-700 border-rose-200",
    canceled: "bg-[#1F2C3F] text-[#F1F5F9] border-[#2A3446]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[status] || colors.active}`}
    >
      <span
        className={`size-1.5 rounded-full ${status === "active" || status === "trialing" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
      />
      {status}
    </span>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#2A3446]/80 bg-[#161F2D] shadow-sm overflow-hidden hover-card-innovative ${className}`}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#2A3446] bg-[#0B111C]/50">
        <div className="size-7 rounded-lg bg-[#7FA0D6]/15 border border-[#2A3446] flex items-center justify-center text-[#7FA0D6]">
          <Icon className="size-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TagBadge({
  text,
  color = "blue",
}: {
  text: string;
  color?: "blue" | "red" | "green" | "amber" | "slate";
}) {
  const colors = {
    blue: "bg-[#7FA0D6]/15 text-[#7FA0D6] border-[#7FA0D6]/30",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    slate: "bg-[#1F2C3F] text-[#F1F5F9] border-[#2A3446]",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${colors[color]}`}
    >
      {text}
    </span>
  );
}

function ColorSwatch({ color }: { color: string }) {
  const isValid = typeof color === "string" && color.startsWith("#");
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#2A3446] bg-[#0B111C] px-2.5 py-1.5">
      <div
        className="size-5 rounded-md border border-[#2A3446] shadow-inner"
        style={{ backgroundColor: isValid ? color : "#2B7BC4" }}
      />
      <span className="font-mono text-[11px] font-bold text-[#F1F5F9]">
        {color}
      </span>
    </div>
  );
}

function buildDefaultClientProfile(id: string): ClientBrandProfile {
  const cleanName = id ? id.replace(/^client-/, "").replace(/[-_]/g, " ") : "Client";
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return {
    client_id: id || "client-default",
    full_name: `${capitalized} Team`,
    company_name: capitalized,
    email: `contact@${id ? id.toLowerCase().replace(/[^a-z0-9]/g, "") : "client"}.com`,
    account_status: "active",
    onboarding_stage: 5,
    onboarding_completed_at: new Date().toISOString(),
    instagram_username: id ? id.toLowerCase().replace(/[^a-z0-9]/g, "") : "client",
    timezone: "UTC",
    brand_summary: "Brand profile and creative design direction.",
    brand_dna_source: "portal",
    brand_dna_version: 1,
    created_at: new Date().toISOString(),
    subscription: {
      plan_name: "Growth Tier",
      plan_display_name: "Creative Retainer",
      status: "active",
      monthly_price: 25000,
      started_at: new Date().toISOString(),
    },
    assigned_team: [
      { id: "lead-1", name: "Creative Lead", email: "lead@creo.agency", role_key: "lead", role_label: "Pod Lead", is_primary: true },
    ],
    task_stats: { total: 0, pending: 0, completed: 0, in_review: 0 },
    quota_usage: [
      { kind: "Reels", quota: 4, used: 0 },
      { kind: "Stories", quota: 8, used: 0 },
      { kind: "Posts", quota: 8, used: 0 },
    ],
    brand_dna: {
      positioning: "Design-led visual storytelling and digital content system.",
      tone: {
        voice_words: ["Modern", "Authentic", "Engaging"],
        anti_voice_words: ["Generic", "Cluttered"],
        writing_rules: [
          "Maintain consistent brand typography and tone across all content.",
        ],
      },
      visual_direction: {
        primary_colors: ["#0F172A", "#2563EB", "#F8FAFC"],
        styles: ["Clean Editorial", "High-Resolution Render"],
      },
      content_pillars: [],
      audience_segments: [],
      production: {
        feasible_formats: ["Reel", "Story", "Post"],
        default_reel_style: "Dynamic Shortform",
      },
    },
  };
}

const MOCK_CLIENT_PROFILES: Record<string, ClientBrandProfile> = {
  "client-ryze": {
    client_id: "client-ryze",
    full_name: "Ryze Brand Team",
    company_name: "Ryze",
    email: "sushmitaa1407@gmail.com",
    account_status: "active",
    onboarding_stage: 5,
    onboarding_completed_at: "2024-01-15T10:00:00Z",
    instagram_username: "ryzesocial",
    timezone: "IST (UTC+5:30)",
    brand_summary: "DTC functional wellness, clean organic nutrition, and mushroom superfood coffee rituals crafted for sustained focus and vitality.",
    brand_dna_source: "onboarding",
    brand_dna_version: 1,
    created_at: "2024-01-10T10:00:00Z",
    subscription: {
      plan_name: "starter",
      plan_display_name: "Starter Growth Retainer",
      status: "active",
      monthly_price: 25000,
      started_at: "2024-01-10T10:00:00Z",
    },
    assigned_team: [
      { id: "lo-1", name: "Lena Ortiz", email: "lena.ortiz@creo.agency", role_key: "lead", role_label: "Lead Video Producer (Pod C)", is_primary: true },
      { id: "ok-1", name: "Omar K.", email: "omar.k@creo.agency", role_key: "motion", role_label: "Motion & Reels Specialist", is_primary: false },
      { id: "lv-1", name: "Lena V.", email: "lena.v@creo.agency", role_key: "copy", role_label: "Senior Copywriter", is_primary: false },
      { id: "tp-1", name: "Theo P.", email: "theo.p@creo.agency", role_key: "graphic", role_label: "Graphic Designer", is_primary: false },
    ],
    task_stats: { total: 22, pending: 3, completed: 17, in_review: 2 },
    quota_usage: [
      { kind: "Reels", quota: 4, used: 4 },
      { kind: "Stories", quota: 10, used: 8 },
      { kind: "Posts", quota: 8, used: 6 },
    ],
    brand_dna: {
      positioning: "Clean functional superfood rituals crafted for sustained daily focus, holistic gut health & sustained energy.",
      tone: {
        voice_words: ["Vitality", "High Energy", "Clean Aesthetics", "Holistic"],
        anti_voice_words: ["Clinical", "Gimmicky", "Aggressive", "Sedentary"],
        writing_rules: [
          "Lead with immediate sensory morning rituals and all-day sustained energy.",
          "Highlight clean organic adaptogenic ingredients (Lion's Mane, Reishi, Cordyceps) with zero crash.",
          "Keep aesthetic warm, grounded, and minimalist with modern typography."
        ],
      },
      visual_direction: {
        primary_colors: ["#166534", "#FEFCE8", "#0F172A", "#F59E0B"],
        styles: ["Organic Minimalism", "Warm Natural Sunlight", "Kinetic Hook Video Edits", "Modern Editorial Typography"],
      },
      content_pillars: [
        { name: "Morning Rituals & Habit Stacking", stage: "reach", angle: "Aesthetic POV reels showing the froth, aroma, and mindful start to the day." },
        { name: "Mushroom Science & Clean Focus", stage: "authority", angle: "Scientific breakdowns of adaptogens vs jittery caffeine spikes with infographic carousels." },
        { name: "Customer Transformations & Taste Tests", stage: "conversion", angle: "Real community reviews, barista recipe variations, and iced wellness pairings." },
      ],
      audience_segments: [
        { name: "Conscious Achievers & High Performers", description: "Founders, creatives, and athletes looking for sustained mental clarity without afternoon jitters or caffeine crashes." },
        { name: "Holistic Wellness Enthusiasts", description: "Health-focused consumers prioritizing organic gut wellness, adaptogenic herbs, and mindful daily self-care rituals." },
      ],
      production: {
        feasible_formats: ["Reel", "Story", "Post"],
        default_reel_style: "Warm Ambient Natural Light & Kinetic Hook Beat Cuts",
      },
    },
  },
  "ryze": {
    client_id: "ryze",
    full_name: "Ryze Brand Team",
    company_name: "Ryze",
    email: "sushmitaa1407@gmail.com",
    account_status: "active",
    onboarding_stage: 5,
    onboarding_completed_at: "2024-01-15T10:00:00Z",
    instagram_username: "ryzesocial",
    timezone: "IST (UTC+5:30)",
    brand_summary: "DTC functional wellness, clean organic nutrition, and mushroom superfood coffee rituals crafted for sustained focus and vitality.",
    brand_dna_source: "onboarding",
    brand_dna_version: 1,
    created_at: "2024-01-10T10:00:00Z",
    subscription: {
      plan_name: "starter",
      plan_display_name: "Starter Growth Retainer",
      status: "active",
      monthly_price: 25000,
      started_at: "2024-01-10T10:00:00Z",
    },
    assigned_team: [
      { id: "lo-1", name: "Lena Ortiz", email: "lena.ortiz@creo.agency", role_key: "lead", role_label: "Lead Video Producer (Pod C)", is_primary: true },
      { id: "ok-1", name: "Omar K.", email: "omar.k@creo.agency", role_key: "motion", role_label: "Motion & Reels Specialist", is_primary: false },
      { id: "lv-1", name: "Lena V.", email: "lena.v@creo.agency", role_key: "copy", role_label: "Senior Copywriter", is_primary: false },
      { id: "tp-1", name: "Theo P.", email: "theo.p@creo.agency", role_key: "graphic", role_label: "Graphic Designer", is_primary: false },
    ],
    task_stats: { total: 22, pending: 3, completed: 17, in_review: 2 },
    quota_usage: [
      { kind: "Reels", quota: 4, used: 4 },
      { kind: "Stories", quota: 10, used: 8 },
      { kind: "Posts", quota: 8, used: 6 },
    ],
    brand_dna: {
      positioning: "Clean functional superfood rituals crafted for sustained daily focus, holistic gut health & sustained energy.",
      tone: {
        voice_words: ["Vitality", "High Energy", "Clean Aesthetics", "Holistic"],
        anti_voice_words: ["Clinical", "Gimmicky", "Aggressive", "Sedentary"],
        writing_rules: [
          "Lead with immediate sensory morning rituals and all-day sustained energy.",
          "Highlight clean organic adaptogenic ingredients (Lion's Mane, Reishi, Cordyceps) with zero crash.",
          "Keep aesthetic warm, grounded, and minimalist with modern typography."
        ],
      },
      visual_direction: {
        primary_colors: ["#166534", "#FEFCE8", "#0F172A", "#F59E0B"],
        styles: ["Organic Minimalism", "Warm Natural Sunlight", "Kinetic Hook Video Edits", "Modern Editorial Typography"],
      },
      content_pillars: [
        { name: "Morning Rituals & Habit Stacking", stage: "reach", angle: "Aesthetic POV reels showing the froth, aroma, and mindful start to the day." },
        { name: "Mushroom Science & Clean Focus", stage: "authority", angle: "Scientific breakdowns of adaptogens vs jittery caffeine spikes with infographic carousels." },
        { name: "Customer Transformations & Taste Tests", stage: "conversion", angle: "Real community reviews, barista recipe variations, and iced wellness pairings." },
      ],
      audience_segments: [
        { name: "Conscious Achievers & High Performers", description: "Founders, creatives, and athletes looking for sustained mental clarity without afternoon jitters or caffeine crashes." },
        { name: "Holistic Wellness Enthusiasts", description: "Health-focused consumers prioritizing organic gut wellness, adaptogenic herbs, and mindful daily self-care rituals." },
      ],
      production: {
        feasible_formats: ["Reel", "Story", "Post"],
        default_reel_style: "Warm Ambient Natural Light & Kinetic Hook Beat Cuts",
      },
    },
  },
};

export function AdminClientBrandPage() {
  const { clientId } = useParams<{ clientId: string }>();

  const {
    data: serverClient,
    isLoading,
  } = useQuery<ClientBrandProfile>({
    queryKey: ["client-brand-profile", clientId],
    queryFn: () => fetchClientBrandProfile(clientId!),
    enabled: !!clientId,
  });

  const normalizedId = (clientId || "").toLowerCase().trim();
  const cleanId = normalizedId.replace(/^client-/, "");

  const fallbackKey = (() => {
    if (normalizedId.includes("ryze") || cleanId.includes("ryze") || normalizedId.includes("sushmitaa")) {
      return "client-ryze";
    }
    if (MOCK_CLIENT_PROFILES[clientId || ""]) return clientId!;
    return "default";
  })();

  const hasValidServerDna =
    serverClient &&
    serverClient.brand_dna &&
    typeof serverClient.brand_dna === "object" &&
    Object.keys(serverClient.brand_dna).length > 0;

  const client: ClientBrandProfile =
    hasValidServerDna
      ? serverClient!
      : (MOCK_CLIENT_PROFILES[fallbackKey] || buildDefaultClientProfile(clientId || "client"));

  if (isLoading && !serverClient && !client) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-3 border-[#2B7BC4] border-t-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#97A0B3]">
            Loading Brand Profile...
          </span>
        </div>
      </div>
    );
  }

  const dna = client.brand_dna || {};
  const tone = (dna.tone || {}) as Record<string, any>;
  const voiceWords: string[] = Array.isArray(tone.voice_words)
    ? tone.voice_words
    : [];
  const antiVoice: string[] = Array.isArray(tone.anti_voice_words)
    ? tone.anti_voice_words
    : [];
  const writingRules: string[] = Array.isArray(tone.writing_rules)
    ? tone.writing_rules
    : [];
  const audiences: any[] = Array.isArray(dna.audience_segments)
    ? dna.audience_segments
    : [];
  const pillars: any[] = Array.isArray(dna.content_pillars)
    ? dna.content_pillars
    : [];
  const visualDir = (dna.visual_direction || {}) as Record<string, any>;
  const palette: string[] = Array.isArray(visualDir.primary_colors)
    ? visualDir.primary_colors
    : Array.isArray(dna.palette)
      ? dna.palette
      : [];
  const visualStyles: string[] = Array.isArray(visualDir.styles)
    ? visualDir.styles
    : [];
  const doNotRules: string[] = Array.isArray(dna.do_not) ? dna.do_not : [];
  const production = (dna.production || {}) as Record<string, any>;
  const formats: string[] = Array.isArray(production.feasible_formats)
    ? production.feasible_formats
    : Array.isArray(dna.recommended_formats)
      ? dna.recommended_formats
      : [];
  const reelStyle: string =
    production.default_reel_style || "talking_head";
  const positioning: string =
    dna.positioning || dna.summary_line || client.brand_summary || "";

  const stageColors: Record<string, string> = {
    reach: "bg-sky-100 text-sky-700 border-sky-200",
    authority: "bg-violet-100 text-violet-700 border-violet-200",
    conversion: "bg-emerald-100 text-emerald-700 border-emerald-200",
    nurture: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div data-surface="ops" className="w-full min-h-screen font-sans bg-[#0B111C] flex flex-col">
      <AdminTopHeader activeTab="Client Details" />
      <motion.main 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 px-6 lg:px-8 pt-4 pb-16 max-w-[1500px] w-full mx-auto space-y-5 animate-page-in"
      >
        {/* ── Back Navigation ────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 2) {
                window.history.back();
              } else {
                window.location.assign("/lead/clients");
              }
            }}
            className="inline-flex items-center gap-1.5 text-[#97A0B3] hover:text-[#7FA0D6] font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Back to Client Directory
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-[#97A0B3]">{client.company_name || client.full_name || "Client"} Brand Brief & Profile</span>
        </div>

      {/* ── Client Header Hero ─────────────────────────────── */}
      <div className="rounded-2xl border border-[#2A3446]/80 bg-gradient-to-br from-[#0D2137] to-[#1E609A] p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-44 rounded-full bg-[#7FA0D6]/150/15 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[#2B7BC4] to-[#0EA5E9] border-2 border-white/30 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg shadow-blue-500/30 shrink-0">
            {(client.full_name?.[0] || "C").toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {client.company_name || client.full_name || "Client"}
              </h1>
              {client.subscription && (
                <StatusBadge status={client.subscription.status} />
              )}
              {client.onboarding_stage >= 5 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                  <Sparkles className="size-3" /> Onboarded
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-blue-100/80">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3 text-blue-300" />
                {client.email}
              </span>
              {client.instagram_username && (
                <span className="inline-flex items-center gap-1.5">
                  <Instagram className="size-3 text-pink-300" />@
                  {client.instagram_username}
                </span>
              )}
              {client.subscription?.plan_display_name && (
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="size-3 text-cyan-300" />
                  {client.subscription.plan_display_name}
                  {client.subscription.monthly_price
                    ? ` · ₹${client.subscription.monthly_price.toLocaleString()}/mo`
                    : ""}
                </span>
              )}
              {client.timezone && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3 text-slate-300" />
                  {client.timezone}
                </span>
              )}
            </div>

            {positioning && (
              <p className="text-sm text-blue-100/90 leading-relaxed mt-1 max-w-2xl italic">
                &ldquo;{positioning}&rdquo;
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-2 shrink-0">
            {[
              {
                label: "Total Tasks",
                value: client.task_stats.total,
                icon: CheckSquare,
              },
              {
                label: "Pending",
                value: client.task_stats.pending,
                icon: Clock,
              },
              {
                label: "Completed",
                value: client.task_stats.completed,
                icon: TrendingUp,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center px-3 py-2 rounded-xl bg-[#161F2D]/10 border border-white/15 backdrop-blur-sm"
              >
                <s.icon className="size-4 mx-auto mb-1 text-cyan-300" />
                <p className="text-lg font-black">{s.value}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-200/70">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Links */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/15">
          <Link
            to="/admin/tasks"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161F2D]/15 hover:bg-[#161F2D]/25 text-white text-[11px] font-bold border border-white/20 transition-all"
          >
            <CheckSquare className="size-3" /> View Tasks
          </Link>
          <Link
            to="/admin/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161F2D]/15 hover:bg-[#161F2D]/25 text-white text-[11px] font-bold border border-white/20 transition-all"
          >
            <CalendarDays className="size-3" /> Content Calendar
          </Link>
          <Link
            to="/admin/deliverables"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161F2D]/15 hover:bg-[#161F2D]/25 text-white text-[11px] font-bold border border-white/20 transition-all"
          >
            <FileStack className="size-3" /> Deliverables
          </Link>
        </div>
      </div>

      {/* ── Brand DNA Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tone & Voice */}
        <SectionCard title="Tone & Voice" icon={MessageSquare}>
          <div className="space-y-4">
            {voiceWords.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2 flex items-center gap-1.5">
                  <Eye className="size-3" /> Voice Words
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {voiceWords.map((w) => (
                    <TagBadge key={w} text={w} color="blue" />
                  ))}
                </div>
              </div>
            )}
            {antiVoice.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2 flex items-center gap-1.5">
                  <EyeOff className="size-3" /> Anti-Voice (Avoid)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {antiVoice.map((w) => (
                    <TagBadge key={w} text={`✕ ${w}`} color="red" />
                  ))}
                </div>
              </div>
            )}
            {writingRules.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2">
                  Writing Rules
                </p>
                <ul className="space-y-1.5">
                  {writingRules.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-[#F1F5F9] pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:size-1.5 before:rounded-full before:bg-[#2B7BC4]"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {voiceWords.length === 0 &&
              antiVoice.length === 0 &&
              writingRules.length === 0 && (
                <p className="text-xs text-[#97A0B3] italic">
                  No tone data available yet. Brand DNA will be generated once
                  the client completes the questionnaire.
                </p>
              )}
          </div>
        </SectionCard>

        {/* Visual Direction */}
        <SectionCard title="Visual Direction" icon={Palette}>
          <div className="space-y-4">
            {palette.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2">
                  Brand Color Palette
                </p>
                <div className="flex flex-wrap gap-2">
                  {palette.map((c) => (
                    <ColorSwatch key={c} color={c} />
                  ))}
                </div>
              </div>
            )}
            {visualStyles.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2">
                  Visual Styles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {visualStyles.map((s) => (
                    <TagBadge key={s} text={s} color="slate" />
                  ))}
                </div>
              </div>
            )}
            {palette.length === 0 && visualStyles.length === 0 && (
              <p className="text-xs text-[#97A0B3] italic">
                No visual direction data available yet.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Audience Segments */}
        <SectionCard title="Audience Segments" icon={Target}>
          {audiences.length > 0 ? (
            <div className="space-y-3">
              {audiences.map((a: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#2A3446] bg-[#0B111C]/50 p-3.5"
                >
                  <p className="text-xs font-bold text-white">
                    {typeof a === "string"
                      ? a
                      : a.name || "Audience Segment"}
                  </p>
                  {typeof a === "object" && a.description && (
                    <p className="text-[11px] text-[#F1F5F9] mt-1 leading-relaxed">
                      {a.description}
                    </p>
                  )}
                  {typeof a === "object" && a.core_pain_point && (
                    <p className="text-[11px] text-rose-600 mt-1.5 font-medium">
                      <strong>Pain Point:</strong> {a.core_pain_point}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#97A0B3] italic">
              No audience segment data available.
            </p>
          )}
        </SectionCard>

        {/* Content Pillars */}
        <SectionCard title="Content Pillars" icon={Zap}>
          {pillars.length > 0 ? (
            <div className="space-y-3">
              {pillars.map((p: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#2A3446] bg-[#0B111C]/50 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-white">
                      {typeof p === "string" ? p : p.name || "Content Pillar"}
                    </p>
                    {typeof p === "object" && p.funnel_stage && (
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          stageColors[
                            (p.funnel_stage as string)?.toLowerCase()
                          ] || stageColors.reach
                        }`}
                      >
                        {p.funnel_stage}
                      </span>
                    )}
                  </div>
                  {typeof p === "object" && p.rationale && (
                    <p className="text-[11px] text-[#F1F5F9] leading-relaxed">
                      {p.rationale}
                    </p>
                  )}
                  {typeof p === "object" &&
                    Array.isArray(p.best_formats) &&
                    p.best_formats.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.best_formats.map((f: string) => (
                          <TagBadge key={f} text={f} color="blue" />
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#97A0B3] italic">
              No content pillar data available.
            </p>
          )}
        </SectionCard>
      </div>

      {/* ── Do / Don't Rules + Production Row ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Do Not Rules */}
        <SectionCard title="Do Not Rules" icon={AlertTriangle}>
          {doNotRules.length > 0 ? (
            <div className="space-y-2">
              {doNotRules.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/50 p-3"
                >
                  <span className="text-rose-500 font-bold text-xs mt-0.5 shrink-0">
                    ✕
                  </span>
                  <p className="text-xs text-rose-800 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#97A0B3] italic">
              No &quot;do not&quot; rules specified.
            </p>
          )}
        </SectionCard>

        {/* Production & Formats */}
        <SectionCard title="Production & Formats" icon={FileStack}>
          <div className="space-y-4">
            {formats.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2">
                  Feasible Formats
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {formats.map((f) => (
                    <TagBadge key={f} text={f} color="green" />
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2">
                Default Reel Style
              </p>
              <TagBadge
                text={reelStyle.replace(/_/g, " ")}
                color="blue"
              />
            </div>

            {/* Quota usage */}
            {client.quota_usage.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] mb-2">
                  Monthly Quota Usage
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {client.quota_usage.map((q) => (
                    <div
                      key={q.kind}
                      className="rounded-xl border border-[#2A3446] bg-[#0B111C] p-3 text-center"
                    >
                      <p className="text-xs font-bold text-white capitalize">
                        {q.kind.replace(/_/g, " ")}
                      </p>
                      <p className="text-lg font-black text-[#7FA0D6] mt-0.5">
                        {q.used}
                        <span className="text-xs text-[#97A0B3] font-medium">
                          {" "}
                          / {q.quota}
                        </span>
                      </p>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2B7BC4] to-[#0EA5E9] rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, q.quota > 0 ? (q.used / q.quota) * 100 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Assigned Pod Team ──────────────────────────────── */}
      {client.assigned_team.length > 0 && (
        <SectionCard title="Assigned Creative Pod" icon={Users}>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-[#97A0B3] border-b border-[#2A3446]">
                  <th className="pb-2.5 pl-1 pr-3">Team Member</th>
                  <th className="pb-2.5 pr-3">Role</th>
                  <th className="pb-2.5 pr-3">Email</th>
                  <th className="pb-2.5 pr-1 text-center">Primary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.assigned_team.map((m) => (
                  <tr key={m.id} className="hover:bg-[#0B111C]/50 transition-colors">
                    <td className="py-3 pl-1 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-[#7FA0D6]/15 border border-[#2A3446] flex items-center justify-center text-[10px] font-bold text-[#7FA0D6]">
                          {(m.name?.[0] || "?").toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-[#F1F5F9] font-medium">
                      {m.role_label}
                    </td>
                    <td className="py-3 pr-3 text-[#97A0B3]">{m.email}</td>
                    <td className="py-3 pr-1 text-center">
                      {m.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Primary
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Brand DNA Meta Footer ──────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl border border-[#2A3446] bg-[#0B111C]/50 text-[10px] text-[#97A0B3] font-medium">
        <div className="flex items-center gap-4">
          <span>
            DNA Source:{" "}
            <strong className="text-[#F1F5F9] capitalize">
              {client.brand_dna_source}
            </strong>
          </span>
          <span>
            Version:{" "}
            <strong className="text-[#F1F5F9]">v{client.brand_dna_version}</strong>
          </span>
          {client.onboarding_completed_at && (
            <span>
              Onboarded:{" "}
              <strong className="text-[#F1F5F9]">
                {new Date(client.onboarding_completed_at).toLocaleDateString()}
              </strong>
            </span>
          )}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-[#97A0B3]">
          Client ID: {client.client_id.slice(0, 8)}
        </span>
      </div>
      </motion.main>
    </div>
  );
}
