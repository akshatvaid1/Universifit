import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from './ui';
import type { AuthUserData } from '../services/api';

export interface FooterProps {
  currentUser?: AuthUserData | null;
  onNavigateStatic?: (page: 'privacy' | 'terms' | 'refund-policy' | 'contact') => void;
  onNavigateAdmin?: () => void;
  onNavigateHome?: () => void;
  onNavigateDiscover?: (category?: string, search?: string) => void;
  onSelectCourse?: (courseId: string) => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentUser,
  onNavigateStatic,
  onNavigateAdmin,
  onNavigateHome,
  onNavigateDiscover,
  onSelectCourse,
  onOpenSupport,
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

  const handleCategoryClick = (category: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateDiscover) {
      onNavigateDiscover(category);
    } else {
      window.history.pushState({}, '', `/discover?category=${encodeURIComponent(category)}`);
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
    <footer className="bg-[#16171A] text-[#F7F4EF] border-t border-white/[0.08] pt-16 sm:pt-20 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-white/[0.08]">
          
          {/* Brand Column (Span 2 on tablet, Span 4 on desktop) */}
          <div className="md:col-span-2 lg:col-span-4 space-y-5">
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
              className="flex items-center gap-3 group inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded-xl p-1 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F7F4EF] text-[#16171A] font-display font-black text-xl flex items-center justify-center tracking-tighter transition-transform group-hover:scale-105 shadow-sm">
                U
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl tracking-tight text-[#F7F4EF] leading-none">
                  Universifit
                </span>
                <span className="text-[10px] font-semibold text-[#F7F4EF]/50 uppercase tracking-widest mt-0.5">
                  Vetted Coaching Platform
                </span>
              </div>
            </a>

            <p className="text-sm text-[#F7F4EF]/70 font-normal leading-relaxed max-w-sm">
              The premier destination for 1-on-1 personalized protocols in strength, metabolic nutrition, dermatologist-led skincare, and posture optimization.
            </p>

            <Badge variant="verified" size="md">
              Top 1% Vetted Practitioners
            </Badge>
          </div>

          {/* Column 1: Company & Legal */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#F7F4EF]/90 font-display">
              Company & Legal
            </h4>
            <ul className="space-y-3 text-sm text-[#F7F4EF]/60 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenSupport ? onOpenSupport() : handleStaticClick('contact', {} as any)}
                  className="hover:text-white transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 flex items-center gap-1.5 text-sm text-[#F7F4EF]/60 font-medium"
                >
                  <span>Help & Support Tickets</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#6E8B6F]/20 text-[#6E8B6F] rounded-full">
                    24h SLA
                  </span>
                </button>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleStaticClick('contact', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/refund-policy"
                  onClick={(e) => handleStaticClick('refund-policy', e)}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  <span>Refund Policy</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full">
                    Guaranteed
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleStaticClick('privacy', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  Privacy & Data Usage
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleStaticClick('terms', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  Terms & Creator Terms
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Categories */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#F7F4EF]/90 font-display">
              Categories
            </h4>
            <ul className="space-y-3 text-sm text-[#F7F4EF]/60 font-medium">
              <li>
                <a
                  href="/discover?category=strength"
                  onClick={(e) => handleCategoryClick('Strength & Physique', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  Strength & Physique
                </a>
              </li>
              <li>
                <a
                  href="/discover?category=nutrition"
                  onClick={(e) => handleCategoryClick('Nutrition Coaching', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  Metabolic Nutrition
                </a>
              </li>
              <li>
                <a
                  href="/discover?category=skincare"
                  onClick={(e) => handleCategoryClick('Skincare & Grooming', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  Clinical Skincare
                </a>
              </li>
              <li>
                <a
                  href="/discover?category=posture"
                  onClick={(e) => handleCategoryClick('Posture', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  Posture & Alignment
                </a>
              </li>
              <li className="pt-1">
                <a
                  href="/discover"
                  onClick={(e) => handleCategoryClick('All', e)}
                  className="text-xs font-semibold text-[#B8703F] hover:text-[#E29A68] transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  <span>Explore All Disciplines</span>
                  <span>&rarr;</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Explore & Curriculums */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#F7F4EF]/90 font-display">
              Explore More
            </h4>
            <ul className="space-y-3 text-sm text-[#F7F4EF]/60 font-medium">
              <li>
                <a
                  href="/discover"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateDiscover) onNavigateDiscover('All');
                    else window.history.pushState({}, '', '/discover');
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  <span>Vetted Coaches Directory</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#B8703F]/20 text-[#B8703F] rounded-full">
                    Top 1%
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="/course/c-big3-mechanics"
                  onClick={(e) => handleCourseClick('c-big3-mechanics', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  Big 3 Biomechanics
                </a>
              </li>
              <li>
                <a
                  href="/course/course-chadmax"
                  onClick={(e) => handleCourseClick('course-chadmax', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  ChadMax Protocol
                </a>
              </li>
              <li>
                <a
                  href="/discover?category=challenges"
                  onClick={(e) => handleCategoryClick('Challenges', e)}
                  className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 block"
                >
                  Cohorts & Squads
                </a>
              </li>
              <li className="pt-1">
                <a
                  href="/discover"
                  onClick={(e) => handleCategoryClick('All', e)}
                  className="text-xs font-semibold text-[#B8703F] hover:text-[#E29A68] transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
                >
                  <span>Explore Masterclasses</span>
                  <span>&rarr;</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: For Coaches */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#F7F4EF]/90 font-display">
              For Coaches
            </h4>
            <ul className="space-y-3 text-sm text-[#F7F4EF]/60 font-medium">
              <li>
                <a
                  href="/auth?mode=signup"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigateStatic) {
                      window.history.pushState({}, '', '/auth?mode=signup');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 cursor-pointer"
                >
                  <span>Apply as Coach</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B8703F]" />
                </a>
              </li>
              {currentUser?.role === 'ADMIN' && (
                <li>
                  <a
                    href="/admin/creators"
                    onClick={handleAdminClick}
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 cursor-pointer"
                  >
                    Verification Audit
                  </a>
                </li>
              )}
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleStaticClick('terms', e)}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 cursor-pointer"
                >
                  Creator Standards
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleStaticClick('contact', e)}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1 cursor-pointer"
                >
                  Coach Concierge
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Curated Explore More Hubs Row */}
        <div className="py-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F7F4EF]/50 font-display">
            <span>Explore Universifit:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Strength & Physique') : undefined}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F4EF]/70 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              Strength & Biomechanics
            </button>
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Nutrition Coaching') : undefined}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F4EF]/70 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              Metabolic Diet
            </button>
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Skincare & Grooming') : undefined}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F4EF]/70 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              Clinical Skincare
            </button>
            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('Posture') : undefined}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F4EF]/70 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              Posture Optimization
            </button>
            <button
              type="button"
              onClick={() => onSelectCourse ? onSelectCourse('c-big3-mechanics') : undefined}
              className="px-3 py-1 rounded-full bg-[#B8703F]/15 hover:bg-[#B8703F]/25 text-[#E29A68] hover:text-white border border-[#B8703F]/30 transition-colors cursor-pointer"
            >
              Big 3 Masterclass
            </button>
            <button
              type="button"
              onClick={() => onSelectCourse ? onSelectCourse('course-chadmax') : undefined}
              className="px-3 py-1 rounded-full bg-[#B8703F]/15 hover:bg-[#B8703F]/25 text-[#E29A68] hover:text-white border border-[#B8703F]/30 transition-colors cursor-pointer"
            >
              ChadMax Protocol
            </button>
          </div>
        </div>

        {/* Social Icons Row + Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Social Icons Row */}
          <div className="flex items-center gap-3">
            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              title="Twitter / X"
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/[0.08] flex items-center justify-center transition-all shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              title="Instagram"
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/[0.08] flex items-center justify-center transition-all shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A]"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
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
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/[0.08] flex items-center justify-center transition-all shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              title="LinkedIn"
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/[0.08] flex items-center justify-center transition-all shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.39 9.74v-8.37H5.07v8.37h2.78z"/>
              </svg>
            </a>

            {/* Discord */}
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              title="Discord Community"
              className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/[0.08] flex items-center justify-center transition-all shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>

          {/* Copyright + Privacy / Terms Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-xs text-[#F7F4EF]/50 font-medium">
            <p>© {new Date().getFullYear()} Universifit Coaching Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/privacy"
                onClick={(e) => handleStaticClick('privacy', e)}
                className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
              >
                Privacy Policy
              </a>
              <span className="text-white/20">•</span>
              <a
                href="/terms"
                onClick={(e) => handleStaticClick('terms', e)}
                className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
              >
                Terms of Service
              </a>
              <span className="text-white/20">•</span>
              <a
                href="/refund-policy"
                onClick={(e) => handleStaticClick('refund-policy', e)}
                className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
              >
                Refund Policy
              </a>
              <span className="text-white/20">•</span>
              <a
                href="/contact"
                onClick={(e) => handleStaticClick('contact', e)}
                className="hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded px-1"
              >
                Contact & Concierge
              </a>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
};
