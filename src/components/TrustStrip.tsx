import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Video, Activity, Users, ArrowUpRight } from 'lucide-react';
import { Card } from './ui';

export const TrustStrip: React.FC = () => {
  const stats = [
    {
      id: 'verified-coaches',
      icon: ShieldCheck,
      number: '500+',
      label: 'Verified Coaches',
      description: 'Top 1% vetted practitioners across fitness, nutrition & aesthetics',
      iconColor: 'bg-[#6E8B6F]/15 text-[#6E8B6F] border-[#6E8B6F]/30',
      tag: '4-tier audit',
    },
    {
      id: 'sessions',
      icon: Video,
      number: '12,000+',
      label: 'Live & Recorded Sessions',
      description: 'HD interactive workshops, form corrections, and library archives',
      iconColor: 'bg-[#B8703F]/15 text-[#B8703F] border-[#B8703F]/30',
      tag: 'On-demand & 1-on-1',
    },
    {
      id: 'tracking',
      icon: Activity,
      number: '24x7',
      label: '24x7 Progress Tracking',
      description: 'Real-time habit metrics, biometrics, macro logging & coach sync',
      iconColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      tag: 'Continuous feedback',
    },
    {
      id: 'members',
      icon: Users,
      number: '48,000+',
      label: 'Active Members',
      description: 'High-performing community members training and ascending together',
      iconColor: 'bg-[#6E8B6F]/15 text-[#8cb08d] border-[#6E8B6F]/30',
      tag: 'Global community',
    },
  ];

  return (
    <section className="py-12 lg:py-16 bg-[#121315] border-y border-white/[0.08] relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#B8703F] animate-pulse" />
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#F7F4EF]/60">
              Validated Platform Performance & Trust
            </h3>
          </div>
          <div className="text-xs text-[#F7F4EF]/50 font-medium flex items-center gap-1">
            <span>Updated live across all disciplines</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#B8703F]" />
          </div>
        </div>

        {/* 4 Stat Cards Grid with Soft Shadows and Accent-Copper Numerals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <Card
                  variant="charcoal"
                  interactive
                  className="h-full p-6 flex flex-col justify-between group bg-[#16171A] border-white/[0.08] hover:border-[#B8703F]/40"
                >
                  <div>
                    {/* Icon & Mini Tag */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-12 h-12 rounded-2xl border ${stat.iconColor} flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-medium text-[#F7F4EF]/60 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                        {stat.tag}
                      </span>
                    </div>

                    {/* Bold Accent-Copper Numeral with Fraunces Display */}
                    <div className="space-y-1">
                      <div className="text-3xl sm:text-4xl font-display font-bold text-[#B8703F] tracking-tight tabular-nums">
                        {stat.number}
                      </div>

                      {/* Label */}
                      <h4 className="text-base font-display font-semibold text-[#F7F4EF] tracking-tight">
                        {stat.label}
                      </h4>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#F7F4EF]/60 leading-relaxed font-sans font-normal mt-4 pt-4 border-t border-white/[0.06]">
                    {stat.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
