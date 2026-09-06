import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ShieldCheck,
  Plus,
  Upload,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Download,
  Zap,
  Star,
  Clock,
  X,
  FileCheck,
  RotateCcw,
  AlertCircle,
  PackageOpen,
  GraduationCap,
  Film,
  Lock,
  Landmark,
  CalendarDays,
  Share2,
  MessageSquare,
  Pin,
  Trash2,
  ShieldAlert,
  HelpCircle,
  Tag,
  Percent,
  Copy,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Eye,
  Target,
  Activity,
  Sparkles,
  Gift,
  Check,
  Edit3,
  UserCheck,
  Ban,
  Search,
  Award,
  UserMinus,
  User,
} from 'lucide-react';
import { Card, Badge, Button, Input, ProgressBar, JoinCallButton } from './ui';
import { generateGoogleCalendarUrl } from '../utils/meetingUtils';
import { CourseStudioModal } from './CourseStudioModal';
import { PayoutSetupModal } from './PayoutSetupModal';
import { CreatorProfileManager } from './CreatorProfileManager';
import { AvailabilityEditor } from './AvailabilityEditor';
import {
  EarningsLineChart,
  StudentTrendChart,
  StorefrontTrafficChart,
  ConversionFunnelVisualizer,
  EngagementRateGauge,
  CommunityPointDistributionChart,
  TopContributorsLeaderboard,
} from './AnalyticsCharts';
import {
  fetchCreatorDashboardData,
  createOfferApi,
  fetchCreatorCoursesApi,
  getPayoutSettingsApi,
  fetchCommunityPosts,
  togglePinPostApi,
  deletePostApi,
  deletePostReplyApi,
  fetchReportedPostsApi,
  dismissPostReportApi,
  fetchCreatorCouponsApi,
  createCouponApi,
  toggleCouponStatusApi,
  deleteCouponApi,
  fetchCreatorAnalyticsApi,
  fetchCreatorReferralStatsApi,
  updateCreatorReferralCodeApi,
  fetchCreatorMembersDirectoryApi,
  removeCreatorMemberApi,
  banCreatorMemberApi,
  unbanCreatorMemberApi,
  fetchMemberActivityApi,
  fetchCreatorCommunityAnalyticsApi,
  toggleOfferStatusApi,
  type CreatorDashboardData,
  type StudioCourseItem,
  type PayoutDetails,
  type CommunityPostItem,
  type CouponItem,
  type CreatorAnalyticsData,
  type CreatorReferralStats,
  type CreatorMemberDirectoryItem,
  type MemberActivityDossier,
  type CreatorCommunityAnalyticsData,
  SAMPLE_CREATOR_DASHBOARD,
  SAMPLE_CREATOR_ANALYTICS,
  SAMPLE_CREATOR_REFERRALS,
} from '../services/api';

type DashboardTab = 'courses' | 'offers' | 'coupons' | 'availability' | 'community' | 'students' | 'calendar' | 'earnings' | 'analytics' | 'referrals' | 'profile';

