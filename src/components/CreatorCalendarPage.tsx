import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Share2,
  Lock,
  Crown,
  CalendarPlus,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui';
import { JoinCallButton } from './ui/JoinCallButton';
import {
  fetchCreatorById,
  fetchCreatorCalendarApi,
  rsvpEventApi,
  cancelRsvpApi,
  type CreatorCalendarEvent,
  type CreatorItem,
} from '../services/api';
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
  getMeetingTimeStatus,
} from '../utils/meetingUtils';
import { trackBook } from '../services/analytics';

interface CreatorCalendarPageProps {
  creatorId: string;
  onBack: () => void;
  onNavigateToOffer?: (offerId: string) => void;
  onNavigateToCommunity?: (creatorId: string) => void;
  onNavigateToProfile?: (creatorId: string) => void;
}

export const CreatorCalendarPage: React.FC<CreatorCalendarPageProps> = ({
  creatorId,
  onBack,
  onNavigateToCommunity,
  onNavigateToProfile,
}) => {
  const [creator, setCreator] = useState<CreatorItem | null>(null);
  const [events, setEvents] = useState<CreatorCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'PAID' | 'PAST'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'FREE' | 'PAID'>('FREE');
  const [rsvpLoadingEventId, setRsvpLoadingEventId] = useState<string | null>(null);
  const [, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [creatorRes, calendarRes] = await Promise.all([
        fetchCreatorById(creatorId),
        fetchCreatorCalendarApi(creatorId),
      ]);

      if (creatorRes) {
        setCreator(creatorRes);
      } else {
        setError('Creator not found');
      }

      if (calendarRes.success && calendarRes.data) {
        setEvents(calendarRes.data.events);
      }
    } catch (err) {
      console.debug('[CreatorCalendarPage]: Error loading calendar', err);
      setError('Unable to load calendar events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadData();
  }, [creatorId]);

  // Handle RSVP
  const handleRsvp = async (event: CreatorCalendarEvent) => {
    if (event.tierAccess === 'PAID' && userTier === 'FREE') {
      showToast('This event requires an Apex VIP Pass. Upgrade to RSVP.');
      return;
    }

    setRsvpLoadingEventId(event.id);
    try {
      const res = await rsvpEventApi(event.id);
      if (res.success) {
        trackBook('user-athlete', event.id, creatorId, String(event.scheduledAt));
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === event.id) {
              const newSpots = e.spotsLeft != null ? Math.max(0, e.spotsLeft - 1) : null;
              return {
                ...e,
                rsvpCount: e.rsvpCount + 1,
                spotsLeft: newSpots,
                myRSVP: {
                  id: res.data?.rsvp?.id || `rsvp-${Date.now()}`,
                  status: res.data?.rsvp?.status || 'GOING',
                  hasAttended: false,
                  joinToken: res.data?.rsvp?.joinToken || 'jt-demo',
                },
              };
            }
            return e;
          })
        );
        showToast(res.message || "RSVP confirmed! You're on the attendee list.");
      } else {
        showToast(res.error || 'Failed to RSVP.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error RSVPing to event.');
    } finally {
      setRsvpLoadingEventId(null);
    }
  };

  // Handle Cancel RSVP
  const handleCancelRsvp = async (event: CreatorCalendarEvent) => {
    setRsvpLoadingEventId(event.id);
    try {
      const res = await cancelRsvpApi(event.id);
      if (res.success) {
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === event.id) {
              const newSpots = e.spotsLeft != null ? e.spotsLeft + 1 : null;
              return {
                ...e,
                rsvpCount: Math.max(0, e.rsvpCount - 1),
                spotsLeft: newSpots,
                myRSVP: null,
              };
            }
            return e;
          })
        );
        showToast('RSVP cancelled.');
      }
    } catch (err: any) {
      showToast(err.message || 'Error cancelling RSVP.');
    } finally {
      setRsvpLoadingEventId(null);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast('Calendar link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredEvents = events.filter((e) => {
    const timeStatus = getMeetingTimeStatus(e.scheduledAt, e.durationMinutes);
    if (filter === 'UPCOMING') return timeStatus.status === 'UPCOMING';
    if (filter === 'LIVE') return timeStatus.isActive;
    if (filter === 'PAID') return e.tierAccess === 'PAID';
    if (filter === 'PAST') return timeStatus.status === 'EXPIRED';
    return true;
  });

  const liveEventsCount = events.filter((e) => getMeetingTimeStatus(e.scheduledAt, e.durationMinutes).isActive).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-32">
        <div className="border-b border-[#E8E8E6] bg-white py-4">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="h-4 w-32 bg-[#F7F7F5] rounded animate-pulse" />
            <div className="h-7 w-24 bg-[#F7F7F5] rounded-md animate-pulse" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="h-20 bg-white border border-[#E8E8E6] rounded-xl animate-pulse" />
          <div className="h-40 bg-white border border-[#E8E8E6] rounded-xl animate-pulse" />
          <div className="h-40 bg-white border border-[#E8E8E6] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-32 flex flex-col justify-center items-center px-4">
        <div className="p-8 max-w-lg w-full text-center space-y-5 bg-white border border-[#E8E8E6] rounded-xl my-16">
          <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-[#14161A] tracking-tight">
              Calendar Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-[#8B8D91] leading-relaxed font-normal">
              We were unable to load the event schedule for this creator. Please return to the coach profile or retry.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={onBack}>
              Return to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-32">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#14161A] text-white text-xs font-medium flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation & Status Bar */}
      <div className="border-b border-[#E8E8E6] bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] transition-colors cursor-pointer rounded px-1.5 py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Coach Profile</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Share Link */}
            <button
              onClick={handleShare}
              className="p-1.5 text-[#8B8D91] hover:text-[#14161A] transition-colors rounded hover:bg-[#F7F7F5] cursor-pointer"
              title="Share calendar"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Interactive Tier Switcher (For test verification of tier gating) */}
            <button
              onClick={() => {
                const nextTier = userTier === 'FREE' ? 'PAID' : 'FREE';
                setUserTier(nextTier);
                showToast(`Switched preview status to ${nextTier === 'PAID' ? 'VIP Member' : 'Free Member'}`);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                userTier === 'PAID'
                  ? 'bg-[#14161A] text-white border-[#14161A]'
                  : 'bg-white text-[#14161A] border-[#E8E8E6]'
              }`}
              title="Toggle membership tier to test VIP vs Free event RSVP"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{userTier === 'PAID' ? 'Apex VIP Pass' : 'Free Member'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <header className="bg-white border-b border-[#E8E8E6] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={creator.avatarUrl || '/chadtag.png'}
                alt={`${creator.fullName}'s profile photo`}
                className="w-16 h-16 rounded-xl object-cover border border-[#E8E8E6]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-[#14161A] tracking-tight">
                    {creator.fullName}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]">
                    Verified Coach
                  </span>
                </div>
                <p className="text-xs text-[#5A5D62] mt-0.5">
                  @{creator.handle} • Live Coaching & Group Masterclasses
                </p>
              </div>
            </div>

            {/* Quick Navigation Tabs */}
            <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E8E8E6]">
              {onNavigateToProfile && (
                <button
                  onClick={() => onNavigateToProfile(creator.id)}
                  className="px-3 py-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] border border-[#E8E8E6] rounded-md bg-white hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  Profile
                </button>
              )}
              {onNavigateToCommunity && (
                <button
                  onClick={() => onNavigateToCommunity(creator.id)}
                  className="px-3 py-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] border border-[#E8E8E6] rounded-md bg-white hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  Community
                </button>
              )}
              <button
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#14161A] rounded-md cursor-default"
              >
                Calendar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Section Heading & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E8E6]">
          <div>
            <h2 className="text-lg font-semibold text-[#14161A] tracking-tight">
              Live Sessions & Calendar
            </h2>
            <p className="text-xs text-[#8B8D91] mt-0.5">
              RSVP to live Q&As, form checks, and VIP clinics. Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {(['ALL', 'UPCOMING', 'LIVE', 'PAID', 'PAST'] as const).map((tab) => {
              const count =
                tab === 'ALL'
                  ? events.length
                  : tab === 'LIVE'
                  ? liveEventsCount
                  : tab === 'PAID'
                  ? events.filter((e) => e.tierAccess === 'PAID').length
                  : tab === 'UPCOMING'
                  ? events.filter((e) => getMeetingTimeStatus(e.scheduledAt, e.durationMinutes).status === 'UPCOMING').length
                  : events.filter((e) => getMeetingTimeStatus(e.scheduledAt, e.durationMinutes).status === 'EXPIRED').length;

              const label =
                tab === 'ALL'
                  ? 'All'
                  : tab === 'UPCOMING'
                  ? 'Upcoming'
                  : tab === 'LIVE'
                  ? 'Live Now'
                  : tab === 'PAID'
                  ? 'VIP Only'
                  : 'Past';

              const isActive = filter === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#14161A] text-white'
                      : 'bg-white text-[#8B8D91] hover:text-[#14161A] border border-[#E8E8E6]'
                  }`}
                >
                  {tab === 'LIVE' && liveEventsCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  <span>{label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-[#8B8D91]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Call Security Window Notice */}
        <div className="bg-[#F0F4FF] border border-[#D0DBFF] rounded-lg p-3.5 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#3652C4] shrink-0 mt-0.5" />
          <div className="text-xs text-[#14161A] space-y-0.5">
            <span className="font-semibold text-[#3652C4]">Automated Join Window Security:</span>{' '}
            <span className="text-[#14161A]/80">
              Google Meet rooms open <strong>15 minutes prior</strong> to scheduled start time and remain accessible up to <strong>60 minutes after</strong>. RSVP to receive automatic calendar alerts and private attendee access.
            </span>
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-[#E8E8E6] rounded-xl p-12 text-center space-y-3">
            <Calendar className="w-8 h-8 text-[#8B8D91] mx-auto stroke-1" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#14161A]">No events found</h3>
              <p className="text-xs text-[#8B8D91]">
                There are currently no sessions matching the "{filter.toLowerCase()}" filter.
              </p>
            </div>
            {filter !== 'ALL' && (
              <button
                onClick={() => setFilter('ALL')}
                className="text-xs font-medium text-[#3652C4] hover:underline pt-1 cursor-pointer"
              >
                View all sessions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt) => {
              const scheduledDate = new Date(evt.scheduledAt);
              const timeStatus = getMeetingTimeStatus(evt.scheduledAt, evt.durationMinutes);
              const isGoing = evt.myRSVP?.status === 'GOING';
              const isWaitlisted = evt.myRSVP?.status === 'WAITLISTED';
              const isVipRequired = evt.tierAccess === 'PAID';
              const canRsvp = !isVipRequired || userTier === 'PAID';

              // Date formatting
              const monthStr = scheduledDate.toLocaleDateString([], { month: 'short' }).toUpperCase();
              const dayStr = scheduledDate.getDate();
              const timeStr = scheduledDate.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              });
              const dayName = scheduledDate.toLocaleDateString([], { weekday: 'short' });

              return (
                <article
                  key={evt.id}
                  className={`bg-white border rounded-xl p-5 transition-all ${
                    timeStatus.isActive
                      ? 'border-[#3652C4] shadow-sm ring-1 ring-[#3652C4]/20'
                      : 'border-[#E8E8E6]'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    
                    {/* Date Block */}
                    <div className="md:col-span-3 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 border-b md:border-b-0 md:border-r border-[#E8E8E6] pb-3 md:pb-0 md:pr-4">
                      <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0">
                        <span className="text-[11px] font-bold tracking-wider text-[#3652C4]">
                          {monthStr}
                        </span>
                        <span className="text-2xl font-bold text-[#14161A] tracking-tight">
                          {dayStr}
                        </span>
                        <span className="text-xs text-[#8B8D91]">
                          {dayName} • {timeStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#8B8D91] md:mt-2">
                        <Clock className="w-3.5 h-3.5 text-[#8B8D91]" />
                        <span>{evt.durationMinutes} mins</span>
                      </div>

                      {evt.isRecurring && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#8B8D91] md:mt-1">
                          <RotateCcw className="w-3 h-3 text-[#8B8D91]" />
                          <span>Weekly session</span>
                        </span>
                      )}
                    </div>

                    {/* Main Event Info */}
                    <div className="md:col-span-6 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Live Now Tag */}
                        {timeStatus.isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0F4FF] text-[#3652C4] border border-[#D0DBFF]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3652C4] animate-pulse" />
                            Live Now
                          </span>
                        )}

                        {/* Tier Badge */}
                        {isVipRequired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#14161A] text-white">
                            <Crown className="w-3 h-3 text-amber-300" />
                            Apex VIP Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]">
                            Free for Community
                          </span>
                        )}

                        {/* RSVP Status Badge */}
                        {isGoing && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            You're Going
                          </span>
                        )}

                        {isWaitlisted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            Waitlisted
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-[#14161A] tracking-tight">
                        {evt.title}
                      </h3>

                      {evt.description && (
                        <p className="text-xs text-[#8B8D91] leading-relaxed">
                          {evt.description}
                        </p>
                      )}

                      {/* Capacity & Attendance Stats */}
                      <div className="flex items-center gap-4 text-xs text-[#8B8D91] pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#8B8D91]" />
                          <span>{evt.rsvpCount} RSVP'd</span>
                        </span>

                        {evt.capacity != null && (
                          <span>
                            {evt.spotsLeft != null && evt.spotsLeft > 0 ? (
                              <span className="text-emerald-600 font-medium">
                                {evt.spotsLeft} spot{evt.spotsLeft === 1 ? '' : 's'} left
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium">Capacity Full</span>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Attendee Calendar Integration Links (If RSVP'd) */}
                      {isGoing && (
                        <div className="pt-2 border-t border-[#E8E8E6] flex flex-wrap items-center gap-2">
                          <a
                            href={generateGoogleCalendarUrl({
                              title: evt.title,
                              startTime: evt.scheduledAt,
                              durationMinutes: evt.durationMinutes,
                              meetLink: evt.meetingUrl || 'https://meet.google.com',
                              coachName: creator.fullName,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#14161A] bg-[#F7F7F5] hover:bg-[#E8E8E6] border border-[#E8E8E6] rounded transition-colors no-underline"
                          >
                            <CalendarPlus className="w-3 h-3 text-[#3652C4]" />
                            <span>Add to Google Calendar</span>
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              downloadIcsFile({
                                id: evt.id,
                                title: evt.title,
                                startTime: evt.scheduledAt,
                                durationMinutes: evt.durationMinutes,
                                meetLink: evt.meetingUrl || 'https://meet.google.com',
                                coachName: creator.fullName,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#8B8D91] hover:text-[#14161A] bg-[#F7F7F5] hover:bg-[#E8E8E6] border border-[#E8E8E6] rounded transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-[#8B8D91]" />
                            <span>Download .ics</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="md:col-span-3 flex flex-col items-start md:items-end justify-between gap-3 w-full border-t md:border-t-0 pt-3 md:pt-0">
                      
                      {/* Join Call Button Component with strict time-windowing */}
                      <JoinCallButton
                        scheduledAt={evt.scheduledAt}
                        durationMinutes={evt.durationMinutes}
                        meetLink={evt.meetingUrl}
                        buttonSize="sm"
                        showBadge={true}
                        onJoinClick={() => showToast('Connecting to Google Meet room...')}
                      />

                      {/* RSVP Actions */}
                      <div className="w-full sm:w-auto flex flex-col items-start md:items-end gap-2 mt-2">
                        {isGoing ? (
                          <button
                            type="button"
                            disabled={rsvpLoadingEventId === evt.id}
                            onClick={() => handleCancelRsvp(evt)}
                            className="text-[11px] text-[#8B8D91] hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            Cancel RSVP
                          </button>
                        ) : isWaitlisted ? (
                          <button
                            type="button"
                            disabled={rsvpLoadingEventId === evt.id}
                            onClick={() => handleCancelRsvp(evt)}
                            className="text-[11px] text-[#8B8D91] hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            Leave Waitlist
                          </button>
                        ) : timeStatus.status === 'EXPIRED' ? (
                          <span className="text-xs text-[#8B8D91]">
                            Event concluded
                          </span>
                        ) : !canRsvp ? (
                          <div className="flex flex-col items-start md:items-end gap-1">
                            <span className="inline-flex items-center gap-1 text-xs text-[#8B8D91]">
                              <Lock className="w-3.5 h-3.5 text-[#8B8D91]" />
                              <span>VIP Tier Required</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setUserTier('PAID');
                                showToast('Upgraded to VIP Tier (Test mode). You can now RSVP!');
                              }}
                              className="text-xs font-medium text-[#3652C4] hover:underline cursor-pointer"
                            >
                              Unlock with VIP Pass
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={rsvpLoadingEventId === evt.id}
                            onClick={() => handleRsvp(evt)}
                            className="w-full sm:w-auto"
                          >
                            {rsvpLoadingEventId === evt.id
                              ? 'Confirming...'
                              : evt.spotsLeft === 0
                              ? 'Join Waitlist'
                              : 'RSVP to Session'}
                          </Button>
                        )}
                      </div>

                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
};
