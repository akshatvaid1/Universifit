import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowRight, ShieldCheck, Dumbbell, Apple, Activity } from 'lucide-react';
import { Card, Button } from './ui';

interface NotFound404Props {
  onBackHome: () => void;
  onNavigateDiscover: (category?: string) => void;
}

export const NotFound404: React.FC<NotFound404Props> = ({
  onBackHome,
  onNavigateDiscover,
}) => {
  const quickLinks = [
    { label: 'Strength & Biomechanics', category: 'Strength', icon: Dumbbell },
    { label: 'Clinical Metabolic Nutrition', category: 'Nutrition', icon: Apple },
    { label: 'Posture & Mobility Reset', category: 'Posture', icon: Activity },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-2xl w-full"
      >
        <Card
          variant="charcoal"
          className="p-8 sm:p-12 text-center bg-[#121315] border-white/[0.08] shadow-2xl space-y-8 rounded-3xl relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#B8703F]/10 blur-3xl pointer-events-none rounded-full" />

          {/* 404 Visual Icon & Pill */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#d48b59] text-xs font-bold font-mono">
              <Compass className="w-3.5 h-3.5 text-[#B8703F]" />
              <span>HTTP 404 ROUTE NOT FOUND</span>
            </div>

            <div className="w-20 h-20 rounded-3xl bg-[#B8703F]/10 border border-[#B8703F]/25 text-[#B8703F] mx-auto flex items-center justify-center shadow-inner">
              <span className="font-display font-black text-3xl tracking-tighter">404</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#F7F4EF] tracking-tight">
                404 — Page Not Found
              </h1>
              <p className="text-sm sm:text-base text-[#F7F4EF]/70 max-w-md mx-auto leading-relaxed">
                The protocol, creator profile, or classroom syllabus you are looking for has been relocated or does not exist.
              </p>
            </div>
          </div>

          {/* Quick Category Jump Badges */}
          <div className="pt-2 border-t border-white/[0.06] space-y-3">
            <span className="text-xs font-semibold text-[#F7F4EF]/50 uppercase tracking-wider block">
              Jump directly to vetted practitioners:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {quickLinks.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.category}
                    onClick={() => onNavigateDiscover(item.category)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#B8703F]/40 text-xs font-semibold text-[#F7F4EF]/85 hover:text-white transition-all cursor-pointer"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-[#B8703F]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTAs: Link Back Home & Discover */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={onBackHome}
              leftIcon={<Home className="w-4 h-4 text-[#B8703F]" />}
              className="w-full sm:w-auto"
            >
              Back to Home
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigateDiscover()}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Explore Discover Catalog
            </Button>
          </div>

          {/* Platform Trust Note */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-[#F7F4EF]/40 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6E8B6F]" />
            <span>Universifit Vetted Coaching Marketplace</span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound404;
