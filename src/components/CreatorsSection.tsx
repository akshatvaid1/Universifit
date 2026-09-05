import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { fetchDiscoverCreators, type CreatorItem } from '../services/api';

interface CreatorsSectionProps {
  onBookCreator: (creatorName: string) => void;
}

export const CreatorsSection: React.FC<CreatorsSectionProps> = ({ onBookCreator }) => {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Strength & Physique', 'Nutrition', 'Skincare & Grooming', 'Posture'];

  useEffect(() => {
    fetchDiscoverCreators({ limit: 8 })
      .then((res) => {
        if (res.data?.creators) {
          setCreators(res.data.creators);
        }
      })
      .catch((err) => {
        console.warn('Could not load creators in CreatorsSection', err);
      });
  }, []);

  const filtered = creators.filter((c) => {
    if (activeFilter === 'All') return true;
    return c.specialtyTags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));
  });

  if (creators.length === 0) {
    return (
      <section id="explore-creators" className="py-16 sm:py-20 lg:py-24 bg-[#0d0d0e] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/[0.08] bg-[#16171A]/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/10 border border-[#B8703F]/20 flex items-center justify-center text-[#B8703F]">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[#F7F4EF]">
              Practitioner Roster In Onboarding
            </h3>
            <p className="text-sm sm:text-base text-[#F7F4EF]/70 max-w-md">
              Founding coaches and clinical practitioners are currently completing platform credential audits. New verified profiles will appear here.
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B8703F] text-white font-medium text-sm hover:bg-[#A35F32] transition-colors"
              >
                Join as a Founding Creator <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="explore-creators" className="py-20 lg:py-28 bg-[#0d0d0e] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-bold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Vetted Industry Leaders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Learn directly from the top 1%
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 max-w-xl">
              Every practitioner is rigorously vetted for credentials, client transformation history, and scientific rigor.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1.5 bg-[#171719] rounded-full border border-white/[0.08] overflow-x-auto self-start md:self-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171719] ${
                  activeFilter === cat
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((creator) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="bg-[#151517] rounded-3xl p-5 border border-white/[0.08] hover:border-white/[0.18] transition-all flex flex-col justify-between group shadow-xl"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative mb-5">
                  <div className="h-44 w-full rounded-2xl overflow-hidden bg-neutral-800">
                    <img
                      src={creator.avatarUrl || undefined}
                      alt={creator.fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="absolute -bottom-4 left-3 right-3 flex items-end justify-between">
                    <div className="relative">
                      <img
                        src={creator.avatarUrl || undefined}
                        alt={creator.fullName}
                        className="w-14 h-14 rounded-2xl object-cover ring-4 ring-[#151517] shadow-lg"
                      />
                    </div>

                    <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 text-xs font-bold text-amber-400 shadow-md">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{creator.rating.toFixed(2)}</span>
                      <span className="text-white/40 font-normal">({creator.totalClients})</span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-white">{creator.fullName}</h3>
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  </div>
                  <span className="inline-block text-[11px] font-bold text-neutral-400 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                    {creator.specialtyTags[0] || 'Vetted Coach'}
                  </span>
                  <p className="text-xs text-neutral-300 font-medium line-clamp-2">
                    {creator.headline}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">Rates from</span>
                  <p className="text-xs font-black text-white">
                    {creator.featuredOffers[0]?.price ? `$${creator.featuredOffers[0].price}` : 'Vetted'}
                  </p>
                </div>

                <button
                  onClick={() => onBookCreator(creator.fullName)}
                  className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151517] active:scale-95"
                >
                  <span>Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