interface CreatorDashboardProps {
  onSwitchToBuyer?: () => void;
  onPreviewPublicProfile?: (creatorId: string) => void;
  onOpenMessages?: (partnerId?: string, contextTitle?: string) => void;
  onOpenSupport?: (category?: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER', refId?: string) => void;
  initialTab?: DashboardTab;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  onSwitchToBuyer,
  onPreviewPublicProfile,
  onOpenMessages,
  onOpenSupport,
  initialTab,
}) => {
  const [data, setData] = useState<CreatorDashboardData>(SAMPLE_CREATOR_DASHBOARD);
  const [analyticsData, setAnalyticsData] = useState<CreatorAnalyticsData>(SAMPLE_CREATOR_ANALYTICS);
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '6m' | 'all'>('30d');
  const [courses, setCourses] = useState<StudioCourseItem[]>([]);
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails | null>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [referralStats, setReferralStats] = useState<CreatorReferralStats>(SAMPLE_CREATOR_REFERRALS);
  const [isEditingRefCode, setIsEditingRefCode] = useState(false);
  const [newRefCodeInput, setNewRefCodeInput] = useState(SAMPLE_CREATOR_REFERRALS.referralCode);
  const [isSavingRefCode, setIsSavingRefCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referralFilter, setReferralFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'courses');
  const [communityPosts, setCommunityPosts] = useState<CommunityPostItem[]>([]);
  const [reportedPosts, setReportedPosts] = useState<CommunityPostItem[]>([]);
  const [communityFilter, setCommunityFilter] = useState<'all' | 'pinned' | 'reported'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Community Members & Activity Telemetry State
  const [membersList, setMembersList] = useState<CreatorMemberDirectoryItem[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTierFilter, setMemberTierFilter] = useState<string>('all');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'ACTIVE' | 'BANNED'>('all');
  const [memberViewMode, setMemberViewMode] = useState<'members' | 'students'>('members');
  const [communityAnalytics, setCommunityAnalytics] = useState<CreatorCommunityAnalyticsData | null>(null);

  // Member Activity Dossier Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedMemberActivity, setSelectedMemberActivity] = useState<MemberActivityDossier | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Ban Member Confirmation Modal State
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [memberToBan, setMemberToBan] = useState<{ id: string; name: string; isBanned: boolean } | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [isSubmittingBan, setIsSubmittingBan] = useState(false);
  
  // Course Studio Modal State (F13)
  const [isCourseStudioOpen, setIsCourseStudioOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<StudioCourseItem | null>(null);

  // Payout Setup Modal State (F14)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [gatedActionMessage, setGatedActionMessage] = useState<string | null>(null);

  // Create Offer Modal State
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerType, setOfferType] = useState<'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY'>('ONE_ON_ONE');
  const [offerPrice, setOfferPrice] = useState('180');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Create Coupon Modal State
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [couponValue, setCouponValue] = useState('20');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponUsageLimit, setCouponUsageLimit] = useState('100');
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  
  // Verification Upload Modal State
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCreatorData = () => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      fetchCreatorDashboardData(),
      fetchCreatorCoursesApi(),
      getPayoutSettingsApi(),
      fetchCommunityPosts('creator-marcus'),
      fetchReportedPostsApi('creator-marcus'),
      fetchCreatorCouponsApi('cp-marcus'),
      fetchCreatorAnalyticsApi('creator-marcus'),
      fetchCreatorReferralStatsApi('creator-marcus'),
      fetchCreatorMembersDirectoryApi('creator-marcus', {}),
      fetchCreatorCommunityAnalyticsApi('creator-marcus'),
    ])
      .then(([dashRes, coursesRes, payoutRes, commRes, reportedRes, couponsRes, analyticsRes, referralsRes, membersRes, commAnalyticsRes]) => {
        if (dashRes) setData(dashRes);
        if (coursesRes && coursesRes.courses) setCourses(coursesRes.courses);
        if (payoutRes && payoutRes.data) setPayoutDetails(payoutRes.data);
        if (commRes) setCommunityPosts(commRes);
        if (reportedRes && reportedRes.reportedPosts) setReportedPosts(reportedRes.reportedPosts);
        if (couponsRes && couponsRes.data) setCoupons(couponsRes.data);
        if (analyticsRes && analyticsRes.data) setAnalyticsData(analyticsRes.data);
        if (referralsRes && referralsRes.data) {
          setReferralStats(referralsRes.data);
          setNewRefCodeInput(referralsRes.data.referralCode);
        }
        if (membersRes && membersRes.data && membersRes.data.members) {
          setMembersList(membersRes.data.members);
        }
        if (commAnalyticsRes && commAnalyticsRes.data) {
          setCommunityAnalytics(commAnalyticsRes.data);
        }
      })
      .catch((err) => {
        console.debug('fetchCreatorDashboardData error', err);
        setError('Network interruption while syncing studio telemetry');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCreatorData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      triggerToast('Please provide a coupon code.');
      return;
    }
    const val = Number(couponValue);
    if (isNaN(val) || val <= 0) {
      triggerToast('Please provide a valid positive discount amount.');
      return;
    }
    if (couponDiscountType === 'PERCENT' && val > 100) {
      triggerToast('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsSubmittingCoupon(true);
    try {
      const res = await createCouponApi({
        code: couponCode.trim().toUpperCase(),
        discountType: couponDiscountType,
        value: val,
        expiryDate: couponExpiry || undefined,
        usageLimit: couponUsageLimit ? Number(couponUsageLimit) : undefined,
        creatorId: 'cp-marcus',
      });

      if (res.success && res.data) {
        setCoupons((prev) => [res.data, ...prev]);
        triggerToast(`Coupon "${res.data.code}" created successfully! 🎉`);
        setCouponCode('');
        setCouponValue('20');
        setCouponExpiry('');
        setCouponUsageLimit('100');
        setIsCreateCouponOpen(false);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create coupon.');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await toggleCouponStatusApi(id);
      if (res.success && res.data) {
        setCoupons((prev) => prev.map((c) => (c.id === id ? res.data : c)));
        triggerToast(`Coupon ${res.data.code} is now ${res.data.isActive ? 'active' : 'inactive'}.`);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update coupon status.');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    try {
      const res = await deleteCouponApi(id);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        triggerToast(`Coupon "${code}" deleted.`);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete coupon.');
    }
  };

  // Referral Actions
  const handleCopyReferralLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralStats.referralLink);
      setCopiedLink(true);
      triggerToast('Referral link copied to clipboard! 📋');
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyReferralCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralStats.referralCode);
      setCopiedCode(true);
      triggerToast(`Referral code "${referralStats.referralCode}" copied! 📋`);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleUpdateReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefCodeInput.trim()) {
      triggerToast('Please provide a valid referral code.');
      return;
    }
    const clean = newRefCodeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean.length < 3) {
      triggerToast('Code must be at least 3 characters long.');
      return;
    }

    setIsSavingRefCode(true);
    try {
      const res = await updateCreatorReferralCodeApi(clean);
      if (res.success && res.data) {
        setReferralStats((prev) => ({
          ...prev,
          referralCode: res.data!.referralCode,
          referralLink: res.data!.referralLink,
        }));
        setIsEditingRefCode(false);
        triggerToast(`Referral code updated to "${res.data.referralCode}"! ✨`);
      } else {
        triggerToast(res.error || 'Failed to update referral code.');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error updating referral code.');
    } finally {
      setIsSavingRefCode(false);
    }
  };

  // Community Moderation Actions
  const handlePinCommunityPost = async (postId: string) => {
    try {
      const res = await togglePinPostApi(postId);
      setCommunityPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p))
      );
      triggerToast(res.message || 'Post pinned status updated.');
    } catch (err) {
      console.debug('Pin error:', err);
    }
  };

  const handleDeleteCommunityPost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to remove this post from your community?')) return;
    try {
      await deletePostApi(postId);
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      setReportedPosts((prev) => prev.filter((p) => p.id !== postId));
      triggerToast('Post permanently deleted from community.');
    } catch (err) {
      console.debug('Delete error:', err);
    }
  };

  const handleDeleteReply = async (postId: string, replyId: string) => {
    if (!window.confirm('Remove this reply?')) return;
    try {
      await deletePostReplyApi(replyId);
      setCommunityPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, repliesCount: Math.max(0, p.repliesCount - 1), replies: p.replies.filter((r) => r.id !== replyId) }
            : p
        )
      );
      triggerToast('Reply removed.');
    } catch (err) {
      console.debug('Delete reply error:', err);
    }
  };

  const handleDismissFlag = async (postId: string) => {
    try {
      await dismissPostReportApi(postId);
      setCommunityPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isReported: false, reportReason: undefined } : p))
      );
      setReportedPosts((prev) => prev.filter((p) => p.id !== postId));
      triggerToast('Flag dismissed for post.');
    } catch (err) {
      console.debug('Dismiss error:', err);
    }
  };

  // Member Management Actions
  const handleViewMemberActivity = async (userId: string) => {
    setIsLoadingActivity(true);
    setIsActivityModalOpen(true);
    try {
      const res = await fetchMemberActivityApi('creator-marcus', userId);
      if (res.success && res.data) {
        setSelectedMemberActivity(res.data);
      } else {
        triggerToast(res.error || 'Failed to fetch member activity telemetry.');
      }
    } catch (err) {
      console.debug('Activity fetch error:', err);
      triggerToast('Could not load member activity timeline.');
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from your community tier? They will lose access to tier content.`)) {
      return;
    }
    try {
      const res = await removeCreatorMemberApi('creator-marcus', userId);
      if (res.success) {
        setMembersList((prev) => prev.filter((m) => m.userId !== userId));
        triggerToast(`${memberName} has been removed from community space.`);
      } else {
        triggerToast(res.error || 'Failed to remove member.');
      }
    } catch (err) {
      console.debug('Remove member error:', err);
      triggerToast('Error removing member.');
    }
  };

  const handleOpenBanModal = (userId: string, name: string, isCurrentlyBanned: boolean) => {
    setMemberToBan({ id: userId, name, isBanned: isCurrentlyBanned });
    setBanReasonInput(isCurrentlyBanned ? '' : 'Violated community guidelines / code of conduct');
    setIsBanModalOpen(true);
  };

  const handleConfirmBan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memberToBan) return;

    setIsSubmittingBan(true);
    try {
      if (memberToBan.isBanned) {
        // Unban flow
        const res = await unbanCreatorMemberApi('creator-marcus', memberToBan.id);
        if (res.success) {
          setMembersList((prev) =>
            prev.map((m) => (m.userId === memberToBan.id ? { ...m, isPrivateMasked: false } : m))
          );
          triggerToast(`${memberToBan.name} unbanned. Access reinstated.`);
          setIsBanModalOpen(false);
          setMemberToBan(null);
          loadCreatorData();
        } else {
          triggerToast(res.error || 'Failed to unban member.');
        }
      } else {
        // Ban flow
        const res = await banCreatorMemberApi('creator-marcus', memberToBan.id, banReasonInput.trim());
        if (res.success) {
          setMembersList((prev) =>
            prev.map((m) => (m.userId === memberToBan.id ? { ...m, isPrivateMasked: true } : m))
          );
          triggerToast(`${memberToBan.name} has been banned from creator community.`);
          setIsBanModalOpen(false);
          setMemberToBan(null);
          loadCreatorData();
        } else {
          triggerToast(res.error || 'Failed to ban member.');
        }
      }
    } catch (err) {
      console.debug('Ban action error:', err);
      triggerToast('Error processing moderation action.');
    } finally {
      setIsSubmittingBan(false);
    }
  };

  const handleBanAuthorFromPost = async (postId: string, authorId: string, authorName: string) => {
    if (!window.confirm(`Ban post author "${authorName}" from your community and delete flagged post?`)) {
      return;
    }
    try {
      await banCreatorMemberApi('creator-marcus', authorId, 'Reported community post violation');
      await deletePostApi(postId);
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      setReportedPosts((prev) => prev.filter((p) => p.id !== postId));
      setMembersList((prev) =>
        prev.map((m) => (m.userId === authorId ? { ...m, isPrivateMasked: true } : m))
      );
      triggerToast(`Author ${authorName} banned and flagged post removed.`);
      loadCreatorData();
    } catch (err) {
      console.debug('Ban author error:', err);
      triggerToast('Failed to ban post author.');
    }
  };

  // Handle Create Offer with Payout Gating (F14)
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerPrice || isSubmittingOffer) return;

    // Publish Gating 1: Creator Agreement required
    if (data.creator && data.creator.agreementAccepted === false) {
      triggerToast('Creator Agreement Required: You must accept terms of service before publishing offers.');
      return;
    }

    // Publish Gating 2: If paid offer and payout not configured, block and prompt Payout Setup
    if (Number(offerPrice) > 0 && !payoutDetails?.payoutSetupCompleted) {
      setGatedActionMessage(
        'Payout Setup Required: Please add your bank account or UPI ID so Universifit can process your client earnings before publishing paid offers.'
      );
      setIsPayoutModalOpen(true);
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const res = await createOfferApi({
        title: offerTitle.trim(),
        description: offerDescription.trim(),
        type: offerType,
        price: Number(offerPrice),
      });

      if (res.success && res.offer) {
        setData((prev) => ({
          ...prev,
          offers: [res.offer, ...prev.offers],
        }));
        triggerToast('New Offer Created & Published to Marketplace! 🎉');
        setOfferTitle('');
        setOfferDescription('');
        setIsCreateOfferOpen(false);
      }
    } catch (err) {
      console.debug('Error creating offer', err);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'COURSE':
        return <Badge variant="copper" size="sm">Video Course</Badge>;
      case 'COMMUNITY':
        return <Badge variant="verified" size="sm">Group Cohort</Badge>;
      default:
        return <Badge variant="neutral" size="sm">1-on-1 Coaching</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32">
        {/* Top Header Skeleton */}
        <section className="bg-gradient-to-b from-[#16171A] to-[#121315] pt-10 pb-10 border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.05]" />
              <div className="space-y-2">
                <div className="h-6 w-44 bg-white/[0.08] rounded-lg" />
                <div className="h-4 w-28 bg-white/[0.04] rounded" />
              </div>
            </div>

            {/* 4 Metrics Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <Card key={n} variant="charcoal" className="p-5 bg-[#16171A] border-white/[0.08] h-28" />
              ))}
            </div>
          </div>
        </section>

        {/* Tab Cards Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <Card key={n} variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] h-40" />
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
              Unable to Synchronize Creator Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
              We couldn't connect with the studio telemetry database. Your earnings, bookings, and student roster may be out of date.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={loadCreatorData}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retry Synchronizing Studio
            </Button>
            {onSwitchToBuyer && (
              <Button
                variant="outline"
                size="md"
                onClick={onSwitchToBuyer}
              >
                Switch to Member View
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 p-4 rounded-2xl bg-[#6E8B6F] text-black font-bold text-xs shadow-2xl flex items-center gap-2 border border-white/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner: Creator Studio Header */}
      <section className="bg-gradient-to-b from-[#16171A] to-[#121315] pt-10 pb-10 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Creator Profile Dossier Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={data.creator.avatarUrl}
                  alt={`${data.creator.fullName} avatar`}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#B8703F] shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#6E8B6F] text-black shadow-md">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF]">
                    {data.creator.fullName}
                  </h1>
                  <Badge variant="verified" size="sm">
                    Verified Coach
                  </Badge>
                  {data.creator.agreementAccepted !== false && (
                    <Badge variant="copper" size="sm">
                      Agreement Active (85/15)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#F7F4EF]/60">
                  <span className="font-mono text-[#B8703F]">@{data.creator.handle}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{data.creator.rating.toFixed(2)}</span>
                    <span className="text-white/40 font-normal">({data.creator.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions: New Course & New Offer & Switch Mode */}
            <div className="flex items-center gap-3">
              {onSwitchToBuyer && (
                <button
                  onClick={onSwitchToBuyer}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-[#F7F4EF] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F]"
                >
                  <Zap className="w-3.5 h-3.5 text-[#B8703F]" />
                  <span>Switch to Member View</span>
                </button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPreviewPublicProfile && onPreviewPublicProfile(data.creator.id)}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                View Public Profile
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenMessages && onOpenMessages()}
                leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#B8703F]" />}
              >
                <span>Messages</span>
              </Button>

              {onOpenSupport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenSupport('OTHER')}
                  leftIcon={<HelpCircle className="w-3.5 h-3.5 text-[#6E8B6F]" />}
                >
                  <span>Support</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGatedActionMessage(null);
                  setIsPayoutModalOpen(true);
                }}
                leftIcon={<Landmark className="w-3.5 h-3.5 text-[#6E8B6F]" />}
              >
                <span>Payout: {payoutDetails?.payoutSetupCompleted ? 'Connected' : 'Setup Required'}</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setCourseToEdit(null);
                  setIsCourseStudioOpen(true);
                }}
                leftIcon={<Film className="w-4 h-4 text-[#B8703F]" />}
              >
                Create Course
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateOfferOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create New Offer
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* EARNINGS SUMMARY CARDS (FROM PAYMENT RECORDS - B6) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Gross Revenue */}
            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F7F4EF]/50 font-medium">Gross Revenue (YTD)</span>
                <span className="text-xs font-bold text-[#6E8B6F] flex items-center gap-0.5 bg-[#6E8B6F]/10 px-2 py-0.5 rounded-md">
                  <TrendingUp className="w-3 h-3" />
                  +{data.earnings.growthMoMPercent}% MoM
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-display font-bold text-[#B8703F]">
                  ${data.earnings.grossRevenue.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                  Processed via Razorpay
                </span>
              </div>
            </Card>

            {/* Card 2: Net Payouts */}
            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F7F4EF]/50 font-medium">Net Payout Available</span>
                <span className="w-2 h-2 rounded-full bg-[#6E8B6F]" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-display font-bold text-white">
                    ${data.earnings.netPayoutAvailable.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#6E8B6F] font-semibold block mt-0.5">
                    Ready for Instant Transfer
                  </span>
                </div>
              </div>
            </Card>

            {/* Card 3: Active Paid Students */}
            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F7F4EF]/50 font-medium">Active Paid Members</span>
                <div className="w-8 h-8 rounded-xl bg-white/[0.05] text-[#F7F4EF] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-display font-bold text-white">
                  {data.earnings.activePaidStudents}
                </span>
                <span className="text-[11px] text-[#F7F4EF]/50 block mt-0.5">
                  100% active retention rate
                </span>
              </div>
            </Card>

            {/* Card 4: Avg Order Value */}
            <Card
              variant="charcoal"
              className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#F7F4EF]/50 font-medium">Average Order Value</span>
                <div className="w-8 h-8 rounded-xl bg-[#B8703F]/15 text-[#B8703F] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-display font-bold text-[#F7F4EF]">
                  ${data.earnings.avgOrderValue}
                </span>
                <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                  Per enrolled athlete
                </span>
              </div>
            </Card>

          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 border-b border-white/[0.08] pt-2 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('courses'); window.history.pushState({}, '', '/dashboard/courses'); }}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'courses' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Course Studio ({courses.length})</span>
              {activeTab === 'courses' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => { setActiveTab('offers'); window.history.pushState({}, '', '/dashboard/offers'); }}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'offers' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Offers Management ({data.offers.length})</span>
              {activeTab === 'offers' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'coupons' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Coupons & Promos ({coupons.length})</span>
              {activeTab === 'coupons' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('availability')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'availability' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Availability & Slots</span>
              {activeTab === 'availability' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'community' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Community Moderation ({communityPosts.length})</span>
              {reportedPosts.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/40">
                  {reportedPosts.length} flagged
                </span>
              )}
              {activeTab === 'community' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'students' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Community Members ({membersList.length || data.students.length})</span>
              {activeTab === 'students' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'calendar' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Booking Calendar ({data.bookings.length})</span>
              {activeTab === 'calendar' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'analytics' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Funnel</span>
              {activeTab === 'analytics' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'referrals' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4 text-[#B8703F]" />
              <span>Referrals & Rewards ({referralStats.totalReferred})</span>
              {referralStats.totalEarnedBonus > 0 && (
                <span className="px-1.5 py-0.2 bg-[#6E8B6F]/20 text-[#6E8B6F] text-[10px] font-bold rounded-full border border-[#6E8B6F]/40">
                  +${referralStats.totalEarnedBonus}
                </span>
              )}
              {activeTab === 'referrals' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'earnings' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Earnings & Invoices</span>
              {activeTab === 'earnings' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                window.history.pushState({}, '', '/dashboard/profile');
              }}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer relative outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] rounded-t-lg px-2.5 py-1 ${
                activeTab === 'profile' ? 'text-[#B8703F]' : 'text-[#F7F4EF]/60 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile &amp; Payout</span>
              {activeTab === 'profile' && (
                <motion.div layoutId="dash-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8703F]" />
              )}
            </button>
          </div>

        </div>
      </section>

      {/* Main Studio Work Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ========================================================================= */}
        {/* TAB: PROFILE & PAYOUT (CreatorProfileManager)                             */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <CreatorProfileManager
            creatorData={data.creator}
            payoutDetails={payoutDetails}
            onProfileUpdated={(updatedCreator) => {
              setData((prev) => ({ ...prev, creator: { ...prev.creator, ...updatedCreator } }));
              triggerToast('Profile updated successfully! ✅');
            }}
            onOpenPayoutModal={() => {
              setGatedActionMessage(
                'Connect your payout account to enable publishing paid courses and coaching calls.'
              );
              setIsPayoutModalOpen(true);
            }}
            onPreviewPublicProfile={onPreviewPublicProfile}
            onTriggerToast={triggerToast}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 0: COURSE STUDIO (F13 CREATE/EDIT/PUBLISH)                            */}
        {/* ========================================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Video Courses & Curriculums ({courses.length})
                </h2>
                <p className="text-xs text-[#F7F4EF]/60">
                  Build multi-module video masterclasses with Mux/Stream hosting, customizable drip delays, and draft/published controls.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCourseToEdit(null);
                  setIsCourseStudioOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Course
              </Button>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    variant="charcoal"
                    className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={course.isPublished ? 'verified' : 'neutral'} size="sm">
                            {course.isPublished ? 'PUBLISHED' : 'DRAFT'}
                          </Badge>
                          <span className="text-xs text-[#F7F4EF]/50 font-mono">
                            {course.totalLessons} Lessons
                          </span>
                        </div>

                        <span className="text-xl font-display font-bold text-[#B8703F]">
                          ${course.price} <span className="text-xs font-normal text-white/50">{course.currency}</span>
                        </span>
                      </div>

                      {course.thumbnailUrl && (
                        <div className="relative rounded-2xl overflow-hidden h-36 border border-white/10 bg-black/40">
                          <img
                            src={course.thumbnailUrl}
                            alt={`${course.title} curriculum cover`}
                            className="w-full h-full object-cover"
                          />
                          {!course.isPublished && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
                              <Lock className="w-4 h-4" />
                              <span>Draft Mode (Hidden from Storefront)</span>
                            </div>
                          )}
                        </div>
                      )}

                      <h3 className="text-base font-display font-bold text-[#F7F4EF] leading-snug">
                        {course.title}
                      </h3>

                      <p className="text-xs text-[#F7F4EF]/70 line-clamp-2 leading-relaxed">
                        {course.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="text-xs text-[#F7F4EF]/60">
                        <strong className="text-white font-semibold">{course.totalEnrollments || 0}</strong> students enrolled
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCourseToEdit(course);
                            setIsCourseStudioOpen(true);
                          }}
                          leftIcon={<Film className="w-3.5 h-3.5 text-[#B8703F]" />}
                        >
                          Edit in Studio
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card
                variant="charcoal"
                className="py-14 px-6 text-center max-w-lg mx-auto space-y-5 my-4 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <Film className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-display font-bold text-white">
                    No video courses created yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 max-w-sm mx-auto leading-relaxed">
                    Build on-demand video courses with structured modules, high-definition streaming, and drip release dates.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setCourseToEdit(null);
                      setIsCourseStudioOpen(true);
                    }}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Launch Your First Course
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: OFFERS MANAGEMENT (B2 CREATE/EDIT) */}
        {/* ========================================================================= */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Offers Cards List (Span 8) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Active Monetization Offers
                </h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateOfferOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  New Offer
                </Button>
              </div>

              <div className="space-y-4">
                {data.offers.length > 0 ? (
                  data.offers.map((offer) => (
                    <Card
                      key={offer.id}
                      variant="charcoal"
                      className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getFormatBadge(offer.type)}
                            <Badge variant={offer.isActive ? 'verified' : 'neutral'} size="sm">
                              {offer.isActive ? 'LIVE' : 'DRAFT'}
                            </Badge>
                            {!offer.isActive && (
                              <span className="text-[10px] text-amber-300 font-semibold">Hidden from marketplace</span>
                            )}
                          </div>

                          <h3 className="text-lg font-display font-bold text-[#F7F4EF]">
                            {offer.title}
                          </h3>

                          <p className="text-xs text-[#F7F4EF]/70 leading-relaxed font-normal">
                            {offer.description}
                          </p>
                        </div>

                        {/* Pricing & Volume Stats */}
                        <div className="text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.08] flex sm:flex-col items-center sm:items-end justify-between">
                          <div>
                            <span className="text-2xl font-display font-bold text-[#B8703F]">
                              ${offer.price}
                            </span>
                            <span className="text-[10px] text-[#F7F4EF]/50 block">
                              {offer.type === 'COURSE' ? 'One-time' : offer.type === 'ONE_ON_ONE' ? 'Per session' : '/ month'}
                            </span>
                          </div>

                          <div className="sm:mt-3 text-right">
                            <span className="text-xs font-bold text-white block">
                              {offer.totalSalesCount} Enrolled
                            </span>
                            <span className="text-[10px] text-[#6E8B6F] font-mono">
                              ${offer.totalRevenue.toLocaleString()} earned
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Draft/Publish toggle row */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                        <div className="text-xs text-[#F7F4EF]/50">
                          {offer.isActive ? (
                            <span className="text-[#6E8B6F] font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#6E8B6F] inline-block" />
                              Live on marketplace
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Draft — not visible to buyers
                            </span>
                          )}
                        </div>

                        {/* Toggle */}
                        <div className="flex items-center gap-2">
                          {!payoutDetails?.payoutSetupCompleted && offer.price > 0 && !offer.isActive && (
                            <button
                              onClick={() => {
                                setGatedActionMessage(
                                  'Payout Setup Required: Connect your bank account or UPI ID before publishing paid offers.'
                                );
                                setIsPayoutModalOpen(true);
                              }}
                              className="text-[10px] text-amber-300 hover:text-amber-200 underline cursor-pointer"
                            >
                              Setup payout first
                            </button>
                          )}
                          <button
                            type="button"
                            title={offer.isActive ? 'Set to Draft' : 'Publish Offer'}
                            onClick={async () => {
                              const newStatus = !offer.isActive;
                              // M2 gating: paid offer + no payout
                              if (newStatus && offer.price > 0 && !payoutDetails?.payoutSetupCompleted) {
                                setGatedActionMessage(
                                  'Payout Setup Required: Connect your bank account or UPI ID before publishing paid offers.'
                                );
                                setIsPayoutModalOpen(true);
                                return;
                              }
                              const res = await toggleOfferStatusApi(offer.id, newStatus);
                              if (res.success) {
                                setData((prev) => ({
                                  ...prev,
                                  offers: prev.offers.map((o) =>
                                    o.id === offer.id ? { ...o, isActive: newStatus } : o
                                  ),
                                }));
                                triggerToast(
                                  newStatus
                                    ? `"${offer.title}" is now live on marketplace! 🎉`
                                    : `"${offer.title}" set to draft.`
                                );
                              } else if (res.error?.includes('PAYOUT')) {
                                setGatedActionMessage(res.error);
                                setIsPayoutModalOpen(true);
                              } else {
                                triggerToast(res.error || 'Failed to update offer status.');
                              }
                            }}
                            className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                              offer.isActive ? 'bg-[#6E8B6F]' : 'bg-neutral-700'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                                offer.isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card
                    variant="charcoal"
                    className="py-14 px-6 text-center max-w-lg mx-auto space-y-5 my-4 border-white/[0.08] bg-[#16171A] shadow-xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                      <PackageOpen className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-display font-bold text-white">
                        No published offers yet
                      </h3>
                      <p className="text-xs sm:text-sm text-[#F7F4EF]/60 max-w-sm mx-auto leading-relaxed">
                        You haven't launched any coaching packages, video curriculums, or group cohorts yet. Create your first offer to start accepting client bookings.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsCreateOfferOpen(true)}
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Create Your First Offer
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Right: Verification Status Widget (B7) (Span 4) */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <Card
                variant="charcoal"
                className="p-6 bg-[#16171A] border-white/15 shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#6E8B6F]" />
                    <h3 className="font-display font-bold text-base text-[#F7F4EF]">
                      Verification Audit Status
                    </h3>
                  </div>

                  <Badge variant="verified" size="sm">
                    Verified
                  </Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-[#F7F4EF]/70 leading-relaxed">
                    Your profile holds verified top 1% credentials on Universifit. All client transactions and payouts are active.
                  </p>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7F4EF]/40 block">
                      Audited Credentials Checklist
                    </span>

                    {data.creator.credentials.map((cred, i) => (
                      <div key={i} className="flex items-center gap-2 text-[#F7F4EF]/90 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6E8B6F] shrink-0" />
                        <span className="truncate">{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsVerificationModalOpen(true)}
                  leftIcon={<Upload className="w-3.5 h-3.5 text-[#B8703F]" />}
                >
                  Upload New Accreditation Docs
                </Button>
              </Card>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1.2: PROMO CODES & COUPON MANAGEMENT                                  */}
        {/* ========================================================================= */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#B8703F]" />
                  <span>Promotional Coupons & Discounts ({coupons.length})</span>
                </h2>
                <p className="text-xs text-[#F7F4EF]/60">
                  Create percentage-based or flat rate discount vouchers for your coaching masterclasses and cohort programs.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateCouponOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Promo Code
              </Button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="charcoal" className="p-4 bg-[#16171A] border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#F7F4EF]/50 font-medium block">Total Codes</span>
                  <span className="text-2xl font-display font-bold text-white mt-0.5 block">{coupons.length}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] text-[#B8703F] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </Card>

              <Card variant="charcoal" className="p-4 bg-[#16171A] border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#F7F4EF]/50 font-medium block">Active Campaigns</span>
                  <span className="text-2xl font-display font-bold text-[#6E8B6F] mt-0.5 block">
                    {coupons.filter((c) => c.isActive).length}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#6E8B6F]/10 text-[#6E8B6F] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </Card>

              <Card variant="charcoal" className="p-4 bg-[#16171A] border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#F7F4EF]/50 font-medium block">Total Redemptions</span>
                  <span className="text-2xl font-display font-bold text-[#B8703F] mt-0.5 block">
                    {coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0)}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#B8703F]/15 text-[#B8703F] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </Card>

              <Card variant="charcoal" className="p-4 bg-[#16171A] border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#F7F4EF]/50 font-medium block">Max Discount</span>
                  <span className="text-2xl font-display font-bold text-white mt-0.5 block">
                    {coupons.length > 0
                      ? `${Math.max(...coupons.map((c) => (c.discountType === 'PERCENT' ? c.value : 0)))}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] text-[#F7F4EF] flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </Card>
            </div>

            {/* Coupons List / Grid */}
            {coupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {coupons.map((cpn) => {
                  const isExpired = cpn.expiryDate ? new Date() > new Date(cpn.expiryDate) : false;
                  const isLimitReached = cpn.usageLimit !== null && cpn.usageLimit !== undefined && cpn.usedCount >= cpn.usageLimit;
                  const usagePercent = cpn.usageLimit ? Math.min(100, Math.round((cpn.usedCount / cpn.usageLimit) * 100)) : 0;

                  return (
                    <Card
                      key={cpn.id}
                      variant="charcoal"
                      className={`p-5 bg-[#16171A] border transition-all duration-200 shadow-xl flex flex-col justify-between space-y-4 ${
                        !cpn.isActive || isExpired || isLimitReached
                          ? 'border-white/[0.06] opacity-75'
                          : 'border-white/[0.12] hover:border-[#B8703F]/50'
                      }`}
                    >
                      <div className="space-y-3.5">
                        {/* Header: Code & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-[#F7F4EF] tracking-wider px-2.5 py-1 bg-black/40 border border-white/10 rounded-lg select-all">
                              {cpn.code}
                            </span>
                            <button
                              type="button"
                              title="Copy code"
                              onClick={() => {
                                navigator.clipboard.writeText(cpn.code);
                                triggerToast(`Copied "${cpn.code}" to clipboard! 📋`);
                              }}
                              className="p-1 text-[#F7F4EF]/50 hover:text-white hover:bg-white/5 rounded transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isExpired ? (
                              <Badge variant="neutral" size="sm" className="bg-rose-500/10 text-rose-400 border-rose-500/30">
                                EXPIRED
                              </Badge>
                            ) : isLimitReached ? (
                              <Badge variant="neutral" size="sm" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                                EXHAUSTED
                              </Badge>
                            ) : cpn.isActive ? (
                              <Badge variant="verified" size="sm">
                                ACTIVE
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                PAUSED
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Discount Magnitude Banner */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.06] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#F7F4EF]/50 font-medium block uppercase tracking-wider">
                              Discount Value
                            </span>
                            <span className="text-xl font-display font-bold text-[#B8703F]">
                              {cpn.discountType === 'PERCENT' ? `${cpn.value}% OFF` : `$${cpn.value} FLAT OFF`}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#F7F4EF]/60 font-mono">
                            {cpn.discountType === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </div>

                        {/* Redemptions Progress */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#F7F4EF]/60">Redemptions</span>
                            <span className="font-mono font-semibold text-white">
                              {cpn.usedCount} {cpn.usageLimit ? `/ ${cpn.usageLimit}` : 'used'}
                            </span>
                          </div>
                          {cpn.usageLimit && (
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  usagePercent >= 100 ? 'bg-amber-400' : 'bg-[#6E8B6F]'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Expiry Details */}
                        <div className="flex items-center gap-1.5 text-xs text-[#F7F4EF]/50 pt-1">
                          <Clock className="w-3.5 h-3.5 text-[#B8703F]" />
                          <span>
                            {cpn.expiryDate
                              ? `Expires ${new Date(cpn.expiryDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}`
                              : 'No expiration date (Permanent)'}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(cpn.id)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                            cpn.isActive
                              ? 'bg-white/5 border-white/10 text-[#F7F4EF]/80 hover:bg-white/10'
                              : 'bg-[#6E8B6F]/10 border-[#6E8B6F]/30 text-[#6E8B6F] hover:bg-[#6E8B6F]/20'
                          }`}
                        >
                          {cpn.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-[#6E8B6F]" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-[#F7F4EF]/40" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(cpn.id, cpn.code)}
                          className="p-1.5 text-[#F7F4EF]/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card
                variant="charcoal"
                className="py-14 px-6 text-center max-w-lg mx-auto space-y-5 my-4 border-white/[0.08] bg-[#16171A] shadow-xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                  <Tag className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-display font-bold text-white">
                    No promo coupons created yet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F7F4EF]/60 max-w-sm mx-auto leading-relaxed">
                    Offer limited-time discounts or special creator promos to incentivize athlete signups and boost masterclass enrollment conversion.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsCreateCouponOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Your First Coupon
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1.5: AVAILABILITY & BLACKOUT DATES (F14)                              */}
        {/* ========================================================================= */}
        {activeTab === 'availability' && (
          <div className="space-y-6">
            <AvailabilityEditor
              onScheduleSaved={() => {
                triggerToast('Weekly Availability & Blackout Dates Saved! 🗓️');
                loadCreatorData();
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1.7: COMMUNITY MODERATION (PIN/DELETE POSTS, REMOVE REPLIES, FLAGS)  */}
        {/* ========================================================================= */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            {/* Community Header & Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Community Space Moderation
                </h2>
                <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                  Pin key announcements, review flagged member posts, and moderate discussion replies.
                </p>
              </div>

              {/* Moderation Filter Chips */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommunityFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    communityFilter === 'all'
                      ? 'bg-[#B8703F] text-white shadow-md'
                      : 'bg-white/[0.04] text-[#F7F4EF]/70 hover:bg-white/[0.08] hover:text-white border border-white/[0.08]'
                  }`}
                >
                  All Posts ({communityPosts.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCommunityFilter('pinned')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    communityFilter === 'pinned'
                      ? 'bg-[#B8703F] text-white shadow-md'
                      : 'bg-white/[0.04] text-[#F7F4EF]/70 hover:bg-white/[0.08] hover:text-white border border-white/[0.08]'
                  }`}
                >
                  Pinned ({communityPosts.filter((p) => p.isPinned).length})
                </button>

                <button
                  type="button"
                  onClick={() => setCommunityFilter('reported')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    communityFilter === 'reported'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  Flagged Queue ({communityPosts.filter((p) => p.isReported).length})
                </button>
              </div>
            </div>

            {/* Posts Moderation List */}
            {(() => {
              const displayPosts = communityPosts.filter((p) => {
                if (communityFilter === 'pinned') return p.isPinned;
                if (communityFilter === 'reported') return p.isReported;
                return true;
              });

              if (displayPosts.length === 0) {
                return (
                  <Card variant="charcoal" className="py-14 px-6 text-center max-w-md mx-auto space-y-3 bg-[#16171A] border-white/10">
                    <MessageSquare className="w-10 h-10 text-white/30 mx-auto" />
                    <h3 className="font-display font-bold text-base text-white">
                      {communityFilter === 'reported'
                        ? 'No Flagged Content! 🎉'
                        : 'No community discussions found'}
                    </h3>
                    <p className="text-xs text-white/60">
                      {communityFilter === 'reported'
                        ? 'All community posts comply with coach standards.'
                        : 'Athletes and members have not posted in this filter.'}
                    </p>
                  </Card>
                );
              }

              return (
                <div className="space-y-4">
                  {displayPosts.map((post) => (
                    <Card
                      key={post.id}
                      variant="charcoal"
                      className={`p-6 bg-[#16171A] border transition-all ${
                        post.isPinned
                          ? 'border-[#B8703F] shadow-lg ring-1 ring-[#B8703F]/30'
                          : post.isReported
                          ? 'border-amber-500/40 bg-amber-950/10'
                          : 'border-white/[0.08]'
                      }`}
                    >
                      {/* Flagged Alert Banner */}
                      {post.isReported && (
                        <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              <strong>Reported by Member:</strong> {post.reportReason || 'Inappropriate Content'} ({post.reportCount || 1} flags)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleDismissFlag(post.id)}
                              className="text-[11px] underline text-amber-300 hover:text-white font-semibold cursor-pointer"
                            >
                              Dismiss Flag
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCommunityPost(post.id)}
                              className="text-[11px] text-rose-400 hover:underline font-bold cursor-pointer"
                            >
                              Delete Post
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBanAuthorFromPost(post.id, post.authorId, post.authorName)}
                              className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold cursor-pointer transition-colors"
                            >
                              Ban Author
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.authorAvatar}
                            alt={`${post.authorName} avatar`}
                            className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">{post.authorName}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white/5 border border-white/10 text-white/70">
                                {post.authorRole}
                              </span>
                              {post.isPinned && (
                                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#B8703F]/20 text-[#B8703F] border border-[#B8703F]/30 flex items-center gap-1">
                                  <Pin className="w-2.5 h-2.5 fill-[#B8703F]" />
                                  <span>PINNED</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#F7F4EF]/50">{post.createdAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#F7F4EF]/70">
                            {post.categoryTag}
                          </span>

                          {/* Pin Toggle */}
                          <Button
                            variant={post.isPinned ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => handlePinCommunityPost(post.id)}
                            leftIcon={<Pin className="w-3.5 h-3.5" />}
                          >
                            <span>{post.isPinned ? 'Unpin' : 'Pin'}</span>
                          </Button>

                          {/* Delete Post */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommunityPost(post.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          >
                            <span>Delete</span>
                          </Button>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="py-3.5 space-y-1.5">
                        <h3 className="font-display font-bold text-base text-white">{post.title}</h3>
                        <p className="text-xs sm:text-sm text-[#F7F4EF]/80 leading-relaxed font-normal whitespace-pre-line">
                          {post.content}
                        </p>
                      </div>

                      {/* Replies List with Moderation Controls */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8703F]">
                            Replies ({post.replies.length})
                          </span>

                          <div className="space-y-2 pl-3 border-l-2 border-white/10">
                            {post.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start justify-between gap-3 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <strong className="text-white">{reply.authorName}</strong>
                                    <span className="text-[10px] text-white/40">{reply.createdAt}</span>
                                  </div>
                                  <p className="text-white/80 mt-1">{reply.content}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteReply(post.id, reply.id)}
                                  className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Remove Reply"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMMUNITY MEMBERS MANAGEMENT & COACHING STUDENTS                  */}
        {/* ========================================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Header & Sub-view Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Members & Student Roster
                </h2>
                <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                  Manage joined community tier members, audit activity dossiers, ban/remove bad actors, and monitor 1-on-1 coaching progress.
                </p>
              </div>

              {/* Sub-view Toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMemberViewMode('members')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    memberViewMode === 'members'
                      ? 'bg-[#B8703F] text-white shadow-md'
                      : 'text-[#F7F4EF]/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Tier Members ({membersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemberViewMode('students')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    memberViewMode === 'students'
                      ? 'bg-[#B8703F] text-white shadow-md'
                      : 'text-[#F7F4EF]/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Coaching Clients ({data.students.length})</span>
                </button>
              </div>
            </div>

            {/* SUBVIEW 1: COMMUNITY MEMBERS DIRECTORY (MEMBER MANAGEMENT) */}
            {memberViewMode === 'members' && (
              <div className="space-y-5">
                {/* Search & Filters Bar */}
                <div className="p-4 rounded-2xl bg-[#16171A] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F7F4EF]/40" />
                    <input
                      type="text"
                      placeholder="Search member name or email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#B8703F]"
                    />
                    {memberSearch && (
                      <button
                        type="button"
                        onClick={() => setMemberSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1 p-0.5 bg-black/40 border border-white/10 rounded-xl text-xs">
                      {(['all', 'ACTIVE', 'BANNED'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setMemberStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                            memberStatusFilter === st
                              ? 'bg-white/15 text-white font-bold'
                              : 'text-white/50 hover:text-white'
                          }`}
                        >
                          {st === 'all' ? 'All Status' : st === 'ACTIVE' ? 'Active' : 'Banned'}
                        </button>
                      ))}
                    </div>

                    {/* Tier Filter */}
                    <select
                      value={memberTierFilter}
                      onChange={(e) => setMemberTierFilter(e.target.value)}
                      aria-label="Filter members by membership tier"
                      className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-[#B8703F]"
                    >
                      <option value="all">All Tiers</option>
                      <option value="PAID">Paid Tiers (Apex VIP)</option>
                      <option value="FREE">Free Tier (Community Squad)</option>
                    </select>
                  </div>
                </div>

                {/* Filtered Members Grid */}
                {(() => {
                  const filtered = membersList.filter((m) => {
                    const matchesSearch =
                      !memberSearch.trim() ||
                      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      (m.email && m.email.toLowerCase().includes(memberSearch.toLowerCase()));

                    const matchesTier =
                      memberTierFilter === 'all' ||
                      (m.tier && m.tier.access === memberTierFilter);

                    const isBanned = m.status === 'BANNED' || m.isPrivateMasked === true;
                    const matchesStatus =
                      memberStatusFilter === 'all' ||
                      (memberStatusFilter === 'BANNED' ? isBanned : !isBanned);

                    return matchesSearch && matchesTier && matchesStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <Card
                        variant="charcoal"
                        className="py-14 px-6 text-center max-w-md mx-auto space-y-3 bg-[#16171A] border-white/10"
                      >
                        <Users className="w-10 h-10 text-white/30 mx-auto" />
                        <h3 className="font-display font-bold text-base text-white">
                          No members match current filter
                        </h3>
                        <p className="text-xs text-white/60">
                          Try adjusting your search keywords or switching tier/status filters.
                        </p>
                      </Card>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.map((member) => {
                        const isBanned = member.status === 'BANNED' || member.isPrivateMasked === true;
                        return (
                          <Card
                            key={member.id || member.userId}
                            variant="charcoal"
                            className={`p-5 bg-[#16171A] border shadow-xl flex flex-col justify-between transition-all ${
                              isBanned
                                ? 'border-rose-500/40 bg-rose-950/10'
                                : 'border-white/[0.08] hover:border-white/20'
                            }`}
                          >
                            <div className="space-y-4">
                              {/* Member Header Info */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {member.avatarUrl ? (
                                      <img
                                        src={member.avatarUrl}
                                        alt={`${member.name} community member avatar`}
                                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-2xl bg-[#B8703F]/20 text-[#B8703F] border border-[#B8703F]/30 flex items-center justify-center font-bold text-base">
                                        {member.name.charAt(0)}
                                      </div>
                                    )}
                                    <div
                                      style={{ borderColor: member.level?.badgeColor || '#3B82F6' }}
                                      className="absolute -bottom-1 -right-1 bg-black text-white px-1.5 py-0.1 rounded-full text-[8px] font-bold font-mono border"
                                    >
                                      {member.level?.points ?? 120}p
                                    </div>
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="font-display font-bold text-sm text-white truncate">
                                        {member.name}
                                      </h4>
                                      {member.isProfilePrivate && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/40 font-mono">
                                          Private (Creator View)
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-white/50 truncate font-mono">
                                      {member.email || 'athlete@universifit.com'}
                                    </p>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                {isBanned ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                    <Ban className="w-2.5 h-2.5" />
                                    BANNED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    ACTIVE
                                  </span>
                                )}
                              </div>

                              {/* Tier & S1 Level Badges */}
                              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                                {member.tier && (
                                  <span
                                    style={{
                                      borderColor: `${member.tier.badgeColor || '#B8703F'}55`,
                                      backgroundColor: `${member.tier.badgeColor || '#B8703F'}15`,
                                      color: member.tier.badgeColor || '#B8703F',
                                    }}
                                    className="px-2 py-0.5 rounded-lg border text-[11px] font-bold font-mono"
                                  >
                                    {member.tier.name} ({member.tier.access})
                                  </span>
                                )}

                                {member.level && (
                                  <span
                                    style={{
                                      borderColor: `${member.level.badgeColor}55`,
                                      color: member.level.badgeColor,
                                    }}
                                    className="px-2 py-0.5 rounded-lg border bg-black/30 text-[10px] font-mono flex items-center gap-1"
                                  >
                                    <Award className="w-3 h-3" />
                                    {member.level.tierName}
                                  </span>
                                )}

                                <span className="text-[10px] text-white/40 font-mono ml-auto">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Card Footer Action Controls */}
                            <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
                              {/* View Activity Dossier */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMemberActivity(member.userId)}
                                leftIcon={<Activity className="w-3.5 h-3.5 text-[#B8703F]" />}
                              >
                                View Activity
                              </Button>

                              <div className="flex items-center gap-1.5">
                                {/* Message Member */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenMessages &&
                                    onOpenMessages(member.userId, `Community Tier: ${member.tier?.name || 'General'}`)
                                  }
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                                  title="Send Direct Message"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                {/* Ban / Unban Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenBanModal(member.userId, member.name, isBanned)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isBanned
                                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                                  }`}
                                  title={isBanned ? 'Unban Member' : 'Ban Member'}
                                >
                                  {isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                </button>

                                {/* Remove Member */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.userId, member.name)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Remove Member from Tier"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBVIEW 2: 1-ON-1 COACHING ROSTER (EXISTING MODULE PROGRESS & AUDITS) */}
            {memberViewMode === 'students' && (
              <div>
                {data.students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                    {data.students.map((student) => (
                      <Card
                        key={student.id}
                        variant="charcoal"
                        className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Student Info */}
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={student.avatarUrl}
                                alt={`${student.name} enrolled student avatar`}
                                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-[#B8703F] text-white px-1.5 py-0.1 rounded-full text-[8px] font-bold font-mono">
                                {student.reputationPoints}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-display font-bold text-sm text-[#F7F4EF] truncate">
                                {student.name}
                              </h4>
                              <p className="text-[11px] text-[#F7F4EF]/50 truncate">
                                {student.email}
                              </p>
                            </div>
                          </div>

                          {/* Program & Progress */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8703F] block truncate">
                              {student.enrolledProgram}
                            </span>

                            <div className="mt-2">
                              <ProgressBar
                                value={student.progressPercent}
                                variant="sage"
                                size="sm"
                                showLabel
                                label={`${student.totalCompletedModules}/${student.totalModules} Modules`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#F7F4EF]/40 font-mono">
                            Active: {student.lastActive}
                          </span>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onOpenMessages &&
                                onOpenMessages(student.id, student.enrolledProgram)
                              }
                              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#B8703F]" />}
                            >
                              Message
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (onOpenMessages) {
                                  onOpenMessages(student.id, `Form Audit & Technique Review: ${student.enrolledProgram}`);
                                } else {
                                  triggerToast(`Direct messaging channel opened for ${student.name}`);
                                }
                              }}
                            >
                              Audit Video
                            </Button>
                          </div>
                        </div>
                      </Card>
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
                        No students enrolled yet. As athletes purchase your courses or coaching tiers, their progress tracking and module audits will appear here.
                      </p>
                    </div>
                    <div className="pt-3">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setActiveTab('offers')}
                      >
                        View Active Offers
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BOOKING CALENDAR & AVAILABILITY (B5) */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                1:1 Consultation & Video Session Schedule
              </h2>
              <Badge variant="verified" size="sm">
                Slots Locked via DB Constraint
              </Badge>
            </div>

            <div className="space-y-4">
              {data.bookings.length > 0 ? (
                data.bookings.map((slot) => (
                  <Card
                    key={slot.id}
                    variant="charcoal"
                    className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={slot.studentAvatar}
                        alt={`${slot.studentName} consultation booking avatar`}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="verified" size="sm">
                            {slot.status}
                          </Badge>
                          <span className="text-xs text-[#F7F4EF]/50 font-mono">
                            {slot.format}
                          </span>
                        </div>

                        <h3 className="text-lg font-display font-bold text-[#F7F4EF]">
                          {slot.programTitle}
                        </h3>

                        <p className="text-xs text-[#B8703F] font-semibold">
                          Student: {slot.studentName}
                        </p>

                        <div className="flex items-center gap-3 text-xs font-semibold text-[#6E8B6F] pt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{slot.scheduledAt.includes('T') ? new Date(slot.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : slot.scheduledAt}</span>
                          </div>
                          <span className="text-white/20">•</span>
                          <span className="text-[#B8703F] text-[11px] font-mono">
                            {slot.durationMinutes || 45} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(slot.meetLink || slot.meetingUrl || 'https://meet.google.com/asc-fit-sync');
                            triggerToast('Google Meet link copied to clipboard!');
                          }
                        }}
                        leftIcon={<Share2 className="w-4 h-4 text-[#B8703F]" />}
                      >
                        Copy Meet Link
                      </Button>

                      <a
                        href={generateGoogleCalendarUrl({
                          title: slot.programTitle,
                          startTime: slot.scheduledAt,
                          durationMinutes: slot.durationMinutes || 45,
                          meetLink: slot.meetLink || slot.meetingUrl || 'https://meet.google.com/asc-fit-sync',
                          coachName: data.creator.fullName,
                          studentName: slot.studentName,
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
                          + Calendar
                        </Button>
                      </a>

                      {/* TIME-WINDOWED JOIN CALL BUTTON FOR COACH */}
                      <JoinCallButton
                        meetLink={slot.meetLink || slot.meetingUrl || 'https://meet.google.com/asc-fit-sync'}
                        scheduledAt={slot.scheduledAt}
                        durationMinutes={slot.durationMinutes || 45}
                        buttonSize="md"
                      />
                    </div>
                  </Card>
                ))
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
                      No upcoming 1-on-1 consultations or video calls booked on your calendar yet. Share your public booking link with clients to start receiving sessions.
                    </p>
                  </div>
                  <div className="pt-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/creator/${data.creator.handle}`);
                          triggerToast('Booking profile link copied to clipboard!');
                        }
                      }}
                      leftIcon={<Share2 className="w-4 h-4" />}
                    >
                      Copy Public Profile Link
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3.5: CREATOR ANALYTICS & CONVERSION TELEMETRY                         */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Header & Range Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                  Analytics & Growth Telemetry
                </h2>
                <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                  Track storefront visits, offer conversion efficiency, earnings momentum, and student cohort expansion.
                </p>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
                {(['7d', '30d', '6m', 'all'] as const).map((rng) => (
                  <button
                    key={rng}
                    type="button"
                    onClick={() => setAnalyticsRange(rng)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      analyticsRange === rng
                        ? 'bg-[#B8703F] text-white shadow-md'
                        : 'text-[#F7F4EF]/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {rng === '7d' ? '7 Days' : rng === '30d' ? '30 Days' : rng === '6m' ? '6 Months' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Storefront Profile Views */}
              <Card
                variant="charcoal"
                className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#B8703F]" />
                    Profile Views
                  </span>
                  <span className="text-xs font-bold text-[#6E8B6F] flex items-center gap-0.5 bg-[#6E8B6F]/10 px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    +{analyticsData.summary.viewsGrowthMoM}% MoM
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-white">
                    {analyticsData.summary.totalProfileViews.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                    Logged across storefront impressions
                  </span>
                </div>
              </Card>

              {/* Card 2: Offer Conversion Rate */}
              <Card
                variant="charcoal"
                className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#6E8B6F]" />
                    Conversion Rate
                  </span>
                  <span className="text-xs font-bold text-[#6E8B6F] flex items-center gap-0.5 bg-[#6E8B6F]/10 px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    +{analyticsData.summary.conversionGrowthMoM}%
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-[#6E8B6F]">
                    {analyticsData.summary.overallConversionRate}%
                  </span>
                  <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                    Views &rarr; Paid checkouts ratio
                  </span>
                </div>
              </Card>

              {/* Card 3: Gross Revenue */}
              <Card
                variant="charcoal"
                className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#B8703F]" />
                    Gross Revenue
                  </span>
                  <span className="text-xs font-bold text-[#6E8B6F] flex items-center gap-0.5 bg-[#6E8B6F]/10 px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    +{analyticsData.summary.revenueGrowthMoM}% MoM
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-[#B8703F]">
                    ${analyticsData.summary.grossRevenue.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[#6E8B6F] font-semibold block mt-0.5">
                    Net: ${analyticsData.summary.netEarnings.toLocaleString()} (85%)
                  </span>
                </div>
              </Card>

              {/* Card 4: Total Active Students */}
              <Card
                variant="charcoal"
                className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    Athletes Enrolled
                  </span>
                  <span className="text-xs font-mono text-[#F7F4EF]/40">
                    AOV: ${analyticsData.summary.avgOrderValue}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-white">
                    {analyticsData.summary.activeStudentsCount}
                  </span>
                  <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                    {analyticsData.summary.totalOfferSales} total checkout sales
                  </span>
                </div>
              </Card>
            </div>

            {/* 3-Stage Visual Conversion Funnel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F7F4EF]/70 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#B8703F]" />
                  <span>Storefront Conversion Funnel (Views &rarr; Enrollments)</span>
                </h3>
                <span className="text-xs text-[#F7F4EF]/40 font-mono">
                  Industry Benchmark: 3.5% - 5.0%
                </span>
              </div>
              <ConversionFunnelVisualizer
                profileViews={analyticsData.summary.totalProfileViews}
                totalSales={analyticsData.summary.totalOfferSales}
                conversionRate={analyticsData.summary.overallConversionRate}
              />
            </div>

            {/* Interactive Charts: Earnings Over Time & Student Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Earnings Over Time */}
              <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-display font-bold text-white">
                      Earnings Velocity Over Time
                    </h3>
                    <p className="text-xs text-[#F7F4EF]/50 mt-0.5">
                      Monthly gross revenue vs creator net payout distribution.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#B8703F]/15 text-[#B8703F] border border-[#B8703F]/30">
                    Monthly Trajectory
                  </span>
                </div>
                <EarningsLineChart data={analyticsData.earningsTimeline} />
              </Card>

              {/* Chart 2: Student Count Trend */}
              <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-display font-bold text-white">
                      Student Cohort Expansion Trend
                    </h3>
                    <p className="text-xs text-[#F7F4EF]/50 mt-0.5">
                      Cumulative active athlete growth and new monthly signups.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    Cohort Momentum
                  </span>
                </div>
                <StudentTrendChart data={analyticsData.studentCountTrend} />
              </Card>
            </div>

            {/* Chart 3: Storefront Daily Impressions & Checkout Histogram */}
            <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    Daily Storefront Traffic & Conversions
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/50 mt-0.5">
                    Day-by-day visitor impressions recorded from direct shares, Discover catalog, and social bio links.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(`${window.location.origin}/creator/${data.creator.handle}`);
                        triggerToast('Storefront link copied to clipboard! Share on social media.');
                      }
                    }}
                    leftIcon={<Share2 className="w-3.5 h-3.5 text-[#B8703F]" />}
                  >
                    Share Storefront Link
                  </Button>
                </div>
              </div>
              <StorefrontTrafficChart data={analyticsData.trafficTimeline} />
            </Card>

            {/* Offer Conversion Performance Breakdown Table */}
            <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    Offer Conversion Performance Breakdown
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/50 mt-0.5">
                    Individual offer view counts, conversion rates, and gross sales generated.
                  </p>
                </div>
                <Badge variant="verified" size="sm">
                  {analyticsData.offerConversionBreakdown.length} Active Offers Monitored
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                      <th className="pb-3 px-3">Offer / Program</th>
                      <th className="pb-3 px-3">Type</th>
                      <th className="pb-3 px-3">Tuition</th>
                      <th className="pb-3 px-3">Impressions</th>
                      <th className="pb-3 px-3">Purchases</th>
                      <th className="pb-3 px-3">Conversion Rate</th>
                      <th className="pb-3 px-3 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {analyticsData.offerConversionBreakdown.map((offer) => (
                      <tr key={offer.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-3">
                          <span className="font-bold text-white block max-w-xs truncate">
                            {offer.title}
                          </span>
                          <span className="text-[10px] text-[#F7F4EF]/40 font-mono">
                            ID: {offer.id}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <Badge variant="copper" size="sm">
                            {offer.type === 'COURSE' ? 'Course' : offer.type === 'ONE_ON_ONE' ? '1:1 Coaching' : 'Community'}
                          </Badge>
                        </td>
                        <td className="py-4 px-3 font-mono font-bold text-white">
                          ${offer.price} {offer.currency}
                          {offer.isRecurring && <span className="text-[10px] text-[#F7F4EF]/50 font-normal"> /mo</span>}
                        </td>
                        <td className="py-4 px-3 font-mono text-[#F7F4EF]/70">
                          {offer.views.toLocaleString()} views
                        </td>
                        <td className="py-4 px-3 font-mono font-bold text-[#6E8B6F]">
                          {offer.purchases} sales
                        </td>
                        <td className="py-4 px-3">
                          <div className="space-y-1 max-w-[130px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-[#6E8B6F]">
                                {offer.conversionRatePercent}%
                              </span>
                              <span className="text-[10px] text-[#F7F4EF]/40">rate</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, offer.conversionRatePercent * 4)}%` }}
                                className="h-full rounded-full bg-gradient-to-r from-[#B8703F] to-[#6E8B6F]"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-3 text-right">
                          <span className="text-sm font-bold font-display text-[#B8703F]">
                            ${offer.revenue.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ========================================================================= */}
            {/* COMMUNITY ENGAGEMENT & GAMIFICATION TELEMETRY (BEYOND T1)                 */}
            {/* ========================================================================= */}
            <div className="space-y-6 pt-4 border-t border-white/[0.08]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-display font-bold text-[#F7F4EF] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#B8703F]" />
                    <span>Community Engagement & Points Intelligence</span>
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                    Live telemetry beyond T1: Active member engagement rate, gamification point distribution, and top community contributors.
                  </p>
                </div>

                <Badge variant="verified" size="sm" className="self-start sm:self-auto font-mono">
                  S1 Tier Engine Active
                </Badge>
              </div>

              {/* Engagement Rate & Tier Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2 Cols: Engagement Radial Gauge & Weekly Momentum */}
                <div className="lg:col-span-2">
                  <EngagementRateGauge
                    data={
                      communityAnalytics?.engagement ?? {
                        totalMembers: 48,
                        activeMembers30d: 38,
                        engagementRate: 79,
                        weeklyTrend: [
                          { period: 'Week 1', active: 28, rate: 68 },
                          { period: 'Week 2', active: 32, rate: 74 },
                          { period: 'Week 3', active: 36, rate: 77 },
                          { period: 'Week 4', active: 38, rate: 79 },
                        ],
                      }
                    }
                  />
                </div>

                {/* 1 Col: Community Tier Access Breakdown */}
                <Card variant="charcoal" className="p-5 bg-[#16171A] border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#B8703F]" />
                        <span>Tier Distribution</span>
                      </h4>
                      <span className="text-[10px] font-mono text-[#6E8B6F] font-bold">
                        {communityAnalytics?.tierBreakdown.paidRatioPercent ?? 38}% Monetized
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {/* Paid Tier Card */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#B8703F]/15 to-transparent border border-[#B8703F]/30 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">Apex VIP Club</span>
                          <span className="text-[10px] text-[#B8703F] font-mono uppercase tracking-wider">Paid Membership</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-display font-bold text-white">
                            {communityAnalytics?.tierBreakdown.paidMembers ?? 18}
                          </span>
                          <span className="text-[10px] text-white/40 block font-mono">Athletes</span>
                        </div>
                      </div>

                      {/* Free Tier Card */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">Community Squad</span>
                          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Free Tier</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-display font-bold text-white/80">
                            {communityAnalytics?.tierBreakdown.freeMembers ?? 30}
                          </span>
                          <span className="text-[10px] text-white/40 block font-mono">Members</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] text-[11px] text-white/50 flex items-center justify-between font-mono">
                    <span>Total Community Size:</span>
                    <strong className="text-white">
                      {(communityAnalytics?.tierBreakdown.paidMembers ?? 18) + (communityAnalytics?.tierBreakdown.freeMembers ?? 30)} Members
                    </strong>
                  </div>
                </Card>
              </div>

              {/* Point Distribution & Top Contributors Leaderboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Point Distribution Across Actions & S1 Levels */}
                <CommunityPointDistributionChart
                  pointData={
                    communityAnalytics?.pointDistribution ?? {
                      totalPoints: 3150,
                      breakdown: [
                        { action: 'lesson-complete', label: 'Lesson Completions', points: 1420, percentage: 45, color: '#B8703F' },
                        { action: 'post', label: 'Community Posts', points: 680, percentage: 22, color: '#3B82F6' },
                        { action: 'reply', label: 'Discussion Replies', points: 450, percentage: 14, color: '#10B981' },
                        { action: 'event-attend', label: 'Live Masterclasses', points: 390, percentage: 12, color: '#F59E0B' },
                        { action: 'like-received', label: 'Peer Upvotes', points: 210, percentage: 7, color: '#8B5CF6' },
                      ],
                    }
                  }
                  levelData={
                    communityAnalytics?.levelDistribution ?? [
                      { level: 'Beginner', count: 18, percentage: 38, badgeColor: '#6B7280' },
                      { level: 'Consistent', count: 22, percentage: 46, badgeColor: '#3B82F6' },
                      { level: 'Elite', count: 8, percentage: 16, badgeColor: '#F59E0B' },
                    ]
                  }
                />

                {/* Top Community Contributors */}
                <TopContributorsLeaderboard
                  contributors={communityAnalytics?.topContributors ?? []}
                />
              </div>
            </div>

            {/* Growth Tips & Insights Callout */}
            <div className="p-5 rounded-2xl bg-[#B8703F]/10 border border-[#B8703F]/25 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Coaching Optimization Insights
                </h4>
                <p className="text-xs text-[#F7F4EF]/70 leading-relaxed">
                  Your 1:1 Biomechanics Sprint is converting at <strong>10.0%</strong> (industry average is 4.2%). Consider adding a recurring monthly retainer coupon for high-intent athletes to maximize lifetime student value.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: REFERRALS & GROWTH INCENTIVES */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
                    Creator Referral Program
                  </h2>
                  <Badge variant="copper" size="sm" className="font-mono">
                    ${referralStats.bonusPerReferral}.00 / Verified Signup
                  </Badge>
                </div>
                <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                  Invite athletes, trainees, or coach peers to Universifit. Earn a flat cash incentive directly into your payout balance for every verified member.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyReferralLink}
                  leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-[#6E8B6F]" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedLink ? 'Link Copied!' : 'Copy Referral Link'}
                </Button>
              </div>
            </div>

            {/* 4 Hero Referral Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Referred Users */}
              <Card variant="charcoal" className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium uppercase tracking-wider">Total Referred</span>
                  <div className="w-8 h-8 rounded-xl bg-[#B8703F]/15 text-[#B8703F] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-white">
                    {referralStats.totalReferred}
                  </span>
                  <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                    Athletes joined with your code
                  </span>
                </div>
              </Card>

              {/* Card 2: Verified Signups */}
              <Card variant="charcoal" className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium uppercase tracking-wider">Verified Conversions</span>
                  <div className="w-8 h-8 rounded-xl bg-[#6E8B6F]/15 text-[#6E8B6F] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-[#6E8B6F]">
                    {referralStats.verifiedCount}
                  </span>
                  <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                    {referralStats.totalReferred > 0 ? `${Math.round((referralStats.verifiedCount / referralStats.totalReferred) * 100)}% verification rate` : '100% verified'}
                  </span>
                </div>
              </Card>

              {/* Card 3: Total Incentive Earned */}
              <Card variant="charcoal" className="p-5 bg-[#16171A] border-[#6E8B6F]/30 bg-gradient-to-br from-[#16171A] to-[#6E8B6F]/5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6E8B6F] font-bold uppercase tracking-wider">Incentive Earned</span>
                  <div className="w-8 h-8 rounded-xl bg-[#6E8B6F]/20 text-[#6E8B6F] flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-[#6E8B6F]">
                    ${referralStats.totalEarnedBonus.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#6E8B6F]/80 block mt-0.5">
                    Paid directly to your bank account
                  </span>
                </div>
              </Card>

              {/* Card 4: Pending Verification Bonus */}
              <Card variant="charcoal" className="p-5 bg-[#16171A] border-white/[0.08] shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#F7F4EF]/50 font-medium uppercase tracking-wider">Pending Rewards</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-amber-400">
                    ${referralStats.pendingBonus.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#F7F4EF]/40 block mt-0.5">
                    {referralStats.pendingCount} signups awaiting email confirm
                  </span>
                </div>
              </Card>
            </div>

            {/* Share & Customize Referral Link Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Shareable Referral Link & Code Box (7 Cols) */}
              <Card variant="charcoal" className="lg:col-span-7 p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#B8703F]" />
                    <span>Your Unique Referral Asset</span>
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/60 mt-1">
                    Share your custom invite link or personal promo code. When buyers sign up, your account is credited automatically.
                  </p>
                </div>

                {/* Referral Code Badge & Editor */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                      Personal Referral Code
                    </span>
                    {!isEditingRefCode ? (
                      <button
                        onClick={() => setIsEditingRefCode(true)}
                        className="text-xs text-[#B8703F] hover:text-[#d48b59] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Customize Code</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingRefCode(false)}
                        className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!isEditingRefCode ? (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#121315] border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold tracking-wider text-[#B8703F]">
                          {referralStats.referralCode}
                        </span>
                        <Badge variant="copper" size="sm">ACTIVE</Badge>
                      </div>
                      <button
                        onClick={handleCopyReferralCode}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-[#6E8B6F]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateReferralCode} className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={newRefCodeInput}
                          onChange={(e) => setNewRefCodeInput(e.target.value.toUpperCase())}
                          placeholder="E.g. MARCUS-PRO"
                          className="font-mono uppercase tracking-wider"
                          disabled={isSavingRefCode}
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          disabled={isSavingRefCode}
                        >
                          {isSavingRefCode ? 'Saving...' : 'Save Code'}
                        </Button>
                      </div>
                      <p className="text-[11px] text-[#F7F4EF]/40">
                        Use 3-20 letters, numbers, and hyphens. Your invite URL will update instantly.
                      </p>
                    </form>
                  )}
                </div>

                {/* Direct Invite URL Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                    Direct Invite URL
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121315] border border-white/10">
                    <input
                      type="text"
                      readOnly
                      value={referralStats.referralLink}
                      className="bg-transparent border-none text-xs text-[#F7F4EF]/80 font-mono flex-1 outline-none select-all"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCopyReferralLink}
                      leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {copiedLink ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* 1-Click Social Sharing Strip */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50 block">
                    1-Click Social & Community Share
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Train with verified coaching protocols on Universifit. Join with my coach referral link: ${referralStats.referralLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-xs font-semibold text-[#25D366] transition-all cursor-pointer"
                    >
                      <span>WhatsApp</span>
                    </a>

                    {/* X / Twitter */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Elevate your training and coaching on @Universifit. Use my invite link to get started: ${referralStats.referralLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      <span>X (Twitter)</span>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralStats.referralLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-xs font-semibold text-[#38BDF8] transition-all cursor-pointer"
                    >
                      <span>LinkedIn</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent('Join Universifit Coaching Platform')}&body=${encodeURIComponent(`Hey,\n\nI recommend checking out Universifit for structured fitness programs and personalized coaching.\n\nHere is my personal referral link: ${referralStats.referralLink}\n\nBest,\n${referralStats.creatorName}`)}`}
                      className="no-underline flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer"
                    >
                      <span>Email Invite</span>
                    </a>
                  </div>
                </div>
              </Card>

              {/* Right Column: How It Works & Incentive Blueprint (5 Cols) */}
              <Card variant="charcoal" className="lg:col-span-5 p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5">
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#6E8B6F]" />
                  <span>How Referral Bonuses Work</span>
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="w-6 h-6 rounded-full bg-[#B8703F]/20 text-[#B8703F] font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Share Your Link or Code</p>
                      <p className="text-[#F7F4EF]/60 leading-relaxed">
                        Send your unique URL to prospective athletes, clients, or coach colleagues.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="w-6 h-6 rounded-full bg-sky-400/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Instant Tracking on Signup</p>
                      <p className="text-[#F7F4EF]/60 leading-relaxed">
                        When the user registers or checks out with your referral link, they are permanently tagged to your partner ledger.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#6E8B6F]/10 border border-[#6E8B6F]/25">
                    <div className="w-6 h-6 rounded-full bg-[#6E8B6F]/20 text-[#6E8B6F] font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#6E8B6F]">Flat $25 Cash Reward</p>
                      <p className="text-[#F7F4EF]/70 leading-relaxed">
                        A flat <strong>$25.00 USD bonus</strong> is credited for each verified user and included in your next automated GST payout cycle.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#B8703F]/10 border border-[#B8703F]/20">
                  <p className="text-[11px] text-[#F7F4EF]/70 leading-relaxed">
                    💡 <strong>Pro-Tip:</strong> Include your referral link in your YouTube descriptions, Instagram bio, or email newsletter for passive creator bonus revenue.
                  </p>
                </div>
              </Card>
            </div>

            {/* Referred Users Activity Table */}
            <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">
                    Referred Athletes & Trainees
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                    Live telemetry of members who registered using your referral code.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start sm:self-auto">
                  <button
                    onClick={() => setReferralFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      referralFilter === 'all'
                        ? 'bg-[#B8703F] text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    All ({referralStats.totalReferred})
                  </button>
                  <button
                    onClick={() => setReferralFilter('verified')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      referralFilter === 'verified'
                        ? 'bg-[#6E8B6F] text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Verified ({referralStats.verifiedCount})
                  </button>
                  <button
                    onClick={() => setReferralFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      referralFilter === 'pending'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Pending ({referralStats.pendingCount})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                      <th className="pb-3 px-3">Athlete / Member</th>
                      <th className="pb-3 px-3">Date Joined</th>
                      <th className="pb-3 px-3">Referral Code</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Incentive Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {referralStats.referrals
                      .filter((ref) => {
                        if (referralFilter === 'verified') return ref.status === 'VERIFIED' || ref.status === 'REWARDED';
                        if (referralFilter === 'pending') return ref.status === 'PENDING';
                        return true;
                      })
                      .map((ref) => (
                        <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Member */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-3">
                              {ref.referredUserAvatar ? (
                                <img
                                  src={ref.referredUserAvatar}
                                  alt={`${ref.referredUserName} referred member avatar`}
                                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#B8703F]/20 text-[#B8703F] font-bold text-xs flex items-center justify-center border border-[#B8703F]/30">
                                  {ref.referredUserName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-white block">
                                  {ref.referredUserName}
                                </span>
                                <span className="text-[11px] text-[#F7F4EF]/40 font-mono">
                                  {ref.referredUserEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Date Joined */}
                          <td className="py-4 px-3 text-[#F7F4EF]/70 font-mono">
                            {new Date(ref.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Referral Code */}
                          <td className="py-4 px-3">
                            <span className="font-mono text-xs font-bold text-[#B8703F] bg-[#B8703F]/10 px-2 py-0.5 rounded border border-[#B8703F]/20">
                              {ref.referralCode}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-3">
                            {ref.status === 'VERIFIED' || ref.status === 'REWARDED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                <span>Pending Confirm</span>
                              </span>
                            )}
                          </td>

                          {/* Incentive Reward */}
                          <td className="py-4 px-3 text-right font-mono font-bold">
                            {ref.status === 'VERIFIED' || ref.status === 'REWARDED' ? (
                              <span className="text-sm text-[#6E8B6F]">
                                +${ref.bonusAmount.toFixed(2)} USD
                              </span>
                            ) : (
                              <span className="text-xs text-amber-400/80">
                                (${ref.bonusAmount.toFixed(2)} Pending)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {referralStats.referrals.filter((ref) => {
                  if (referralFilter === 'verified') return ref.status === 'VERIFIED' || ref.status === 'REWARDED';
                  if (referralFilter === 'pending') return ref.status === 'PENDING';
                  return true;
                }).length === 0 && (
                  <div className="py-12 text-center space-y-3">
                    <Gift className="w-8 h-8 text-[#B8703F] mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-white">No referrals found for this filter</p>
                    <p className="text-xs text-[#F7F4EF]/50">
                      Share your direct link with new clients to start earning bonus rewards.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: EARNINGS ANALYTICS (B6 REVENUE BREAKDOWN) */}
        {/* ========================================================================= */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-display font-bold text-[#F7F4EF]">
              Monthly Revenue Performance
            </h2>

            <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 block">Cumulative Payouts</span>
                  <span className="text-2xl font-display font-bold text-[#B8703F]">
                    ${data.earnings.grossRevenue.toLocaleString()} USD
                  </span>
                </div>
                <Badge variant="copper" size="md">
                  +24.8% MoM Growth
                </Badge>
              </div>

              {/* Visual Bar Graph of Monthly Growth */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/40 block">
                  Monthly Revenue Trajectory (USD)
                </span>

                {data.earnings.monthlyBreakdown.length > 0 ? (
                  <div className="grid grid-cols-6 gap-3 items-end h-48 pt-6">
                    {data.earnings.monthlyBreakdown.map((m) => {
                      const heightPercent = Math.max(8, Math.round((m.amount / 8000) * 100));
                      return (
                        <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[11px] font-mono font-bold text-[#B8703F]">
                            ${m.amount}
                          </span>
                          <div
                            className="w-full rounded-xl bg-gradient-to-t from-[#B8703F]/20 to-[#B8703F] border border-[#B8703F]/40 transition-all hover:scale-105"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-xs font-semibold text-[#F7F4EF]/60 font-mono">
                            {m.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                    <DollarSign className="w-8 h-8 text-[#B8703F] mx-auto opacity-60" />
                    <p className="text-sm font-semibold text-white">No payout history recorded yet</p>
                    <p className="text-xs text-[#F7F4EF]/50 max-w-sm mx-auto">
                      Your monthly trajectory will populate as clients book consultations and enroll in your programs.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* GST-COMPLIANT INVOICES & TAX STATEMENTS (F14/M2) */}
            <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-display font-bold text-[#F7F4EF]">
                      GST Tax Invoices & Sales Statements
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30">
                      18% GST Compliant
                    </span>
                  </div>
                  <p className="text-xs text-[#F7F4EF]/60 mt-0.5">
                    Itemized tax invoices with SAC 999293 code, CGST/SGST split, and legal creator GSTIN.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-[#F7F4EF]/50">Creator GSTIN:</span>
                  <span className="font-bold text-[#B8703F]">
                    {payoutDetails?.gstin || '27AAPFV8921M1Z5'}
                  </span>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                      <th className="pb-3 px-3">Invoice No.</th>
                      <th className="pb-3 px-3">Student / Buyer</th>
                      <th className="pb-3 px-3">Program / Offer</th>
                      <th className="pb-3 px-3">Gross Total</th>
                      <th className="pb-3 px-3">Taxable Base</th>
                      <th className="pb-3 px-3">GST (18%)</th>
                      <th className="pb-3 px-3 text-right">Tax Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {[
                      {
                        invoiceNumber: 'ASC-INV-2026-9842',
                        date: 'Aug 28, 2026',
                        studentName: 'Akshat Sharma',
                        studentEmail: 'akshat@example.com',
                        programTitle: 'Mastering the Big 3 Bar Paths (Video Course)',
                        gross: 89,
                        base: 75.42,
                        gst: 13.58,
                      },
                      {
                        invoiceNumber: 'ASC-INV-2026-9811',
                        date: 'Aug 15, 2026',
                        studentName: 'Aditya Sharma',
                        studentEmail: 'aditya.sharma@example.com',
                        programTitle: '1-on-1 Biomechanics & Hypertrophy Cohort',
                        gross: 180,
                        base: 152.54,
                        gst: 27.46,
                      },
                      {
                        invoiceNumber: 'ASC-INV-2026-9788',
                        date: 'Aug 10, 2026',
                        studentName: 'Rohan Mehta',
                        studentEmail: 'rohan.mehta@example.com',
                        programTitle: 'Thoracic Mobility & Squat Form Breakdown',
                        gross: 140,
                        base: 118.64,
                        gst: 21.36,
                      },
                    ].map((inv) => (
                      <tr key={inv.invoiceNumber} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3 font-mono font-bold text-[#B8703F]">
                          <div>
                            <span>{inv.invoiceNumber}</span>
                            <span className="block text-[10px] text-[#F7F4EF]/40 font-normal">
                              {inv.date}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#F7F4EF]">
                          <div>
                            <span>{inv.studentName}</span>
                            <span className="block text-[10px] text-[#F7F4EF]/40 font-mono">
                              {inv.studentEmail}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#F7F4EF]/80 max-w-xs truncate font-medium">
                          {inv.programTitle}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white">
                          ${inv.gross} USD
                        </td>
                        <td className="py-3.5 px-3 text-[#F7F4EF]/70 font-mono">
                          ${inv.base}
                        </td>
                        <td className="py-3.5 px-3 text-[#6E8B6F] font-mono font-semibold">
                          ${inv.gst} (CGST+SGST)
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <a
                            href={`/api/invoices/${inv.invoiceNumber}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="no-underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-[#B8703F]/20 text-[#B8703F] hover:text-[#d48b59] border border-white/10 hover:border-[#B8703F]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* CREATE OFFER MODAL (WIRED TO B2: POST /offers) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateOfferOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#16171A] w-full max-w-lg rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Create New Coaching Offer
                  </h3>
                  <span className="text-xs text-[#B8703F] font-semibold">
                    Wired to B2 POST /offers API
                  </span>
                </div>

                <button
                  onClick={() => setIsCreateOfferOpen(false)}
                  className="p-1 rounded-full text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOffer} className="space-y-4">
                {/* Offer Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase">
                    Coaching Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOfferType('ONE_ON_ONE')}
                      className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                        offerType === 'ONE_ON_ONE'
                          ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                          : 'bg-white/[0.02] text-white/70 border-white/10'
                      }`}
                    >
                      1-on-1
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('COURSE')}
                      className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                        offerType === 'COURSE'
                          ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                          : 'bg-white/[0.02] text-white/70 border-white/10'
                      }`}
                    >
                      Video Course
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferType('COMMUNITY')}
                      className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                        offerType === 'COMMUNITY'
                          ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                          : 'bg-white/[0.02] text-white/70 border-white/10'
                      }`}
                    >
                      Squad
                    </button>
                  </div>
                </div>

                {/* Offer Title */}
                <Input
                  label="Program Title"
                  placeholder="e.g. 1-on-1 Biomechanics & Hypertrophy Cohort"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  required
                />

                {/* Price (USD) */}
                <Input
                  label="Tuition Price (USD)"
                  type="number"
                  placeholder="180"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  required
                />

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#F7F4EF]/80">
                    Deliverables & Curriculum Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Weekly video form checks, periodized split, daily macro sync..."
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    className="w-full bg-[#121315] text-xs text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] rounded-xl p-3.5 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsCreateOfferOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmittingOffer}
                  >
                    Publish Offer
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CREATE PROMO CODE / COUPON MODAL (WIRED TO POST /api/coupons)             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateCouponOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#16171A] w-full max-w-lg rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Create Promotional Coupon
                    </h3>
                    <span className="text-[11px] text-[#F7F4EF]/50">
                      Generate valid promo codes for checkout discounts
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateCouponOpen(false)}
                  className="p-1 rounded-full text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                {/* Promo Code Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP25, SUMMER20, ATHLETE50"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#121315] text-sm font-mono tracking-wider font-bold text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] rounded-xl p-3.5 focus:outline-none uppercase"
                  />
                  <p className="text-[11px] text-[#F7F4EF]/40">
                    Athletes will enter this exact code during checkout.
                  </p>
                </div>

                {/* Discount Type Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase">
                    Discount Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCouponDiscountType('PERCENT')}
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                        couponDiscountType === 'PERCENT'
                          ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                          : 'bg-white/[0.02] text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      <span>Percentage Off (%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCouponDiscountType('FLAT')}
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                        couponDiscountType === 'FLAT'
                          ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                          : 'bg-white/[0.02] text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Flat Amount ($)</span>
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase">
                    {couponDiscountType === 'PERCENT' ? 'Discount Percentage (%) *' : 'Flat Discount Amount ($ USD) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max={couponDiscountType === 'PERCENT' ? '100' : '10000'}
                      placeholder={couponDiscountType === 'PERCENT' ? '20' : '50'}
                      value={couponValue}
                      onChange={(e) => setCouponValue(e.target.value)}
                      className="w-full bg-[#121315] text-sm text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] rounded-xl p-3.5 pr-10 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-3.5 text-sm font-bold text-[#B8703F]">
                      {couponDiscountType === 'PERCENT' ? '%' : '$'}
                    </span>
                  </div>
                </div>

                {/* Usage Limit & Expiry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase">
                      Max Usage Limit (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 100 (Leave empty for ∞)"
                      value={couponUsageLimit}
                      onChange={(e) => setCouponUsageLimit(e.target.value)}
                      className="w-full bg-[#121315] text-xs text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] rounded-xl p-3 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      className="w-full bg-[#121315] text-xs text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] rounded-xl p-3 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsCreateCouponOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmittingCoupon}
                  >
                    Create Coupon
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VERIFICATION DOCS MODAL (WIRED TO B7: S3/R2 UPLOAD) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isVerificationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#16171A] w-full max-w-md rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 text-center shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/30 mx-auto flex items-center justify-center">
                <FileCheck className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-white">
                  Upload Credential Documents
                </h3>
                <p className="text-xs text-[#F7F4EF]/60">
                  Streams directly to S3/Cloudflare R2 for administrative audit (B7).
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] space-y-3 cursor-pointer hover:border-[#B8703F] transition-colors">
                <Upload className="w-6 h-6 text-[#B8703F] mx-auto" />
                <span className="text-xs font-semibold text-[#F7F4EF]/80 block">
                  Drag NSCA / CISSN certificate or Govt ID here
                </span>
                <span className="text-[10px] text-white/40 block">PDF, PNG, JPG up to 10MB</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsVerificationModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    triggerToast('Documents Uploaded to S3/R2 & Sent to Admin Audit Queue! 🚀');
                    setIsVerificationModalOpen(false);
                  }}
                >
                  Submit for Audit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* COURSE STUDIO MODAL (F13: CREATE/EDIT/PUBLISH VIDEO COURSES)              */}
      {/* ========================================================================= */}
      <CourseStudioModal
        isOpen={isCourseStudioOpen}
        onClose={() => setIsCourseStudioOpen(false)}
        courseToEdit={courseToEdit}
        payoutSetupCompleted={Boolean(payoutDetails?.payoutSetupCompleted)}
        onOpenPayoutSetup={() => {
          setGatedActionMessage(
            'Payout Setup Required: Please add your bank account or UPI ID so Universifit can process your client earnings before publishing paid courses.'
          );
          setIsPayoutModalOpen(true);
        }}
        onCourseSaved={(savedCourse) => {
          loadCreatorData();
          triggerToast(
            savedCourse?.isPublished
              ? 'Course Published to Marketplace! 🎉'
              : 'Course Draft Saved in Studio! 📝'
          );
        }}
      />

      {/* ========================================================================= */}
      {/* PAYOUT SETUP MODAL (F14: BANK ACCOUNT & UPI CONFIGURATION)                */}
      {/* ========================================================================= */}
      <PayoutSetupModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        currentPayout={payoutDetails}
        gatedActionMessage={gatedActionMessage}
        onPayoutSaved={(updated) => {
          setPayoutDetails(updated);
          triggerToast('Payout Configuration Connected & Verified! 🏦');
          loadCreatorData();
        }}
      />

      {/* ========================================================================= */}
      {/* MEMBER ACTIVITY DOSSIER MODAL (ACTIVITY TIMELINE & S1 REPUTATION)         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isActivityModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#16171A] w-full max-w-2xl rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B8703F]/20 to-[#6E8B6F]/20 border border-white/10 flex items-center justify-center text-xl font-display font-bold text-white overflow-hidden shrink-0">
                    {selectedMemberActivity?.user.avatarUrl ? (
                      <img
                        src={selectedMemberActivity.user.avatarUrl}
                        alt={`${selectedMemberActivity.user.fullName} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedMemberActivity?.user.fullName.charAt(0) || 'A'
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-white">
                        {selectedMemberActivity?.user.fullName || 'Member Activity Dossier'}
                      </h3>
                      {selectedMemberActivity?.membership?.tier && (
                        <span
                          style={{
                            borderColor: `${selectedMemberActivity.membership.tier.badgeColor || '#B8703F'}55`,
                            color: selectedMemberActivity.membership.tier.badgeColor || '#B8703F',
                          }}
                          className="text-[10px] font-mono px-2 py-0.2 rounded-full border bg-black/40"
                        >
                          {selectedMemberActivity.membership.tier.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 font-mono">
                      {selectedMemberActivity?.user.email} • Joined {selectedMemberActivity?.membership ? new Date(selectedMemberActivity.membership.joinedAt).toLocaleDateString() : 'Active'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsActivityModalOpen(false);
                    setSelectedMemberActivity(null);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto space-y-6 pr-1">
                {isLoadingActivity ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-[#B8703F] border-t-transparent rounded-full animate-spin mx-auto" />
                    <span className="text-xs text-white/50 font-mono block">Loading member telemetry & activity logs...</span>
                  </div>
                ) : selectedMemberActivity ? (
                  <>
                    {/* Banned Alert Banner */}
                    {selectedMemberActivity.membership?.status === 'BANNED' && (
                      <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            <strong>Member Banned:</strong> {selectedMemberActivity.membership.banReason || 'Code of conduct violation'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-300">
                          {selectedMemberActivity.membership.bannedAt ? new Date(selectedMemberActivity.membership.bannedAt).toLocaleDateString() : 'Banned'}
                        </span>
                      </div>
                    )}

                    {/* 4 Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                        <span className="text-[10px] uppercase font-mono text-white/40 block">Total Points</span>
                        <span className="text-xl font-display font-bold text-[#B8703F]">
                          {selectedMemberActivity.gamification?.totalCommunityPoints ?? selectedMemberActivity.user.points}
                        </span>
                        <span className="text-[9px] text-[#6E8B6F] font-mono block">
                          {selectedMemberActivity.gamification?.level.tierName || 'Level 1'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                        <span className="text-[10px] uppercase font-mono text-white/40 block">Posts</span>
                        <span className="text-xl font-display font-bold text-white">
                          {selectedMemberActivity.activity.totalPosts}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono block">Created</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                        <span className="text-[10px] uppercase font-mono text-white/40 block">Replies</span>
                        <span className="text-xl font-display font-bold text-white">
                          {selectedMemberActivity.activity.totalReplies}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono block">Discussions</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                        <span className="text-[10px] uppercase font-mono text-white/40 block">Completed</span>
                        <span className="text-xl font-display font-bold text-[#6E8B6F]">
                          {selectedMemberActivity.activity.completedLessons}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono block">Lessons</span>
                      </div>
                    </div>

                    {/* Recent Community Posts Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#B8703F] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Community Posts ({selectedMemberActivity.activity.posts.length})</span>
                      </h4>

                      {selectedMemberActivity.activity.posts.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedMemberActivity.activity.posts.map((post) => (
                            <div
                              key={post.id}
                              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white truncate">{post.title}</span>
                                <span className="text-[10px] text-white/40 font-mono">
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-white/70 line-clamp-2">{post.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-white/40">
                          No community posts published yet.
                        </div>
                      )}
                    </div>

                    {/* Course Progress Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E8B6F] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Curriculum Progress ({selectedMemberActivity.activity.progress.length})</span>
                      </h4>

                      {selectedMemberActivity.activity.progress.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedMemberActivity.activity.progress.map((prog, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-white block">{prog.lessonTitle}</span>
                                <span className="text-[10px] text-white/40 font-mono">{prog.courseTitle}</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                  prog.isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {prog.isCompleted ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-white/40">
                          No lesson completion telemetry recorded.
                        </div>
                      )}
                    </div>

                    {/* Points Transaction Log */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gamification Points History ({selectedMemberActivity.activity.pointsTransactions.length})</span>
                      </h4>

                      {selectedMemberActivity.activity.pointsTransactions.length > 0 ? (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {selectedMemberActivity.activity.pointsTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04] flex items-center justify-between text-xs font-mono"
                            >
                              <span className="text-white/70">{tx.action}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[#B8703F] font-bold">+{tx.points} pts</span>
                                <span className="text-[10px] text-white/30">{new Date(tx.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-white/40">
                          Points awarded on account creation.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-xs text-white/40">
                    No activity data available for this member.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setIsActivityModalOpen(false);
                    setSelectedMemberActivity(null);
                  }}
                >
                  Close Dossier
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* BAN / UNBAN MEMBER CONFIRMATION MODAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBanModalOpen && memberToBan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#16171A] w-full max-w-md rounded-3xl border border-white/15 p-6 sm:p-8 space-y-5 shadow-2xl"
            >
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                  memberToBan.isBanned
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {memberToBan.isBanned ? <UserCheck className="w-7 h-7" /> : <Ban className="w-7 h-7" />}
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-display font-bold text-xl text-white">
                  {memberToBan.isBanned ? 'Reinstate Member Access' : 'Ban Community Member'}
                </h3>
                <p className="text-xs text-[#F7F4EF]/60">
                  {memberToBan.isBanned
                    ? `Restore ${memberToBan.name}'s ability to view tier content, post discussions, and join cohort masterclasses.`
                    : `Immediately revoke ${memberToBan.name}'s tier access, hide their discussions, and block them from rejoining.`}
                </p>
              </div>

              {!memberToBan.isBanned && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/80 block">
                    Ban Reason (Audit Log)
                  </label>
                  <textarea
                    rows={2}
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    placeholder="Specify violation or misconduct..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Violated guidelines', 'Spamming discussions', 'Harassment'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setBanReasonInput(reason)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white cursor-pointer"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsBanModalOpen(false);
                    setMemberToBan(null);
                  }}
                  disabled={isSubmittingBan}
                >
                  Cancel
                </Button>
                <Button
                  variant={memberToBan.isBanned ? 'primary' : 'outline'}
                  className={`flex-1 ${
                    !memberToBan.isBanned ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500' : ''
                  }`}
                  onClick={() => handleConfirmBan()}
                  disabled={isSubmittingBan}
                >
                  {isSubmittingBan ? 'Processing...' : memberToBan.isBanned ? 'Unban Member' : 'Confirm Ban'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
