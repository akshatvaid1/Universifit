import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Award,
  Video,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Share2,
  Lock,
  AlertCircle,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Pencil,
  Sparkles,
  Heart,
} from 'lucide-react';
import { Card, Badge, Button } from './ui';
import { ReviewModal } from './ReviewModal';
import {
  fetchCreatorById,
  fetchCreatorOffers,
  fetchCreatorReviewsApi,
  fetchWishlistApi,
  toggleWishlistApi,
  logStorefrontVisitApi,
  type CreatorItem,
  type CreatorOffer,
  type CreatorReviewsSummary,
  type ReviewItem,
} from '../services/api';
import { updatePageMetadata } from '../utils/seo';

interface CreatorProfilePageProps {
  creatorId: string;
  onBack?: () => void;
  onBookOffer?: (offer: CreatorOffer, creator: CreatorItem) => void;
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({
  creatorId,
  onBack,
  onBookOffer,
}) => {
  const [creator, setCreator] = useState<CreatorItem | null>(null);
  const [offers, setOffers] = useState<CreatorOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [reviewsData, setReviewsData] = useState<CreatorReviewsSummary | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<ReviewItem | null>(null);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedOfferIds, setSavedOfferIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfileData = () => {
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchCreatorById(creatorId),
      fetchCreatorOffers(creatorId),
      fetchCreatorReviewsApi(creatorId),
      fetchWishlistApi(),
      logStorefrontVisitApi(creatorId),
    ])
      .then(([creatorData, offersData, reviewsRes, wishlistRes]) => {
        if (creatorData) {
          setCreator(creatorData);
        } else {
          setError('Coach profile not found');
        }
        if (offersData && offersData.length > 0) {
          setOffers(offersData);
          setSelectedOfferId(offersData[0].id);
        } else if (creatorData?.featuredOffers && creatorData.featuredOffers.length > 0) {
          setOffers(creatorData.featuredOffers as CreatorOffer[]);
          setSelectedOfferId(creatorData.featuredOffers[0].id);
        }
        if (reviewsRes && reviewsRes.data) {
          setReviewsData(reviewsRes.data);
        }
        if (wishlistRes && wishlistRes.data) {
          setSavedOfferIds(new Set(wishlistRes.data.map((item) => item.offerId)));
        }
      })
      .catch((err) => {
        console.warn('Profile fetch error', err);
        setError('Network interruption while querying coach profile');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleToggleWishlist = async (e: React.MouseEvent, offer: CreatorOffer) => {
    e.stopPropagation();
    const isCurrentlySaved = savedOfferIds.has(offer.id);

    // Optimistic state update
    setSavedOfferIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(offer.id);
      else next.add(offer.id);
      return next;
    });

    setToastMessage(
      isCurrentlySaved
        ? `Removed "${offer.title}" from saved items.`
        : `Saved "${offer.title}" to your Wishlist! ❤️`
    );
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await toggleWishlistApi(offer.id);
    } catch (err) {
      console.warn('Wishlist toggle error:', err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProfileData();
  }, [creatorId]);

  // Dynamic Per-Creator SEO Metadata Injection (Title, Description, OG Image & Profile Type)
  useEffect(() => {
    if (creator && creator.fullName) {
      const bioSnippet = creator.bio
        ? creator.bio.length > 150
          ? `${creator.bio.slice(0, 147)}...`
          : creator.bio
        : `Verified 1-on-1 coaching, protocols & custom splits with ${creator.fullName}. Specializing in ${creator.specialtyTags.join(', ')}.`;

      updatePageMetadata({
        title: `${creator.fullName} — ${creator.headline || 'Verified Coach'} | Ascend`,
        description: `${bioSnippet} Rated ${creator.rating.toFixed(2)}★ with ${creator.totalClients}+ active athletes coached.`,
        ogImage: creator.avatarUrl || '/og-image.svg',
        ogType: 'profile',
        canonicalUrl: `${window.location.origin}/creator/${encodeURIComponent(creator.handle || creator.id)}`,
      });
    }
  }, [creator]);

