import { useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { request } from "../../lib/http";
import { fetchPortalDeliverables } from "../../lib/deliverables-api";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";

// Fallback for demo when backend is empty
const DEMO_ASSETS = [
  { id: "demo-1", status: "Published", type: "REEL", title: "The 36-hour dough", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop" },
  { id: "demo-2", status: "Needs you", type: "CAROUSEL", title: "Diwali pre-order guide", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop" },
  { id: "demo-3", status: "Approved", type: "STORY", title: "Pre-order reminder", image: "https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?w=600&h=600&fit=crop" },
  { id: "demo-4", status: "Published", type: "POST", title: "Weekend bake list", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=600&fit=crop" }
];

export function PortalLibraryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["portal-library", user?.id],
    queryFn: () => fetchPortalDeliverables(user?.id || "", undefined, 100),
    enabled: !!user?.id
  });

  const { data: dashboard } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
  });
  
  const subscriptionActive = !!dashboard?.active_plan && ["active", "trialing"].includes(dashboard?.active_plan?.status);

  const rawItems = response?.items || [];
  
  // Transform real items into library format
  const realAssets = rawItems.map((item: any) => ({
    id: item.id,
    status: item.status === "pending_approval" ? "Needs you" : item.status === "approved" ? "Approved" : item.status === "in_production" ? "Scheduled" : "Published",
    type: (item.type || (item.file_type?.includes("video") ? "reel" : "post")).toUpperCase(),
    title: item.title || `${item.type || "Asset"} Draft`,
    image: item.thumbnail_url || item.file_url || "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&h=600&fit=crop",
    fileUrl: item.file_url
  }));

  const assets = realAssets.length > 0 ? realAssets : DEMO_ASSETS;

  const counts = {
    total: assets.length,
    reels: assets.filter(a => a.type === "REEL").length,
    carousels: assets.filter(a => a.type === "CAROUSEL").length,
    posts: assets.filter(a => a.type === "POST").length,
    stories: assets.filter(a => a.type === "STORY").length,
  };

  const filteredAssets = assets.filter(a => {
    const matchesFilter = filter === "All" || filter.toUpperCase().startsWith(a.type);
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!subscriptionActive && dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <SubscriptionLockedState />
      </div>
    );
  }

  const handleDownload = (id: string, url?: string) => {
    setDownloading(id);
    setTimeout(() => {
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = true.toString();
        a.click();
      }
      setDownloading(null);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#93C5FD] animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] text-[#6B7280] uppercase mb-1">
            EVERYTHING WE HAVE MADE FOR YOU
          </p>
          <h1 className="text-3xl font-semibold text-white">Library</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts, captions..."
              className="w-full sm:w-[280px] pl-10 pr-4 py-2.5 bg-[#161C2D] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#93C5FD] focus:ring-1 focus:ring-[#93C5FD] transition-all"
            />
          </div>
          <button 
            onClick={() => handleDownload("all")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161C2D] border border-white/[0.08] hover:bg-white/[0.04] transition-colors rounded-xl text-sm font-medium text-white shrink-0"
          >
            {downloading === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download all
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#161C2D] border border-white/[0.05] rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
        <div className="p-5 sm:p-6">
          <p className="text-xs text-[#9CA3AF] font-medium mb-1.5">Delivered since joining</p>
          <p className="text-3xl font-semibold text-white mb-1">{counts.total}</p>
          <p className="text-[11px] text-[#6B7280]">assets, all yours to keep</p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs text-[#9CA3AF] font-medium mb-1.5">Published</p>
          <p className="text-3xl font-semibold text-white mb-1">{assets.filter(a => a.status === "Published").length}</p>
          <p className="text-[11px] text-[#6B7280]">to your socials</p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs text-[#9CA3AF] font-medium mb-1.5">First-round approvals</p>
          <p className="text-3xl font-semibold text-white mb-1">94%</p>
          <p className="text-[11px] text-[#6B7280]">across all batches</p>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs text-[#9CA3AF] font-medium mb-1.5">Brand files</p>
          <p className="text-3xl font-semibold text-white mb-1">12</p>
          <p className="text-[11px] text-[#6B7280]">logos, fonts, photos</p>
        </div>
      </div>

      {/* Filters & Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "All", label: `All ${counts.total}` },
            { id: "Reels", label: `Reels ${counts.reels}` },
            { id: "Carousels", label: `Carousels ${counts.carousels}` },
            { id: "Posts", label: `Posts ${counts.posts}` },
            { id: "Stories", label: `Stories ${counts.stories}` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                filter === f.id
                  ? "bg-white/[0.08] text-white"
                  : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#6B7280]">
          Every file comes in full resolution with captions and hashtags.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[400px]">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-[#6B7280] py-20 border border-dashed border-white/[0.1] rounded-2xl">
            <Search className="w-8 h-8 mb-4 opacity-50" />
            <p className="text-sm">No assets found matching your criteria</p>
          </div>
        ) : (
          filteredAssets.map((asset, i) => {
            let badgeClass = "bg-[#374151]/80 text-white"; // default / Scheduled
            if (asset.status === "Needs you") badgeClass = "bg-[#B45309]/90 text-white";
            else if (asset.status === "Approved") badgeClass = "bg-[#047857]/90 text-white";
            else if (asset.status === "Published") badgeClass = "bg-[#1E3A8A]/90 text-[#93C5FD]";

            return (
              <div 
                key={asset.id} 
                className="group bg-[#161C2D] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/[0.1] transition-all animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Image Box */}
                <div className="relative aspect-square overflow-hidden bg-[#0E1420]">
                  <img
                    src={asset.image}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md ${badgeClass}`}>
                      {asset.status}
                    </span>
                  </div>
                </div>
                
                {/* Content Box */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase mb-1">
                      {asset.type}
                    </p>
                    <p className="text-sm font-semibold text-white truncate">
                      {asset.title}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDownload(asset.id, (asset as any).fileUrl)}
                    className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-white/[0.1] transition-colors shrink-0"
                  >
                    {downloading === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
