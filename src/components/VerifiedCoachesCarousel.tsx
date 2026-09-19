import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Button } from './ui';
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

  if (!currentCoach) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-[#F7F7F5] text-[#14161A] border-t border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-[#E8E8E6] bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
            <h3 className="text-xl sm:text-2xl font-semibold font-sans text-[#14161A]">
              Creator Roster
            </h3>
            <p className="text-sm sm:text-base text-[#8B8D91] max-w-md font-normal">
              Verified creators who host private communities and courses will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F7F7F5] text-[#14161A] relative font-sans border-t border-[#E8E8E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-semibold text-[#14161A] tracking-tight">
              Featured Coaches & Creators
            </h2>
            <p className="text-sm sm:text-base text-[#8B8D91] font-normal leading-relaxed">
              Explore creators offering dedicated guidance, courses, and accountability communities.
            </p>
          </div>

          {/* Navigation Arrows */}
          {coaches.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-9 h-9 rounded-md border border-[#E8E8E6] bg-white hover:bg-[#F7F7F5] text-[#14161A] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous coach"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="w-9 h-9 rounded-md border border-[#E8E8E6] bg-white hover:bg-[#F7F7F5] text-[#14161A] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next coach"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Featured Editorial Card (Clean surface, functional border, no decorative shadows) */}
        <div className="bg-white rounded-xl border border-[#E8E8E6] p-6 sm:p-8 lg:p-10 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCoach.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left Column: Portrait */}
              <div className="lg:col-span-5 relative">
                <div className="relative h-[380px] sm:h-[440px] w-full rounded-lg overflow-hidden bg-[#F7F7F5] border border-[#E8E8E6]">
                  <img
                    src={currentCoach.avatarUrl || '/chadtag.png'}
                    alt={`${currentCoach.fullName} profile`}
                    loading="lazy"
                    decoding="async"
                    width={440}
                    height={440}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>

              {/* Right Column: Coach Details */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Specialty Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentCoach.specialtyTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium px-2.5 py-1 rounded bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="text-xs font-normal text-[#5A5D62]">
                      Verified
                    </span>
                  </div>

                  {/* Name and Headline */}
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-sans font-semibold text-[#14161A] tracking-tight">
                      {currentCoach.fullName}
                    </h3>
                    <p className="text-sm sm:text-base text-[#5A5D62] font-sans font-medium mt-1">
                      {currentCoach.headline || `@${currentCoach.handle}`}
                    </p>
                  </div>

                  {/* Bio */}
                  <p className="text-sm sm:text-base text-[#14161A]/85 leading-relaxed font-normal">
                    {currentCoach.bio || 'Creator sharing structured protocols and community support.'}
                  </p>

                  {/* Credentials Row - Clean typography, no icon-list */}
                  {currentCoach.credentials && currentCoach.credentials.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-medium text-[#8B8D91] uppercase tracking-wider block mb-2">
                        Focus Areas
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentCoach.credentials.map((cred, i) => (
                          <span
                            key={i}
                            className="text-xs font-normal px-2.5 py-1 rounded bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]"
                          >
                            {cred}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-6 border-t border-[#E8E8E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {currentCoach.featuredOffers && currentCoach.featuredOffers[0] && (
                    <div>
                      <span className="text-xs text-[#8B8D91] font-normal block">
                        {currentCoach.featuredOffers[0].title}
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-sans font-bold text-[#14161A]">
                          ${currentCoach.featuredOffers[0].price}
                        </span>
                        <span className="text-xs text-[#8B8D91]">
                          {currentCoach.featuredOffers[0].type === 'COURSE' ? 'one-time' : 'per session'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => onBookCoach && onBookCoach(currentCoach)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      View Profile & Offerings
                    </Button>
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
