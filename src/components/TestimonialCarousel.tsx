import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Badge, Card } from './ui';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  role: string;
  buyerPhoto: string;
  quote: string;
  coachTrainedWith: string;
  coachAvatar: string;
  resultStat: string;
  rating: number;
  timeframe: string;
  category: 'Physique' | 'Skincare' | 'Posture' | 'Nutrition';
}

const testimonials: Testimonial[] = [];

export const TestimonialCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (testimonials.length === 0) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-[#0E0E10] border-t border-white/[0.08] relative font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/[0.08] bg-[#16171A]/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/10 border border-[#B8703F]/20 flex items-center justify-center text-[#B8703F]">
              <Quote className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[#F7F4EF]">
              Client Outcomes & Transformation Reviews
            </h3>
            <p className="text-sm sm:text-base text-[#F7F4EF]/70 max-w-lg">
              Verified client outcome stories and transformation milestones will appear here as athletes complete coached protocols.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-[#16171A] relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#B8703F]/[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#6E8B6F]/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <Badge variant="verified" size="sm">
                Validated Member Outcomes
              </Badge>
              <span className="text-xs text-[#F7F4EF]/50 font-medium">
                Real client transformations
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#F7F4EF]">
              Transformed with <span className="italic text-[#B8703F]">Universifit</span>
            </h2>

            <p className="text-sm sm:text-base text-[#F7F4EF]/70 max-w-xl font-normal">
              Genuine stories from members who overcame lifestyle, diet, and desk-routine bottlenecks guided by vetted coaches.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous testimonials"
              className={`w-11 h-11 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                canScrollLeft
                  ? 'bg-[#16171A] hover:bg-[#1f2125] text-white border-white/20 hover:border-[#B8703F]'
                  : 'bg-white/[0.02] text-white/30 border-white/[0.06] cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next testimonials"
              className={`w-11 h-11 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                canScrollRight
                  ? 'bg-[#16171A] hover:bg-[#1f2125] text-white border-white/20 hover:border-[#B8703F]'
                  : 'bg-white/[0.02] text-white/30 border-white/[0.06] cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-6 pt-2 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {testimonials.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="w-[340px] sm:w-[410px] shrink-0 snap-start h-full"
            >
              <Card
                variant="charcoal"
                interactive
                className="h-full p-6 sm:p-7 flex flex-col justify-between group shadow-xl bg-[#16171A] border-white/[0.09] hover:border-[#B8703F]/40 relative"
              >
                {/* Quote Icon watermark */}
                <Quote className="w-8 h-8 text-white/[0.03] absolute top-6 right-6 pointer-events-none" />

                <div>
                  {/* Rating Stars & Category Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <span className="text-[11px] font-semibold text-[#F7F4EF]/60 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                      {item.timeframe}
                    </span>
                  </div>

                  {/* 2-3 Line Quote */}
                  <p className="text-sm sm:text-base text-[#F7F4EF]/85 font-normal leading-relaxed italic line-clamp-4 mb-5">
                    "{item.quote}"
                  </p>

                  {/* Result Stat Box in Accent Copper */}
                  <div className="p-3.5 rounded-2xl bg-[#B8703F]/10 border border-[#B8703F]/25 flex items-start gap-2.5 mb-6">
                    <div className="w-6 h-6 rounded-lg bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#F7F4EF] leading-snug">
                      {item.resultStat}
                    </span>
                  </div>
                </div>

                {/* Buyer & Coach Info Footer */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                  {/* Buyer */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.buyerPhoto}
                      alt={`${item.name}, verified Universifit member`}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-sm text-[#F7F4EF] flex items-center gap-1 truncate">
                        <span>{item.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6E8B6F] shrink-0" />
                      </h4>
                      <p className="text-[11px] text-[#F7F4EF]/50 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#B8703F]" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Coach Trained With Badge */}
                  <div className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/0.06 shrink-0">
                    <img
                      src={item.coachAvatar}
                      alt={`Coach ${item.coachTrainedWith}`}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[10px] font-semibold text-[#F7F4EF]/70">
                      {item.coachTrainedWith.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
