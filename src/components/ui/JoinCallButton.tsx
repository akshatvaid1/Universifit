import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Lock, ExternalLink, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { getMeetingTimeStatus, type MeetingTimeStatus } from '../../utils/meetingUtils';

export interface JoinCallButtonProps {
  meetLink?: string;
  scheduledAt: string | Date;
  durationMinutes?: number;
  windowBeforeMinutes?: number;
  windowAfterMinutes?: number;
  buttonSize?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  onJoinClick?: () => void;
  className?: string;
}

export const JoinCallButton: React.FC<JoinCallButtonProps> = ({
  meetLink = 'https://meet.google.com/asc-fit-sync',
  scheduledAt,
  durationMinutes = 45,
  windowBeforeMinutes = 15,
  windowAfterMinutes = 60,
  buttonSize = 'md',
  showBadge = true,
  onJoinClick,
  className = '',
}) => {
  // Live state updated periodically
  const [timeStatus, setTimeStatus] = useState<MeetingTimeStatus>(() =>
    getMeetingTimeStatus(scheduledAt, durationMinutes, windowBeforeMinutes, windowAfterMinutes)
  );

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const update = () => {
      setTimeStatus(getMeetingTimeStatus(scheduledAt, durationMinutes, windowBeforeMinutes, windowAfterMinutes));
    };

    update();
    const interval = setInterval(update, 10000); // refresh status every 10s
    return () => clearInterval(interval);
  }, [scheduledAt, durationMinutes, windowBeforeMinutes, windowAfterMinutes]);

  const isActive = timeStatus.isActive;
  const isUpcoming = !isActive && timeStatus.status === 'UPCOMING';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-lg',
    lg: 'px-6 py-2.5 text-base gap-2.5 rounded-lg',
  }[buttonSize];

  return (
    <div className={`relative inline-flex flex-col items-start sm:items-end ${className}`}>
      {/* Active Time Window Status Badge */}
      {showBadge && (
        <div className="flex items-center gap-1.5 mb-1.5">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F4FF] text-[#3652C4] border border-[#D0DBFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3652C4] animate-pulse" />
              Live Call Window Active
            </span>
          ) : isUpcoming ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F7F7F5] text-[#8B8D91] border border-[#E8E8E6]">
              <Clock className="w-3 h-3 text-[#8B8D91]" />
              {timeStatus.badgeText} ({timeStatus.startsInText})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F7F7F5] text-[#8B8D91] border border-[#E8E8E6]">
              <CheckCircle className="w-3 h-3 text-[#8B8D91]" />
              Session Ended
            </span>
          )}
        </div>
      )}

      {/* Main Join Call Button or Locked Pill */}
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isActive ? (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onJoinClick}
            className="no-underline block"
          >
            <button
              type="button"
              className={`relative inline-flex items-center justify-center font-medium text-white transition-colors cursor-pointer bg-[#3652C4] hover:bg-[#2B42A4] active:bg-[#24378A] ${sizeClasses}`}
            >
              <Video className="w-4 h-4 text-white" />
              <span>Join Google Meet</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </button>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={`relative inline-flex items-center justify-center font-medium transition-colors cursor-not-allowed select-none bg-[#F7F7F5] text-[#8B8D91] border border-[#E8E8E6] ${sizeClasses}`}
          >
            {isUpcoming ? (
              <>
                <Lock className="w-3.5 h-3.5 text-[#8B8D91]" />
                <span>Join Call ({timeStatus.startsInText})</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#8B8D91]" />
                <span>Session Ended</span>
              </>
            )}
          </button>
        )}

        {/* Informative Tooltip on Hover */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 right-0 sm:right-0 bottom-full mb-2 w-64 p-3 rounded-lg bg-[#FFFFFF] border border-[#E8E8E6] text-xs text-[#14161A] shadow-md pointer-events-none"
            >
              <div className="flex items-start gap-2">
                {isActive ? (
                  <Sparkles className="w-4 h-4 text-[#3652C4] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#8B8D91] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-[#14161A]">
                    {isActive ? 'Room Ready for Call' : 'Google Meet Security Window'}
                  </p>
                  <p className="text-xs text-[#8B8D91] leading-relaxed">
                    {timeStatus.tooltip}
                  </p>
                  <p className="text-[11px] text-[#3652C4] font-mono">
                    Window: 15m prior &rarr; 60m post-slot
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
