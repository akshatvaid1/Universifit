import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  CreditCard,
  Play,
  Download,
  Zap,
  Plus,
  RotateCcw,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  MessageSquare,
  Star,
  HelpCircle,
  Heart,
  Trash2,
  Bookmark,
  Award,
  RefreshCw,
  XCircle,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { Card, Badge, Button, ProgressBar, JoinCallButton } from './ui';
import { ReviewModal } from './ReviewModal';
import { generateGoogleCalendarUrl } from '../utils/meetingUtils';
import {
  fetchBuyerDashboardData,
  fetchWishlistApi,
  removeFromWishlistApi,
  getCourseCertificateDownloadUrl,
  fetchUserSubscriptionsApi,
  cancelSubscriptionApi,
  pauseSubscriptionApi,
  resumeSubscriptionApi,
  type BuyerDashboardData,
  type BuyerSubscriptionItem,
  type WishlistItem,
  SAMPLE_BUYER_DASHBOARD,
  SAMPLE_WISHLIST_ITEMS,
} from '../services/api';

interface MySpaceDashboardProps {
  onResumeCourse?: (courseId: string) => void;
  onExploreMore?: () => void;
  onOpenMessages?: (partnerId?: string, contextTitle?: string) => void;
  onOpenSupport?: (category?: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER', refId?: string) => void;
  onSelectCreator?: (creatorId: string) => void;
}

export const MySpaceDashboard: React.FC<MySpaceDashboardProps> = ({
  onResumeCourse,
  onExploreMore,
  onOpenMessages,
  onOpenSupport,
  onSelectCreator,
}) => {
  const [data, setData] = useState<BuyerDashboardData>(SAMPLE_BUYER_DASHBOARD);
  const [subscriptions, setSubscriptions] = useState<BuyerSubscriptionItem[]>(
    SAMPLE_BUYER_DASHBOARD.subscriptions || []
  );
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(SAMPLE_WISHLIST_ITEMS);
  const [activeTab, setActiveTab] = useState<'courses' | 'subscriptions' | 'bookings' | 'purchases' | 'saved'>('courses');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Self-Serve Subscription Cancel Modal State
  const [cancelModalState, setCancelModalState] = useState<{
    isOpen: boolean;
    subscription?: BuyerSubscriptionItem;
    isSubmitting: boolean;
    successMessage?: string;
  }>({
    isOpen: false,
    isSubmitting: false,
  });

  // Review Modal State (F16)
  const [reviewModalState, setReviewModalState] = useState<{
    isOpen: boolean;
    creatorId: string;
    creatorName: string;
    programTitle: string;
    enrollmentId?: string;
    bookingId?: string;
  }>({
    isOpen: false,
    creatorId: '',
    creatorName: '',
    programTitle: '',
  });

  const loadDashboardData = () => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      fetchBuyerDashboardData().catch((err) => {
        console.debug('fetchBuyerDashboardData error', err);
        return null;
      }),
      fetchWishlistApi().catch((err) => {
        console.debug('fetchWishlistApi error', err);
        return { success: true, data: SAMPLE_WISHLIST_ITEMS, count: SAMPLE_WISHLIST_ITEMS.length };
      }),
      fetchUserSubscriptionsApi().catch((err) => {
        console.debug('fetchUserSubscriptionsApi error', err);
        return { success: true, data: SAMPLE_BUYER_DASHBOARD.subscriptions || [], count: 0 };
      }),
    ])
      .then(([dashboardRes, wishlistRes, subscriptionsRes]) => {
        if (dashboardRes) setData(dashboardRes);
        if (wishlistRes && wishlistRes.data) setWishlistItems(wishlistRes.data);
        if (subscriptionsRes && subscriptionsRes.data) setSubscriptions(subscriptionsRes.data);
      })
      .catch((err) => {
        console.debug('Dashboard data loading error', err);
        setError('Network interruption while syncing your member space');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCancelSubscription = async (enrollmentId: string, cancelAtCycleEnd = true) => {
    setCancelModalState((prev) => ({ ...prev, isSubmitting: true, successMessage: undefined }));
    try {
      const res = await cancelSubscriptionApi(enrollmentId, cancelAtCycleEnd);
      // Optimistic update
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === enrollmentId
            ? {
                ...sub,
                status: cancelAtCycleEnd ? sub.status : 'CANCELLED',
                cancelAtPeriodEnd: cancelAtCycleEnd,
              }
            : sub
        )
      );
      setCancelModalState((prev) => ({
        ...prev,
        isSubmitting: false,
        successMessage: res.message || 'Subscription cancelled successfully.',
      }));
      setTimeout(() => {
        setCancelModalState({ isOpen: false, isSubmitting: false });
      }, 1800);
    } catch (err: any) {
      console.debug('Failed to cancel subscription', err);
      setCancelModalState((prev) => ({
        ...prev,
        isSubmitting: false,
        successMessage: 'Error processing cancellation. Please contact concierge support.',
      }));
    }
  };

  const handlePauseSubscription = async (enrollmentId: string) => {
    // Optimistic pause
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === enrollmentId ? { ...sub, status: 'PAUSED' } : sub))
    );
    try {
      await pauseSubscriptionApi(enrollmentId);
    } catch (err) {
      console.debug('Failed to pause subscription', err);
    }
  };

  const handleResumeSubscription = async (enrollmentId: string) => {
    // Optimistic resume
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === enrollmentId ? { ...sub, status: 'ACTIVE' } : sub))
    );
    try {
      await resumeSubscriptionApi(enrollmentId);
    } catch (err) {
      console.debug('Failed to resume subscription', err);
    }
  };

  const handleRemoveFromWishlist = async (offerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic removal
    setWishlistItems((prev) => prev.filter((item) => item.offerId !== offerId && item.offer?.id !== offerId));
    try {
      await removeFromWishlistApi(offerId);
    } catch (err) {
      console.debug('Failed to remove from wishlist', err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32">
        {/* Top Welcome Skeleton */}
        <section className="bg-gradient-to-b from-[#16171A] to-[#121315] pt-10 pb-12 border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.05]" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/[0.08] rounded-lg" />
                <div className="h-4 w-32 bg-white/[0.04] rounded" />
              </div>
            </div>

            {/* Quick Metrics Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <Card key={n} variant="charcoal" className="p-5 bg-[#16171A] border-white/[0.08] h-24" />
              ))}
            </div>
          </div>
        </section>

        {/* Tab Cards Skeletons */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map((n) => (
              <Card key={n} variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] h-72" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32 flex flex-col justify-center items-center px-4">
        <Card
          variant="charcoal"
          className="p-8 sm:p-10 max-w-lg w-full text-center space-y-6 border-rose-500/30 bg-[#16171A] shadow-2xl my-16"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Unable to Load Member Space
            </h1>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
              We encountered a network issue while querying your enrolled programs and session calendar. Check your connection or tap below to retry.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={loadDashboardData}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retry Loading My Space
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={onExploreMore}
            >
              Explore Discover Catalog
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32">
      
      {/* Top Welcome Header Bar */}
      <section className="bg-gradient-to-b from-[#16171A] to-[#121315] pt-10 pb-12 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* User Profile & Reputation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar with Points Badge */}
              <div className="relative shrink-0">
                <img
                  src={data.user.avatarUrl}
                  alt={`${data.user.name} profile photo`}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/15 shadow-xl"
                />
                <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#B8703F] text-white shadow-md flex items-center gap-0.5">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>{data.user.points}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF]">
                    Welcome back, {data.user.name.split(' ')[0]}
                  </h1>
                  <Badge variant="copper" size="sm">
                    {data.user.tier}
                  </Badge>
                </div>
                <p className="text-xs text-[#F7F4EF]/60 font-mono">
                  {data.user.email} • Member Space
                </p>
              </div>
            </div>

            {/* Quick Action: Explore More Coaches & Messages & Support */}
            <div className="flex items-center gap-3">
              {onOpenSupport && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => onOpenSupport('OTHER')}
                  leftIcon={<HelpCircle className="w-4 h-4 text-[#6E8B6F]" />}
                >
                  Help Desk
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => onOpenMessages && onOpenMessages()}
                leftIcon={<MessageSquare className="w-4 h-4 text-[#B8703F]" />}
              >
                Coach Messages
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={onExploreMore}
                leftIcon={<Plus className="w-4 h-4 text-[#B8703F]" />}
              >
                Explore New Protocols
              </Button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-[#F7F4EF]/50 font-medium block">
                  Active Curriculums
                </span>
                <span className="text-2xl font-display font-bold text-[#F7F4EF] mt-0.5 block">
                  {data.stats.enrolledCoursesCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#B8703F]/15 text-[#B8703F] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </Card>

            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-[#F7F4EF]/50 font-medium block">
                  Upcoming 1:1 Sessions
                </span>
                <span className="text-2xl font-display font-bold text-[#6E8B6F] mt-0.5 block">
                  {data.stats.activeBookingsCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#6E8B6F]/15 text-[#6E8B6F] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </Card>

            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-[#F7F4EF]/50 font-medium block">
                  Hours Mastered
                </span>
                <span className="text-2xl font-display font-bold text-sky-400 mt-0.5 block">
                  {data.stats.totalHoursLearned} hrs
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </Card>

          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] pt-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'courses'
                  ? 'text-[#B8703F]'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Enrolled Courses ({data.enrolledCourses.length})</span>
              {activeTab === 'courses' && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'subscriptions'
                  ? 'text-[#B8703F]'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Subscriptions & Coaching ({subscriptions.length})</span>
              {activeTab === 'subscriptions' && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'bookings'
                  ? 'text-[#B8703F]'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Sessions & Bookings ({data.upcomingBookings.length})</span>
              {activeTab === 'bookings' && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'purchases'
                  ? 'text-[#B8703F]'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Purchase History ({data.purchaseHistory.length})</span>
              {activeTab === 'purchases' && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'saved'
                  ? 'text-[#B8703F]'
                  : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Saved ({wishlistItems.length})</span>
              {activeTab === 'saved' && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]"
                />
              )}
            </button>
          </div>

        </div>
      </section>

      {/* Tab Contents Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ========================================================================= */}
        {/* TAB 1: ENROLLED COURSES (B3) */}
        {/* ========================================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                Your Learning Programs
              </h2>
              <span className="text-xs text-[#F7F4EF]/50">
                Pulls real progress from B3 /users/me/progress
              </span>
            </div>

            {data.enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.enrolledCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      variant="charcoal"
                      className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5 flex flex-col justify-between h-full"
                    >
                      <div className="space-y-4">
                        {/* Top Thumbnail & Coach Header */}
                        <div className="relative h-44 rounded-2xl overflow-hidden bg-neutral-900">
                          <img
                            src={course.thumbnailUrl}
                            alt={`${course.title} curriculum cover`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#16171A] via-black/20 to-transparent" />

                          {/* Coach Floating Pill */}
                          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-white">
                            <img
                              src={course.coachAvatar}
                              alt={`Coach ${course.coachName}`}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>{course.coachName}</span>
                          </div>

                          {/* Last Accessed Pill */}
                          <div className="absolute bottom-3 left-3 text-[11px] font-medium text-white/70 bg-black/60 px-2.5 py-1 rounded-md">
                            Last active: {course.lastAccessedAt}
                          </div>
                        </div>

                        {/* Course Title & Lessons Count */}
                        <div>
                          <h3 className="text-lg font-display font-bold text-[#F7F4EF] leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[#F7F4EF]/60 mt-1">
                            {course.completedLessons} of {course.totalLessons} Lessons Completed
                          </p>
                        </div>

                        {/* REUSED PROGRESS BAR PRIMITIVE */}
                        <ProgressBar
                          value={course.progressPercent}
                          variant={course.progressPercent === 100 ? 'sage' : 'copper'}
                          size="md"
                          showLabel
                          label="Curriculum Mastery"
                        />

                        {/* Next Up Lesson Cue */}
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#B8703F] tracking-wider block">
                            Up Next
                          </span>
                          <p className="font-semibold text-[#F7F4EF] truncate">
                            {course.nextLessonTitle}
                          </p>
                        </div>
                      </div>

                        {/* Resume CTA, Rate & Message Coach, Certificate */}
                        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onOpenMessages &&
                                onOpenMessages(
                                  course.coachName.includes('Marcus') ? 'creator-marcus' : 'creator-kai',
                                  course.title
                                )
                              }
                              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#B8703F]" />}
                            >
                              Message
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setReviewModalState({
                                  isOpen: true,
                                  creatorId: course.coachName.includes('Marcus') ? 'creator-marcus' : 'creator-kai',
                                  creatorName: course.coachName,
                                  programTitle: course.title,
                                  enrollmentId: course.id,
                                })
                              }
                              leftIcon={<Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                            >
                              Rate
                            </Button>

                            {course.progressPercent === 100 && (
                              <a
                                href={getCourseCertificateDownloadUrl(course.courseId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="no-underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B8703F]/20 hover:bg-[#B8703F]/30 text-[#D48B59] hover:text-[#e5a073] border border-[#B8703F]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                                title="Download Certificate of Completion"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Certificate</span>
                              </a>
                            )}
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onResumeCourse && onResumeCourse(course.courseId)}
                            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                          >
                            Enter Classroom
                          </Button>
                        </div>

                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* EMPTY STATE: "no enrollments yet" */
              <Card
                variant="charcoal"
                className="py-16 px-6 text-center max-w-lg mx-auto space-y-5 my-6 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-[#F7F4EF] tracking-tight">
                    no enrollments yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed max-w-md mx-auto">
                    You haven't enrolled in any coaching curriculums or video programs yet. Connect with a verified coach to kick off your protocol.
                  </p>
                </div>
                <div className="pt-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onExploreMore}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Explore Discover Catalog &rarr;
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1.5: ACTIVE SUBSCRIPTIONS & RECURRING COACHING */}
        {/* ========================================================================= */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Active Subscriptions & Monthly Coaching
                </h2>
                <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                  Manage recurring 1:1 coaching cohorts, auto-renewals, and self-serve cancellations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#6E8B6F] bg-[#6E8B6F]/10 border border-[#6E8B6F]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Razorpay Subscriptions Secured
                </span>
              </div>
            </div>

            {subscriptions.length > 0 ? (
              <div className="space-y-5">
                {subscriptions.map((sub) => {
                  const isActive = sub.status === 'ACTIVE';
                  const isPaused = sub.status === 'PAUSED';
                  const isCancelled = sub.status === 'CANCELLED';

                  const periodStartDate = sub.currentPeriodStart
                    ? new Date(sub.currentPeriodStart).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Current Month';
                  const periodEndDate = sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Next Billing Cycle';

                  return (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card
                        variant="charcoal"
                        className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5 relative overflow-hidden"
                      >
                        {/* Cancellation Scheduled Warning Banner */}
                        {sub.cancelAtPeriodEnd && (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                <strong>Cancellation Pending:</strong> Your coaching access remains fully active until <strong>{periodEndDate}</strong>. No future charges will be billed.
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResumeSubscription(sub.id)}
                              className="text-xs shrink-0 border-amber-500/40 hover:bg-amber-500/20 text-amber-300"
                            >
                              Undo & Keep Active
                            </Button>
                          </div>
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Left: Coach & Offer Details */}
                          <div className="flex items-start gap-4">
                            <img
                              src={sub.coachAvatar}
                              alt={`Coach ${sub.coachName}`}
                              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10 shrink-0"
                            />
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isActive && !sub.cancelAtPeriodEnd && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#6E8B6F] animate-pulse" />
                                    ACTIVE SUBSCRIPTION
                                  </span>
                                )}
                                {sub.cancelAtPeriodEnd && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    CANCELS AT CYCLE END
                                  </span>
                                )}
                                {isPaused && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    MEMBERSHIP PAUSED
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    CANCELLED
                                  </span>
                                )}

                                <span className="text-xs text-[#F7F4EF]/50 font-mono">
                                  {sub.format || '1:1 Coaching Plan'}
                                </span>
                              </div>

                              <h3 className="text-lg font-display font-bold text-[#F7F4EF]">
                                {sub.offerTitle}
                              </h3>

                              <p className="text-xs text-[#B8703F] font-medium">
                                Direct Coach: {sub.coachName} ({sub.coachHeadline})
                              </p>

                              {/* Billing Cycle Details */}
                              <div className="flex items-center gap-4 text-xs text-[#F7F4EF]/60 pt-1 flex-wrap">
                                <div className="flex items-center gap-1.5 font-mono text-white/80">
                                  <Calendar className="w-3.5 h-3.5 text-[#B8703F]" />
                                  <span>Cycle: {periodStartDate} – {periodEndDate}</span>
                                </div>
                                <span className="text-white/20">•</span>
                                <div className="font-mono text-[#B8703F] font-bold">
                                  ${sub.amount} {sub.currency} / {sub.billingInterval || 'month'}
                                </div>
                                {sub.razorpaySubscriptionId && (
                                  <>
                                    <span className="text-white/20">•</span>
                                    <span className="text-[11px] font-mono text-[#F7F4EF]/40">
                                      ID: {sub.razorpaySubscriptionId}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2.5 shrink-0 flex-wrap lg:flex-nowrap">
                            <Button
                              variant="ghost"
                              size="md"
                              onClick={() =>
                                onOpenMessages &&
                                onOpenMessages(sub.coachId, sub.offerTitle)
                              }
                              leftIcon={<MessageSquare className="w-4 h-4 text-[#B8703F]" />}
                            >
                              Message Coach
                            </Button>

                            {isActive && !sub.cancelAtPeriodEnd && (
                              <Button
                                variant="outline"
                                size="md"
                                onClick={() => handlePauseSubscription(sub.id)}
                                leftIcon={<PauseCircle className="w-4 h-4 text-amber-400" />}
                              >
                                Pause
                              </Button>
                            )}

                            {isPaused && (
                              <Button
                                variant="outline"
                                size="md"
                                onClick={() => handleResumeSubscription(sub.id)}
                                leftIcon={<PlayCircle className="w-4 h-4 text-[#6E8B6F]" />}
                              >
                                Resume
                              </Button>
                            )}

                            {!isCancelled && !sub.cancelAtPeriodEnd && (
                              <Button
                                variant="outline"
                                size="md"
                                onClick={() =>
                                  setCancelModalState({
                                    isOpen: true,
                                    subscription: sub,
                                    isSubmitting: false,
                                  })
                                }
                                className="border-rose-500/30 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300"
                                leftIcon={<XCircle className="w-4 h-4" />}
                              >
                                Cancel Subscription
                              </Button>
                            )}

                            {onOpenSupport && (
                              <Button
                                variant="ghost"
                                size="md"
                                onClick={() => onOpenSupport('PAYMENT_ISSUE', sub.id)}
                                leftIcon={<HelpCircle className="w-4 h-4 text-[#F7F4EF]/50" />}
                              >
                                Support
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card
                variant="charcoal"
                className="py-16 px-6 text-center max-w-lg mx-auto space-y-5 my-6 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-[#F7F4EF] tracking-tight">
                    No active subscriptions
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed max-w-md mx-auto">
                    You don't currently have any ongoing monthly coaching cohorts or recurring memberships.
                  </p>
                </div>
                <div className="pt-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onExploreMore}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Browse 1:1 Coaching Cohorts &rarr;
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UPCOMING BOOKINGS (B5) */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                Upcoming 1:1 Sessions & Video Calls
              </h2>
              <span className="text-xs text-[#F7F4EF]/50">
                Pulls from B5 /users/me/bookings
              </span>
            </div>

            {data.upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingBookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      variant="charcoal"
                      className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      {/* Booking Details Left */}
                      <div className="flex items-start gap-4">
                        <img
                          src={booking.coachAvatar}
                          alt={`Coach ${booking.coachName}`}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="verified" size="sm">
                              Confirmed Session
                            </Badge>
                            <span className="text-xs text-[#F7F4EF]/50 font-mono">
                              {booking.format}
                            </span>
                          </div>

                          <h3 className="text-lg font-display font-bold text-[#F7F4EF]">
                            {booking.offerTitle}
                          </h3>

                          <p className="text-xs text-[#B8703F] font-medium">
                            with Coach {booking.coachName} ({booking.coachHeadline})
                          </p>

                          <div className="flex items-center gap-3 text-xs font-semibold text-[#6E8B6F] pt-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{booking.scheduledAt.includes('T') ? new Date(booking.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : booking.scheduledAt}</span>
                            </div>
                            <span className="text-white/20">•</span>
                            <span className="text-[#B8703F] text-[11px] font-mono">
                              {booking.durationMinutes || 45} mins
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action CTAs Right */}
                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                        <Button
                          variant="ghost"
                          size="md"
                          onClick={() =>
                            setReviewModalState({
                              isOpen: true,
                              creatorId: booking.coachId,
                              creatorName: booking.coachName,
                              programTitle: booking.offerTitle,
                              bookingId: booking.id,
                            })
                          }
                          leftIcon={<Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        >
                          Rate Session
                        </Button>

                        <Button
                          variant="ghost"
                          size="md"
                          onClick={() =>
                            onOpenMessages &&
                            onOpenMessages(booking.coachId, booking.offerTitle)
                          }
                          leftIcon={<MessageSquare className="w-4 h-4 text-[#B8703F]" />}
                        >
                          Message
                        </Button>

                        <a
                          href={generateGoogleCalendarUrl({
                            title: booking.offerTitle,
                            startTime: booking.scheduledAt,
                            durationMinutes: booking.durationMinutes || 45,
                            meetLink: booking.meetLink || booking.meetingUrl || 'https://meet.google.com/asc-fit-sync',
                            coachName: booking.coachName,
                            studentName: data.user.name,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="no-underline"
                        >
                          <Button
                            variant="outline"
                            size="md"
                            leftIcon={<Calendar className="w-4 h-4 text-[#B8703F]" />}
                          >
                            + Google Calendar
                          </Button>
                        </a>

                        {/* TIME-WINDOWED JOIN CALL BUTTON */}
                        <JoinCallButton
                          meetLink={booking.meetLink || booking.meetingUrl || 'https://meet.google.com/asc-fit-sync'}
                          scheduledAt={booking.scheduledAt}
                          durationMinutes={booking.durationMinutes || 45}
                          buttonSize="md"
                        />
                      </div>

                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* EMPTY STATE: "no bookings yet" */
              <Card
                variant="charcoal"
                className="py-16 px-6 text-center max-w-lg mx-auto space-y-5 my-6 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-[#F7F4EF] tracking-tight">
                    no bookings yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed max-w-md mx-auto">
                    You have no upcoming 1-on-1 consultations or movement audits scheduled. Choose an available slot with your coach.
                  </p>
                </div>
                <div className="pt-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onExploreMore}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Find a Coach & Book a Slot
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PURCHASE & ORDER HISTORY (B6) */}
        {/* ========================================================================= */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                Billing & Purchase History
              </h2>
              <span className="text-xs text-[#F7F4EF]/50">
                Pulls payment records from B6 Razorpay orders
              </span>
            </div>

            {data.purchaseHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                      <th className="pb-3 px-4">Order ID</th>
                      <th className="pb-3 px-4">Program / Item</th>
                      <th className="pb-3 px-4">Coach</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {data.purchaseHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-mono font-semibold text-[#F7F4EF]">
                          <div>
                            <span>{item.orderId}</span>
                            {item.invoiceNumber && (
                              <span className="block text-[10px] text-[#B8703F] font-mono mt-0.5">
                                #{item.invoiceNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-white max-w-xs truncate">
                          <div>
                            <span>{item.programTitle}</span>
                            <span className="block text-[10px] text-[#F7F4EF]/40 font-normal mt-0.5">
                              SAC: 999293 (Coaching/Training)
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[#F7F4EF]/70">
                          {item.coachName}
                        </td>
                        <td className="py-4 px-4 text-[#F7F4EF]/50 font-mono">
                          {item.date}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-[#B8703F]">
                            ${item.amount} {item.currency}
                          </span>
                          <span className="block text-[10px] text-[#6E8B6F] font-mono mt-0.5">
                            Incl. 18% GST (${(item.amount - item.amount / 1.18).toFixed(2)})
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onOpenSupport && (
                              <button
                                type="button"
                                onClick={() => onOpenSupport('PAYMENT_ISSUE', item.orderId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#F7F4EF]/60 hover:text-white border border-white/10 text-[11px] font-medium transition-all cursor-pointer"
                                title="Report payment or access issue"
                              >
                                <span>Support</span>
                              </button>
                            )}
                            <a
                              href={item.invoicePdfUrl || item.invoiceUrl || `/api/invoices/${item.invoiceNumber || 'ASC-INV-2026-9842'}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-[#B8703F]/20 text-[#B8703F] hover:text-[#d48b59] border border-white/10 hover:border-[#B8703F]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>GST PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card
                variant="charcoal"
                className="py-16 px-6 text-center max-w-lg mx-auto space-y-5 my-6 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-[#F7F4EF] tracking-tight">
                    No purchases on record yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed max-w-md mx-auto">
                    When you enroll in masterclasses or book coaching packages, your itemized receipts and tax invoices will appear here.
                  </p>
                </div>
                <div className="pt-3">
                  <Button variant="outline" size="md" onClick={onExploreMore}>
                    Browse Available Offers
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SAVED PROGRAMS / WISHLIST */}
        {/* ========================================================================= */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Saved Programs & Coaching
                </h2>
                <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                  Protocols and coaching packages bookmarked from creator storefronts.
                </p>
              </div>
              <span className="text-xs font-mono text-[#B8703F] bg-[#B8703F]/10 border border-[#B8703F]/20 px-2.5 py-1 rounded-full">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
              </span>
            </div>

            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => {
                  const offer = item.offer;
                  if (!offer) return null;
                  const creator = offer.creator;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full"
                    >
                      <Card
                        variant="charcoal"
                        className="p-6 bg-[#16171A] border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between h-full shadow-lg relative group"
                      >
                        <div className="space-y-4">
                          {/* Coach Header & Remove Heart Button */}
                          <div className="flex items-start justify-between gap-3">
                            {creator ? (
                              <div
                                onClick={() => onSelectCreator && onSelectCreator(creator.id || creator.handle || '')}
                                className="flex items-center gap-3 cursor-pointer group/creator"
                              >
                                <img
                                  src={creator.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                                  alt={`Coach ${creator.user?.fullName || creator.handle}`}
                                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 group-hover/creator:ring-[#B8703F]/50 transition-all"
                                />
                                <div>
                                  <h4 className="text-sm font-bold text-white group-hover/creator:text-[#B8703F] transition-colors leading-snug">
                                    {creator.user?.fullName || creator.handle}
                                  </h4>
                                  <p className="text-[11px] text-[#F7F4EF]/50 font-mono">
                                    @{creator.handle || 'coach'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-[#B8703F]" />
                                <span className="text-xs font-semibold text-[#F7F4EF]/70">Verified Protocol</span>
                              </div>
                            )}

                            {/* Remove Action Button */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveFromWishlist(offer.id || item.offerId, e)}
                              className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-[#F7F4EF]/40 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Offer Title & Badges */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="copper" size="sm">
                                {offer.type === 'COURSE'
                                  ? 'Course'
                                  : offer.type === 'ONE_ON_ONE'
                                  ? '1:1 Coaching'
                                  : offer.type === 'COMMUNITY'
                                  ? 'Community'
                                  : 'Digital Asset'}
                              </Badge>
                              {offer.course?.title && (
                                <span className="text-[11px] font-mono text-[#F7F4EF]/50 truncate max-w-[140px]">
                                  {offer.course.title}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-[#F7F4EF] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                              {offer.title}
                            </h3>

                            <p className="text-xs text-[#F7F4EF]/60 line-clamp-2 leading-relaxed">
                              {offer.description}
                            </p>
                          </div>
                        </div>

                        {/* Card Bottom: Price & CTA */}
                        <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-[#F7F4EF]/40 block">
                              Investment
                            </span>
                            <span className="text-lg font-bold font-display text-[#B8703F]">
                              ${offer.price} <span className="text-xs font-normal text-[#F7F4EF]/60">{offer.currency || 'USD'}</span>
                            </span>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (creator && onSelectCreator) {
                                onSelectCreator(creator.id || creator.handle || '');
                              } else if (onExploreMore) {
                                onExploreMore();
                              }
                            }}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            View Program
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card
                variant="charcoal"
                className="py-16 px-6 text-center max-w-lg mx-auto space-y-5 my-6 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-[#F7F4EF] tracking-tight">
                    Your wishlist is empty
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed max-w-md mx-auto">
                    Browse our directory of verified coaches and save masterclasses, coaching protocols, or private consultations for future enrollment.
                  </p>
                </div>
                <div className="pt-3">
                  <Button variant="primary" size="md" onClick={onExploreMore}>
                    Browse Available Offers
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

      </main>

      {/* Review Modal for Course/Session Ratings (F16) */}
      <ReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState((prev) => ({ ...prev, isOpen: false }))}
        creatorId={reviewModalState.creatorId}
        creatorName={reviewModalState.creatorName}
        programTitle={reviewModalState.programTitle}
        enrollmentId={reviewModalState.enrollmentId}
        bookingId={reviewModalState.bookingId}
        onReviewSaved={() => {
          loadDashboardData();
        }}
      />

      {/* Self-Serve Subscription Cancellation Modal */}
      <AnimatePresence>
        {cancelModalState.isOpen && cancelModalState.subscription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#16171A] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setCancelModalState({ isOpen: false, isSubmitting: false })}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {cancelModalState.successMessage ? (
                /* Success Feedback */
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-bold text-white">
                      Subscription Cancelled
                    </h3>
                    <p className="text-xs text-[#F7F4EF]/70 max-w-sm mx-auto leading-relaxed">
                      {cancelModalState.successMessage}
                    </p>
                  </div>
                </div>
              ) : (
                /* Cancellation Confirmation Form */
                <>
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-[#F7F4EF] tracking-tight">
                      Cancel Coaching Subscription?
                    </h3>
                    <p className="text-xs text-[#F7F4EF]/60 leading-relaxed">
                      You are about to cancel auto-renewal for your monthly 1:1 coaching cohort with <strong>{cancelModalState.subscription.coachName}</strong>.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-[#F7F4EF]/60">Program:</span>
                      <span className="font-bold text-white">{cancelModalState.subscription.offerTitle}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-[#F7F4EF]/60">Monthly Investment:</span>
                      <span className="font-bold text-[#B8703F]">
                        ${cancelModalState.subscription.amount} {cancelModalState.subscription.currency} / {cancelModalState.subscription.billingInterval || 'month'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium pt-2 border-t border-white/[0.06]">
                      <span className="text-[#F7F4EF]/60">Access Active Through:</span>
                      <span className="font-mono font-bold text-[#6E8B6F]">
                        {cancelModalState.subscription.currentPeriodEnd
                          ? new Date(cancelModalState.subscription.currentPeriodEnd).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'End of current cycle'}
                      </span>
                    </div>
                  </div>

                  {/* Blueprint Terms Explainer */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed space-y-1">
                    <p className="font-bold text-amber-300">Phase 0 Self-Serve Policy:</p>
                    <p>
                      • You will retain full access to weekly form audits, direct WhatsApp messaging, and recorded curriculum until the current billing cycle expires.
                    </p>
                    <p>
                      • No further automatic payments will be charged to your card or UPI account.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="md"
                      disabled={cancelModalState.isSubmitting}
                      onClick={() => setCancelModalState({ isOpen: false, isSubmitting: false })}
                    >
                      Keep Membership
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={cancelModalState.isSubmitting}
                      onClick={() => handleCancelSubscription(cancelModalState.subscription!.id, true)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                      Confirm Cancellation
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
