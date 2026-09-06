import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  Play,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button, Badge } from './ui';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-[#16171A]">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#B8703F]/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-[#6E8B6F]/[0.05] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Fraunces Headline, Subtext, CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-8"
          >
            {/* Top Tag Pill with Sage Verified Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] text-xs sm:text-sm font-medium text-[#F7F4EF]/90 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6E8B6F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6E8B6F]"></span>
              </span>
              <span className="tracking-tight text-[#F7F4EF]/90 font-sans">1-on-1 & Cohort Coaching</span>
              <span className="text-white/20">•</span>
              <Badge variant="verified" size="sm">
                Vetted Top 1%
              </Badge>
            </div>

            {/* Left-Aligned Fraunces Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium tracking-tight text-[#F7F4EF] leading-[1.12]">
              Train, look, and feel better{' '}
              <span className="italic font-normal text-[#B8703F]">
                — guided by vetted coaches
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg lg:text-xl text-[#F7F4EF]/75 font-sans font-normal leading-relaxed max-w-2xl">
              Access customized strength protocols, metabolic nutrition plans, dermatologist-approved skincare, and posture optimization from world-class creator athletes and verified practitioners.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={onGetStarted}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started
              </Button>

              <a href="#explore-creators">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Play className="w-4 h-4 fill-current text-[#B8703F]" />}
                >
                  Explore Creators
                </Button>
              </a>
            </div>

            {/* Micro Highlights List */}
            <div className="pt-4 border-t border-white/[0.08] w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#F7F4EF]/70 font-sans font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6E8B6F] shrink-0" />
                <span>Tailored Daily Protocols</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6E8B6F] shrink-0" />
                <span>Live Video Form Audits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6E8B6F] shrink-0" />
                <span>Zero Generic AI Plans</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Asymmetric Real Creator Photo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Outer Warm Copper Glow Halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#B8703F]/15 via-[#6E8B6F]/10 to-transparent rounded-3xl blur-2xl transform -rotate-3" />

            {/* Main Creator Card Container */}
            <div className="relative w-full max-w-md bg-[#16171A] rounded-3xl p-3 sm:p-4 border border-white/[0.12] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden">
              
              {/* Creator Athlete Hero Image */}
              <div className="relative h-[430px] sm:h-[490px] w-full rounded-2xl overflow-hidden bg-neutral-900">
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80"
                  alt="Marcus Vance, Head Strength & Biomechanics Coach at Universifit demonstrating posture protocols"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                
                {/* Gradient Overlays for High-End Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#16171A] via-black/25 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

                {/* Top Coach Header Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <Badge variant="verified" size="sm">
                    Live Coaching
                  </Badge>

                  <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-1 text-xs font-bold text-amber-400 font-sans">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.99</span>
                    <span className="text-white/60 font-normal">(1.4k reviews)</span>
                  </div>
                </div>

                {/* Bottom Overlay Info on Image */}
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  <div className="bg-[#16171A]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-lg text-[#F7F4EF]">
                            Universifit Certified Coach
                          </h4>
                          <ShieldCheck className="w-4 h-4 text-[#6E8B6F]" />
                        </div>
                        <p className="text-xs text-[#F7F4EF]/60 font-sans font-medium">
                          Evidence-Based Movement & Health Specialist
                        </p>
                      </div>
                      <Badge variant="copper" size="sm">
                        Top 0.1%
                      </Badge>
                    </div>

                    {/* Progress Bar inside Card */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-2 text-[#6E8B6F] font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        <span>98.8% Client Success Rate</span>
                      </div>
                      <span className="text-[#F7F4EF]/50">48 Slots Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: Live Form Check */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="absolute -left-3 sm:-left-6 top-1/3 bg-[#16171A]/95 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3 text-left max-w-[200px]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#F7F4EF]/50 tracking-wider font-sans">
                    Biometrics
                  </p>
                  <p className="text-xs font-bold text-[#F7F4EF] leading-tight font-sans">
                    Full Form Video Check
                  </p>
                </div>
              </motion.div>

              {/* Floating Badge 2: Transformation Metric */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="absolute -right-3 sm:-right-6 bottom-16 bg-[#16171A]/95 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6E8B6F]/20 text-[#6E8B6F] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#F7F4EF]/50 tracking-wider font-sans">
                    Results
                  </p>
                  <p className="text-xs font-bold text-[#F7F4EF] leading-tight font-sans">
                    12k+ Transformations
                  </p>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
