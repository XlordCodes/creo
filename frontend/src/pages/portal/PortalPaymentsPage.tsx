import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { request } from "../../lib/http";
import { openRazorpayCheckout } from "../../lib/razorpay";

interface SubscriptionData {
  status: string;
  name?: string;
  price_minor?: number;
  current_period_end?: string;
}

export function PortalPaymentsPage() {
  const { user } = useAuth();
  const [downloadingInv, setDownloadingInv] = useState<string | null>(null);
  const [processingAddon, setProcessingAddon] = useState<string | null>(null);

  const { data: subData } = useQuery<{ subscription?: SubscriptionData }>({
    queryKey: ["client-subscription", user?.id],
    queryFn: () => request<any>("/api/v1/payments/subscription"),
    enabled: !!user?.id,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
  });
  
  const stage = dashboard?.onboarding_stage ?? user?.onboarding_stage ?? 1;
  const isSetupIncomplete = stage < 4;

  const planName = (subData as any)?.plan?.display_name || subData?.subscription?.name || "Growth";
  const planPrice = (subData?.subscription as any)?.amount 
    ? parseFloat((subData?.subscription as any).amount) 
    : (subData as any)?.plan?.price_minor ? (subData as any).plan.price_minor / 100 : 50000;
  const renewalDate = subData?.subscription?.current_period_end 
    ? new Date(subData.subscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
    : "12 OCT";

  const addons = [
    { id: "extra_reel", name: "Extra reel", desc: "Delivered within this batch", price: 4500 },
    { id: "rush", name: "Rush delivery", desc: "24-hour turnaround on one asset", price: 6000 },
    { id: "revision", name: "Extra revision round", desc: "For one asset", price: 1500 },
    { id: "shoot", name: "Half-day shoot", desc: "Product + process footage in Chennai", price: 18000 },
  ];

  const backendInvoices = (subData as any)?.invoices || [];
  const invoices = backendInvoices.length > 0 
    ? backendInvoices.map((inv: any) => ({
        id: inv.id,
        period: inv.date,
        amount: typeof inv.amount === 'string' ? parseFloat(inv.amount.replace(/[^0-9.]/g, '')) : inv.amount,
        status: inv.status
      }))
    : [
        { id: "CR-2609", period: "12 Sep – 11 Oct", amount: planPrice, status: "Paid" },
      ];

  const usage = (subData as any)?.usage || {};
  const usageBars = [
    { label: "Reels", current: usage.reel?.used || 0, max: usage.reel?.quota || 10, color: "bg-[#3B82F6]" },
    { label: "Posts", current: usage.static_post?.used || 0, max: usage.static_post?.quota || 16, color: "bg-[#3B82F6]" },
    { label: "Stories", current: usage.story?.used || 0, max: usage.story?.quota || 22, color: "bg-[#3B82F6]" }
  ];

  const totalMax = usageBars.reduce((sum, item) => sum + item.max, 0);
  const costPerAsset = totalMax > 0 ? Math.round(planPrice / totalMax) : 1042;


  const handleAddon = (addon: typeof addons[0]) => {
    setProcessingAddon(addon.id);
    // Simulate backend init then Razorpay
    setTimeout(() => {
      setProcessingAddon(null);
      openRazorpayCheckout(
        {
          key: "mock",
          amount: addon.price * 100,
          currency: "INR",
          name: "Creo Studio",
          description: addon.name,
          order_id: "mock_" + addon.id,
          prefill: { name: user?.full_name || "", email: user?.email || "" }
        },
        () => alert(`Successfully added ${addon.name} to this cycle!`),
        () => {}
      );
    }, 600);
  };

  const handleDownload = (id: string) => {
    setDownloadingInv(id);
    setTimeout(() => setDownloadingInv(null), 1200);
  };

  const handleComparePlans = () => {
    alert("Compare plans modal will open here.");
  };

  if (isSetupIncomplete && dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-8">
          <h2 className="text-xl font-bold text-white mb-2">Complete Your Setup</h2>
          <p className="text-sm text-[#9CA3AF] mb-6">
            You need to finish the onboarding process before you can fully access and manage your plans and billing.
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#6B7280] mb-2">
            {planName} PLAN · RENEWS {renewalDate}
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Plan & billing</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleComparePlans}
            className="px-5 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors"
          >
            Compare plans
          </button>
          <button className="px-5 py-2.5 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors">
            Pause next month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── Top Left: Current Plan ── */}
        <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#6B7280] mb-1">
                CURRENT PLAN
              </p>
              <h2 className="text-3xl font-bold text-white">{planName}</h2>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-white">₹{planPrice.toLocaleString('en-IN')}</h2>
              <p className="text-[11px] text-[#9CA3AF] mt-1">per month · ₹{costPerAsset.toLocaleString('en-IN')} per asset</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">


            {usageBars.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-white">{item.label}</span>
                  <span className="text-[12px] font-medium text-[#9CA3AF]">{item.current} / {item.max}</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.current / item.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#6B7280] font-medium leading-relaxed">
            2 revision rounds per asset · 2 business-day batch SLA · dedicated account director
          </p>
        </div>

        {/* ── Top Right: Add to this cycle ── */}
        <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
          <h3 className="text-sm font-bold text-white mb-6">Add to this cycle</h3>
          <div className="divide-y divide-white/[0.05]">
            {addons.map(addon => (
              <div key={addon.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-1">{addon.name}</h4>
                  <p className="text-[11px] text-[#6B7280]">{addon.desc}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                  <span className="text-[13px] font-bold text-white">₹{addon.price.toLocaleString('en-IN')}</span>
                  <button 
                    onClick={() => handleAddon(addon)}
                    disabled={!!processingAddon}
                    className="px-5 py-2 rounded-full bg-[#E2E8F0] text-[#0E1420] text-[12px] font-bold hover:bg-[#E2E8F0]/90 transition-colors w-20 flex items-center justify-center disabled:opacity-50"
                  >
                    {processingAddon === addon.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom Left: Invoices ── */}
        <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8">
          <h3 className="text-sm font-bold text-white mb-6">Invoices</h3>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-[#6B7280] pb-3 font-mono">Invoice</th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-[#6B7280] pb-3 font-mono">Period</th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-[#6B7280] pb-3 font-mono">Amount</th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-[#6B7280] pb-3 font-mono">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-4 text-[13px] font-medium text-[#9CA3AF] font-mono">{inv.id}</td>
                    <td className="py-4 text-[13px] text-white">{inv.period}</td>
                    <td className="py-4 text-[13px] font-bold text-white">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#1E3A8A]/90 text-[#93C5FD] text-[11px] font-bold">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => handleDownload(inv.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.12] text-[12px] font-bold text-white hover:bg-white/[0.05] transition-colors"
                      >
                        {downloadingInv === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Download className="w-3.5 h-3.5" />}
                        GST invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom Right: Payment method ── */}
        <div className="bg-[#161C2D] border border-white/[0.05] rounded-[24px] p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-6">Payment method</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#9CA3AF]">Method</span>
                <span className="text-[13px] font-bold text-white">UPI AutoPay · Razorpay</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#9CA3AF]">Next charge</span>
                <span className="text-[13px] font-bold text-white">₹{planPrice.toLocaleString('en-IN')} · {renewalDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#9CA3AF]">GSTIN on invoices</span>
                <span className="text-[13px] font-bold text-white">Added</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              openRazorpayCheckout(
                {
                  key: "mock",
                  amount: 0,
                  currency: "INR",
                  name: "Creo Studio",
                  description: "Update payment method",
                  order_id: "mock_auth",
                },
                () => alert("Payment method updated successfully!"),
                () => {}
              );
            }}
            className="w-full py-3 rounded-full border border-white/[0.12] text-[13px] font-bold text-white hover:bg-white/[0.05] transition-colors mt-auto"
          >
            Change payment method
          </button>
        </div>

      </div>
    </div>
  );
}
