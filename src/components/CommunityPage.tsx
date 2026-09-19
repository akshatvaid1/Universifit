import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Heart,
  Send,
  Zap,
  ChevronLeft,
  Share2,
  Plus,
  AlertCircle,
  Pin,
  Trash2,
  Flag,
  ShieldAlert,
  X,
  Lock,
  CheckCircle2,
  Crown,
  Calendar,
} from 'lucide-react';
import { Button, Input } from './ui';
import {
  fetchCommunityPosts,
  createCommunityPostApi,
  toggleLikePostApi,
  createReplyApi,
  togglePinPostApi,
  deletePostApi,
  deletePostReplyApi,
  reportPostApi,
  dismissPostReportApi,
  fetchCreatorById,
  type CommunityPostItem,
  type CreatorItem,
} from '../services/api';
import { trackCommunityJoin } from '../services/analytics';

interface CommunityPageProps {
  creatorId?: string;
  onBack?: () => void;
  onNavigateToCalendar?: (creatorId: string) => void;
  onNavigateToProfile?: (creatorId: string) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  creatorId = '',
  onBack,
  onNavigateToCalendar,
  onNavigateToProfile,
}) => {
  const [creator, setCreator] = useState<CreatorItem | null>(null);
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [userPoints, setUserPoints] = useState<number>(285);
  const [userTier, setUserTier] = useState<'FREE' | 'PAID'>('FREE');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showModerationReviewOnly, setShowModerationReviewOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Composer State
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<string>('General Discussion');
  const [newPostTierAccess, setNewPostTierAccess] = useState<'FREE' | 'PAID'>('FREE');
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reply States (keyed by postId)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('INAPPROPRIATE');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  const categories = [
    'All',
    'General Discussion',
    'Wins & PRs',
    'Form Audits',
    'Nutrition Q&A',
    'Coach Bulletin',
  ];

  const calculateLevel = (points: number): number => {
    if (points >= 500) return 3;
    if (points >= 150) return 2;
    return 1;
  };

  const loadCommunityData = () => {
    if (!creatorId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    Promise.all([fetchCreatorById(creatorId), fetchCommunityPosts(creatorId)])
      .then(([c, data]) => {
        if (c) {
          setCreator(c);
          trackCommunityJoin('athlete', creatorId, userTier);
        } else {
          setError('Coach profile not found');
        }

        if (data && data.length > 0) {
          setPosts(data);
        } else {
          // Seed realistic initial community posts with free and tier-gated items
          setPosts([
            {
              id: 'post-seed-1',
              creatorId,
              authorId: 'creator-chadtag',
              authorName: 'Chadtag',
              authorAvatar: '/chadtag.png',
              authorRole: 'CREATOR',
              authorPoints: 1420,
              title: 'Weekly Form Check & Asymmetry Audit Rules',
              content: 'Athletes: when posting form audit clips, please ensure adequate lighting from both anterior and 45-degree sagittal angles. Log your working sets at RPE 8. Let\'s keep refining the mechanics.',
              categoryTag: 'Coach Bulletin',
              tierAccess: 'FREE',
              likesCount: 38,
              hasLiked: false,
              isPinned: true,
              repliesCount: 3,
              replies: [
                {
                  id: 'reply-seed-1',
                  postId: 'post-seed-1',
                  authorId: 'user-ref-1',
                  authorName: 'Marcus V.',
                  authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  authorRole: 'BUYER',
                  authorPoints: 310,
                  content: 'Understood Coach! Uploading my squat session clip from this morning.',
                  createdAt: '2 hours ago',
                },
              ],
              createdAt: '1 day ago',
            },
            {
              id: 'post-seed-2',
              creatorId,
              authorId: 'creator-chadtag',
              authorName: 'Chadtag',
              authorAvatar: '/chadtag.png',
              authorRole: 'CREATOR',
              authorPoints: 1420,
              title: 'Apex VIP Protocol: Micronutrient Partitioning for Lean Recomp',
              content: 'Exclusive VIP breakdown: full clinical breakdown on carb re-feeds, potassium-to-sodium electrolyte balancing during fat loss plateaus, and training window nutrient timing.',
              categoryTag: 'Nutrition Q&A',
              tierAccess: 'PAID',
              likesCount: 24,
              hasLiked: false,
              isPinned: false,
              repliesCount: 1,
              replies: [],
              createdAt: '3 days ago',
            },
            {
              id: 'post-seed-3',
              creatorId,
              authorId: 'user-ref-2',
              authorName: 'David K.',
              authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
              authorRole: 'BUYER',
              authorPoints: 180,
              title: '6-Week Milestone: Posture Decompression Results',
              content: 'Just wanted to share a win. By following the daily anterior pelvic tilt stretches and thoracic mobilization drills, my rounded shoulders are visibly improved and lower back tightness is gone.',
              categoryTag: 'Wins & PRs',
              tierAccess: 'FREE',
              likesCount: 19,
              hasLiked: false,
              isPinned: false,
              repliesCount: 2,
              replies: [],
              createdAt: '4 days ago',
            },
          ]);
        }
      })
      .catch((err) => {
        console.debug('Community load error', err);
        setError('Network interruption while loading community feed');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCommunityData();
  }, [creatorId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Submit New Post (+10 Points)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator || !newPostTitle.trim() || !newPostContent.trim() || isSubmittingPost) return;

    setIsSubmittingPost(true);
    try {
      const res = await createCommunityPostApi(creator.id, {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        categoryTag: newPostCategory,
        tierAccess: newPostTierAccess,
      });

      if (res.success && res.post) {
        setPosts((prev) => [res.post, ...prev]);
        setUserPoints((prev) => prev + res.pointsEarned);
        showToast(`+${res.pointsEarned} Points Earned for Community Post`);
        setNewPostTitle('');
        setNewPostContent('');
        setIsComposerOpen(false);
      }
    } catch (err) {
      console.debug('Error creating post', err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // 2. Toggle Like on Post
  const handleToggleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          const likesCount = hasLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
          return { ...p, hasLiked, likesCount };
        }
        return p;
      })
    );

    try {
      await toggleLikePostApi(postId);
    } catch (err) {
      console.debug('Error toggling like', err);
    }
  };

  // 3. Submit Reply (+5 Points)
  const handleCreateReply = async (postId: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text || isSubmittingReply[postId]) return;

    setIsSubmittingReply((prev) => ({ ...prev, [postId]: true }));

    try {
      const res = await createReplyApi(postId, text);
      if (res.success && res.reply) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                repliesCount: p.repliesCount + 1,
                replies: [...p.replies, res.reply],
              };
            }
            return p;
          })
        );

        setUserPoints((prev) => prev + res.pointsEarned);
        showToast(`+${res.pointsEarned} Points Earned for Helpful Reply`);
        setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.debug('Error creating reply', err);
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // 4. Pin/Unpin Post (Coach Moderator Action)
  const handleTogglePin = async (postId: string) => {
    try {
      const res = await togglePinPostApi(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p))
      );
      showToast(res.message || 'Post pin status updated.');
    } catch (err) {
      console.debug('Pin error', err);
    }
  };

  // 5. Delete Post (Coach Moderator or Author Action)
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this community post?')) return;
    try {
      await deletePostApi(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Post removed from community.');
    } catch (err) {
      console.debug('Delete post error', err);
    }
  };

  // 6. Delete Reply
  const handleDeleteReply = async (postId: string, replyId: string) => {
    if (!window.confirm('Remove this reply?')) return;
    try {
      await deletePostReplyApi(replyId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              repliesCount: Math.max(0, p.repliesCount - 1),
              replies: p.replies.filter((r) => r.id !== replyId),
            };
          }
          return p;
        })
      );
      showToast('Reply removed.');
    } catch (err) {
      console.debug('Delete reply error', err);
    }
  };

  // 7. Open Report Modal
  const handleOpenReportModal = (postId: string) => {
    setReportingPostId(postId);
    setReportReason('INAPPROPRIATE');
    setReportDetails('');
    setIsReportModalOpen(true);
  };

  // 8. Submit Report/Flag
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPostId) return;

    setIsSubmittingReport(true);
    try {
      await reportPostApi(reportingPostId, reportReason, reportDetails);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === reportingPostId
            ? { ...p, isReported: true, reportReason, reportCount: (p.reportCount || 0) + 1 }
            : p
        )
      );
      setIsReportModalOpen(false);
      showToast('Post flagged for practitioner review.');
    } catch (err) {
      console.debug('Report error', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 9. Dismiss Report (Coach Action)
  const handleDismissReport = async (postId: string) => {
    try {
      await dismissPostReportApi(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isReported: false, reportReason: undefined } : p))
      );
      showToast('Flag dismissed.');
    } catch (err) {
      console.debug('Dismiss error', err);
    }
  };

  const toggleExpandReply = (postId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const filteredPosts = posts.filter((p) => {
    if (showModerationReviewOnly) return p.isReported;
    if (activeCategory === 'All') return true;
    return p.categoryTag.toLowerCase() === activeCategory.toLowerCase();
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const reportedPostsCount = posts.filter((p) => p.isReported).length;

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-32 flex flex-col justify-center items-center px-4">
        <div className="p-8 max-w-lg w-full text-center space-y-5 bg-white border border-[#E8E8E6] rounded-xl my-16">
          <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-[#14161A] tracking-tight">
              Community Space Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-[#8B8D91] leading-relaxed font-normal">
              We were unable to load this creator's community space. Please return to the coach profile or retry.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={onBack}>
              Return
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
            {/* User Reputation & Level Pill */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A]">
              <Zap className="w-3.5 h-3.5 text-[#3652C4]" />
              <span>Lv. {calculateLevel(userPoints)} • {userPoints} pts</span>
            </span>

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
              title="Toggle tier to preview gated vs unlocked access"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{userTier === 'PAID' ? 'Apex VIP Pass' : 'Free Member'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Header Strip */}
      <section className="bg-white border-b border-[#E8E8E6] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={creator.avatarUrl || ''}
                alt={`${creator.fullName}'s squad avatar`}
                className="w-14 h-14 rounded-lg object-cover border border-[#E8E8E6]"
              />

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-[#14161A] tracking-tight">
                    {creator.fullName}'s Squad
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#5A5D62] mt-0.5 font-normal">
                  Accountability community for form audits, PR celebrations, and direct practitioner Q&As.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onNavigateToProfile && (
                <button
                  onClick={() => onNavigateToProfile(creator.id)}
                  className="px-3 py-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] border border-[#E8E8E6] rounded-md bg-white hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  Profile
                </button>
              )}
              {onNavigateToCalendar && (
                <button
                  onClick={() => onNavigateToCalendar(creator.id)}
                  className="px-3 py-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] border border-[#E8E8E6] rounded-md bg-white hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#3652C4]" />
                  <span>Calendar</span>
                </button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsComposerOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Start Discussion (+10 pts)
              </Button>
            </div>
          </div>

          {/* Category Filter Pills & Moderation Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowModerationReviewOnly(false);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  activeCategory === cat && !showModerationReviewOnly
                    ? 'bg-[#14161A] text-white border-[#14161A]'
                    : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Creator Moderation Review Tab */}
            <button
              onClick={() => setShowModerationReviewOnly(!showModerationReviewOnly)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 ml-auto ${
                showModerationReviewOnly
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-white text-[#8B8D91] hover:text-[#14161A] border-[#E8E8E6]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Flagged for Review</span>
              {reportedPostsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {reportedPostsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Community Feed */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* POST COMPOSER MODAL / ACCORDION */}
        <AnimatePresence>
          {isComposerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white border border-[#E8E8E6] rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E6]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#14161A]">
                      Create Community Post
                    </h3>
                    <p className="text-xs text-[#8B8D91]">
                      Earn +10 reputation points upon publishing
                    </p>
                  </div>

                  <button
                    onClick={() => setIsComposerOpen(false)}
                    className="p-1 rounded-md text-[#8B8D91] hover:text-[#14161A] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#14161A]">
                        Topic Category
                      </label>
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full bg-white text-[#14161A] border border-[#E8E8E6] focus:border-[#14161A] rounded-md px-3 py-2 text-xs font-sans focus:outline-none"
                      >
                        <option value="General Discussion">General Discussion</option>
                        <option value="Wins & PRs">Wins & PRs</option>
                        <option value="Form Audits">Form Audits</option>
                        <option value="Nutrition Q&A">Nutrition Q&A</option>
                        <option value="Coach Bulletin">Coach Bulletin</option>
                      </select>
                    </div>

                    {/* Tier-Gating Access Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#14161A]">
                        Tier Visibility
                      </label>
                      <select
                        value={newPostTierAccess}
                        onChange={(e) => setNewPostTierAccess(e.target.value as 'FREE' | 'PAID')}
                        className="w-full bg-white text-[#14161A] border border-[#E8E8E6] focus:border-[#14161A] rounded-md px-3 py-2 text-xs font-sans focus:outline-none"
                      >
                        <option value="FREE">Free for All Members</option>
                        <option value="PAID">Apex VIP Club (Paid Tier Exclusive)</option>
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Discussion Title"
                    placeholder="e.g. Question on Thoracic Extension and Bar Path"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    required
                  />

                  <div className="space-y-1 font-sans">
                    <label className="block text-xs font-medium text-[#14161A]">
                      Post Content & Discussion Context
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Share your breakthrough, ask technical questions, or post execution timestamps..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-white text-[#14161A] border border-[#E8E8E6] focus:border-[#14161A] focus:ring-1 focus:ring-[#14161A] rounded-md p-3 text-xs sm:text-sm font-sans placeholder-[#8B8D91] focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8E8E6]">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setIsComposerOpen(false)}
                    >
                      Discard
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      isLoading={isSubmittingPost}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Publish to Squad (+10 pts)
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEED LIST */}
        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-6 bg-white border border-[#E8E8E6] rounded-xl animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F7F7F5]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 bg-[#F7F7F5] rounded" />
                    <div className="h-3 w-20 bg-[#F7F7F5] rounded" />
                  </div>
                </div>
                <div className="h-4 w-3/4 bg-[#F7F7F5] rounded" />
                <div className="h-3 w-full bg-[#F7F7F5] rounded" />
              </div>
            ))
          ) : sortedPosts.length > 0 ? (
            sortedPosts.map((post) => {
              const isRepliesExpanded = !!expandedReplies[post.id];
              const isCoach = post.authorRole === 'CREATOR';
              const isPaidGated = post.tierAccess === 'PAID';
              const isLockedForUser = isPaidGated && userTier !== 'PAID';

              return (
                <div
                  key={post.id}
                  className={`p-5 sm:p-6 bg-white border rounded-xl space-y-4 transition-colors ${
                    post.isPinned
                      ? 'border-[#14161A] ring-1 ring-[#14161A]'
                      : 'border-[#E8E8E6]'
                  }`}
                >
                  {/* Pinned Banner */}
                  {post.isPinned && (
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E6] text-xs font-semibold text-[#14161A]">
                      <div className="flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 text-[#3652C4]" />
                        <span>Pinned by Coach</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(post.id)}
                        className="text-[11px] text-[#8B8D91] hover:text-[#14161A] cursor-pointer"
                      >
                        Unpin
                      </button>
                    </div>
                  )}

                  {/* Flagged / Reported Warning for Creator Moderation */}
                  {post.isReported && (
                    <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          <strong>Flagged for Review:</strong> {post.reportReason || 'Inappropriate Content'} ({post.reportCount || 1} reports)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDismissReport(post.id)}
                          className="text-xs text-amber-800 underline hover:text-amber-950 cursor-pointer"
                        >
                          Dismiss Flag
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-xs text-rose-700 font-semibold hover:underline cursor-pointer"
                        >
                          Delete Post
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header: Author Avatar with Points/Level Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar}
                        alt={`${post.authorName}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover border border-[#E8E8E6] shrink-0"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-[#14161A]">
                            {post.authorName}
                          </h4>

                          {isCoach && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A] rounded">
                              Coach
                            </span>
                          )}

                          {/* Points / Level Badge on Avatar */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5A5D62] px-1.5 py-0.2 rounded bg-[#F7F7F5] border border-[#E8E8E6]">
                            <Zap className="w-3 h-3 text-[#3652C4]" />
                            <span>Lv. {calculateLevel(post.authorPoints)}</span>
                          </span>
                        </div>

                        <span className="text-[11px] text-[#8B8D91]">
                          {post.createdAt} • {post.categoryTag}
                        </span>
                      </div>
                    </div>

                    {/* Post Badges & Moderator Actions */}
                    <div className="flex items-center gap-1.5">
                      {isPaidGated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#14161A] text-white">
                          <Crown className="w-3 h-3" />
                          <span>VIP Exclusive</span>
                        </span>
                      )}

                      {/* Coach Pin Action */}
                      <button
                        type="button"
                        onClick={() => handleTogglePin(post.id)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          post.isPinned ? 'text-[#3652C4]' : 'text-[#8B8D91] hover:text-[#14161A]'
                        }`}
                        title={post.isPinned ? 'Unpin' : 'Pin to Top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Post Action */}
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded text-[#8B8D91] hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Post Content OR Tier-Gated Lock Card */}
                  {isLockedForUser ? (
                    /* TIER-GATED ACCESS CARD (Locked for free tier) */
                    <div className="p-6 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] text-center space-y-3 my-2">
                      <div className="w-9 h-9 rounded-md bg-white border border-[#E8E8E6] text-[#14161A] mx-auto flex items-center justify-center">
                        <Lock className="w-4 h-4 text-[#3652C4]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-[#14161A]">
                          Exclusive to Apex VIP Club Members
                        </h3>
                        <p className="text-xs text-[#8B8D91] max-w-md mx-auto leading-relaxed">
                          "{post.title}" contains advanced practitioner breakdown notes. Upgrade your community membership to view this discussion.
                        </p>
                      </div>
                      <div className="pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setUserTier('PAID');
                            showToast('Upgraded to VIP Tier! Discussion unlocked.');
                          }}
                        >
                          Unlock with VIP Pass ($29/mo)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* UNLOCKED FULL CONTENT */
                    <div className="space-y-2 py-1">
                      <h3 className="text-base font-semibold text-[#14161A]">
                        {post.title}
                      </h3>
                      <p className="text-sm text-[#14161A] leading-relaxed whitespace-pre-line font-normal">
                        {post.content}
                      </p>
                    </div>
                  )}

                  {/* Action Bar (Like, Reply, Report, Share) */}
                  <div className="pt-3 border-t border-[#E8E8E6] flex items-center justify-between text-xs font-medium text-[#8B8D91]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                          post.hasLiked
                            ? 'bg-[#14161A] text-white border-[#14161A]'
                            : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-current text-white' : ''}`} />
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        onClick={() => toggleExpandReply(post.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-[#F7F7F5] text-[#14161A] transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#3652C4]" />
                        <span>{post.repliesCount} Replies</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(post.id)}
                        className="hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-1 px-1.5 py-1"
                        title="Report inappropriate content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(`${window.location.origin}/community#${post.id}`);
                          }
                          showToast('Link copied to clipboard');
                        }}
                        className="hover:text-[#14161A] transition-colors cursor-pointer flex items-center gap-1 px-1.5 py-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </button>
                    </div>
                  </div>

                  {/* REPLY THREAD */}
                  {isRepliesExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E8E8E6] space-y-3">
                      <div className="space-y-2.5 pl-3 border-l-2 border-[#E8E8E6]">
                        {post.replies.map((reply) => {
                          const isReplyCoach = reply.authorRole === 'CREATOR';

                          return (
                            <div
                              key={reply.id}
                              className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] space-y-1 relative group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={reply.authorAvatar}
                                    alt={reply.authorName}
                                    className="w-6 h-6 rounded-full object-cover border border-[#E8E8E6]"
                                  />
                                  <span className="font-semibold text-xs text-[#14161A]">
                                    {reply.authorName}
                                  </span>
                                  {isReplyCoach && (
                                    <span className="text-[10px] font-medium px-1 py-0.2 bg-white text-[#3652C4] border border-[#E8E8E6] rounded">
                                      Coach
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono text-[#8B8D91]">
                                    Lv. {calculateLevel(reply.authorPoints)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#8B8D91]">
                                    {reply.createdAt}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(post.id, reply.id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[#8B8D91] hover:text-rose-600 transition-opacity cursor-pointer"
                                    title="Remove Reply"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-[#14161A] leading-relaxed pl-8 font-normal">
                                {reply.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Inline Reply Composer */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Write a helpful reply (+5 pts)..."
                          value={replyInputs[post.id] || ''}
                          onChange={(e) =>
                            setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateReply(post.id);
                          }}
                          className="flex-1 bg-white text-xs text-[#14161A] placeholder-[#8B8D91] border border-[#E8E8E6] rounded-md px-3 py-2 focus:border-[#14161A] focus:outline-none"
                        />

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCreateReply(post.id)}
                          isLoading={isSubmittingReply[post.id]}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="p-10 text-center bg-white border border-[#E8E8E6] rounded-xl space-y-2">
              <MessageSquare className="w-8 h-8 text-[#8B8D91] mx-auto" />
              <p className="text-sm font-medium text-[#14161A]">
                {showModerationReviewOnly
                  ? 'No flagged posts pending review.'
                  : 'No community discussions in this category yet.'}
              </p>
              {!showModerationReviewOnly && (
                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={() => setIsComposerOpen(true)}>
                    Start the First Discussion
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* REPORT / FLAG MODAL */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full max-w-md bg-white border border-[#E8E8E6] rounded-xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E6]">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-700" />
                  <h3 className="text-sm font-semibold text-[#14161A]">
                    Report Discussion Post
                  </h3>
                </div>

                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1 rounded text-[#8B8D91] hover:text-[#14161A] hover:bg-[#F7F7F5] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#14161A]">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-white text-xs text-[#14161A] border border-[#E8E8E6] rounded-md px-3 py-2 focus:border-[#14161A] focus:outline-none"
                  >
                    <option value="SPAM">Spam or Promotional Advertising</option>
                    <option value="HARASSMENT">Harassment or Toxic Language</option>
                    <option value="INAPPROPRIATE">Inappropriate Content</option>
                    <option value="MISINFORMATION">Dangerous Health/Training Misinformation</option>
                    <option value="OFF_TOPIC">Off-Topic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#14161A]">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly explain the issue for the moderation team..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full bg-white text-xs text-[#14161A] border border-[#E8E8E6] rounded-md p-2.5 focus:border-[#14161A] focus:outline-none placeholder-[#8B8D91]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E8E6]">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={isSubmittingReport}
                  >
                    Submit Report
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
