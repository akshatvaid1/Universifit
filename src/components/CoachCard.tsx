import React from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  ArrowRight,
  TrendingUp,
  Award,
  Video,
  BookOpen,
  Users,
} from 'lucide-react';
import { Card, Badge, Button } from './ui';
import type { CreatorItem } from '../services/api';

interface CoachCardProps {
  coach: CreatorItem;
  onBook?: (coach: CreatorItem) => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, onBook }) => {
  const primaryOffer = coach.featuredOffers?.[0];

  const getFormatIcon = (type?: string) => {
    switch (type) {
      case 'COURSE':
        return <BookOpen className="w-3.5 h-3.5 text-[#B8703F]" />;
      case 'COMMUNITY':
        return <Users className="w-3.5 h-3.5 text-[#6E8B6F]" />;
      default:
        return <Video className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const getFormatLabel = (type?: string) => {
    switch (type) {
      case 'COURSE':
        return 'Video Curriculum';
      case 'COMMUNITY':
        return 'Group Cohort';
      default:
        return '1-on-1 Coaching';
    }
  };

  const getResultStat = (c: CreatorItem): string => {
    if (c.specialtyTags.some((t) => t.toLowerCase().includes('skin'))) {
      return '420+ clinical acne remissions & barrier restorations';
    }
    if (c.specialtyTags.some((t) => t.toLowerCase().includes('posture'))) {
      return '2,100+ cervical spine alignments & desk resets';
    }
    if (c.specialtyTags.some((t) => t.toLowerCase().includes('nutrition'))) {
      return '1,650+ verified body recomp & fat loss protocols';
    }
    return '140+ verified physique transformations with 98.8% success';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Card
        variant="charcoal"
        interactive
        tabIndex={0}
        role="button"
        aria-label={`View profile for ${coach.fullName}, ${coach.headline}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBook && onBook(coach);
          }
        }}
        className="h-full flex flex-col justify-between group shadow-xl bg-[#16171A] border-white/[0.08] hover:border-[#B8703F]/40 p-5 outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315]"
      >
        <div>
          {/* Top Image + Badges Container */}
          <div className="relative mb-4 h-48 w-full rounded-2xl overflow-hidden bg-neutral-900">
            <img
              src={coach.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80'}
              alt={coach.fullName}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#16171A] via-black/20 to-transparent" />

            {/* Top Left Verified Badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="verified" size="sm">
                Verified Coach
              </Badge>
            </div>

            {/* Top Right Rating Pill */}
            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 flex items-center gap-1 text-[11px] font-bold text-amber-400 font-sans shadow-sm">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{coach.rating.toFixed(2)}</span>
              <span className="text-white/50 font-normal">({coach.totalClients}+)</span>
            </div>

            {/* Format Chip on Bottom Left */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-[#F7F4EF]/90">
              {getFormatIcon(primaryOffer?.type)}
              <span>{getFormatLabel(primaryOffer?.type)}</span>
            </div>
          </div>

          {/* Coach Name & Headline */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display font-bold text-lg text-[#F7F4EF] group-hover:text-white transition-colors truncate">
                {coach.fullName}
              </h3>
              <span className="text-[11px] font-mono text-[#F7F4EF]/50 shrink-0">
                @{coach.handle}
              </span>
            </div>

            <p className="text-xs text-[#B8703F] font-sans font-medium line-clamp-1">
              {coach.headline || 'Verified Coaching Practitioner'}
            </p>

            {/* Result Stat Box */}
            <div className="mt-3 p-2.5 rounded-xl bg-[#B8703F]/10 border border-[#B8703F]/20 flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#B8703F] shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-[#F7F4EF]/90 leading-tight line-clamp-2">
                {getResultStat(coach)}
              </p>
            </div>

            {/* Specialty Tags */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {coach.specialtyTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-[#F7F4EF]/70 border border-white/[0.06]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Credential Highlight */}
            {coach.credentials?.[0] && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#6E8B6F] font-medium">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{coach.credentials[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Pricing & Action */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#F7F4EF]/40 font-medium block">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-display font-bold text-[#B8703F]">
                ${primaryOffer?.price ? Number(primaryOffer.price) : 120}
              </span>
              <span className="text-[10px] text-[#F7F4EF]/50 font-sans">
                /{primaryOffer?.type === 'COURSE' ? 'curriculum' : 'session'}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onBook && onBook(coach)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Book
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
