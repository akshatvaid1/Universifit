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
  RotateCcw,
  AlertCircle,
  Pin,
  Trash2,
  Flag,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Card, Badge, Button, Input } from './ui';
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

interface CommunityPageProps {
  creatorId?: string;
  onBack?: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  creatorId = '',
  onBack,
}) => {
  const [creator, setCreator] = useState<CreatorItem | null>(null);
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Composer State
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<string>('General Discussion');
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const [pointsToast, setPointsToast] = useState<string | null>(null);

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
  ];

  const loadCommunityData = () => {
    if (!creatorId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    Promise.all([fetchCreatorById(creatorId), fetchCommunityPosts(creatorId)])
      .then(([c, data]) => {
        if (c) setCreator(c);
        else setError('Coach profile not found');
        if (data) setPosts(data);
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

  const showPointsAlert = (msg: string) => {
    setPointsToast(msg);
    setTimeout(() => setPointsToast(null), 3000);
  };

  // 1. Submit New Post (B4: +10 Points)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator || !newPostTitle.trim() || !newPostContent.trim() || isSubmittingPost) return;

    setIsSubmittingPost(true);
    try {
      const res = await createCommunityPostApi(creator.id, {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        categoryTag: newPostCategory,
      });

      if (res.success && res.post) {
        setPosts((prev) => [res.post, ...prev]);
        setUserPoints((prev) => prev + res.pointsEarned);
        showPointsAlert(`+${res.pointsEarned} Points Earned for Community Post! ⚡`);
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

  // 2. Toggle Like on Post (B4)
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

  // 3. Submit Reply (B4: +5 Points)
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
        showPointsAlert(`+${res.pointsEarned} Points Earned for Helpful Reply! ⚡`);
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
      showPointsAlert(res.message || 'Post pin status updated.');
    } catch (err) {
      console.debug('Pin error', err);
    }
  };

  // 5. Delete Post (Coach Moderator or Author Action)
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this community post?')) return;
    try {
      await deletePostApi(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showPointsAlert('Post removed from community.');
    } catch (err) {
      console.debug('Delete post error', err);
    }
  };

  // 6. Delete Reply (Coach Moderator or Author Action)
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
      showPointsAlert('Reply removed.');
    } catch (err) {
      console.debug('Delete reply error', err);
    }
  };

  // 7. Open Report Modal (Buyer Action)
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
      showPointsAlert('Post flagged for coach review. Thank you for keeping the community safe! 🛡️');
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
      showPointsAlert('Flag dismissed.');
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
    if (activeCategory === 'All') return true;
    return p.categoryTag.toLowerCase() === activeCategory.toLowerCase();
  });

  // Sort pinned posts to the top
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  if (error || !creator) {
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
              Community Space Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
              We were unable to load this creator's community squad. The profile may be private or unlisted.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="md" onClick={onBack}>
              Return
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-32">
      {/* Floating Points Toast Notification */}
      <AnimatePresence>
        {pointsToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 p-4 rounded-2xl bg-[#B8703F] text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-white/20"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{pointsToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation & Community Banner */}
      <div className="border-b border-white/[0.08] bg-[#16171A] sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
            <span>Back to Coach Profile</span>
          </button>

          {/* User Reputation Points Badge in Navbar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#B8703F]/15 border border-[#B8703F]/30 px-3 py-1.5 rounded-full text-xs font-bold text-[#B8703F]">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{userPoints} Rep Points</span>
            </div>

            <Badge variant="verified" size="sm">
              Member Squad
            </Badge>
          </div>
        </div>
      </div>

      {/* Community Header Strip */}
      <section className="bg-gradient-to-b from-[#16171A] to-[#121315] pt-8 pb-10 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={creator.avatarUrl || ''}
                  alt={`Coach ${creator.fullName} squad avatar`}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/15 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-[#6E8B6F] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                  COACH
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF]">
                    {creator.fullName}'s Inner Circle
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 mt-0.5 font-normal">
                  Exclusive accountability squad for form audits, PR celebrations, and weekly Q&As.
                </p>
              </div>
            </div>

            {/* Quick Action: New Post Button */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsComposerOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Start New Post (+10 pts)
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-8 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] ${
                  activeCategory === cat
                    ? 'bg-[#B8703F] text-white shadow-md'
                    : 'bg-white/[0.04] text-[#F7F4EF]/70 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Community Feed Layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* 1. POST COMPOSER */}
        <AnimatePresence>
          {isComposerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card
                variant="charcoal"
                className="p-6 sm:p-7 bg-[#16171A] border-[#B8703F]/40 shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center font-bold text-xs">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-[#F7F4EF]">
                        Create Community Post
                      </h3>
                      <span className="text-[11px] text-[#6E8B6F] font-semibold">
                        Earn +10 Reputation Points on publish
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsComposerOpen(false)}
                    className="text-xs text-[#F7F4EF]/50 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-4">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#F7F4EF]/70">
                      Topic Category
                    </label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full bg-[#121315] text-[#F7F4EF] border border-white/15 focus:border-[#B8703F] rounded-xl px-3.5 py-2.5 text-xs font-sans focus:outline-none"
                    >
                      <option value="General Discussion">General Discussion</option>
                      <option value="Wins & PRs">Wins & PRs</option>
                      <option value="Form Check & Audits">Form Check & Audits</option>
                      <option value="Nutrition Q&A">Nutrition Q&A</option>
                      <option value="Coach Bulletin">Coach Bulletin</option>
                    </select>
                  </div>

                  <Input
                    label="Discussion Title"
                    placeholder="e.g. Question on Bench Press Leg Drive Angle"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#F7F4EF]/70">
                      Post Content & Context
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Share your breakthrough, routine question, or upload video links for form feedback..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-[#121315] text-[#F7F4EF] border border-white/15 focus:border-[#B8703F] rounded-2xl p-3.5 text-xs sm:text-sm font-sans placeholder:text-white/30 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
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
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. COMMUNITY POSTS FEED */}
        <div className="space-y-6">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <Card
                key={n}
                variant="charcoal"
                className="p-6 sm:p-7 bg-[#16171A] border-white/[0.08] animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.05]" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-white/[0.06] rounded" />
                      <div className="h-3 w-20 bg-white/[0.04] rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-24 rounded-full bg-white/[0.04]" />
                </div>
              </Card>
            ))
          ) : error ? (
            <Card
              variant="charcoal"
              className="p-8 sm:p-10 text-center max-w-lg mx-auto space-y-5 my-8 border-rose-500/30 bg-[#16171A] shadow-xl"
            >
              <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">
                  Unable to Synchronize Community Feed
                </h3>
                <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
                  The discussion feed couldn't connect with the squad server. Check your network or reload.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={loadCommunityData}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reload Community Posts
              </Button>
            </Card>
          ) : sortedPosts.length > 0 ? (
            sortedPosts.map((post) => {
              const isRepliesExpanded = !!expandedReplies[post.id];
              const isCoach = post.authorRole === 'CREATOR';

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card
                    variant="charcoal"
                    className={`p-6 sm:p-7 bg-[#16171A] border transition-all ${
                      post.isPinned
                        ? 'border-[#B8703F] shadow-lg ring-1 ring-[#B8703F]/30'
                        : isCoach
                        ? 'border-[#B8703F]/40 shadow-md'
                        : 'border-white/[0.08]'
                    }`}
                  >
                    {/* Pinned Banner */}
                    {post.isPinned && (
                      <div className="mb-4 -mt-2 -mx-2 px-3 py-1.5 rounded-xl bg-[#B8703F]/15 border border-[#B8703F]/30 flex items-center justify-between text-xs text-[#B8703F] font-bold">
                        <div className="flex items-center gap-1.5">
                          <Pin className="w-3.5 h-3.5 fill-[#B8703F]" />
                          <span>PINNED BY COACH</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(post.id)}
                          className="text-[11px] underline hover:text-white cursor-pointer"
                        >
                          Unpin
                        </button>
                      </div>
                    )}

                    {/* Flagged / Reported Warning for Coach */}
                    {post.isReported && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            <strong>Flagged by Member:</strong> {post.reportReason || 'Inappropriate Content'} ({post.reportCount || 1} report)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDismissReport(post.id)}
                            className="text-[11px] text-amber-200 underline hover:text-white cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-[11px] text-rose-400 font-bold hover:underline cursor-pointer"
                          >
                            Remove Post
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Post Header: Avatar with Points Badge + Author Info */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={post.authorAvatar}
                            alt={`${post.authorName} avatar`}
                            className={`w-11 h-11 rounded-2xl object-cover ring-2 ${
                              isCoach ? 'ring-[#B8703F]' : 'ring-white/10'
                            }`}
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono shadow-md flex items-center gap-0.5 ${
                              isCoach ? 'bg-[#6E8B6F] text-black' : 'bg-[#B8703F] text-white'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            <span>{post.authorPoints}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-sm text-[#F7F4EF]">
                              {post.authorName}
                            </h4>
                            {isCoach && (
                              <span className="text-[10px] font-bold px-2 py-0.2 bg-[#6E8B6F]/20 text-[#6E8B6F] rounded-full border border-[#6E8B6F]/30">
                                Coach
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#F7F4EF]/50">{post.createdAt}</span>
                        </div>
                      </div>

                      {/* Right Header Badges & Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#F7F4EF]/70">
                          {post.categoryTag}
                        </span>

                        {/* Coach Pin Action */}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(post.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            post.isPinned
                              ? 'bg-[#B8703F]/20 text-[#B8703F]'
                              : 'text-white/40 hover:text-white hover:bg-white/5'
                          }`}
                          title={post.isPinned ? 'Unpin Post' : 'Pin Post to Top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Post Action */}
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Post Title & Content */}
                    <div className="py-4 space-y-2">
                      <h3 className="text-lg font-display font-bold text-[#F7F4EF] leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-[#F7F4EF]/80 leading-relaxed whitespace-pre-line font-normal">
                        {post.content}
                      </p>
                    </div>

                    {/* Post Action Bar (Like + Reply + Report + Share) */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-semibold text-[#F7F4EF]/60">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            post.hasLiked
                              ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]/40'
                              : 'bg-white/[0.04] text-[#F7F4EF]/70 hover:bg-white/[0.08] hover:text-white border-white/[0.06]'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${post.hasLiked ? 'fill-current text-[#B8703F]' : ''}`}
                          />
                          <span>{post.likesCount}</span>
                        </button>

                        <button
                          onClick={() => toggleExpandReply(post.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-[#B8703F]" />
                          <span>{post.repliesCount} Replies</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Report Post Button (Buyer) */}
                        <button
                          type="button"
                          onClick={() => handleOpenReportModal(post.id)}
                          className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg"
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
                            showPointsAlert(`Discussion link copied to clipboard! 📋`);
                          }}
                          className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 rounded-lg px-2 py-1"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. REPLY THREAD SECTION */}
                    {isRepliesExpanded && (
                      <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-4">
                        <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-white/[0.08]">
                          {post.replies.map((reply) => {
                            const isReplyCoach = reply.authorRole === 'CREATOR';

                            return (
                              <div
                                key={reply.id}
                                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 relative group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                      <img
                                        src={reply.authorAvatar}
                                        alt={`${reply.authorName} avatar`}
                                        className="w-7 h-7 rounded-xl object-cover"
                                      />
                                      <div
                                        className={`absolute -bottom-1 -right-1 px-1 py-0.1 rounded-full text-[8px] font-bold font-mono ${
                                          isReplyCoach
                                            ? 'bg-[#6E8B6F] text-black'
                                            : 'bg-[#B8703F] text-white'
                                        }`}
                                      >
                                        {reply.authorPoints}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-xs text-[#F7F4EF]">
                                        {reply.authorName}
                                      </span>
                                      {isReplyCoach && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#6E8B6F]/20 text-[#6E8B6F] rounded-full">
                                          Coach
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#F7F4EF]/40 font-mono">
                                      {reply.createdAt}
                                    </span>

                                    {/* Delete Reply Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReply(post.id, reply.id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                      title="Remove Reply"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-xs text-[#F7F4EF]/80 leading-relaxed pl-9 font-normal">
                                  {reply.content}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Inline Reply Composer */}
                        <div className="flex items-center gap-2 pt-2">
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
                            className="flex-1 bg-[#121315] text-xs text-[#F7F4EF] placeholder:text-white/30 border border-white/10 rounded-full px-4 py-2.5 focus:border-[#B8703F] focus:outline-none"
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
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="p-12 text-center space-y-3 bg-[#16171A] rounded-3xl border border-white/5">
              <MessageSquare className="w-10 h-10 text-white/30 mx-auto" />
              <p className="text-sm text-white/60">No community posts yet in this category.</p>
              <Button variant="primary" size="sm" onClick={() => setIsComposerOpen(true)}>
                Start the First Discussion
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* REPORT / FLAG MODAL */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#16171A] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5"
            >
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Report Inappropriate Post</h3>
                  <p className="text-xs text-white/60">Help us maintain a respectful coaching environment.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-[#121315] text-xs text-white border border-white/15 rounded-xl px-3.5 py-2.5 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="SPAM">Spam or Promotional Ads</option>
                    <option value="HARASSMENT">Harassment or Hate Speech</option>
                    <option value="INAPPROPRIATE">Inappropriate Content or Language</option>
                    <option value="MISINFORMATION">Dangerous Medical or Training Misinformation</option>
                    <option value="OFF_TOPIC">Off-Topic Discussion</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">Additional Details (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide brief context for the coach moderation team..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full bg-[#121315] text-xs text-white border border-white/15 rounded-xl p-3 focus:border-amber-400 focus:outline-none placeholder:text-white/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsReportModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={isSubmittingReport}
                    className="bg-amber-600 hover:bg-amber-500 text-white"
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
