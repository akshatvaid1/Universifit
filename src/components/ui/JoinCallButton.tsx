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
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  }[buttonSize];

  return (
    <div className={`relative inline-flex flex-col items-start sm:items-end ${className}`}>
      {/* Active Time Window Status Badge */}
      {showBadge && (
        <div className="flex items-center gap-1.5 mb-1.5">
          {isActive ? (
            <motion.span
              initial={{ scale: 0.95 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Call Window Active
            </motion.span>
          ) : isUpcoming ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-[#F7F4EF]/60 border border-white/10">
              <Clock className="w-3 h-3 text-[#B8703F]" />
              {timeStatus.badgeText} ({timeStatus.startsInText})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] text-[#F7F4EF]/40 border border-white/5">
              <CheckCircle className="w-3 h-3 text-white/30" />
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative inline-flex items-center justify-center font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border border-emerald-400/40 shadow-emerald-500/25 ${sizeClasses}`}
            >
              <Video className="w-4 h-4 text-white fill-current" />
              <span>Join Google Meet</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-100" />
            </motion.button>
          </a>
        ) : (
          <button
            type="button"
            disabled={!isActive}
            className={`relative inline-flex items-center justify-center font-semibold rounded-xl transition-all cursor-not-allowed select-none bg-white/[0.04] text-[#F7F4EF]/40 border border-white/[0.08] ${sizeClasses}`}
          >
            {isUpcoming ? (
              <>
                <Lock className="w-3.5 h-3.5 text-[#F7F4EF]/30" />
                <span>Join Call ({timeStatus.startsInText})</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#F7F4EF]/30" />
                <span>Session Ended</span>
              </>
            )}
          </button>
        )}

        {/* Informative Tooltip on Hover */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute z-50 right-0 sm:right-0 bottom-full mb-2 w-64 p-2.5 rounded-xl bg-[#1A1C20] border border-white/15 text-xs text-[#F7F4EF] shadow-2xl pointer-events-none"
            >
              <div className="flex items-start gap-2">
                {isActive ? (
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B8703F] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    {isActive ? 'Room Ready for Call' : 'Google Meet Security Window'}
                  </p>
                  <p className="text-[11px] text-[#F7F4EF]/70 leading-relaxed">
                    {timeStatus.tooltip}
                  </p>
                  <p className="text-[10px] text-[#B8703F] font-mono">
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
