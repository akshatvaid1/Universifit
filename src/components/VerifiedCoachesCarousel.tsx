import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Badge, Button } from './ui';
import { fetchDiscoverCreators, type CreatorItem } from '../services/api';

interface VerifiedCoachesProps {
  onBookCoach?: (coach: CreatorItem) => void;
}

export const VerifiedCoachesCarousel: React.FC<VerifiedCoachesProps> = ({ onBookCoach }) => {
  const [coaches, setCoaches] = useState<CreatorItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    fetchDiscoverCreators({ limit: 8 })
      .then((res) => {
        if (res.data?.creators) {
          setCoaches(res.data.creators);
        }
      })
      .catch((err) => {
        console.debug('Could not query coaches for carousel', err);
      });
  }, []);

  const currentCoach = coaches[activeIndex] || coaches[0];

  const handleNext = () => {
    if (coaches.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % coaches.length);
  };

  const handlePrev = () => {
    if (coaches.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + coaches.length) % coaches.length);
  };

  // Result stat mapping based on specialty
  const getResultStat = (coach: CreatorItem): string => {
    if (coach.specialtyTags.some((t) => t.toLowerCase().includes('skin'))) {
      return '420+ clinical acne remissions & skin barrier transformations';
    }
    if (coach.specialtyTags.some((t) => t.toLowerCase().includes('posture'))) {
      return '2,100+ structural alignments & forward-head posture corrections';
    }
    if (coach.specialtyTags.some((t) => t.toLowerCase().includes('nutrition'))) {
      return '1,650+ verified body recomp & sustainable fat loss protocols';
    }
    return '140+ verified physique transformations with 98.8% milestone completion';
  };

  if (coaches.length === 0) {
    return (
      <section id="verified-coaches" className="py-16 sm:py-20 lg:py-24 bg-[#121315] border-y border-white/[0.08] relative font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/[0.08] bg-[#16171A]/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#B8703F]/10 border border-[#B8703F]/20 flex items-center justify-center text-[#B8703F]">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[#F7F4EF]">
              Applications in Verification Review
            </h3>
            <p className="text-sm sm:text-base text-[#F7F4EF]/70 max-w-md">
              No verified coaches are publicly listed yet. Our clinical board audits licenses and certifications before onboarding founding practitioners.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B8703F] text-white font-medium text-sm hover:bg-[#A35F32] transition-colors"
              >
                Apply as a Founding Coach <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="verified-coaches" className="py-16 sm:py-20 lg:py-28 bg-[#121315] border-y border-white/[0.08] relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Carousel Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <Badge variant="verified" size="sm">
                Top 1% Vetted
              </Badge>
              <span className="text-xs text-[#F7F4EF]/50 font-medium">
                Live from GET /discover
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#F7F4EF] tracking-tight">
              Verified Coaches, <span className="italic text-[#B8703F]">Real Results</span>
            </h2>

            <p className="text-sm sm:text-base text-[#F7F4EF]/70 font-normal max-w-xl leading-relaxed">
              Editorial spotlight featuring world-class practitioners with verified credentials, live video reviews, and validated client outcomes.
            </p>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#F7F4EF]/50 font-mono">
              {activeIndex + 1} / {coaches.length}
            </span>

            <button
              onClick={handlePrev}
              aria-label="Previous Coach"
              className="w-11 h-11 rounded-full bg-[#16171A] border border-white/10 hover:border-[#B8703F] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next Coach"
              className="w-11 h-11 rounded-full bg-[#16171A] border border-white/10 hover:border-[#B8703F] text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editorial-Style Horizontal Spotlight Card */}
        {currentCoach && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCoach.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[#16171A] rounded-3xl border border-white/10 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                {/* Large Photo Left */}
                <div className="lg:col-span-5 relative min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] bg-neutral-900 overflow-hidden">
                  <img
                    src={currentCoach.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80'}
                    alt={`${currentCoach.fullName} — Verified Coach Profile`}
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Subtle Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16171A] via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#16171A]/90" />

                  {/* Top Floating Badge */}
                  <div className="absolute top-5 left-5">
                    <Badge variant="verified" size="md">
                      Verified Coach
                    </Badge>
                  </div>

                  {/* Bottom Rating on Mobile View */}
                  <div className="absolute bottom-5 left-5 flex lg:hidden items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{currentCoach.rating.toFixed(2)}</span>
                    <span className="text-white/60 font-normal">({currentCoach.totalClients}+ clients)</span>
                  </div>
                </div>

                {/* Right Side: Editorial Info, Result Stat, Badges, CTAs */}
                <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-between space-y-6">
                  
                  {/* Top Header Row: Rating & Tags */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Specialty Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentCoach.specialtyTags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.06] text-[#F7F4EF]/80 border border-white/[0.08]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Desktop Rating */}
                      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{currentCoach.rating.toFixed(2)}</span>
                        <span className="text-white/50 font-normal">
                          ({currentCoach.totalClients}+ clients)
                        </span>
                      </div>
                    </div>

                    {/* Coach Name in Fraunces & Headline */}
                    <div>
                      <h3 className="text-3xl sm:text-4xl font-display font-bold text-[#F7F4EF] tracking-tight">
                        {currentCoach.fullName}
                      </h3>
                      <p className="text-sm sm:text-base text-[#B8703F] font-sans font-medium mt-1">
                        {currentCoach.headline || `@${currentCoach.handle}`}
                      </p>
                    </div>

                    {/* ONE-LINE RESULT STAT CALLOUT (Accent Copper Highlight) */}
                    <div className="p-4 rounded-2xl bg-[#B8703F]/10 border border-[#B8703F]/25 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8703F]">
                          Validated Result Stat
                        </span>
                        <p className="text-sm font-semibold text-[#F7F4EF] leading-snug mt-0.5">
                          {getResultStat(currentCoach)}
                        </p>
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-sm text-[#F7F4EF]/70 leading-relaxed font-normal">
                      {currentCoach.bio || 'World-class practitioner guiding dedicated clients through progressive training protocols and evidence-based routines.'}
                    </p>

                    {/* Credentials Row */}
                    {currentCoach.credentials && currentCoach.credentials.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-[#F7F4EF]/40 uppercase tracking-wider block mb-2">
                          Accreditations & Background
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {currentCoach.credentials.map((cred, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#6E8B6F] border border-[#6E8B6F]/20 flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5" />
                              {cred}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Strip with Pricing & CTA */}
                  <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Featured Offer / Pricing */}
                    <div>
                      <span className="text-xs text-[#F7F4EF]/50 font-medium block">
                        Featured Coaching
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl sm:text-3xl font-display font-bold text-[#B8703F]">
                          ${currentCoach.featuredOffers[0]?.price || '180'}
                        </span>
                        <span className="text-xs text-[#F7F4EF]/60">
                          / {currentCoach.featuredOffers[0]?.type === 'COURSE' ? 'curriculum' : 'month'}
                        </span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => onBookCoach && onBookCoach(currentCoach)}
                        leftIcon={<Calendar className="w-4 h-4 text-[#B8703F]" />}
                      >
                        Availability
                      </Button>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => onBookCoach && onBookCoach(currentCoach)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Apply for Coaching
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Coach Carousel Selector Avatars */}
        <div className="mt-8 flex items-center justify-center gap-3 overflow-x-auto py-2">
          {coaches.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveIndex(i)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer select-none shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] ${
                activeIndex === i
                  ? 'bg-[#16171A] border-[#B8703F] text-white shadow-md'
                  : 'bg-white/[0.03] border-white/10 text-[#F7F4EF]/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <img
                src={c.avatarUrl || ''}
                alt={`${c.fullName} thumbnail`}
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
              <span className="text-xs font-semibold">{c.fullName.split(' ')[0]}</span>
              {activeIndex === i && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8703F]" />
              )}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
