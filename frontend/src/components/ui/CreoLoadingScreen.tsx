interface CreoLoadingScreenProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
  className?: string;
}

export function CreoLoadingScreen({
  label = "Authenticating...",
  sublabel,
  fullScreen = true,
  className = "",
}: CreoLoadingScreenProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* ── Creative Gyroscopic Orbit Ring (No "C") ── */}
      <div className="relative flex items-center justify-center size-14">
        {/* Soft Ambient Radial Glow Backdrop */}
        <div className="absolute inset-0 rounded-full bg-[#7FA0D6]/15 blur-lg animate-pulse-ring pointer-events-none" />

        {/* Outer Orbit Precision Ring (Clockwise) */}
        <div className="size-12 rounded-full border-2 border-[#2A3446]/60 border-t-[#7FA0D6] border-r-[#7FA0D6]/35 animate-spin shadow-[0_0_18px_rgba(127,160,214,0.35)]" />

        {/* Inner Counter-Orbit Arc (Counter-Clockwise) */}
        <div className="absolute size-7 rounded-full border border-transparent border-b-[#BCCCE6] border-l-[#BCCCE6]/50 animate-spin-reverse" />

        {/* Epicenter Glowing Creative Core (Minimal Pulsing Dot) */}
        <div className="absolute size-2 rounded-full bg-gradient-to-tr from-[#7FA0D6] to-[#BCCCE6] shadow-[0_0_10px_#7FA0D6] animate-pulse" />
      </div>

      {/* ── Label & Sequenced Micro-dots ── */}
      <div className="flex flex-col items-center gap-1.5 text-center select-none">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#BCCCE6] flex items-center gap-1.5">
          <span>{label.replace(/\.\.\.$/, "")}</span>
          <span className="inline-flex gap-1 items-center ml-0.5">
            <span className="size-1 rounded-full bg-[#7FA0D6] animate-pulse [animation-duration:1s]" />
            <span className="size-1 rounded-full bg-[#7FA0D6]/70 animate-pulse [animation-duration:1s] [animation-delay:200ms]" />
            <span className="size-1 rounded-full bg-[#7FA0D6]/40 animate-pulse [animation-duration:1s] [animation-delay:400ms]" />
          </span>
        </div>

        {/* Hairline Shimmer Progress Bar */}
        <div className="w-28 h-[2px] rounded-full bg-[#161F2D] border border-[#2A3446]/60 overflow-hidden relative">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#7FA0D6] to-transparent animate-shimmer-slide" />
        </div>

        {sublabel && (
          <p className="text-[10px] text-[#97A0B3]/80 font-medium tracking-wide mt-1">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0B111C] text-[#F8FAFC]">
        {content}
      </div>
    );
  }

  return content;
}

export default CreoLoadingScreen;
