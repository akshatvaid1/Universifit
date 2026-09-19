import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { AuthUserData } from '../services/api';
import { openCookiePreferences } from '../services/analytics';

export interface FooterProps {
  currentUser?: AuthUserData | null;
  onNavigateStatic?: (page: 'privacy' | 'terms' | 'refund-policy' | 'contact') => void;
  onNavigateAdmin?: () => void;
  onNavigateHome?: () => void;
  onNavigateDiscover?: (category?: string, search?: string) => void;
  onSelectCourse?: (courseId: string) => void;
  onOpenSupport?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onNavigateMySpace?: () => void;
  onNavigateDashboard?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentUser,
  onNavigateStatic,
  onNavigateAdmin,
  onNavigateHome,
  onNavigateDiscover,
  onSelectCourse,
  onOpenSupport,
  onOpenAuth,
  onNavigateMySpace,
  onNavigateDashboard,
}) => {
  const handleStaticClick = (page: 'privacy' | 'terms' | 'refund-policy' | 'contact', e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateStatic) {
      onNavigateStatic(page);
    } else {
      window.history.pushState({}, '', `/${page}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateAdmin) {
      onNavigateAdmin();
    } else {
      window.history.pushState({}, '', '/admin/creators');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };


  const handleCourseClick = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectCourse) {
      onSelectCourse(courseId);
    } else {
      window.history.pushState({}, '', `/course/${encodeURIComponent(courseId)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <footer className="bg-white text-[#14161A] border-t border-[#E8E8E6] pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid: Brand + Buyers / Creators / Company / Legal columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-[#E8E8E6]">
          
          {/* Brand Column (Span 4 on desktop) */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateHome) {
                  onNavigateHome();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2.5 inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded-md cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-md bg-[#14161A] text-white font-sans font-bold text-base flex items-center justify-center tracking-tight">
                U
              </div>
              <span className="font-sans font-bold text-xl tracking-tight text-[#14161A] leading-none">
                Universifit
              </span>
            </a>

            <p className="text-sm text-[#8B8D91] font-normal leading-relaxed max-w-sm">
              Creators sell courses, coaching, and private community memberships here. Learn directly from verified practitioners.
            </p>
          </div>

          {/* Column 1: Buyers */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-[#14161A]">
              Buyers
            </h4>
            <ul className="space-y-2.5 text-sm text-[#8B8D91]">
              <li>
                <a
                  href="/discover"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateDiscover) onNavigateDiscover('All');
                    else window.history.pushState({}, '', '/discover');
                  }}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
                >
                  Explore by Goal
                </a>
              </li>
              <li>
                <a
                  href="/discover"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateDiscover) onNavigateDiscover('All');
                    else window.history.pushState({}, '', '/discover');
                  }}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
                >
                  Vetted Coaches Directory
                </a>
              </li>
              <li>
                <a
                  href="/course/course-chadmax"
                  onClick={(e) => handleCourseClick('course-chadmax', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Video Curriculums
                </a>
              </li>
              <li>
                <a
                  href="/community"
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById('community');
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                    else window.location.hash = '#community';
                  }}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Community Groups
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser && onNavigateMySpace) {
                      onNavigateMySpace();
                    } else if (onOpenAuth) {
                      onOpenAuth('login');
                    } else {
                      window.history.pushState({}, '', '/my-space');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  My Space Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Creators */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-[#14161A]">
              Creators
            </h4>
            <ul className="space-y-2.5 text-sm text-[#8B8D91]">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuth) {
                      onOpenAuth('register');
                    } else {
                      window.history.pushState({}, '', '/auth?mode=signup');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#3652C4] transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded cursor-pointer text-left"
                >
                  <span>Apply as Creator</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#3652C4]" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser?.role === 'CREATOR' && onNavigateDashboard) {
                      onNavigateDashboard();
                    } else if (onOpenAuth) {
                      onOpenAuth('register');
                    } else {
                      window.history.pushState({}, '', '/dashboard');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#3652C4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded cursor-pointer text-left block"
                >
                  Creator Studio
                </button>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleStaticClick('terms', e)}
                  className="hover:text-[#3652C4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded cursor-pointer block"
                >
                  Platform Standards
                </a>
              </li>
              {currentUser?.role === 'ADMIN' && (
                <li>
                  <a
                    href="/admin/creators"
                    onClick={handleAdminClick}
                    className="hover:text-[#3652C4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded cursor-pointer block"
                  >
                    Verification Audit
                  </a>
                </li>
              )}
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleStaticClick('terms', e)}
                  className="hover:text-[#3652C4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded cursor-pointer block"
                >
                  Payout & Verification
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-[#14161A]">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-[#8B8D91]">
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleStaticClick('contact', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  About Universifit
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenSupport ? onOpenSupport() : handleStaticClick('contact', {} as any)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded text-sm text-[#8B8D91] block"
                >
                  Help & Support Tickets
                </button>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleStaticClick('contact', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-[#14161A]">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-[#8B8D91]">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleStaticClick('privacy', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleStaticClick('terms', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/refund-policy"
                  onClick={(e) => handleStaticClick('refund-policy', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleStaticClick('terms', e)}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block"
                >
                  Creator Code of Conduct
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openCookiePreferences()}
                  className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded block text-left"
                >
                  Cookie & Privacy Preferences
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Curated Explore Hubs Row */}
        <div className="py-6 border-b border-[#E8E8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#14161A]">
            <span>Explore:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Strength & Physique') : undefined}
              className="px-3 py-1 rounded-md bg-[#F7F7F5] hover:bg-white text-[#14161A] hover:text-[#3652C4] border border-[#E8E8E6] transition-colors cursor-pointer"
            >
              Strength & Biomechanics
            </button>
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Nutrition Coaching') : undefined}
              className="px-3 py-1 rounded-md bg-[#F7F7F5] hover:bg-white text-[#14161A] hover:text-[#3652C4] border border-[#E8E8E6] transition-colors cursor-pointer"
            >
              Metabolic Diet
            </button>
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Skincare & Grooming') : undefined}
              className="px-3 py-1 rounded-md bg-[#F7F7F5] hover:bg-white text-[#14161A] hover:text-[#3652C4] border border-[#E8E8E6] transition-colors cursor-pointer"
            >
              Clinical Skincare
            </button>
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Posture') : undefined}
              className="px-3 py-1 rounded-md bg-[#F7F7F5] hover:bg-white text-[#14161A] hover:text-[#3652C4] border border-[#E8E8E6] transition-colors cursor-pointer"
            >
              Posture Optimization
            </button>
            <button
              type="button"
              onClick={() => onSelectCourse ? onSelectCourse('course-chadmax') : undefined}
              className="px-3 py-1 rounded-md bg-[#F7F7F5] hover:bg-white text-[#14161A] hover:text-[#3652C4] border border-[#E8E8E6] transition-colors cursor-pointer"
            >
              ChadMax Protocol
            </button>
          </div>
        </div>

        {/* Social Icons Row + Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Social Icons Row */}
          <div className="flex items-center gap-2.5">
            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              title="Twitter / X"
              className="w-8 h-8 rounded-md border border-[#E8E8E6] bg-white text-[#8B8D91] hover:text-[#3652C4] hover:border-[#3652C4] flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4]"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              title="Instagram"
              className="w-8 h-8 rounded-md border border-[#E8E8E6] bg-white text-[#8B8D91] hover:text-[#3652C4] hover:border-[#3652C4] flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4]"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              title="YouTube"
              className="w-8 h-8 rounded-md border border-[#E8E8E6] bg-white text-[#8B8D91] hover:text-[#3652C4] hover:border-[#3652C4] flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4]"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              title="LinkedIn"
              className="w-8 h-8 rounded-md border border-[#E8E8E6] bg-white text-[#8B8D91] hover:text-[#3652C4] hover:border-[#3652C4] flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4]"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
              </svg>
            </a>
          </div>

          {/* Copyright + Privacy / Terms Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-xs text-[#8B8D91]">
            <p>© {new Date().getFullYear()} Universifit Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/privacy"
                onClick={(e) => handleStaticClick('privacy', e)}
                className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
              >
                Privacy Policy
              </a>
              <span className="text-[#E8E8E6]">•</span>
              <a
                href="/terms"
                onClick={(e) => handleStaticClick('terms', e)}
                className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
              >
                Terms of Service
              </a>
              <span className="text-[#E8E8E6]">•</span>
              <a
                href="/refund-policy"
                onClick={(e) => handleStaticClick('refund-policy', e)}
                className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
              >
                Refund Policy
              </a>
              <span className="text-[#E8E8E6]">•</span>
              <a
                href="/contact"
                onClick={(e) => handleStaticClick('contact', e)}
                className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
              >
                Contact
              </a>
              <span className="text-[#E8E8E6]">•</span>
              <button
                type="button"
                onClick={() => openCookiePreferences()}
                className="hover:text-[#3652C4] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded"
              >
                Cookies
              </button>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
};
