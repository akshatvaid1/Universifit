import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card, Button } from './ui';
import type { CreatorItem } from '../services/api';

interface CoachCardProps {
  coach: CreatorItem;
  onBook?: (coach: CreatorItem) => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, onBook }) => {
  const primaryOffer = coach.featuredOffers?.[0];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <Card
        variant="ivory"
        interactive
        tabIndex={0}
        role="button"
        aria-label={`View profile for ${coach.fullName}, ${coach.headline}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onBook) onBook(coach);
          }
        }}
        className="h-full flex flex-col justify-between group bg-white border-[#E8E8E6] hover:border-[#14161A] p-5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F7F5]"
      >
        <div>
          {/* Top Image - Clean, functional border, NO floating badges */}
          <div className="relative mb-3 h-48 w-full rounded-lg overflow-hidden bg-[#F7F7F5] border border-[#E8E8E6]">
            <img
              src={coach.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=450&auto=format&fit=crop&q=80'}
              alt={`${coach.fullName} — ${coach.headline || 'Verified Coach'}`}
              loading="lazy"
              decoding="async"
              width={320}
              height={192}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Clean Metadata Row (No floating badges) */}
          <div className="flex items-center justify-between text-xs text-[#5A5D62] pb-2 font-normal">
            <span>{getFormatLabel(primaryOffer?.type)}</span>
            {coach.verificationStatus === 'VERIFIED' && (
              <span className="font-medium text-[#14161A]">Verified</span>
            )}
          </div>

          {/* Coach Name & Headline: Inter only, hierarchy via size/weight/spacing */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-sans font-semibold text-base text-[#14161A] truncate">
                {coach.fullName}
              </h3>
              <span className="text-xs text-[#5A5D62] shrink-0 font-normal">
                @{coach.handle}
              </span>
            </div>

            <p className="text-xs text-[#5A5D62] font-sans font-normal line-clamp-1">
              {coach.headline || 'Coaching Practitioner'}
            </p>

            {/* Bio */}
            {coach.bio && (
              <p className="text-xs text-[#14161A]/80 line-clamp-2 pt-1 font-normal leading-relaxed">
                {coach.bio}
              </p>
            )}

            {/* Specialty Tags */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {coach.specialtyTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Credential - Clean typography, no icon-list */}
            {coach.credentials?.[0] && (
              <div className="pt-1 text-xs text-[#8B8D91] font-normal truncate">
                {coach.credentials[0]}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Pricing & Action (Signal-blue CTA) */}
        <div className="mt-5 pt-4 border-t border-[#E8E8E6] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-[#8B8D91] font-medium block">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-sans font-bold text-[#14161A]">
                ${primaryOffer?.price ? Number(primaryOffer.price) : 120}
              </span>
              <span className="text-[10px] text-[#8B8D91] font-sans">
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
