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
  Heart,
  Check,
  Calendar,
} from 'lucide-react';
import { Button, Breadcrumbs } from './ui';
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
import { updatePageMetadata, setCreatorSchema, clearCreatorSchema, getCreatorOgImageUrl } from '../utils/seo';
import { trackCheckoutStart } from '../services/analytics';

interface CreatorProfilePageProps {
  creatorId: string;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateDiscover?: (category?: string) => void;
  onSelectCourse?: (courseId: string) => void;
  onBookOffer?: (offer: CreatorOffer, creator: CreatorItem) => void;
  onNavigateCommunity?: (creatorId: string) => void;
  onNavigateCalendar?: (creatorId: string) => void;
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({
  creatorId,
  onBack,
  onNavigateHome,
  onNavigateDiscover,
  onSelectCourse: _onSelectCourse,
  onBookOffer,
  onNavigateCommunity,
  onNavigateCalendar,
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
        console.debug('Profile fetch error', err);
        setError('Network interruption while querying coach profile');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleToggleWishlist = async (e: React.MouseEvent, offer: CreatorOffer) => {
    e.stopPropagation();
    const isCurrentlySaved = savedOfferIds.has(offer.id);

    setSavedOfferIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(offer.id);
      else next.add(offer.id);
      return next;
    });

    setToastMessage(
      isCurrentlySaved
        ? `Removed "${offer.title}" from saved items.`
        : `Saved "${offer.title}" to your wishlist.`
    );
    setTimeout(() => setToastMessage(null), 3000);

    try {
      await toggleWishlistApi(offer.id);
    } catch (err) {
      console.debug('Wishlist toggle error:', err);
    }
  };

  const handleProceedToCheckout = (offer: CreatorOffer) => {
    trackCheckoutStart(offer.id, Number(offer.price), offer.currency || 'USD', creator?.id);
    if (onBookOffer && creator) {
      onBookOffer(offer, creator);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProfileData();
  }, [creatorId]);

  // Per-Creator SEO Metadata Injection
  useEffect(() => {
    if (creator && creator.fullName) {
      const bioSnippet = creator.bio
        ? creator.bio.length > 150
          ? `${creator.bio.slice(0, 147)}...`
          : creator.bio
        : `Verified 1-on-1 coaching, protocols & custom splits with ${creator.fullName}. Specializing in ${creator.specialtyTags.join(', ')}.`;

      const ogImage = getCreatorOgImageUrl({
        id: creator.handle || creator.id || creatorId,
        fullName: creator.fullName,
        avatarUrl: creator.avatarUrl,
        headline: creator.headline,
      });

      updatePageMetadata({
        title: `${creator.fullName} — ${creator.headline || 'Verified Coach'} | Universifit`,
        description: `${bioSnippet} Rated ${creator.rating.toFixed(2)}★ with ${creator.totalClients}+ active athletes coached.`,
        ogImage,
        ogType: 'profile',
        canonicalUrl: `${window.location.origin}/creator/${encodeURIComponent(creator.handle || creator.id || creatorId)}`,
      });

      setCreatorSchema({
        id: creator.id || creatorId,
        fullName: creator.fullName,
        handle: creator.handle,
        headline: creator.headline || undefined,
        bio: creator.bio || undefined,
        avatarUrl: creator.avatarUrl || undefined,
        specialtyTags: creator.specialtyTags,
        rating: creator.rating,
        totalReviews: reviewsData?.totalReviews || creator.totalClients,
        socialLinks: creator.socialLinks,
      });
    } else if (error) {
      clearCreatorSchema();
      updatePageMetadata({
        title: 'Coach Profile Unavailable | Universifit',
        description: 'The requested coach profile could not be found or has temporarily paused bookings on Universifit.',
        ogImage: '/og-image.svg',
        ogType: 'website',
        canonicalUrl: `${window.location.origin}/creator/${encodeURIComponent(creatorId)}`,
      });
    }

    return () => {
      clearCreatorSchema();
    };
  }, [creator, error, creatorId, reviewsData?.totalReviews]);

