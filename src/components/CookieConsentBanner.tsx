import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
  Cookie,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  getCookieConsent,
  saveCookieConsent,
} from '../services/analytics';

interface CookieConsentBannerProps {
  onNavigateStatic?: (page: 'privacy' | 'terms' | 'refund-policy' | 'contact') => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onNavigateStatic }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState<boolean>(false);
  const [functionalAllowed, setFunctionalAllowed] = useState<boolean>(true);

  useEffect(() => {
    // Check if user has already made a consent choice
    const consent = getCookieConsent();
    if (!consent) {
      // Small delay before showing banner for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setAnalyticsAllowed(consent.analytics);
      setFunctionalAllowed(consent.functional);
    }

    // Listen for custom event to re-open consent preferences (e.g. from footer or settings)
    const handleReopen = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalyticsAllowed(current.analytics);
        setFunctionalAllowed(current.functional);
      }
      setIsCustomizing(true);
      setIsVisible(true);
    };

    window.addEventListener('open_cookie_preferences', handleReopen);
    return () => window.removeEventListener('open_cookie_preferences', handleReopen);
  }, []);

  const handleAcceptAll = () => {
    saveCookieConsent({
      essential: true,
      analytics: true,
      functional: true,
    });
    setIsVisible(false);
  };

  const handleRejectOptional = () => {
    saveCookieConsent({
      essential: true,
      analytics: false,
      functional: false,
    });
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    saveCookieConsent({
      essential: true,
      analytics: analyticsAllowed,
      functional: functionalAllowed,
    });
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie and Privacy Consent"
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 pointer-events-auto"
        >
          <div className="bg-[#14161A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 text-white space-y-4 font-sans">
            {/* Top Bar: Icon + Title */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    Privacy & Cookie Preferences
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      IT Rules 2011 / DPDP Act
                    </span>
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/60">
                    Compliant with Indian Digital Personal Data Protection standards
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRejectOptional}
                aria-label="Close and use essential cookies only"
                className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanatory Body */}
            <p className="text-xs text-[#F7F4EF]/80 leading-relaxed">
              Ascend uses strictly necessary cookies to keep you signed in, verify Razorpay payments, and secure your session.
              With your consent, we also utilize cookieless, privacy-first telemetry to understand platform traffic and improve coach curriculum.
              We never sell your data or deploy third-party advertising trackers.
            </p>

            {/* Custom Preferences Accordion */}
            {isCustomizing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-white/10 text-xs"
              >
                {/* 1. Essential */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Lock className="w-3.5 h-3.5 text-[#B8703F]" />
                      <span>Strictly Necessary (Essential)</span>
                    </div>
                    <p className="text-[11px] text-[#F7F4EF]/60 leading-normal">
                      Required for JWT authentication, CSRF defense, and Razorpay checkout encryption. Cannot be disabled.
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono uppercase px-2 py-1 rounded bg-white/10 text-white/70">
                    Always Active
                  </span>
                </div>

                {/* 2. Analytics */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Analytics & Performance</span>
                    </div>
                    <p className="text-[11px] text-[#F7F4EF]/60 leading-normal">
                      Measures anonymous route views, checkout completion rates, and learning progression in cookieless mode.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle Analytics and Performance cookies"
                    />
                    <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B8703F]"></div>
                  </label>
                </div>

                {/* 3. Functional */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Functional Preferences</span>
                    </div>
                    <p className="text-[11px] text-[#F7F4EF]/60 leading-normal">
                      Remembers volume levels, video playback speed, and coach discovery filter selections.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={functionalAllowed}
                      onChange={(e) => setFunctionalAllowed(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle Functional Preferences cookies"
                    />
                    <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B8703F]"></div>
                  </label>
                </div>

                {/* Indian IT Rules Grievance Officer Notice */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Grievance Redressal:</strong> In accordance with the IT Rules 2011 & DPDP Act 2023, queries or complaints regarding personal data should be directed to our Grievance Officer at{' '}
                    <a href="mailto:grievance@ascend.fit" className="underline font-mono text-white hover:text-amber-300">
                      grievance@ascend.fit
                    </a>.
                  </span>
                </div>
              </motion.div>
            )}

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsCustomizing(!isCustomizing)}
                className="text-xs text-[#F7F4EF]/60 hover:text-white transition-colors flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#B8703F]" />
                <span>{isCustomizing ? 'Hide Options' : 'Customize Preferences'}</span>
                {isCustomizing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {isCustomizing ? (
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#B8703F] text-white hover:bg-[#a66234] transition-colors shadow-sm cursor-pointer"
                  >
                    Save Preferences
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleRejectOptional}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white/90 transition-colors cursor-pointer"
                    >
                      Reject Optional
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptAll}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#B8703F] text-white hover:bg-[#a66234] transition-colors shadow-sm cursor-pointer"
                    >
                      Accept All
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Legal Links Footer */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#F7F4EF]/40">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateStatic && onNavigateStatic('privacy')}
                  className="hover:text-white transition-colors underline cursor-pointer"
                >
                  Privacy Policy
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onNavigateStatic && onNavigateStatic('refund-policy')}
                  className="hover:text-white transition-colors underline cursor-pointer"
                >
                  Refund Policy
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onNavigateStatic && onNavigateStatic('terms')}
                  className="hover:text-white transition-colors underline cursor-pointer"
                >
                  Terms
                </button>
              </div>
              <span>Ascend Platform India</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
