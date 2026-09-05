import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  RefreshCw,
  Mail,
  ChevronLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Lock,
  HeartPulse,
  Send,
  Building2,
  MapPin,
  AlertCircle,
} from 'lucide-react';

export type StaticPageType = 'privacy' | 'terms' | 'refund-policy' | 'contact';

interface StaticPagesProps {
  initialPage: StaticPageType;
  onBackHome: () => void;
  onSelectPage: (page: StaticPageType) => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({
  initialPage,
  onBackHome,
  onSelectPage,
}) => {
  const [activePage, setActivePage] = useState<StaticPageType>(initialPage);

  // Contact form states
  const [contactCategory, setContactCategory] = useState('Buyer Support & Booking Inquiries');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactOrderId, setContactOrderId] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleTabChange = (page: StaticPageType) => {
    setActivePage(page);
    onSelectPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) return;

    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSubmitted(true);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans flex flex-col justify-between selection:bg-[#B8703F] selection:text-white">
      {/* Top Breadcrumb & Navigation Bar */}
      <header className="border-b border-white/[0.08] bg-[#16171A] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
              <span>Back to Marketplace</span>
            </button>
            <div className="h-5 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-mono text-[#F7F4EF]/40">Legal & Governance</span>
            </div>
          </div>

          {/* Quick Page Selector Tabs */}
          <nav className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/[0.06] overflow-x-auto max-w-[550px]">
            <button
              onClick={() => handleTabChange('privacy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'privacy'
                  ? 'bg-[#B8703F] text-white shadow-sm'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => handleTabChange('terms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'terms'
                  ? 'bg-[#B8703F] text-white shadow-sm'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms</span>
            </button>
            <button
              onClick={() => handleTabChange('refund-policy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'refund-policy'
                  ? 'bg-[#B8703F] text-white shadow-sm'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refund Policy</span>
            </button>
            <button
              onClick={() => handleTabChange('contact')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activePage === 'contact'
                  ? 'bg-[#B8703F] text-white shadow-sm'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* 1. PRIVACY POLICY PAGE                                   */}
          {/* ========================================================= */}
          {activePage === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#d48b59] text-xs font-bold font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>DATA GOVERNANCE & TELEMETRY</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  Privacy & Health Data Usage Policy
                </h1>
                <p className="text-sm text-[#F7F4EF]/60 leading-relaxed max-w-3xl">
                  Effective Date: January 1, 2026. This policy governs how Ascend Coaching Inc. collects, protects, isolates, and limits the processing of your personal information, physique check-in media, and biometric records across our global fitness marketplace.
                </p>
              </div>

              {/* Callout: Strict Data Isolation */}
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-[#6E8B6F]/40 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#6E8B6F]/20 text-[#6E8B6F] flex items-center justify-center shrink-0 mt-0.5">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <h3 className="font-bold text-white text-base">
                    Our Core Promise: Zero AI Model Training on Private Media
                  </h3>
                  <p className="text-[#F7F4EF]/70 leading-relaxed">
                    Ascend explicitly guarantees that your physique check-in photos, DEXA scans, lifting mechanics recordings, and direct chat consultations with coaches are <span className="text-white font-semibold underline decoration-[#6E8B6F]">never sold, never leased to data brokers, and never used to train commercial generative AI or computer vision models</span> without your explicit, auditable opt-in.
                  </p>
                </div>
              </div>

              {/* Section 1: Data We Collect */}
              <section className="space-y-4">
                <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#B8703F] font-mono text-base">01.</span>
                  <span>Categories of Information We Collect</span>
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-5 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-2">
                    <h3 className="font-bold text-white">Biometric & Physiological Telemetry</h3>
                    <p className="text-[#F7F4EF]/60 leading-relaxed">
                      Self-reported body mass, resting heart rate, caloric targets, macros, hormonal panels, and dietary allergies voluntarily submitted to your coach for personalized program design.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-2">
                    <h3 className="font-bold text-white">Physique & Movement Media</h3>
                    <p className="text-[#F7F4EF]/60 leading-relaxed">
                      Lifting execution videos (barbell bar paths, posture analysis) and weekly progress check-in photos stored behind encrypted, private temporary URLs with pre-signed access tokens.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-2">
                    <h3 className="font-bold text-white">Identity & Credentials</h3>
                    <p className="text-[#F7F4EF]/60 leading-relaxed">
                      Full legal name, verified email, Google OAuth identifier, and for verified creators, certified diplomas, board licenses, and government identity documentation.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#16171A] border border-white/[0.08] space-y-2">
                    <h3 className="font-bold text-white">Transaction & Billing Records</h3>
                    <p className="text-[#F7F4EF]/60 leading-relaxed">
                      Payment references, order histories, and payout addresses. We partner with PCI-DSS Level 1 payment processors (Razorpay, Stripe); raw credit card credentials never enter Ascend servers.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2: Data Usage & Cryptographic Storage */}
              <section className="space-y-4">
                <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#B8703F] font-mono text-base">02.</span>
                  <span>How We Secure and Store Your Information</span>
                </h2>
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-4 text-xs sm:text-sm text-[#F7F4EF]/70 leading-relaxed">
                  <p>
                    All health records, direct messages, and private client spreadsheets are encrypted at rest using <strong className="text-white">AES-256</strong> and transmitted across public networks using <strong className="text-white">TLS 1.3</strong> protocols.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-white">Scoped Access Delegation:</strong> Your chosen coach is the only non-administrative party authorized to view your uploaded progress photos and diet sheets.
                    </li>
                    <li>
                      <strong className="text-white">Revocation of Access:</strong> Upon termination of a coaching relationship, you may revoke coach access to historical check-in photo galleries at any moment from your My Space settings.
                    </li>
                    <li>
                      <strong className="text-white">Right to Erasure (GDPR Art. 17):</strong> Submitting an erasure request via <code className="text-[#B8703F] bg-white/[0.05] px-1.5 py-0.5 rounded">privacy@ascend.io</code> initiates complete permanent scrubbing of your image vaults within 30 days.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3: Third-Party Disclosures */}
              <section className="space-y-4">
                <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#B8703F] font-mono text-base">03.</span>
                  <span>Third-Party Sub-Processors</span>
                </h2>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#16171A]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#F7F4EF]/50 font-mono">
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4">Role & Purpose</th>
                        <th className="py-3 px-4">Jurisdiction & Safeguard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-[#F7F4EF]/70">
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">Stripe / Razorpay</td>
                        <td className="py-3 px-4">Payment gateway tokenization & creator payouts</td>
                        <td className="py-3 px-4">PCI-DSS Level 1 / SOC 2</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">AWS S3 (Private Vault)</td>
                        <td className="py-3 px-4">Server-side encrypted video and photo storage</td>
                        <td className="py-3 px-4">AES-256 / ISO 27001</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold text-white">PostgreSQL via Prisma</td>
                        <td className="py-3 px-4">Transactional relational database (bookings & credentials)</td>
                        <td className="py-3 px-4">Strict RBAC / VPC Isolated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 2. TERMS OF SERVICE PAGE                                 */}
          {/* ========================================================= */}
          {activePage === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#d48b59] text-xs font-bold font-mono">
                  <FileText className="w-3.5 h-3.5" />
                  <span>MARKETPLACE RULES & COMMISSION</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  Marketplace Terms of Service & Creator Agreement
                </h1>
                <p className="text-sm text-[#F7F4EF]/60 leading-relaxed max-w-3xl">
                  Last Updated: January 1, 2026. These Terms govern marketplace transactions, user behavior, creator verification obligations, and our binding creator commission payout structure.
                </p>
              </div>

              {/* Medical Disclaimer Banner */}
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm text-amber-200/80">
                  <h3 className="font-bold text-white text-sm">
                    Medical & Physical Exercise Advisory
                  </h3>
                  <p className="leading-relaxed">
                    Ascend is a technology marketplace connecting independent fitness and wellness practitioners with clients. Coaches on Ascend do not provide medical diagnosis, prescribe pharmaceutical medications, or replace emergency healthcare. Always consult a licensed physician prior to commencing high-intensity strength training or aggressive caloric restriction.
                  </p>
                </div>
              </div>

              {/* Creator Payout Terms (F4 Core Requirement) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                    <span className="text-[#B8703F] font-mono text-base">01.</span>
                    <span>Creator Economics & Payout Terms</span>
                  </h2>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 font-bold">
                    85% Coach Split
                  </span>
                </div>

                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-6 text-xs sm:text-sm">
                  <p className="text-[#F7F4EF]/70 leading-relaxed">
                    Ascend provides verified coaches with client discovery, payment processing, intake forms, and automated video course delivery. In return, transactions are governed by the following commercial schedule:
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                      <div className="text-[11px] font-mono uppercase text-[#F7F4EF]/50">Commission Split</div>
                      <div className="text-2xl font-bold font-display text-emerald-400">85% / 15%</div>
                      <p className="text-[11px] text-[#F7F4EF]/60">Coach receives 85% of gross booking; Ascend retains 15% marketplace fee.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                      <div className="text-[11px] font-mono uppercase text-[#F7F4EF]/50">Escrow Hold</div>
                      <div className="text-2xl font-bold font-display text-amber-400">48 Hours</div>
                      <p className="text-[11px] text-[#F7F4EF]/60">Consultation revenues hold for 48 hrs post-session to verify client fulfillment.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                      <div className="text-[11px] font-mono uppercase text-[#F7F4EF]/50">Disbursement Cycle</div>
                      <div className="text-2xl font-bold font-display text-[#B8703F]">Weekly</div>
                      <p className="text-[11px] text-[#F7F4EF]/60">Transferred every Tuesday via Stripe Connect or Razorpay Linked Accounts ($50 min).</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-[#F7F4EF]/70">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                      Creator Obligations & Chargeback Liability
                    </h4>
                    <ul className="list-disc pl-5 space-y-2 text-xs">
                      <li>
                        <strong className="text-white">Tax Documentation:</strong> Creators are responsible for submitting applicable tax certificates (Form W-9 for US entities; PAN/GSTIN registration for Indian coaches) before payouts exceed statutory limits.
                      </li>
                      <li>
                        <strong className="text-white">Chargeback Protection:</strong> In the event a client files a payment reversal, Ascend defends creators if proof of delivery (session recording, completed intake sheet, or active chat thread) was established.
                      </li>
                      <li>
                        <strong className="text-white">Platform Exclusivity of In-App Leads:</strong> For clients introduced through Ascend Discover, coaches agree to process all follow-on subscriptions and bookings through Ascend for a 12-month period.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2: Coach Verification Audit */}
              <section className="space-y-4">
                <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#B8703F] font-mono text-base">02.</span>
                  <span>Mandatory Verification Standards</span>
                </h2>
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-3 text-xs sm:text-sm text-[#F7F4EF]/70 leading-relaxed">
                  <p>
                    All practitioners operating under verified status must submit valid documentation evaluated by Ascend Administrators (`PATCH /admin/creators/:id/verify`). Permitted credentials include:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>Accredited Strength Certifications: NSCA-CSCS, USAW Level 1/2, NASM-CPT/CES, ACSM-EP.</li>
                    <li>Clinical & Nutritional Credentials: M.D., Board of Dermatology license, Registered Dietitian (RD/RDN), Master of Science in Exercise Physiology.</li>
                    <li>Liability Insurance: Practitioners must maintain general liability coverage appropriate to their jurisdiction.</li>
                  </ul>
                </div>
              </section>

              {/* Section 3: Intellectual Property */}
              <section className="space-y-4">
                <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#B8703F] font-mono text-base">03.</span>
                  <span>Intellectual Property & Course Ownership</span>
                </h2>
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] text-xs sm:text-sm text-[#F7F4EF]/70 leading-relaxed">
                  Coaches retain 100% copyright over their self-authored video lessons, training routines, and proprietary nutrition spreadsheets. By publishing on Ascend, creators grant Ascend a worldwide, non-exclusive license to host, stream, and market the content to registered students.
                </div>
              </section>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 3. REFUND POLICY PAGE                                    */}
          {/* ========================================================= */}
          {activePage === 'refund-policy' && (
            <motion.div
              key="refund-policy"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>FAIR CLIENT & CREATOR GUARANTEE</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  Buyer Protection & Refund Policy
                </h1>
                <p className="text-sm text-[#F7F4EF]/60 leading-relaxed max-w-3xl">
                  Our refund framework balances genuine client satisfaction with fair compensation for coach labor, specialized knowledge, and reserved calendar time.
                </p>
              </div>

              {/* Service Type Breakdown Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* 1. Live 1-on-1 Consultations */}
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Live 1-on-1 Consultations</h3>
                    <p className="text-xs text-[#F7F4EF]/60 leading-relaxed">
                      Applies to 60-min video assessments, biomechanics audits, and nutrition deep-dives.
                    </p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>&gt; 48 Hours Notice:</span>
                      <span>100% Full Refund</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-300 font-semibold">
                      <span>24–48 Hours Notice:</span>
                      <span>50% Partial Refund</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-400 font-medium">
                      <span>&lt; 24 Hours / No-Show:</span>
                      <span>Non-Refundable</span>
                    </div>
                  </div>
                </div>

                {/* 2. On-Demand Digital Courses */}
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Digital Video Courses</h3>
                    <p className="text-xs text-[#F7F4EF]/60 leading-relaxed">
                      Self-paced video modules, exercise demonstrations, and curriculum libraries.
                    </p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>14-Day Window:</span>
                      <span>100% Money-Back</span>
                    </div>
                    <p className="text-[11px] text-[#F7F4EF]/60 leading-normal">
                      Valid if buyer has streamed less than 25% of lessons and has not exported proprietary downloadable spreadsheets.
                    </p>
                  </div>
                </div>

                {/* 3. Bespoke Transformation Programs */}
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">Custom Multi-Week Programs</h3>
                    <p className="text-xs text-[#F7F4EF]/60 leading-relaxed">
                      8-week and 12-week high-touch transformation packages with weekly check-ins.
                    </p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Before Plan Delivery:</span>
                      <span>100% Refund</span>
                    </div>
                    <p className="text-[11px] text-[#F7F4EF]/60 leading-normal">
                      Once custom macro targets & personalized workout routines are drafted and delivered, refunds are prorated strictly for unused future weeks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Coach No-Show Guarantee */}
              <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>The Ascend Coach Attendance Guarantee</span>
                </div>
                <p className="text-[#F7F4EF]/70 leading-relaxed">
                  If a verified coach fails to attend a confirmed appointment or does not deliver an agreed-upon initial customized intake protocol within <strong className="text-white">5 business days</strong> of payment, the buyer is entitled to an immediate <strong className="text-white">100% automatic refund</strong> or re-credit to their Ascend wallet, at their choice.
                </p>
              </div>

              {/* How to initiate a refund */}
              <section className="space-y-4">
                <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-[#B8703F] font-mono text-base">01.</span>
                  <span>How to Initiate a Refund Request</span>
                </h2>
                <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-4 text-xs sm:text-sm text-[#F7F4EF]/70 leading-relaxed">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Visit your <strong className="text-white">My Space</strong> dashboard, navigate to the <strong className="text-white">Purchases & Bookings</strong> tab, locate the order, and select <span className="text-[#B8703F] font-semibold">Request Cancellation</span>.
                    </li>
                    <li>
                      Alternatively, send an email to <a href="mailto:refunds@ascend.io" className="text-[#B8703F] underline">refunds@ascend.io</a> including your Order Reference ID (e.g., <code className="bg-white/[0.05] px-1 rounded font-mono">asc_ord_...</code>) and the reason for cancellation.
                    </li>
                    <li>
                      Approved refunds are processed back to the original funding source (credit card, UPI, debit, net banking) within <strong className="text-white">5 to 7 business days</strong>.
                    </li>
                  </ol>
                </div>
              </section>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 4. CONTACT & CONCIERGE PAGE                              */}
          {/* ========================================================= */}
          {activePage === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-white/[0.08]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#d48b59] text-xs font-bold font-mono">
                  <Mail className="w-3.5 h-3.5" />
                  <span>CONCIERGE & SUPPORT</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                  Contact Ascend Support
                </h1>
                <p className="text-sm text-[#F7F4EF]/60 leading-relaxed max-w-3xl">
                  Have a question about a coach booking, platform verification, or enterprise partnerships? Our dedicated support team responds within 12 hours.
                </p>
              </div>

              {/* Two Column: Contact Form & Department Directory */}
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Form Column (Span 7) */}
                <div className="lg:col-span-7">
                  <div className="p-6 sm:p-8 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-xl space-y-6">
                    <div>
                      <h2 className="text-lg font-display font-bold text-white tracking-tight">
                        Send a Direct Inquiry
                      </h2>
                      <p className="text-xs text-[#F7F4EF]/60 mt-1">
                        Fill out the details below and an Ascend concierge specialist will respond to your registered email.
                      </p>
                    </div>

                    {contactSubmitted ? (
                      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                        <h3 className="text-base font-bold text-white">Inquiry Dispatched Successfully</h3>
                        <p className="text-xs text-emerald-200/80 leading-relaxed max-w-md mx-auto">
                          Thank you, {contactName || 'Athlete'}. Ticket confirmation has been logged for <strong className="text-white">{contactEmail}</strong>. Our average response time for {contactCategory} is currently 4 hours.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setContactSubmitted(false);
                            setContactMessage('');
                          }}
                          className="text-xs text-[#B8703F] hover:underline font-semibold cursor-pointer pt-2 block mx-auto"
                        >
                          Submit another inquiry
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                        {/* Category */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#F7F4EF]/70 uppercase tracking-wider text-[10px]">
                            Inquiry Department
                          </label>
                          <select
                            value={contactCategory}
                            onChange={(e) => setContactCategory(e.target.value)}
                            className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#B8703F]"
                          >
                            <option>Buyer Support & Booking Inquiries</option>
                            <option>Coach Verification Audit & Accreditation</option>
                            <option>Billing, Payouts & Refund Escalation</option>
                            <option>Data Usage & Health Privacy Requests</option>
                            <option>Corporate Wellness & Partnerships</option>
                          </select>
                        </div>

                        {/* Name & Email Row */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="font-bold text-[#F7F4EF]/70 uppercase tracking-wider text-[10px]">
                              Your Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Alex Mercer"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500 text-xs focus:outline-none focus:border-[#B8703F]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-bold text-[#F7F4EF]/70 uppercase tracking-wider text-[10px]">
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="alex@example.com"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500 text-xs focus:outline-none focus:border-[#B8703F]"
                            />
                          </div>
                        </div>

                        {/* Order ID Optional */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#F7F4EF]/70 uppercase tracking-wider text-[10px] flex items-center justify-between">
                            <span>Order Reference ID (Optional)</span>
                            <span className="text-neutral-500 lowercase font-normal">if related to booking</span>
                          </label>
                          <input
                            type="text"
                            placeholder="asc_ord_91823"
                            value={contactOrderId}
                            onChange={(e) => setContactOrderId(e.target.value)}
                            className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500 text-xs font-mono focus:outline-none focus:border-[#B8703F]"
                          />
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#F7F4EF]/70 uppercase tracking-wider text-[10px]">
                            Message Description
                          </label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Describe your inquiry or scheduling issue in detail..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500 text-xs focus:outline-none focus:border-[#B8703F]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingContact}
                          className="w-full py-3.5 rounded-full bg-[#B8703F] hover:bg-[#a56234] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingContact ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Dispatching Support Ticket...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Inquiry to Concierge</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Directory Column (Span 5) */}
                <div className="lg:col-span-5 space-y-4 text-xs">
                  {/* Direct Contact Cards */}
                  <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-4">
                    <h3 className="font-bold text-white text-sm">Direct Inboxes</h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="font-bold text-white">General & Buyer Support</div>
                        <a href="mailto:support@ascend.io" className="text-[#B8703F] font-mono hover:underline">
                          support@ascend.io
                        </a>
                        <div className="text-[10px] text-[#F7F4EF]/40 mt-0.5">SLA: &lt; 12 hours response</div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="font-bold text-white">Creator Verification & Audits</div>
                        <a href="mailto:creators@ascend.io" className="text-[#B8703F] font-mono hover:underline">
                          creators@ascend.io
                        </a>
                        <div className="text-[10px] text-[#F7F4EF]/40 mt-0.5">SLA: &lt; 24 hours turnaround</div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="font-bold text-white">Billing & Dispute Resolution</div>
                        <a href="mailto:refunds@ascend.io" className="text-[#B8703F] font-mono hover:underline">
                          refunds@ascend.io
                        </a>
                        <div className="text-[10px] text-[#F7F4EF]/40 mt-0.5">Priority routing: &lt; 4 hours</div>
                      </div>
                    </div>
                  </div>

                  {/* Physical HQ & Operations */}
                  <div className="p-6 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#B8703F]" />
                      <span>Corporate Entity</span>
                    </h3>
                    <p className="text-[#F7F4EF]/60 leading-relaxed">
                      <strong className="text-white">Ascend Coaching Technologies Inc.</strong><br />
                      450 Lexington Avenue, Suite 1400<br />
                      New York, NY 10017, United States
                    </p>
                    <div className="pt-2 border-t border-white/[0.06] text-[#F7F4EF]/50 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>APAC Hub: 100 Feet Road, Indiranagar, Bengaluru</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[#F7F4EF]/40 font-mono border-t border-white/[0.06]">
        Ascend Coaching Inc. • Legal & Compliance Documentation
      </footer>
    </div>
  );
};
