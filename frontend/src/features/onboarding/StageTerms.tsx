import { motion } from "motion/react";
/**
 * Stage 2 — MSA (Master Service Agreement) acceptance.
 *
 * The Accept button is DISABLED until the user has scrolled to the bottom
 * of the agreement text. Real-time scroll listener and IntersectionObserver
 * on sentinel ensure strict enforcement.
 */
import { useCallback, useRef, useState, useEffect } from "react";
import { Clock, Check, FileText, ChevronRight, Lock, ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

interface StageTermsProps {
  userId: string;
  onAccepted: () => void;
  onBack?: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

const MSA_TEXT = `MASTER SERVICE AGREEMENT — CREO DIGITAL AGENCY

Last updated: January 2025

This Master Service Agreement ("Agreement") is entered into between Creo Digital
Agency Pvt. Ltd. ("Agency") and the Client identified during registration.

1. SCOPE OF SERVICES
   Agency will provide digital marketing services as described in the selected
   subscription plan, including but not limited to social media content creation,
   brand identity development, and creative campaign management.

2. PAYMENT TERMS
   Client agrees to pay the subscription fee as selected during onboarding.
   Payments are due on the first day of each billing cycle. A grace period of
   7 days applies before service suspension.

3. INTELLECTUAL PROPERTY
   Upon full payment, all original creative assets produced by Agency for Client
   are assigned to Client. Agency retains the right to display the work in its
   portfolio unless Client requests otherwise in writing.

4. REVISION POLICY
   The number of revision rounds per deliverable is determined by the selected
   plan (1 round for Starter, 2 for Growth, 3 for Enterprise). Revisions must
   be requested within 5 business days of delivery.

5. CONFIDENTIALITY
   Both parties agree to keep confidential any proprietary information shared
   during the engagement. This obligation survives termination of this Agreement.

6. TERMINATION
   Either party may terminate this Agreement with 30 days written notice.
   No refunds are issued for the current billing cycle upon termination.

7. LIMITATION OF LIABILITY
   Agency's total liability under this Agreement shall not exceed the total fees
   paid by Client in the 3 months preceding the event giving rise to the claim.

8. GOVERNING LAW
   This Agreement shall be governed by the laws of the Republic of India,
   and disputes shall be subject to the exclusive jurisdiction of courts in
   Mumbai, Maharashtra.

9. AMENDMENTS
   Agency may update this Agreement with 30 days' notice. Continued use of
   services after notice constitutes acceptance of the updated terms.

10. ENTIRE AGREEMENT
    This Agreement constitutes the entire agreement between the parties and
    supersedes all prior discussions and agreements relating to its subject matter.

By clicking "Accept Agreement & Continue to Payment", you acknowledge that you have read,
understood, and agree to be bound by this Master Service Agreement.

— End of Agreement —`;

export function StageTerms({ onAccepted, onBack, isSubmitting, error }: StageTermsProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    const el = scrollElementRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setHasScrolled(true);
      return;
    }
    const current = Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100)));
    setScrollProgress(current);
    if (current >= 95) {
      setHasScrolled(true);
    }
  };

  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    scrollElementRef.current = node;
    if (!node) return;

    // Create observer targeting sentinel at the bottom of agreement
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasScrolled(true);
          setScrollProgress(100);
          observerRef.current?.disconnect();
        }
      },
      { root: node, threshold: 0.8 },
    );
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Summary & Requirements */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="rounded-2xl border border-[#2A3446] bg-[#161F2D] p-6 sm:p-7 shadow-xl h-full flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7FA0D6]/20 border border-[#7FA0D6]/30 text-[#BCCCE6] text-[11px] font-bold uppercase tracking-wider mb-4 shadow-sm w-fit">
                Step 2 of 5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight mb-2">
                Master Service Agreement
              </h2>
              <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
                Please review the terms of service below. Scroll to the bottom of the agreement to unlock the acceptance button.
              </p>

              <div className="rounded-xl border border-[#2A3446] bg-[#0B111C] p-4 mb-6">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#2A3446]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <FileText className="w-4 h-4 text-[#7FA0D6]" />
                    Document Highlights
                  </div>
                  <div className="text-[11px] font-bold text-[#94A3B8] bg-[#161F2D] border border-[#2A3446] px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-[#7FA0D6]" /> Enforced
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-[#161F2D] border border-[#2A3446] p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-white">01. Scope of Services</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">Content creation, identity, campaigns</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#7FA0D6] shrink-0" />
                  </div>
                  <div className="flex items-center justify-between bg-[#161F2D] border border-[#2A3446] p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-white">02. Payment Terms</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">Billing cycles & 7-day grace period</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#7FA0D6] shrink-0" />
                  </div>
                  <div className="flex items-center justify-between bg-[#161F2D] border border-[#2A3446] p-3 rounded-lg">
                    <div>
                      <p className="text-xs font-semibold text-white">03. Intellectual Property</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">Full ownership assigned on payment</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#7FA0D6] shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Read status condition indicator */}
            {!hasScrolled ? (
              <div className="bg-[#D8BF9B]/10 border border-[#D8BF9B]/30 rounded-xl p-4 flex items-start gap-3 mt-4">
                <Clock className="w-5 h-5 text-[#D8BF9B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#D8BF9B]">Reading in progress ({scrollProgress}%)</p>
                  <p className="text-xs text-[#D8BF9B]/80 font-medium mt-0.5">Scroll through the document on the right to unlock acceptance</p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex items-start gap-3 mt-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Reading condition satisfied (100%)</p>
                  <p className="text-xs text-emerald-300/80 font-medium mt-0.5">You can now proceed to accept and continue to payment</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Document Viewer */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-2xl border border-[#2A3446] bg-[#161F2D] p-6 sm:p-7 shadow-xl flex flex-col h-full relative overflow-hidden">
            
            {/* Document Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2A3446]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B111C] flex items-center justify-center text-[#7FA0D6] shrink-0 border border-[#2A3446]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">creo_master_agreement_2026.pdf</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">Standard Legal Terms • Rev 2026.01</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 w-36">
                <div className="flex-1 h-2 bg-[#0B111C] border border-[#2A3446] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7FA0D6] transition-all duration-200"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#BCCCE6] w-9 text-right">
                  {scrollProgress}%
                </span>
              </div>
            </div>

            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-[380px] h-[52vh] max-h-[580px] overflow-y-auto bg-[#0B111C] border border-[#2A3446] rounded-xl p-6 sm:p-7 font-mono text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap select-text scroll-smooth shadow-inner"
            >
              {MSA_TEXT}
              {/* IntersectionObserver sentinel */}
              <div ref={sentinelRef} className="h-1 mt-6" aria-hidden="true" />
            </div>

            {/* Completion Banner under document */}
            {hasScrolled && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-4 py-2.5 rounded-xl flex items-center gap-2 mt-4"
              >
                <div className="size-4 rounded-full bg-emerald-500 text-[#0B111C] flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Agreement scrolled and reviewed. Acceptance is unlocked.</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm font-medium text-rose-300">
          {error}
        </div>
      )}

      {/* FOOTER ACTIONS BAR */}
      <div className="rounded-2xl border border-[#2A3446] bg-[#161F2D] p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#0B111C] border border-[#2A3446] text-sm font-bold text-[#94A3B8] hover:text-white hover:border-[#7FA0D6] shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Step 1</span>
          </button>
        ) : <div />}

        <button
          id="accept-terms-btn"
          type="button"
          onClick={onAccepted}
          disabled={!hasScrolled || isSubmitting}
          className={`w-full sm:w-auto min-w-[280px] py-3 px-8 rounded-xl font-bold text-sm transition-all shadow-md inline-flex items-center justify-center gap-2 ${
            hasScrolled && !isSubmitting
              ? "bg-[#BCCCE6] text-[#0B111C] cursor-pointer hover:bg-white shadow-[#BCCCE6]/20"
              : "bg-[#161F2D] text-[#64748B] border border-[#2A3446] cursor-not-allowed shadow-none"
          }`}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>{isSubmitting ? "Accepting terms…" : "Accept Agreement & Continue to Payment"}</span>
          {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </motion.div>
  );
}

export default StageTerms;