  const selectedOffer =
    offers.find((o) => o.id === selectedOfferId) || offers[0] || creator?.featuredOffers?.[0];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  const getFormatIcon = (type?: string) => {
    switch (type) {
      case 'COURSE':
        return <BookOpen className="w-3.5 h-3.5 text-[#3652C4]" />;
      case 'COMMUNITY':
        return <Users className="w-3.5 h-3.5 text-[#3652C4]" />;
      default:
        return <Video className="w-3.5 h-3.5 text-[#3652C4]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-32">
        <div className="border-b border-[#E8E8E6] bg-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="h-4 w-32 bg-[#F7F7F5] rounded animate-pulse" />
            <div className="h-7 w-20 bg-[#F7F7F5] rounded-md animate-pulse" />
          </div>
        </div>

        <div className="bg-white border-b border-[#E8E8E6] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
              <div className="lg:col-span-4 h-80 rounded-xl bg-[#F7F7F5] border border-[#E8E8E6]" />
              <div className="lg:col-span-8 space-y-4">
                <div className="h-6 w-36 bg-[#F7F7F5] rounded" />
                <div className="h-9 w-2/3 bg-[#F7F7F5] rounded" />
                <div className="h-4 w-1/3 bg-[#F7F7F5] rounded" />
                <div className="h-24 w-full bg-[#F7F7F5] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-32 flex flex-col justify-center items-center px-4">
        <div className="p-8 max-w-lg w-full text-center space-y-5 my-16 bg-white border border-[#E8E8E6] rounded-xl">
          <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-[#14161A] tracking-tight">
              Coach Profile Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-[#8B8D91] leading-relaxed font-normal">
              We were unable to load this coach's curriculum and consultation schedules. The practitioner may have updated their handle or temporarily paused new bookings.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={loadProfileData}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              Return to Discover
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
            className="fixed top-24 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#14161A] text-white text-xs font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation & Breadcrumb Bar */}
      <div className="border-b border-[#E8E8E6] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] transition-colors cursor-pointer rounded px-1.5 py-1 shrink-0"
              title="Back to Discovery"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-3.5 w-px bg-[#E8E8E6] hidden sm:block shrink-0" />
            <Breadcrumbs
              items={[
                { label: 'Home', onClick: onNavigateHome },
                { label: 'Discover', onClick: () => (onNavigateDiscover ? onNavigateDiscover() : onBack?.()) },
                ...(creator.specialtyTags && creator.specialtyTags.length > 0
                  ? [
                      {
                        label: creator.specialtyTags[0],
                        onClick: () => onNavigateDiscover?.(creator.specialtyTags[0]),
                      },
                    ]
                  : []),
                { label: creator.fullName, isCurrent: true },
              ]}
              className="min-w-0"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateCommunity && (
              <button
                onClick={() => onNavigateCommunity(creator.id)}
                className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-xs font-medium text-[#14161A] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#3652C4]" />
                <span className="hidden sm:inline">Community</span>
              </button>
            )}
            {onNavigateCalendar && (
              <button
                onClick={() => onNavigateCalendar(creator.id)}
                className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-xs font-medium text-[#14161A] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#3652C4]" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            )}
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F5] border border-[#E8E8E6] text-xs font-medium text-[#14161A] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#8B8D91]" />
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE HEADER (B1 Minimalist) */}
      <section className="bg-white border-b border-[#E8E8E6] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Coach Photo Left (Span 4) */}
            <div className="lg:col-span-4">
              <div className="rounded-xl overflow-hidden bg-[#F7F7F5] border border-[#E8E8E6] aspect-square max-w-sm mx-auto lg:max-w-none">
                <img
                  src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&auto=format&fit=crop&q=80'}
                  alt={`${creator.fullName} — Verified Coach Profile Photo`}
                  width={384}
                  height={384}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Quick Trust Highlights under photo */}
              <div className="grid grid-cols-3 gap-2 mt-4 max-w-sm mx-auto lg:max-w-none">
                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] text-center">
                  <span className="text-base font-bold text-[#14161A] block">
                    {creator.rating.toFixed(2)} ★
                  </span>
                  <span className="text-[11px] text-[#5A5D62]">
                    Client Rating
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] text-center">
                  <span className="text-base font-bold text-[#14161A] block">
                    {creator.totalClients}+
                  </span>
                  <span className="text-[11px] text-[#5A5D62]">
                    Clients Coached
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] text-center">
                  <span className="text-base font-bold text-[#14161A] block">
                    &lt; 24h
                  </span>
                  <span className="text-[11px] text-[#5A5D62]">
                    Response Time
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Bio & Information Right (Span 8) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Header Titles & Verified Badge */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {creator.specialtyTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-[#14161A] tracking-tight">
                    {creator.fullName}
                  </h1>

                  {/* Minimalist Verified Badge */}
                  {creator.verificationStatus === 'VERIFIED' && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]"
                      title="Platform-verified practitioner credentials"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3652C4]" />
                      <span>Verified Practitioner</span>
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-[#8B8D91]">
                  {creator.headline || `@${creator.handle}`}
                </p>

                {/* Social Channels */}
                {creator.socialLinks && (creator.socialLinks.youtube || creator.socialLinks.instagram || creator.socialLinks.discord) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {creator.socialLinks.youtube && (
                      <a
                        href={creator.socialLinks.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F7F5] hover:bg-white border border-[#E8E8E6] text-xs font-medium text-[#14161A] transition-colors"
                      >
                        <span>YouTube</span>
                      </a>
                    )}
                    {creator.socialLinks.instagram && (
                      <a
                        href={creator.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F7F5] hover:bg-white border border-[#E8E8E6] text-xs font-medium text-[#14161A] transition-colors"
                      >
                        <span>Instagram</span>
                      </a>
                    )}
                    {creator.socialLinks.discord && (
                      <a
                        href={creator.socialLinks.discord}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F7F7F5] hover:bg-white border border-[#E8E8E6] text-xs font-medium text-[#14161A] transition-colors"
                      >
                        <span>Discord Community</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bio Statement */}
              <div className="p-5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E6]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91] mb-2">
                  Coaching Philosophy & Methodology
                </h3>
                <p className="text-sm sm:text-base text-[#14161A] font-normal leading-relaxed">
                  {creator.bio || 'World-class practitioner offering individualized, high-touch training, metabolic nutrition planning, and form audits.'}
                </p>
              </div>

              {/* Verified Credentials */}
              {creator.credentials && creator.credentials.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91]">
                    Credentials & Certifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {creator.credentials.map((cred, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white border border-[#E8E8E6] text-xs font-medium text-[#14161A] flex items-center gap-2.5"
                      >
                        <Award className="w-4 h-4 text-[#14161A] shrink-0" />
                        <span>{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* OFFERS & STICKY CTA SECTION */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* OFFERS LIST (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-[#14161A] tracking-tight">
                Available Coaching & Programs
              </h2>
              <p className="text-sm text-[#8B8D91] font-normal">
                Select your preferred format. All programs include direct practitioner oversight and verified platform delivery.
              </p>
            </div>

            {/* Offer Cards */}
            <div className="space-y-3.5 pt-1">
              {offers.length > 0 ? (
                offers.map((offer) => {
                  const isSelected = selectedOffer?.id === offer.id;

                  return (
                    <div
                      key={offer.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedOfferId(offer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedOfferId(offer.id);
                        }
                      }}
                      className={`p-5 rounded-xl transition-colors cursor-pointer bg-white border focus-visible:ring-2 focus-visible:ring-[#3652C4] focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'border-[#14161A] ring-1 ring-[#14161A]'
                          : 'border-[#E8E8E6] hover:border-[#14161A]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        
                        {/* Offer Header & Description */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]">
                                {getFormatIcon(offer.type)}
                                <span>{getFormatLabel(offer.type)}</span>
                              </span>

                              {offer.isActive === false && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  Draft
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              title={savedOfferIds.has(offer.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                              onClick={(e) => handleToggleWishlist(e, offer)}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                                savedOfferIds.has(offer.id)
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'text-[#8B8D91] hover:text-[#14161A] hover:bg-[#F7F7F5]'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  savedOfferIds.has(offer.id) ? 'fill-rose-600 text-rose-600' : ''
                                }`}
                              />
                            </button>
                          </div>

                          <h3 className="text-lg font-semibold text-[#14161A]">
                            {offer.title}
                          </h3>

                          <p className="text-sm text-[#8B8D91] leading-relaxed font-normal">
                            {offer.description || 'Comprehensive protocol tailored to your physical transformation milestones.'}
                          </p>

                          {/* Inclusions Row */}
                          <div className="pt-2 flex flex-wrap gap-3 text-xs text-[#14161A] font-medium">
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-[#3652C4]" />
                              Direct Practitioner Messaging
                            </span>
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-[#3652C4]" />
                              Video Form Audits
                            </span>
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-[#3652C4]" />
                              Progress Tracking
                            </span>
                          </div>
                        </div>

                        {/* Price & Selection Indicator */}
                        <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E8E8E6]">
                          <div>
                            <span className="text-xs text-[#8B8D91] block">Price</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-2xl font-bold text-[#14161A]">
                                ${Number(offer.price)}
                              </span>
                              <span className="text-xs text-[#8B8D91]">
                                / {offer.type === 'COURSE' ? 'course' : 'month'}
                              </span>
                            </div>
                          </div>

                          <div className="sm:mt-4">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium border ${
                                isSelected
                                  ? 'bg-[#14161A] text-white border-[#14161A]'
                                  : 'bg-white text-[#14161A] border-[#E8E8E6]'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-14 px-6 text-center space-y-4 bg-white border border-[#E8E8E6] rounded-xl">
                  <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A] mx-auto flex items-center justify-center">
                    <PackageOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#14161A]">
                      No active packages published yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8B8D91] max-w-md mx-auto leading-relaxed font-normal">
                      This coach is currently finalizing their consultation calendar and course syllabus.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={onBack}>
                      Browse Other Coaches
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP STICKY CTA CARD (Span 4) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 self-start space-y-4">
            <div className="p-6 bg-white border border-[#E8E8E6] rounded-xl space-y-5">
              <div className="pb-3 border-b border-[#E8E8E6] flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-[#8B8D91] tracking-wider">
                  Selected Program
                </span>
                {creator.verificationStatus === 'VERIFIED' && (
                  <span className="text-xs font-medium text-[#3652C4]">
                    Verified
                  </span>
                )}
              </div>

              {selectedOffer ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[#8B8D91] block mb-1">
                      {getFormatLabel(selectedOffer.type)}
                    </span>
                    <h4 className="font-semibold text-base text-[#14161A]">
                      {selectedOffer.title}
                    </h4>
                    <p className="text-xs text-[#8B8D91] mt-1 line-clamp-2 leading-relaxed">
                      {selectedOffer.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] flex items-center justify-between">
                    <span className="text-xs text-[#8B8D91] font-medium">Investment</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#14161A]">
                        ${Number(selectedOffer.price)}
                      </span>
                      <span className="text-[11px] text-[#8B8D91] block">
                        {selectedOffer.type === 'COURSE' ? 'Lifetime Access' : 'Monthly Recurring'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    {selectedOffer.isActive === false ? (
                      <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-center space-y-1">
                        <span className="text-xs font-semibold text-amber-800 block">
                          Draft Offer Pending Launch
                        </span>
                        <p className="text-[11px] text-amber-700">
                          This offer will open for booking once the practitioner publishes their active calendar.
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full justify-center"
                        onClick={() => handleProceedToCheckout(selectedOffer)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {selectedOffer.type === 'COURSE' ? 'Enroll in Course' : 'Book Consultation Slot'}
                      </Button>
                    )}

                    <p className="text-[11px] text-center text-[#8B8D91] font-medium flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-[#14161A]" />
                      <span>Encrypted checkout via Razorpay</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#8B8D91]">
                  Select an offer from the list to proceed.
                </div>
              )}
            </div>
          </aside>

        </div>
      </section>

      {/* REAL REVIEWS & RATINGS SECTION */}
      <section className="py-14 bg-white border-t border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-[#14161A] tracking-tight">
                Athlete Reviews & Evaluations
              </h2>
              <p className="text-sm text-[#8B8D91] max-w-xl font-normal">
                Genuine client evaluations submitted upon completing consultations or curriculums with {creator.fullName}.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReviewToEdit(null);
                setIsReviewModalOpen(true);
              }}
            >
              Rate & Review Coach
            </Button>
          </div>

          {/* Aggregate Rating Scorecard */}
          <div className="p-6 sm:p-8 bg-[#F7F7F5] border border-[#E8E8E6] rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Score Column */}
              <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-[#E8E8E6] pb-6 md:pb-0 md:pr-6">
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-5xl font-bold text-[#14161A]">
                    {(reviewsData?.averageRating || creator.rating || 5.0).toFixed(2)}
                  </span>
                  <span className="text-base text-[#8B8D91] font-normal">/ 5.0</span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-1 text-[#14161A]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-[#14161A]" />
                  ))}
                </div>

                <p className="text-xs text-[#8B8D91]">
                  Based on <strong>{reviewsData?.totalReviews || 0}</strong> verified evaluations
                </p>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-white border border-[#E8E8E6] text-[#14161A]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3652C4]" />
                    Zero simulated reviews
                  </span>
                </div>
              </div>

              {/* Star Breakdown Column */}
              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsData?.distribution?.[stars as 1 | 2 | 3 | 4 | 5] || 0;
                  const total = reviewsData?.totalReviews || 1;
                  const percent = reviewsData?.totalReviews ? Math.round((count / total) * 100) : 0;

                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-[#14161A] font-medium flex items-center gap-1 shrink-0">
                        <span>{stars}</span> <Star className="w-3 h-3 fill-[#14161A]" />
                      </span>

                      <div className="flex-1 h-2 bg-[#E8E8E6] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#14161A] rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <span className="w-12 text-right text-[#8B8D91] font-mono text-[11px] shrink-0">
                        {percent}% ({count})
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Filter Chips Bar (Only shown if reviews exist) */}
          {(reviewsData?.reviews && reviewsData.reviews.length > 0) && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setStarFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  starFilter === 'all'
                    ? 'bg-[#14161A] text-white border-[#14161A]'
                    : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                }`}
              >
                All Reviews ({reviewsData?.reviews.length || 0})
              </button>
              {[5, 4, 3].map((star) => (
                <button
                  key={star}
                  onClick={() => setStarFilter(star)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                    starFilter === star
                      ? 'bg-[#14161A] text-white border-[#14161A]'
                      : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                  }`}
                >
                  <span>{star} Stars</span>
                  <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          )}

          {/* REVIEWS LIST OR GRACEFUL ZERO-FAKE-REVIEWS EMPTY STATE */}
          {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsData.reviews
                .filter((r: ReviewItem) => starFilter === 'all' || r.rating === starFilter)
                .map((review: ReviewItem) => {
                  const isAuthor = review.buyerId === 'mock_buyer_id' || review.buyerName.includes('Akshat');

                  return (
                    <div
                      key={review.id}
                      className="p-5 bg-white border border-[#E8E8E6] rounded-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={review.buyerAvatar}
                              alt={`${review.buyerName}'s avatar`}
                              loading="lazy"
                              decoding="async"
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border border-[#E8E8E6] shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-semibold text-sm text-[#14161A]">
                                  {review.buyerName}
                                </h4>
                                {review.verifiedBuyer && (
                                  <span className="inline-flex items-center text-[10px] font-medium text-[#3652C4]">
                                    ✓ Verified
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#5A5D62]">
                                {review.createdAt}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 text-[#14161A] shrink-0">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i <= review.rating ? 'fill-[#14161A]' : 'text-[#E8E8E6]'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {review.programTitle && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E6] text-[11px] text-[#8B8D91]">
                            <BookOpen className="w-3 h-3 text-[#3652C4]" />
                            <span className="truncate max-w-[260px]">{review.programTitle}</span>
                          </div>
                        )}

                        <p className="text-sm text-[#14161A] leading-relaxed font-normal">
                          "{review.reviewText}"
                        </p>
                      </div>

                      {isAuthor && (
                        <div className="pt-3 border-t border-[#E8E8E6] flex items-center justify-between">
                          <span className="text-[11px] text-[#3652C4] font-medium">
                            Your verified review
                          </span>
                          <button
                            onClick={() => {
                              setReviewToEdit(review);
                              setIsReviewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#14161A] hover:text-[#3652C4] cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            /* GRACEFUL ZERO-FAKE-REVIEWS EMPTY STATE */
            <div className="p-8 sm:p-10 text-center bg-[#F7F7F5] border border-[#E8E8E6] rounded-xl max-w-xl mx-auto space-y-3">
              <div className="w-10 h-10 rounded-md bg-white border border-[#E8E8E6] text-[#14161A] mx-auto flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#3652C4]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#14161A]">
                  Zero Simulated Reviews Policy
                </h3>
                <p className="text-xs sm:text-sm text-[#8B8D91] leading-relaxed font-normal">
                  Universifit never manufactures placeholder testimonials. Authentic athlete reviews will appear here once verified clients complete consultations or courses with {creator.fullName}.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  Completed a program? Leave a review
                </Button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Review Submission & Edit Modal */}
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
          fetchCreatorReviewsApi(creator.id).then((res) => {
            if (res.data) setReviewsData(res.data);
          });
        }}
      />

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E8E6] p-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[11px] text-[#8B8D91] block truncate max-w-[150px]">
              {selectedOffer?.title || 'Coaching Program'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#14161A]">
                ${selectedOffer?.price ? Number(selectedOffer.price) : 180}
              </span>
              <span className="text-[11px] text-[#8B8D91]">
                {selectedOffer?.type === 'COURSE' ? 'total' : '/mo'}
              </span>
            </div>
          </div>

          {selectedOffer?.isActive === false ? (
            <span className="text-xs font-medium text-amber-800 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200">
              Draft (Pending)
            </span>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => selectedOffer && handleProceedToCheckout(selectedOffer)}
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