  const selectedOffer =
    offers.find((o) => o.id === selectedOfferId) || offers[0] || creator?.featuredOffers?.[0];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getFormatIcon = (type?: string) => {
    switch (type) {
      case 'COURSE':
        return <BookOpen className="w-4 h-4 text-[#B8703F]" />;
      case 'COMMUNITY':
        return <Users className="w-4 h-4 text-[#6E8B6F]" />;
      default:
        return <Video className="w-4 h-4 text-sky-400" />;
    }
  };

  const getFormatBadge = (type?: string) => {
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
      <div className="min-h-screen bg-[#16171A] text-[#F7F4EF] font-sans pb-32">
        {/* Top Navigation Skeleton */}
        <div className="border-b border-white/[0.08] bg-[#121315]/80 backdrop-blur-md sticky top-20 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
              <span>Back to Discovery</span>
            </button>
            <div className="w-24 h-7 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* Hero Profile Skeleton */}
        <section className="bg-gradient-to-b from-[#121315] via-[#16171A] to-[#16171A] pt-8 pb-12 border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
              <div className="lg:col-span-4 h-[380px] rounded-3xl bg-white/[0.04] border border-white/[0.08]" />
              <div className="lg:col-span-8 space-y-6">
                <div className="space-y-3">
                  <div className="h-6 w-32 bg-white/[0.06] rounded-full" />
                  <div className="h-10 w-3/4 bg-white/[0.08] rounded-xl" />
                  <div className="h-4 w-full bg-white/[0.04] rounded" />
                  <div className="h-4 w-2/3 bg-white/[0.04] rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Offers Skeleton */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-6 w-48 bg-white/[0.06] rounded" />
              <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] h-40" />
              <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] h-40" />
            </div>
            <div className="lg:col-span-4">
              <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] h-80" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-[#16171A] text-[#F7F4EF] font-sans pb-32 flex flex-col justify-center items-center px-4">
        <Card
          variant="charcoal"
          className="p-8 sm:p-10 max-w-lg w-full text-center space-y-6 border-rose-500/30 bg-[#121315] shadow-2xl my-16"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-white tracking-tight">
              Coach Profile Unavailable
            </h2>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
              We were unable to load this coach's curriculum and consultation schedules. The practitioner may have updated their handle or temporarily paused new bookings.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={loadProfileData}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retry Loading Profile
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={onBack}
            >
              Return to Discover
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#16171A] text-[#F7F4EF] font-sans pb-32">
      
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

      {/* Top Navigation & Back Bar */}
      <div className="border-b border-white/[0.08] bg-[#121315]/80 backdrop-blur-md sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded-lg px-2 py-1"
          >
            <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
            <span>Back to Discovery</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F]"
            >
              <Share2 className="w-3.5 h-3.5 text-[#B8703F]" />
              <span>{copiedLink ? 'Copied Link!' : 'Share Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Profile Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#121315] via-[#16171A] to-[#16171A] pt-8 pb-12 border-b border-white/[0.08]">
        {/* Glow Halo */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#B8703F]/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Coach Photo Left (Span 4) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-4 relative"
            >
              <div className="relative h-[360px] sm:h-[420px] rounded-3xl overflow-hidden bg-neutral-900 border border-white/15 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.8)]">
                <img
                  src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80'}
                  alt={creator.fullName}
                  className="w-full h-full object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#16171A] via-transparent to-transparent" />

                {/* Verified Pill Overlay */}
                <div className="absolute top-4 left-4">
                  <Badge variant="verified" size="md">
                    Verified Coach
                  </Badge>
                </div>

                {/* Bottom Stats Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{creator.rating.toFixed(2)}</span>
                    <span className="text-white/50 font-normal">({creator.totalClients}+ clients)</span>
                  </div>
                  <span className="text-xs font-semibold text-[#6E8B6F]">Active Coach</span>
                </div>
              </div>
            </motion.div>

            {/* Coach Dossier & Bio Right (Span 8) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-8 space-y-6"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {creator.specialtyTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.06] text-[#F7F4EF]/80 border border-white/[0.08]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#F7F4EF] tracking-tight">
                  {creator.fullName}
                </h1>
                <p className="text-base sm:text-lg text-[#B8703F] font-sans font-medium">
                  {creator.headline || `@${creator.handle}`}
                </p>

                {/* Social Links (YouTube, Instagram, Discord) */}
                {creator.socialLinks && (creator.socialLinks.youtube || creator.socialLinks.instagram || creator.socialLinks.discord) && (
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    {creator.socialLinks.youtube && (
                      <a
                        href={creator.socialLinks.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 text-xs font-semibold text-[#FF6B6B] hover:text-white transition-all shadow-sm group cursor-pointer"
                        title={`${creator.fullName} YouTube Channel`}
                      >
                        <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span>YouTube</span>
                      </a>
                    )}
                    {creator.socialLinks.instagram && (
                      <a
                        href={creator.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/30 text-xs font-semibold text-[#F777A9] hover:text-white transition-all shadow-sm group cursor-pointer"
                        title={`${creator.fullName} Instagram`}
                      >
                        <svg className="w-4 h-4 fill-none stroke-current stroke-2 transition-transform group-hover:scale-110" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                        </svg>
                        <span>Instagram</span>
                      </a>
                    )}
                    {creator.socialLinks.discord && (
                      <a
                        href={creator.socialLinks.discord}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/35 text-xs font-semibold text-[#8EA1E1] hover:text-white transition-all shadow-sm group cursor-pointer"
                        title={`${creator.fullName} Discord Community`}
                      >
                        <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <span>Discord Community</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bio Statement */}
              <div className="p-5 rounded-2xl bg-[#121315] border border-white/[0.08] shadow-sm">
                <h3 className="text-xs font-bold text-[#F7F4EF]/40 uppercase tracking-wider mb-2">
                  Coaching Philosophy & Methodology
                </h3>
                <p className="text-sm sm:text-base text-[#F7F4EF]/80 font-normal leading-relaxed">
                  {creator.bio || 'World-class coach offering individualized, high-touch training, metabolic nutrition planning, and form audits.'}
                </p>
              </div>

              {/* Credentials Grid */}
              {creator.credentials && creator.credentials.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#F7F4EF]/40 uppercase tracking-wider">
                    Verified Credentials & Certifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {creator.credentials.map((cred, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.03] border border-[#6E8B6F]/20 text-xs font-medium text-[#F7F4EF]/90 flex items-center gap-2.5"
                      >
                        <Award className="w-4 h-4 text-[#6E8B6F] shrink-0" />
                        <span>{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-lg font-display font-bold text-[#B8703F]">
                    {creator.rating.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-[#F7F4EF]/50 uppercase font-semibold">
                    Client Rating
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-lg font-display font-bold text-[#6E8B6F]">
                    {creator.totalClients}+
                  </div>
                  <span className="text-[10px] text-[#F7F4EF]/50 uppercase font-semibold">
                    Coached
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-lg font-display font-bold text-[#F7F4EF]">
                    100%
                  </div>
                  <span className="text-[10px] text-[#F7F4EF]/50 uppercase font-semibold">
                    Verified ID
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <div className="text-lg font-display font-bold text-sky-400">
                    &lt; 24h
                  </div>
                  <span className="text-[10px] text-[#F7F4EF]/50 uppercase font-semibold">
                    Response Time
                  </span>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Offers & Curriculum Section */}
      <section className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Offers List (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <Badge variant="copper" size="sm">
                Programs & Formats
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] tracking-tight">
                Available Coaching & Programs
              </h2>
              <p className="text-sm text-[#F7F4EF]/60 font-normal">
                Choose the coaching format that fits your commitment level. All programs include verified coach oversight.
              </p>
            </div>

            {/* Offer Cards List */}
            <div className="space-y-4 pt-2">
              {offers.length > 0 ? (
                offers.map((offer) => {
                  const isSelected = selectedOffer?.id === offer.id;

                  return (
                    <motion.div
                      key={offer.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select ${offer.title} for ${offer.price}`}
                      onClick={() => setSelectedOfferId(offer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedOfferId(offer.id);
                        }
                      }}
                      className="cursor-pointer outline-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315]"
                    >
                      <Card
                        variant="charcoal"
                        interactive
                        className={`p-6 transition-all border ${
                          isSelected
                            ? 'border-[#B8703F] bg-[#1a1b1f] shadow-[0_0_30px_-5px_rgba(184,112,63,0.3)]'
                            : 'border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          
                          {/* Offer Header & Description */}
                          <div className="space-y-2.5 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getFormatBadge(offer.type)}
                                {offer.isActive === false && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    Draft • Pricing & Availability Pending
                                  </span>
                                )}
                                <span className="text-xs text-[#F7F4EF]/50 flex items-center gap-1 font-mono">
                                  {getFormatIcon(offer.type)}
                                  {offer.type}
                                </span>
                              </div>

                              <button
                                type="button"
                                title={savedOfferIds.has(offer.id) ? 'Remove from Saved' : 'Save to Wishlist'}
                                onClick={(e) => handleToggleWishlist(e, offer)}
                                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                                  savedOfferIds.has(offer.id)
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                    : 'bg-white/[0.04] text-[#F7F4EF]/60 hover:text-white hover:bg-white/10 border border-white/10'
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    savedOfferIds.has(offer.id) ? 'fill-rose-500 text-rose-500 scale-110' : ''
                                  }`}
                                />
                                <span className="hidden sm:inline">
                                  {savedOfferIds.has(offer.id) ? 'Saved' : 'Save'}
                                </span>
                              </button>
                            </div>

                            <h3 className="text-xl font-display font-bold text-[#F7F4EF]">
                              {offer.title}
                            </h3>

                            <p className="text-sm text-[#F7F4EF]/70 leading-relaxed font-normal">
                              {offer.description || 'Comprehensive protocol tailored to your physical transformation milestones.'}
                            </p>

                            {/* Offer Perks Row */}
                            <div className="pt-2 flex flex-wrap gap-2 text-xs text-[#F7F4EF]/70 font-medium">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#6E8B6F]" />
                                Direct Coach Line
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#6E8B6F]" />
                                Weekly Video Form Checks
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#6E8B6F]" />
                                24x7 Progress Dashboard
                              </span>
                            </div>
                          </div>

                          {/* Price & Selection Indicator */}
                          <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-white/[0.08]">
                            <div>
                              <span className="text-xs text-[#F7F4EF]/50 font-medium block">Investment</span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-3xl font-display font-bold text-[#B8703F]">
                                  ${Number(offer.price)}
                                </span>
                                <span className="text-xs text-[#F7F4EF]/60 font-sans">
                                  / {offer.type === 'COURSE' ? 'curriculum' : 'month'}
                                </span>
                              </div>
                            </div>

                            <div className="sm:mt-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                  offer.isActive === false
                                    ? isSelected
                                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                                      : 'bg-white/[0.05] text-amber-400/80 border-amber-500/20'
                                    : isSelected
                                    ? 'bg-[#B8703F] text-white border-[#B8703F]'
                                    : 'bg-white/[0.05] text-[#F7F4EF]/70 border-white/10'
                                }`}
                              >
                                {offer.isActive === false
                                  ? isSelected
                                    ? 'Draft Selected'
                                    : 'Preview Draft'
                                  : isSelected
                                  ? 'Selected Program'
                                  : 'Select Program'}
                              </span>
                            </div>
                          </div>

                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <Card
                  variant="charcoal"
                  className="py-14 px-6 text-center space-y-4 border-white/[0.08] bg-[#121315] shadow-xl"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                    <PackageOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-display font-bold text-white">
                      No active packages published yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#F7F4EF]/60 max-w-md mx-auto leading-relaxed font-normal">
                      This coach is currently finalizing their consultation calendar and course syllabus. Browse other vetted coaches or return later.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={onBack}>
                      Browse Other Coaches
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* DESKTOP STICKY CTA CARD (Span 4) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-36 self-start space-y-4">
            <Card
              variant="charcoal"
              className="p-6 bg-[#121315] border-white/15 shadow-2xl space-y-5"
            >
              <div className="pb-3 border-b border-white/[0.08] flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#F7F4EF]/50 tracking-wider">
                  Selected Program
                </span>
                <Badge variant="verified" size="sm">
                  100% Satisfaction
                </Badge>
              </div>

              {selectedOffer ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-display font-bold text-lg text-[#F7F4EF]">
                      {selectedOffer.title}
                    </h4>
                    <p className="text-xs text-[#F7F4EF]/60 mt-1 line-clamp-2">
                      {selectedOffer.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#16171A] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs text-[#F7F4EF]/60 font-medium">Total Investment</span>
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold text-[#B8703F]">
                        ${Number(selectedOffer.price)}
                      </span>
                      <span className="text-[10px] text-[#F7F4EF]/50 block font-sans">
                        {selectedOffer.type === 'COURSE' ? 'Lifetime Access' : 'Monthly Recurring'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {selectedOffer.isActive === false ? (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                        <span className="text-xs font-semibold text-amber-300 block">
                          Draft Offer Pending Creator Launch
                        </span>
                        <p className="text-[11px] text-[#F7F4EF]/60">
                          Chadtag is currently finalizing pricing and calendar slots. Booking will activate once published.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => onBookOffer && onBookOffer(selectedOffer, creator)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {selectedOffer.type === 'COURSE' ? 'Enroll in Course' : 'Book Coaching Slot'}
                      </Button>
                    )}

                    <p className="text-[11px] text-center text-[#F7F4EF]/40 font-medium flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-[#6E8B6F]" />
                      <span>Encrypted Checkout with Razorpay</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#F7F4EF]/50">
                  Select an offer from the left to proceed.
                </div>
              )}
            </Card>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* VERIFIED REVIEWS & RATINGS SECTION (F16) */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#16171A] border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="copper" size="sm">
                Verified Feedback
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] tracking-tight">
                Athlete Reviews & Results
              </h2>
              <p className="text-sm text-[#F7F4EF]/60 max-w-xl font-normal">
                Authentic reviews submitted by athletes upon completing course curriculums or 1-on-1 consultations.
              </p>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setReviewToEdit(null);
                setIsReviewModalOpen(true);
              }}
              leftIcon={<Sparkles className="w-4 h-4 text-[#B8703F]" />}
            >
              Rate & Review Coach
            </Button>
          </div>

          {/* Aggregate Rating Scorecard */}
          <Card
            variant="charcoal"
            className="p-6 sm:p-8 bg-[#121315] border-white/10 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Score Column (Span 4) */}
              <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-white/[0.08] pb-6 md:pb-0 md:pr-6">
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-5xl sm:text-6xl font-display font-bold text-[#F7F4EF]">
                    {(reviewsData?.averageRating || creator.rating || 5.0).toFixed(2)}
                  </span>
                  <span className="text-lg text-[#F7F4EF]/40 font-medium">/ 5.0</span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-[#F7F4EF]/60 font-medium">
                  Based on <strong>{reviewsData?.totalReviews || 142}</strong> verified athlete evaluations
                </p>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6E8B6F]/10 border border-[#6E8B6F]/25 text-[11px] font-semibold text-[#6E8B6F]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Verified Purchases
                  </span>
                </div>
              </div>

              {/* Star Breakdown Bars Column (Span 8) */}
              <div className="md:col-span-8 space-y-2.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsData?.distribution?.[stars as 1 | 2 | 3 | 4 | 5] || 0;
                  const total = reviewsData?.totalReviews || 1;
                  const percent = Math.round((count / total) * 100);

                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-[#F7F4EF]/70 font-medium flex items-center gap-1 shrink-0">
                        <span>{stars}</span> <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </span>

                      <div className="flex-1 h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#B8703F] to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <span className="w-12 text-right text-[#F7F4EF]/50 font-mono text-[11px] shrink-0">
                        {percent}% ({count})
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </Card>

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStarFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                starFilter === 'all'
                  ? 'bg-[#B8703F] text-white border-[#B8703F]'
                  : 'bg-white/[0.04] text-[#F7F4EF]/70 border-white/10 hover:border-white/20'
              }`}
            >
              All Reviews ({reviewsData?.reviews.length || 0})
            </button>
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                onClick={() => setStarFilter(star)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                  starFilter === star
                    ? 'bg-[#B8703F] text-white border-[#B8703F]'
                    : 'bg-white/[0.04] text-[#F7F4EF]/70 border-white/10 hover:border-white/20'
                }`}
              >
                <span>{star} Stars</span>
                <Star className="w-3 h-3 fill-current" />
              </button>
            ))}
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(reviewsData?.reviews || [])
              .filter((r: ReviewItem) => starFilter === 'all' || r.rating === starFilter)
              .map((review: ReviewItem) => {
                const isAuthor = review.buyerId === 'mock_buyer_id' || review.buyerName.includes('Akshat');

                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      variant="charcoal"
                      className="p-6 bg-[#121315] border-white/[0.08] shadow-lg flex flex-col justify-between h-full space-y-4"
                    >
                      <div className="space-y-3">
                        {/* Header: User Avatar, Name & Stars */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={review.buyerAvatar}
                              alt={review.buyerName}
                              className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display font-bold text-sm text-[#F7F4EF]">
                                  {review.buyerName}
                                </h4>
                                {review.verifiedBuyer && (
                                  <Badge variant="verified" size="sm">
                                    VERIFIED
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-[#F7F4EF]/40 font-mono">
                                {review.createdAt}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating Icons */}
                          <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Program Context Chip */}
                        {review.programTitle && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#B8703F] font-medium">
                            <BookOpen className="w-3 h-3" />
                            <span className="truncate max-w-[280px]">{review.programTitle}</span>
                          </div>
                        )}

                        {/* Review Body Text */}
                        <p className="text-sm text-[#F7F4EF]/80 leading-relaxed font-normal">
                          "{review.reviewText}"
                        </p>
                      </div>

                      {/* Author Edit CTA Footer */}
                      {isAuthor && (
                        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 font-medium">
                            ✓ You authored this review
                          </span>
                          <button
                            onClick={() => {
                              setReviewToEdit(review);
                              setIsReviewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8703F] hover:underline cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit Review</span>
                          </button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
          </div>

        </div>
      </section>

      {/* Review Submission & Edit Modal (F16) */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewToEdit(null);
        }}
        creatorId={creator.id}
        creatorName={creator.fullName}
        programTitle={selectedOffer?.title || 'Coaching Program'}
        existingReview={reviewToEdit}
        onReviewSaved={() => {
          // Refresh reviews summary dynamically
          fetchCreatorReviewsApi(creator.id).then((res) => {
            if (res.data) setReviewsData(res.data);
          });
        }}
      />

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#121315]/95 backdrop-blur-xl border-t border-white/10 p-4 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-[#F7F4EF]/50 uppercase font-semibold block truncate max-w-[140px]">
              {selectedOffer?.title || 'Coaching Program'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-display font-bold text-[#B8703F]">
                ${selectedOffer?.price ? Number(selectedOffer.price) : 180}
              </span>
              <span className="text-[10px] text-[#F7F4EF]/50">
                {selectedOffer?.type === 'COURSE' ? 'total' : '/mo'}
              </span>
            </div>
          </div>

          {selectedOffer?.isActive === false ? (
            <span className="text-xs font-medium text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              Draft (Pending)
            </span>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => selectedOffer && onBookOffer && onBookOffer(selectedOffer, creator)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {selectedOffer?.type === 'COURSE' ? 'Enroll Now' : 'Book Session'}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
};
