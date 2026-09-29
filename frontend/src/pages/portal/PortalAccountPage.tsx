import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { useSearchParams } from "react-router";
import { request } from "../../lib/http";
import { Instagram, Upload, Palette } from "lucide-react";

export function PortalAccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "settings";

  const { data: profile } = useQuery<any>({
    queryKey: ["portal-profile", user?.id],
    queryFn: () => request("/api/v1/portal/profile"),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
  });
  
  const stage = dashboard?.onboarding_stage ?? user?.onboarding_stage ?? 1;
  const isSetupIncomplete = stage < 4;

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      return await request("/api/v1/portal/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-profile"] });
      alert("Changes saved successfully!");
    },
  });

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    brandName: "",
    igHandle: "",
    whatYouSell: "",
    voiceWords: [] as string[],
    audience: "",
    competitors: "",
    colors: ["#BA5A2B", "#F3EBDD", "#2B1D14", "#5D7A45"],
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        name: profile.full_name || user?.full_name || "",
        company: profile.company_name || user?.company_name || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        brandName: profile.company_name || "",
        igHandle: profile.instagram_username || "",
        whatYouSell: profile.brand_dna?.summary_line || "",
        audience: profile.brand_dna?.target_audience || "",
        voiceWords: profile.brand_dna?.tone_keywords || ["Warm", "Craft-first", "Local"],
      }));
    }
  }, [profile, user]);

  const handleSaveSettings = () => {
    updateProfileMutation.mutate({
      full_name: form.name,
      company_name: form.company,
      phone: form.phone,
    });
  };

  const handleSaveBrandDNA = () => {
    updateProfileMutation.mutate({
      company_name: form.brandName,
      instagram_username: form.igHandle,
      brand_dna: {
        ...(profile?.brand_dna || {}),
        summary_line: form.whatYouSell,
        target_audience: form.audience,
        tone_keywords: form.voiceWords,
        palette: form.colors,
      }
    });
    setSearchParams({ tab: "brand" });
  };

  const toggleVoiceWord = (word: string) => {
    setForm((prev) => ({
      ...prev,
      voiceWords: prev.voiceWords.includes(word)
        ? prev.voiceWords.filter((w) => w !== word)
        : [...prev.voiceWords, word],
    }));
  };

  const updateColor = (idx: number, hex: string) => {
    const newColors = [...form.colors];
    newColors[idx] = hex;
    setForm((prev) => ({ ...prev, colors: newColors }));
  };

  if (isSetupIncomplete && dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-8">
          <h2 className="text-xl font-bold text-white mb-2">Complete Your Setup</h2>
          <p className="text-sm text-[#9CA3AF] mb-6">
            You need to finish the onboarding process before you can fully access and manage your profile, brand DNA, and settings.
          </p>
          <a
            href={`/onboarding?step=${stage}`}
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-white text-[#0E1420] text-[13px] font-bold hover:bg-white/90 transition-colors"
          >
            Resume Onboarding
          </a>
        </div>
      </div>
    );
  }

  if (tab === "edit-brand") {
    return (
      <div className="animate-in fade-in duration-500 max-w-2xl">
        <h1 className="text-3xl font-semibold text-white mb-6">Edit Brand DNA</h1>

        <div className="flex gap-6">
          <div className="flex-1 bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-8 space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-white mb-2">Brand name</label>
                <input type="text" value={form.brandName} onChange={(e) => setForm({...form, brandName: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-white mb-2">Instagram handle</label>
                <input type="text" value={form.igHandle} onChange={(e) => setForm({...form, igHandle: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white mb-2">What do you sell, in one line?</label>
              <input type="text" value={form.whatYouSell} onChange={(e) => setForm({...form, whatYouSell: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" placeholder="Slow-fermented sourdough and festive boxes, pre-order only." />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white mb-2">Pick three words for your voice</label>
              <div className="flex flex-wrap gap-2">
                {["Warm", "Playful", "Premium", "Craft-first", "Bold", "Minimal", "Local", "Witty"].map(word => (
                  <button key={word} onClick={() => toggleVoiceWord(word)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${form.voiceWords.includes(word) ? "bg-white text-[#0E1420]" : "bg-white/[0.05] text-white hover:bg-white/[0.1]"}`}>
                    {word}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white mb-2">Who buys from you?</label>
              <textarea rows={2} value={form.audience} onChange={(e) => setForm({...form, audience: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-white/[0.2]" placeholder="25-40, Chennai + Bengaluru, weekend bakers and gift buyers." />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white mb-2">Two or three brands you admire (or compete with)</label>
              <input type="text" value={form.competitors} onChange={(e) => setForm({...form, competitors: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" placeholder="@theboxbakery, @loafandco" />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-white mb-2">Brand Colors</label>
              <div className="flex gap-4">
                {form.colors.map((color, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded-lg border border-white/[0.1] overflow-hidden cursor-pointer hover:scale-105 transition-transform flex items-center justify-center">
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => updateColor(idx, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" 
                    />
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: color }} />
                    <Palette className="w-4 h-4 text-white/50 z-0 drop-shadow-md" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-dashed border-white/[0.1] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-white/[0.2] transition-colors">
              <Upload className="w-5 h-5 text-[#9CA3AF] mb-3" />
              <p className="text-[13px] font-bold text-white mb-1">Drop your logo, fonts and product photos</p>
              <p className="text-[11px] text-[#6B7280]">Optional now, you can add them later in Brand DNA</p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-[11px] text-[#6B7280]">Saved automatically</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setSearchParams({ tab: "brand" })} className="px-5 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors">
                  Back
                </button>
                <button onClick={handleSaveBrandDNA} className="px-5 py-2.5 rounded-full bg-white text-[#0E1420] text-[13px] font-bold hover:bg-white/90 transition-colors flex items-center justify-center">
                  {updateProfileMutation.isPending ? "Saving..." : "Save and continue"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (tab === "brand") {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.15em] mb-1">
              VERSION 3 · UPDATED BY YOU ON 2 SEP
            </p>
            <h1 className="text-3xl font-semibold text-white">Brand DNA</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors">
              Version history
            </button>
            <button onClick={() => setSearchParams({ tab: "edit-brand" })} className="px-5 py-2.5 rounded-full bg-white text-[#0E1420] text-[13px] font-bold hover:bg-white/90 transition-colors">
              Suggest an edit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
              <h3 className="text-[15px] font-bold text-white mb-4">Voice</h3>
              <p className="text-[13px] text-[#9CA3AF] mb-5 leading-relaxed">
                Warm, patient, a little nerdy about fermentation. We explain the craft without showing off.
              </p>
              <div className="flex flex-wrap gap-2">
                {form.voiceWords.map(word => (
                  <span key={word} className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-[12px] font-medium text-white">{word}</span>
                ))}
              </div>
            </div>

            <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8 flex gap-8">
              <div className="flex-1">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">MAIN AUDIENCE</h3>
                <p className="text-[13px] text-white leading-relaxed">{form.audience || "25-40, Chennai + Bengaluru, weekend bakers and gift buyers."}</p>
              </div>
              <div className="flex-1">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">WHAT THEY CARE ABOUT</h3>
                <p className="text-[13px] text-white leading-relaxed">Real ingredients, pre-order convenience, festive gifting.</p>
              </div>
            </div>

            <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
              <h3 className="text-[15px] font-bold text-white mb-6">Do & don't</h3>
              <div className="flex gap-8">
                <div className="flex-1 space-y-3">
                  <h4 className="text-[13px] font-bold text-white">Do</h4>
                  <ul className="text-[13px] text-[#9CA3AF] space-y-2">
                    <li>Show hands and process</li>
                    <li>Natural light, warm tones</li>
                    <li>Lead with the smell and texture</li>
                  </ul>
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-[13px] font-bold text-[#F87171]">Don't</h4>
                  <ul className="text-[13px] text-[#9CA3AF] space-y-2">
                    <li>Stock photos</li>
                    <li>Neon or cool colours</li>
                    <li>Discount-first hooks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
              <h3 className="text-[15px] font-bold text-white mb-6">Look</h3>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { name: "Crust", hex: form.colors[0] },
                  { name: "Flour", hex: form.colors[1] },
                  { name: "Oven", hex: form.colors[2] },
                  { name: "Basil", hex: form.colors[3] },
                ].map((c) => (
                  <div key={c.name}>
                    <div className="w-full aspect-[4/3] rounded-lg mb-2" style={{ backgroundColor: c.hex || "#000000" }} />
                    <p className="text-[11px] font-bold text-white">{c.name}</p>
                    <p className="text-[10px] text-[#6B7280]">{c.hex ? c.hex.toUpperCase() : ""}</p>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/[0.05]">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">TYPE</h3>
                <p className="text-[13px] text-[#9CA3AF]">Headlines: Recoleta · Body: Inter <span className="text-[#6B7280]">(from your brand kit)</span></p>
              </div>
            </div>

            <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
              <h3 className="text-[15px] font-bold text-white mb-5">Hooks that worked</h3>
              <div className="space-y-2">
                {[
                  "We start baking 36 hours before you order.",
                  "The crackle you can hear.",
                  "Why our Diwali box sells out by Monday.",
                ].map(hook => (
                  <div key={hook} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0 last:pb-0">
                    <p className="text-[13px] text-white flex-1 leading-relaxed">"{hook}"</p>
                    <span className="px-2 py-0.5 rounded bg-[#1E3A8A]/30 text-[#93C5FD] text-[10px] font-bold whitespace-nowrap">approved first round</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
              <h3 className="text-[15px] font-bold text-white mb-5">Brand files</h3>
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-[#9CA3AF]">Logo pack.zip</span>
                  <span className="text-[#6B7280] text-[11px]">4 files</span>
                </div>
                <div className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-[#9CA3AF]">Product photos - Sept</span>
                  <span className="text-[#6B7280] text-[11px]">38 photos</span>
                </div>
                <div className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-[#9CA3AF]">Menu 2026.pdf</span>
                  <span className="text-[#6B7280] text-[11px]">1.2 MB</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] text-white text-[13px] font-medium hover:bg-white/[0.08] transition-colors">
                <Upload className="w-4 h-4" /> Upload files
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Settings Tab
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.15em] mb-1">
            ACCOUNT
          </p>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
        </div>
        <button onClick={handleSaveSettings} className="px-5 py-2.5 rounded-full bg-white text-[#0E1420] text-[13px] font-bold hover:bg-white/90 transition-colors">
          {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="space-y-6">
          
          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
            <h3 className="text-[15px] font-bold text-white mb-5">Profile</h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] text-[#9CA3AF] mb-2">Your name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" placeholder="[Owner name]" />
              </div>
              <div>
                <label className="block text-[12px] text-[#9CA3AF] mb-2">Company</label>
                <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" placeholder="Company Name" />
              </div>
              <div>
                <label className="block text-[12px] text-[#9CA3AF] mb-2">Work email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" placeholder="Email address" />
              </div>
              <div>
                <label className="block text-[12px] text-[#9CA3AF] mb-2">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[#0E1420] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/[0.2]" placeholder="[+91 ...]" />
              </div>
            </div>
          </div>

          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
            <h3 className="text-[15px] font-bold text-white mb-5">Instagram</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-[#9CA3AF]" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-0.5">Not connected yet</h4>
                  <p className="text-[11px] text-[#6B7280]">Connect to publish automatically and see results.</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-full bg-white text-[#0E1420] text-[12px] font-bold hover:bg-white/90 transition-colors whitespace-nowrap">
                Connect with Meta
              </button>
            </div>
          </div>

          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
            <h3 className="text-[15px] font-bold text-white mb-5">Team access</h3>
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white">[{form.name || "Owner name"}] · <span className="text-[#9CA3AF]">owner</span></span>
                <span className="px-3 py-1 rounded-full bg-white/[0.08] text-white text-[11px] font-bold">Admin</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#9CA3AF]">Marketing manager</span>
                <button className="px-4 py-1.5 rounded-full border border-white/[0.12] text-white text-[12px] font-bold hover:bg-white/[0.05] transition-colors">Invite</button>
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280]">Invited people can review and comment; only admins can approve and pay.</p>
          </div>
          
        </div>

        <div className="space-y-6">
          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
            <h3 className="text-[15px] font-bold text-white mb-6">Notifications</h3>
            <div className="space-y-6">
              {[
                { label: "Email me when a batch is ready", defaultOn: true },
                { label: "WhatsApp reminder the day before a review is due", defaultOn: true },
                { label: "Weekly summary every Monday", defaultOn: false },
                { label: "Billing emails", defaultOn: true },
              ].map((notif, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[13px] text-white">{notif.label}</span>
                  <div className={`w-9 h-5 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${notif.defaultOn ? "bg-[#3B82F6]" : "bg-white/[0.1]"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notif.defaultOn ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
            <h3 className="text-[15px] font-bold text-white mb-6">Security</h3>
            <div className="space-y-5 mb-6">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-5">
                <span className="text-[13px] text-white">Password</span>
                <button className="px-4 py-1.5 rounded-full border border-white/[0.12] text-white text-[12px] font-bold hover:bg-white/[0.05] transition-colors">Change password</button>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-5">
                <span className="text-[13px] text-white">2-step verification</span>
                <button className="px-4 py-1.5 rounded-full border border-white/[0.12] text-white text-[12px] font-bold hover:bg-white/[0.05] transition-colors">Set up</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white">Signed-in devices</span>
                <span className="text-[12px] text-[#6B7280]">2 devices</span>
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280]">Changing your password asks for your current one first.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
