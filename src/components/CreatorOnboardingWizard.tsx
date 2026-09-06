import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Upload,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Award,
  Sparkles,
  FileCheck,
  Check,
  Dumbbell,
  Apple,
  UserCheck,
  Scale,
  FileText,
  Percent,
  Lock,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Card, Badge, Button, Input, ProgressBar } from './ui';
import { submitCreatorOnboardingApi } from '../services/api';

interface CreatorOnboardingWizardProps {
  initialName?: string;
  initialEmail?: string;
  onComplete?: () => void;
  onBack?: () => void;
}

export const CreatorOnboardingWizard: React.FC<CreatorOnboardingWizardProps> = ({
  initialName = 'Coach Marcus',
  initialEmail = 'marcus@example.com',
  onComplete,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // Step 1: Profile State
  const [handle, setHandle] = useState('marcus.vance');
  const [headline, setHeadline] = useState('Olympic Strength & Biomechanics Specialist');
  const [bio, setBio] = useState(
    'Former national powerlifting coach helping trainees break plateaus through bar path analysis and progressive overload blocks.'
  );
  const [yearsExperience, setYearsExperience] = useState('10+');

  // Step 2: Disciplines & Accreditations State
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([
    'Strength & Physique',
    'Hypertrophy',
    'Biomechanics',
  ]);
  const [credentials, setCredentials] = useState<string[]>([
    'CSCS Certified (NSCA)',
    'M.S. Exercise Physiology',
  ]);
  const [customCred, setCustomCred] = useState('');

  // Step 3: Verification Docs (B7)
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(
    'NSCA_CSCS_Certification_MarcusVance.pdf'
  );

  // Step 4: Creator Agreement State (M6/M2)
  const [isAgreementChecked, setIsAgreementChecked] = useState<boolean>(false);
  const [agreementAcceptedAt, setAgreementAcceptedAt] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDisciplines = [
    { id: 'Strength & Physique', label: 'Strength & Physique', icon: Dumbbell },
    { id: 'Hypertrophy', label: 'Hypertrophy & Bodybuilding', icon: Dumbbell },
    { id: 'Biomechanics', label: 'Barbell Biomechanics', icon: Sparkles },
    { id: 'Metabolic Nutrition', label: 'Metabolic Nutrition & Recomp', icon: Apple },
    { id: 'Clinical Skincare', label: 'Clinical Skincare & Acne', icon: Sparkles },
    { id: 'Posture & Alignment', label: 'Posture & Spine Alignment', icon: UserCheck },
    { id: 'Fat Loss', label: 'Sustainable Fat Loss', icon: Scale },
  ];

  const toggleDiscipline = (disc: string) => {
    setSelectedDisciplines((prev) =>
      prev.includes(disc) ? prev.filter((d) => d !== disc) : [...prev, disc]
    );
  };

  const handleAddCredential = () => {
    if (customCred.trim() && !credentials.includes(customCred.trim())) {
      setCredentials((prev) => [...prev, customCred.trim()]);
      setCustomCred('');
    }
  };

  const handleRemoveCredential = (cred: string) => {
    setCredentials((prev) => prev.filter((c) => c !== cred));
  };

  const handleToggleAgreement = (checked: boolean) => {
    setIsAgreementChecked(checked);
    if (checked && !agreementAcceptedAt) {
      setAgreementAcceptedAt(new Date().toISOString());
    }
  };

  // Step 5: Submit Onboarding to B7 API
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitCreatorOnboardingApi({
        creatorId: 'creator-marcus',
        handle,
        headline,
        bio,
        yearsExperience,
        specialtyTags: selectedDisciplines,
        credentials,
        docFileName: uploadedDocName || undefined,
        agreementAccepted: isAgreementChecked,
        agreementAcceptedAt: agreementAcceptedAt || new Date().toISOString(),
      });

      if (onComplete) onComplete();
    } catch (err) {
      console.debug('Error during onboarding submit', err);
      if (onComplete) onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32">
      
      {/* Top Wizard Navigation */}
      <div className="border-b border-white/[0.08] bg-[#16171A] py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={currentStep > 1 ? () => setCurrentStep((s) => s - 1) : onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
            <span>{currentStep > 1 ? 'Previous Step' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6E8B6F]" />
            <span className="text-xs font-bold text-[#F7F4EF]">
              Creator Verification Onboarding
            </span>
          </div>

          <span className="text-xs font-mono text-[#B8703F] font-bold">
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Global Onboarding Progress Bar */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <ProgressBar
            value={progressPercent}
            variant="copper"
            size="sm"
          />
        </div>
      </div>

      {/* Main Wizard Step Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <AnimatePresence mode="wait">
          
          {/* ========================================================================= */}
          {/* STEP 1: CREATOR PROFILE & IDENTITY */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Badge variant="copper" size="sm">
                  Step 1: Identity & Dossier
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] mt-1">
                  Tell us about your coaching expertise
                </h1>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 font-normal">
                  This public profile dossier is displayed to prospective clients on your Universifit storefront.
                </p>
              </div>

              <Card variant="charcoal" className="p-6 sm:p-8 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5">
                
                {/* Full Name & Handle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={initialName}
                    disabled
                    helperText={`Registered with: ${initialEmail}`}
                  />

                  <Input
                    label="Creator Public Handle (@handle)"
                    placeholder="e.g. marcus.vance"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                  />
                </div>

                {/* Professional Headline */}
                <Input
                  label="Headline / Core Discipline"
                  placeholder="e.g. Olympic Strength & Biomechanics Specialist"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  required
                />

                {/* Years Experience Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#F7F4EF]/70">
                    Years of Active Coaching Experience
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['1-3 yrs', '3-5 yrs', '5-10 yrs', '10+ yrs'].map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setYearsExperience(exp)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          yearsExperience === exp
                            ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                            : 'bg-white/[0.03] text-[#F7F4EF]/70 border-white/10'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coaching Philosophy Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#F7F4EF]/80">
                    Coaching Philosophy & Methodology Bio
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe how you tailor periodized training, dietary adherence, or clinical routines for your clients..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#121315] text-xs text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] focus:ring-2 focus:ring-[#B8703F] rounded-xl p-3.5 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Disciplines
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: SPECIALTY DISCIPLINES & ACCREDITATIONS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Badge variant="copper" size="sm">
                  Step 2: Disciplines & Accreditations
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] mt-1">
                  Tag your specialties and certifications
                </h1>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 font-normal">
                  Universifit matches buyers by goal based on your verified discipline tags.
                </p>
              </div>

              <Card variant="charcoal" className="p-6 sm:p-8 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
                
                {/* Specialty Chips Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase tracking-wider block">
                    Select Specialty Disciplines
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availableDisciplines.map((disc) => {
                      const isSelected = selectedDisciplines.includes(disc.id);
                      const IconComp = disc.icon;

                      return (
                        <button
                          key={disc.id}
                          type="button"
                          onClick={() => toggleDiscipline(disc.id)}
                          className={`p-3 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F] font-bold'
                              : 'bg-white/[0.03] text-[#F7F4EF]/70 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <IconComp className="w-4 h-4 shrink-0" />
                            <span>{disc.label}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#B8703F]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accreditations & Certifications List */}
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase tracking-wider block">
                    Accreditations & Degree Background
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {credentials.map((cred) => (
                      <span
                        key={cred}
                        className="px-3 py-1.5 rounded-xl bg-[#6E8B6F]/15 text-[#6E8B6F] border border-[#6E8B6F]/30 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{cred}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCredential(cred)}
                          className="hover:text-white ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Custom Credential */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add credential (e.g. CISSN Sports Nutritionist, Stanford M.D.)..."
                      value={customCred}
                      onChange={(e) => setCustomCred(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCredential();
                        }
                      }}
                      className="flex-1 bg-[#121315] text-xs text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] rounded-xl px-3.5 py-2.5 focus:outline-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleAddCredential}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(3)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Document Upload
                  </Button>
                </div>

              </Card>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: UPLOAD VERIFICATION ACCREDITATION DOCS (B7: POST /verification-docs) */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Badge variant="verified" size="sm">
                  Step 3: Verification Audit (B7)
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] mt-1">
                  Upload accreditation & identity proof
                </h1>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 font-normal">
                  Universifit streams verification files directly to secure S3/Cloudflare R2 storage for administrative review.
                </p>
              </div>

              <Card variant="charcoal" className="p-6 sm:p-8 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6 text-center">
                
                {/* Drag and drop upload zone */}
                <div
                  onClick={() => setUploadedDocName('NSCA_CSCS_Certification_MarcusVance.pdf')}
                  className="p-8 sm:p-10 rounded-3xl border-2 border-dashed border-[#B8703F]/40 bg-[#B8703F]/5 hover:bg-[#B8703F]/10 transition-colors space-y-3 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/20 text-[#B8703F] mx-auto flex items-center justify-center shadow-md">
                    <Upload className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-[#F7F4EF]">
                      Upload Degree, NSCA / CISSN Certificate or Govt ID
                    </h3>
                    <p className="text-xs text-[#F7F4EF]/60 mt-1 max-w-sm mx-auto">
                      Supports PDF, PNG, JPEG up to 15MB. Encrypted and accessible solely by administrative compliance auditors.
                    </p>
                  </div>

                  <span className="inline-block px-3 py-1 bg-white/[0.08] rounded-full text-xs font-semibold text-white">
                    Select File from Device
                  </span>
                </div>

                {/* Uploaded Document Pill */}
                {uploadedDocName && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#6E8B6F]/30 flex items-center justify-between text-xs text-left">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-[#6E8B6F] shrink-0" />
                      <div>
                        <span className="font-bold text-[#F7F4EF] block truncate max-w-xs">
                          {uploadedDocName}
                        </span>
                        <span className="text-[10px] text-[#6E8B6F] font-semibold">
                          Ready for S3 / Cloudflare R2 Streaming
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-[#6E8B6F] font-bold">Uploaded ✓</span>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(4)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Creator Agreement
                  </Button>
                </div>

              </Card>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: CREATOR AGREEMENT (M6/M2: REVENUE SHARE, IP, REFUND, CONDUCT) */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Badge variant="copper" size="sm">
                  Step 4: Creator Terms & Revenue Share Agreement
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] mt-1">
                  Universifit Creator Terms of Service
                </h1>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 font-normal">
                  Review the revenue share schedule, refund liabilities, content ownership rights, and professional conduct policy before launching your studio.
                </p>
              </div>

              <Card variant="charcoal" className="p-6 sm:p-8 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
                
                {/* 4 Legal Clauses Container */}
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  
                  {/* Clause 1: Revenue Share */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-[#B8703F]/20 text-[#B8703F]">
                        <Percent className="w-4 h-4" />
                      </div>
                      <span>1. Revenue Share & Escrow Payouts (85% Creator / 15% Platform)</span>
                    </div>
                    <p className="text-xs text-[#F7F4EF]/75 leading-relaxed pl-7">
                      The Creator receives <strong>85% of Gross Merchandise Value (GMV)</strong> on all course sales, 1-on-1 coaching consultations, and community memberships. Universifit retains a <strong>15% platform and payment infrastructure fee</strong>. Net creator earnings are disbursed automatically on a rolling 7-day escrow schedule to your verified bank account or UPI ID configured in Payout Settings.
                    </p>
                  </div>

                  {/* Clause 2: Refund Liability */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <span>2. Refund Liability & Chargeback Protocol</span>
                    </div>
                    <p className="text-xs text-[#F7F4EF]/75 leading-relaxed pl-7">
                      Universifit maintains a mandatory <strong>14-day student satisfaction guarantee</strong> for on-demand courses and a <strong>24-hour rescheduling window</strong> for 1-on-1 calls. In the event of unfulfilled coaching bookings, missed video sessions, or legitimate buyer dispute claims, the associated refund liability will be debited from your upcoming rolling escrow payout balance.
                    </p>
                  </div>

                  {/* Clause 3: IP Retention */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-[#6E8B6F]/20 text-[#6E8B6F]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span>3. 100% Intellectual Property & Content Ownership</span>
                    </div>
                    <p className="text-xs text-[#F7F4EF]/75 leading-relaxed pl-7">
                      You retain <strong>100% exclusive copyright and ownership</strong> over all video masterclasses, curriculum assets, PDF protocols, and coaching methodologies uploaded to the platform. You grant Universifit a limited, revocable, non-exclusive license strictly necessary to host, transcode (via Cloudflare/Mux), and stream content to authorized paying students.
                    </p>
                  </div>

                  {/* Clause 4: Conduct Policy */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>4. Professional Conduct & Evidence-Based Guidelines</span>
                    </div>
                    <p className="text-xs text-[#F7F4EF]/75 leading-relaxed pl-7">
                      All creators must adhere to accredited ethical coaching standards (e.g. NSCA, CSCS, CISSN, Registered Dietitian, Physical Therapy licensure). The prescription of unapproved prescription pharmaceuticals, anabolic compounds, or dangerous extreme caloric protocols is strictly prohibited and results in immediate profile revocation and escrow forfeiture.
                    </p>
                  </div>

                </div>

                {/* Agreement Checkbox & Live Digital Signature */}
                <div className="pt-4 border-t border-white/[0.08] space-y-3">
                  <label
                    onClick={() => handleToggleAgreement(!isAgreementChecked)}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition-all cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isAgreementChecked}
                      onChange={(e) => handleToggleAgreement(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/30 text-[#B8703F] focus:ring-[#B8703F] focus:ring-offset-0 bg-[#121315] cursor-pointer"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-white block">
                        I have read, understand, and agree to the Universifit Creator Terms of Service, 85/15 Revenue Share Schedule, Refund Liabilities, and Conduct Guidelines.
                      </span>
                      <span className="text-[11px] text-[#F7F4EF]/50 block">
                        Acceptance is legally binding and recorded on your immutable Creator Profile before offer publishing is enabled.
                      </span>
                    </div>
                  </label>

                  {/* Live Signature Pill */}
                  {isAgreementChecked ? (
                    <div className="p-3 rounded-xl bg-[#6E8B6F]/10 border border-[#6E8B6F]/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#6E8B6F] font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Digitally signed by <strong>{initialName}</strong> (@{handle})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#F7F4EF]/60">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • Verified
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Checkbox acceptance is required before you can publish offers or launch your studio.</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(3)}
                  >
                    Back to Documents
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    disabled={!isAgreementChecked}
                    onClick={() => setCurrentStep(5)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Final Review
                  </Button>
                </div>

              </Card>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: VERIFICATION REVIEW & LAUNCH STUDIO */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-display font-bold text-[#F7F4EF]">
                  Onboarding Dossier Ready for Review
                </h1>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 max-w-md mx-auto">
                  Your creator storefront and agreement credentials will be recorded in your Creator Studio.
                </p>
              </div>

              <Card variant="charcoal" className="p-6 sm:p-8 bg-[#16171A] border-white/[0.08] shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">
                      {initialName}
                    </h3>
                    <span className="text-xs text-[#B8703F] font-mono">@{handle}</span>
                  </div>

                  <Badge variant="copper" size="sm">
                    Status: PENDING AUDIT (B7)
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                    <span className="text-[#F7F4EF]/50 uppercase font-bold text-[10px]">
                      Headline
                    </span>
                    <p className="font-semibold text-white">{headline}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                    <span className="text-[#F7F4EF]/50 uppercase font-bold text-[10px]">
                      Experience
                    </span>
                    <p className="font-semibold text-white">{yearsExperience} Active Trainees</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#F7F4EF]/50 uppercase font-bold text-[10px]">
                    Tagged Disciplines
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedDisciplines.map((d) => (
                      <span key={d} className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-white">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Creator Agreement Status Row */}
                <div className="p-3.5 rounded-2xl bg-[#6E8B6F]/10 border border-[#6E8B6F]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#6E8B6F]" />
                    <div>
                      <span className="font-bold text-white block">
                        Creator Terms of Service Accepted
                      </span>
                      <span className="text-[10px] text-[#6E8B6F]">
                        85% Revenue Share • 100% IP Retained • Conduct Compliant
                      </span>
                    </div>
                  </div>
                  <Badge variant="verified" size="sm">
                    Agreed & Signed ✓
                  </Badge>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.08]">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(4)}
                  >
                    Edit Agreement
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleFinalSubmit}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Submit Verification & Launch Studio
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
