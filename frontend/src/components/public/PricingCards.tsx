import { Link } from "react-router";

interface PricingCardsProps {
  showBillingToggle?: boolean;
  defaultCycle?: string;
  className?: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: null,
    price: "₹25,000",
    period: "/month",
    unitCost: "≈ ₹1,136 per asset · 22 assets",
    stats: [
      { count: "4", label: "Reels" },
      { count: "8", label: "Posts" },
      { count: "10", label: "Stories" },
    ],
    features: [
      "1 revision round per asset",
      "3 business-day batch SLA",
      "Shared account lead",
    ],
    isFeatured: false,
    ctaText: "Start with a free sample",
    ctaLink: "/signup?plan=starter",
  },
  {
    id: "growth",
    name: "Growth",
    badge: "Best value per asset",
    price: "₹50,000",
    period: "/month",
    unitCost: "≈ ₹1,042 per asset · 48 assets",
    stats: [
      { count: "10", label: "Reels" },
      { count: "16", label: "Posts" },
      { count: "22", label: "Stories" },
    ],
    features: [
      "2 revision rounds per asset",
      "2 business-day batch SLA",
      "Dedicated account director",
    ],
    isFeatured: true,
    ctaText: "Start with a free sample",
    ctaLink: "/signup?plan=growth",
  },
  {
    id: "scale",
    name: "Scale",
    badge: null,
    price: "₹95,000",
    period: "/month",
    unitCost: "≈ ₹990 per asset · 96 assets",
    stats: [
      { count: "20", label: "Reels" },
      { count: "32", label: "Posts" },
      { count: "44", label: "Stories" },
    ],
    features: [
      "3 revision rounds per asset",
      "24-hour priority SLA",
      "Director + monthly strategy review",
    ],
    isFeatured: false,
    ctaText: "Start with a free sample",
    ctaLink: "/signup?plan=scale",
  },
];

export function PricingCards({ className = "" }: PricingCardsProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* 3 Pricing Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 ${
              plan.isFeatured
                ? "bg-[#141C2B] border-2 border-[#7FA0D6]/80 shadow-[0_0_35px_rgba(127,160,214,0.12)]"
                : "bg-[#121926] border border-[#222F44] hover:border-white/[0.15]"
            }`}
          >
            <div>
              {/* Plan Name & Badge */}
              <div className="flex items-center justify-between mb-4 min-h-[28px]">
                <h3 className="text-white font-semibold text-base tracking-wide">
                  {plan.name}
                </h3>
                {plan.badge && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-[11px] font-medium text-white/90">
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Price & Unit Cost */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm font-normal text-[#9CA3AF]">
                    {plan.period}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1.5 font-medium">
                  {plan.unitCost}
                </p>
              </div>

              {/* Separator */}
              <div className="border-t border-white/[0.08] my-6" />

              {/* Quotas 3-column stats */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {plan.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {stat.count}
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <div className="space-y-3.5 mb-8 text-[13px] text-[#D1D5DB] leading-relaxed">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-auto pt-2">
              <Link
                to={plan.ctaLink}
                className="w-full bg-[#BCCCE6] hover:bg-[#CAD8EE] text-[#0E1420] text-sm font-bold py-3.5 px-4 rounded-xl text-center transition-colors block shadow-sm"
              >
                {plan.ctaText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
