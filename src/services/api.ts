export interface CreatorOffer {
  id: string;
  creatorId?: string;
  title: string;
  description: string | null;
  type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
  price: number;
  currency: string;
  isActive: boolean;
  isRecurring?: boolean;
  billingInterval?: string;
  totalEnrollments?: number;
  totalBookings?: number;
}

export interface CreatorItem {
  id: string;
  userId: string;
  fullName: string;
  email?: string;
  avatarUrl: string | null;
  handle: string;
  headline: string | null;
  bio: string | null;
  specialtyTags: string[];
  credentials: string[];
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    discord?: string;
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating: number;
  totalClients: number;
  activeOffersCount: number;
  featuredOffers: Array<{
    id: string;
    title: string;
    description?: string;
    type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
    price: number | string;
    currency: string;
    isActive?: boolean;
  }>;
}

export interface DiscoverResponse {
  success: boolean;
  data: {
    creators: CreatorItem[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    activeFilters?: {
      category: string | null;
      goal: string | null;
      search: string | null;
      type: string | null;
      sortBy: string;
    };
  };
}

export interface SearchResultCreator {
  id: string;
  userId: string;
  fullName: string;
  handle: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  specialtyTags: string[];
  credentials: string[];
  verificationStatus: string;
  rating: number;
  totalReviews?: number;
  offers?: any[];
}

export interface SearchResultCourse {
  id: string;
  title: string;
  description?: string | null;
  price?: number;
  category?: string | null;
  thumbnailUrl?: string | null;
  creatorId: string;
  coachName?: string | null;
  coachAvatar?: string | null;
  coachHeadline?: string | null;
  lessonCount?: number;
}

export interface GlobalSearchResponse {
  success: boolean;
  query: string;
  category?: string;
  results: {
    creators: SearchResultCreator[];
    courses: SearchResultCourse[];
    total: number;
  };
}

export const CHADTAG_CREATOR: CreatorItem = {
  id: 'creator-chadtag',
  userId: 'user-chadtag',
  fullName: 'Chadtag',
  email: 'chadtag@ascend.io',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  handle: 'chadtag',
  headline: "Men's Self-Improvement & Aesthetics Coach",
  bio: "A men's self-improvement and aesthetics coach covering facial aesthetics, diet, physique training, and confidence/mindset.",
  specialtyTags: ['looksmaxxing', 'grooming', 'physique', 'confidence-building'],
  credentials: [
    'Facial Aesthetics & Structure Consultant',
    'Physique & Hypertrophy Coach',
    'Confidence & Mindset Specialist',
  ],
  socialLinks: {
    youtube: 'https://youtube.com/@chadtag',
    instagram: 'https://instagram.com/chadtagyt',
    discord: 'https://discord.gg/aTpvfD2SU',
  },
  verificationStatus: 'VERIFIED',
  rating: 5.0,
  totalClients: 0,
  activeOffersCount: 0,
  featuredOffers: [
    {
      id: 'offer-chadtag-1on1',
      title: '1:1 Coaching Call',
      description: 'Private 1-on-1 consultation session covering facial aesthetics assessment, customized nutrition framework, physique roadmap, and confidence building.',
      type: 'ONE_ON_ONE',
      price: 150,
      currency: 'USD',
      isActive: false, // draft pending creator pricing & availability
    },
  ],
};

// Creator catalog with genuine production creator Chadtag
export const FALLBACK_CREATORS: CreatorItem[] = [CHADTAG_CREATOR];

/**
 * Fetches creators dynamically from GET /discover
 */
export const fetchDiscoverCreators = async (params: {
  category?: string;
  goal?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<DiscoverResponse> => {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.goal && params.goal !== 'All') query.set('goal', params.goal);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  try {
    const res = await fetch(`/api/discover?${query.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data: DiscoverResponse = await res.json();
      return data;
    }
  } catch (error) {
    console.info('[API Discover]: Using fallback creators', error);
  }

  let filtered = [...FALLBACK_CREATORS];
  if (params.category && params.category !== 'All') {
    filtered = filtered.filter((c) =>
      c.specialtyTags.some((t) => t.toLowerCase().includes(params.category!.toLowerCase()))
    );
  }
  if (params.goal && params.goal !== 'All') {
    filtered = filtered.filter((c) =>
      c.specialtyTags.some((t) => t.toLowerCase().includes(params.goal!.toLowerCase()))
    );
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        (c.bio && c.bio.toLowerCase().includes(q)) ||
        c.specialtyTags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return {
    success: true,
    data: {
      creators: filtered,
      pagination: {
        page: 1,
        limit: params.limit || 10,
        totalItems: filtered.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  };
};

/**
 * Global Full-Text Search across Creators (name, bio, handle, tags) and Courses (title, description, coach)
 * Hits GET /api/search with debounced queries
 */
export const searchGlobalApi = async (
  query: string,
  category?: string,
  type?: 'all' | 'creators' | 'courses'
): Promise<GlobalSearchResponse> => {
  const searchTerm = query.trim();
  const searchParams = new URLSearchParams();
  if (searchTerm) searchParams.set('q', searchTerm);
  if (category && category !== 'All') searchParams.set('category', category);
  if (type) searchParams.set('type', type);

  try {
    const res = await fetch(`/api/search?${searchParams.toString()}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data: GlobalSearchResponse = await res.json();
      if (data.results) return data;
    }
  } catch (error) {
    console.info('[API Search]: Fallback to empty search state', error);
  }

  return {
    success: true,
    query: searchTerm,
    category: category || 'All',
    results: {
      creators: [],
      courses: [],
      total: 0,
    },
  };
};

/**
 * Fetches a single creator profile from GET /creators/:id
 */
export const fetchCreatorById = async (id: string): Promise<CreatorItem> => {
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(id)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (error) {
    console.warn(`[API]: fetchCreatorById(${id}) fallback`, error);
  }

  const found = FALLBACK_CREATORS.find(
    (c) => c.id === id || c.userId === id || c.handle.toLowerCase() === id.toLowerCase()
  );
  if (!found) {
    throw new Error(`Creator ${id} not found`);
  }
  return found;
};

/**
 * Fetches offers for a creator from GET /creators/:id/offers
 */
export const fetchCreatorOffers = async (id: string): Promise<CreatorOffer[]> => {
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(id)}/offers`);
    if (res.ok) {
      const json = await res.json();
      if (json.data?.offers) return json.data.offers;
    }
  } catch (error) {
    console.warn(`[API]: fetchCreatorOffers(${id}) fallback`, error);
  }

  try {
    const creator = await fetchCreatorById(id);
    return (creator?.featuredOffers as CreatorOffer[]) || [];
  } catch {
    return [];
  }
};


export interface LessonItem {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl?: string | null;
  durationMinutes: number;
  order: number;
  dripDays: number;
  dripDate?: string | null;
  isLocked: boolean;
  isCompleted: boolean;
  resources?: Array<{ title: string; url: string; size?: string }>;
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  coachHeadline: string;
  totalLessons: number;
  completedLessons: number;
  lessons: LessonItem[];
}

export const CHADMAX_COURSE: CourseDetail = {
  id: 'course-chadmax',
  title: 'ChadMax',
  description: "Comprehensive men's self-improvement and aesthetics protocol covering facial aesthetics, diet, physique training, height & posture optimization, and confidence & aura building.",
  coachId: 'creator-chadtag',
  coachName: 'Chadtag',
  coachAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  coachHeadline: "Men's Self-Improvement & Aesthetics Coach",
  totalLessons: 5,
  completedLessons: 0,
  lessons: [
    {
      id: 'lesson-chadmax-1',
      courseId: 'course-chadmax',
      title: 'Facial Aesthetics & Structure',
      description: 'Video upload pending — placeholder module.',
      videoUrl: '',
      durationMinutes: 0,
      order: 1,
      dripDays: 0,
      isCompleted: false,
      isLocked: false,
    },
    {
      id: 'lesson-chadmax-2',
      courseId: 'course-chadmax',
      title: 'Diet & Nutrition Framework',
      description: 'Video upload pending — placeholder module.',
      videoUrl: '',
      durationMinutes: 0,
      order: 2,
      dripDays: 0,
      isCompleted: false,
      isLocked: false,
    },
    {
      id: 'lesson-chadmax-3',
      courseId: 'course-chadmax',
      title: 'Physique & Muscle Building',
      description: 'Video upload pending — placeholder module.',
      videoUrl: '',
      durationMinutes: 0,
      order: 3,
      dripDays: 0,
      isCompleted: false,
      isLocked: false,
    },
    {
      id: 'lesson-chadmax-4',
      courseId: 'course-chadmax',
      title: 'Height & Posture Optimization',
      description: 'Video upload pending — placeholder module.',
      videoUrl: '',
      durationMinutes: 0,
      order: 4,
      dripDays: 0,
      isCompleted: false,
      isLocked: false,
    },
    {
      id: 'lesson-chadmax-5',
      courseId: 'course-chadmax',
      title: 'Confidence & Aura Building',
      description: 'Video upload pending — placeholder module.',
      videoUrl: '',
      durationMinutes: 0,
      order: 5,
      dripDays: 0,
      isCompleted: false,
      isLocked: false,
    },
  ],
};

export const SAMPLE_COURSE: CourseDetail = {
  id: '',
  title: '',
  description: '',
  coachId: '',
  coachName: '',
  coachAvatar: '',
  coachHeadline: '',
  totalLessons: 0,
  completedLessons: 0,
  lessons: [],
};

/**
 * Fetches course details and lessons from GET /courses/:id
 */
export const fetchCourseById = async (courseId: string): Promise<CourseDetail> => {
  try {
    const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.warn(`[API]: fetchCourseById(${courseId}) fallback`, err);
  }
  if (courseId === 'course-chadmax' || courseId.toLowerCase().includes('chad')) {
    return CHADMAX_COURSE;
  }
  return SAMPLE_COURSE;
};

/**
 * Marks a lesson complete via POST /lessons/:id/complete (Server-side drip verified)
 */
export const completeLessonApi = async (lessonId: string): Promise<{ success: boolean; completedLessons: number }> => {
  try {
    const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_valid_jwt_token',
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[API]: completeLessonApi(${lessonId}) simulation`, err);
  }
  return { success: true, completedLessons: 3 };
};

export interface PostReplyItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'CREATOR' | 'BUYER' | 'ADMIN';
  authorPoints: number;
  content: string;
  createdAt: string;
}

export interface CommunityPostItem {
  id: string;
  creatorId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'CREATOR' | 'BUYER' | 'ADMIN';
  authorPoints: number;
  title: string;
  content: string;
  categoryTag: string;
  likesCount: number;
  hasLiked: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  isReported?: boolean;
  reportReason?: string;
  reportCount?: number;
  repliesCount: number;
  replies: PostReplyItem[];
  createdAt: string;
}

export const SAMPLE_COMMUNITY_POSTS: CommunityPostItem[] = [];

/**
 * Fetches community posts from GET /creators/:id/posts (B4)
 */
export const fetchCommunityPosts = async (creatorId: string): Promise<CommunityPostItem[]> => {
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/posts`);
    if (res.ok) {
      const json = await res.json();
      if (json.data?.posts) return json.data.posts;
    }
  } catch (err) {
    console.warn(`[API]: fetchCommunityPosts(${creatorId}) fallback`, err);
  }
  return [];
};

/**
 * Creates a new community post via POST /creators/:id/posts (+10 points on User)
 */
export const createCommunityPostApi = async (
  creatorId: string,
  data: { title: string; content: string; categoryTag?: string }
): Promise<{ success: boolean; post: CommunityPostItem; pointsEarned: number }> => {
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_valid_jwt_token',
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API]: createCommunityPostApi fallback', err);
  }

  const newPost: CommunityPostItem = {
    id: `post_${Date.now()}`,
    creatorId,
    authorId: 'user-me',
    authorName: 'Akshat S.',
    authorAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    authorRole: 'BUYER',
    authorPoints: 255, // +10 points
    title: data.title,
    content: data.content,
    categoryTag: data.categoryTag || 'Discussion',
    likesCount: 0,
    hasLiked: false,
    repliesCount: 0,
    replies: [],
    createdAt: 'Just now',
  };

  return { success: true, post: newPost, pointsEarned: 10 };
};

/**
 * Toggles like on a post via POST /posts/:id/like (B4)
 */
export const toggleLikePostApi = async (
  postId: string
): Promise<{ success: boolean; likesCount: number; hasLiked: boolean }> => {
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_valid_jwt_token',
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[API]: toggleLikePostApi(${postId}) fallback`, err);
  }
  return { success: true, likesCount: 40, hasLiked: true };
};

/**
 * Creates a reply to a post via POST /posts/:id/replies (+5 points on User)
 */
export const createReplyApi = async (
  postId: string,
  content: string
): Promise<{ success: boolean; reply: PostReplyItem; pointsEarned: number }> => {
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_valid_jwt_token',
      },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[API]: createReplyApi(${postId}) fallback`, err);
  }

  const reply: PostReplyItem = {
    id: `rep_${Date.now()}`,
    postId,
    authorId: 'user-me',
    authorName: 'Akshat S.',
    authorAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    authorRole: 'BUYER',
    authorPoints: 260, // +5 points
    content,
    createdAt: 'Just now',
  };

  return { success: true, reply, pointsEarned: 5 };
};

/**
 * Pins/Unpins a post in the community space (Coach only)
 */
export const togglePinPostApi = async (
  postId: string
): Promise<{ success: boolean; isPinned: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/pin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn(`[togglePinPostApi Fallback]:`, err);
  }

  const post = SAMPLE_COMMUNITY_POSTS.find((p) => p.id === postId);
  if (post) {
    post.isPinned = !post.isPinned;
    return { success: true, isPinned: post.isPinned, message: post.isPinned ? 'Pinned' : 'Unpinned' };
  }
  return { success: true, isPinned: true, message: 'Pinned' };
};

/**
 * Deletes a post from the community (Coach or Author)
 */
export const deletePostApi = async (
  postId: string
): Promise<{ success: boolean; message?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn(`[deletePostApi Fallback]:`, err);
  }

  const index = SAMPLE_COMMUNITY_POSTS.findIndex((p) => p.id === postId);
  if (index !== -1) {
    SAMPLE_COMMUNITY_POSTS.splice(index, 1);
  }
  return { success: true, message: 'Post deleted.' };
};

/**
 * Deletes a reply/comment from a post (Coach or Author)
 */
export const deletePostReplyApi = async (
  replyId: string
): Promise<{ success: boolean; message?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/posts/replies/${encodeURIComponent(replyId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn(`[deletePostReplyApi Fallback]:`, err);
  }

  return { success: true, message: 'Reply deleted.' };
};

/**
 * Reports/flags an inappropriate post (Buyers/Members)
 */
export const reportPostApi = async (
  postId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason, details }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[reportPostApi Fallback]:`, err);
  }

  const post = SAMPLE_COMMUNITY_POSTS.find((p) => p.id === postId);
  if (post) {
    post.isReported = true;
    post.reportReason = reason;
    post.reportCount = (post.reportCount || 0) + 1;
  }
  return { success: true, message: 'Post reported to coach for moderation.' };
};

/**
 * Fetches reported/flagged posts for a creator community space
 */
export const fetchReportedPostsApi = async (
  creatorId: string
): Promise<{ success: boolean; reportedPosts: CommunityPostItem[]; count: number }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/posts/reported/${encodeURIComponent(creatorId)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        reportedPosts: json.data?.reportedPosts || [],
        count: json.data?.count || 0,
      };
    }
  } catch (err) {
    console.warn(`[fetchReportedPostsApi Fallback]:`, err);
  }

  const reported = SAMPLE_COMMUNITY_POSTS.filter((p) => p.isReported);
  return { success: true, reportedPosts: reported, count: reported.length };
};

/**
 * Dismisses a report/flag on a post
 */
export const dismissPostReportApi = async (
  postId: string
): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/dismiss-report`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[dismissPostReportApi Fallback]:`, err);
  }

  const post = SAMPLE_COMMUNITY_POSTS.find((p) => p.id === postId);
  if (post) {
    post.isReported = false;
    post.reportReason = undefined;
  }
  return { success: true, message: 'Report dismissed.' };
};

export interface EnrolledCourseItem {
  id: string;
  courseId: string;
  title: string;
  coachName: string;
  coachAvatar: string;
  thumbnailUrl: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastAccessedAt: string;
  nextLessonTitle: string;
}

export interface BuyerBookingItem {
  id: string;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  coachHeadline: string;
  offerTitle: string;
  scheduledAt: string;
  durationMinutes?: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetLink: string;
  meetingUrl?: string;
  format: string;
}

export interface PurchaseRecordItem {
  id: string;
  orderId: string;
  paymentId: string;
  invoiceNumber?: string;
  programTitle: string;
  coachName: string;
  type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
  amount: number;
  currency: string;
  status: 'CAPTURED' | 'FAILED';
  date: string;
  invoiceUrl: string;
  invoicePdfUrl?: string;
  gstBreakdown?: {
    baseAmount: number;
    cgst: number;
    sgst: number;
    totalTax: number;
  };
}

export interface BuyerSubscriptionItem {
  id: string; // enrollmentId
  offerId: string;
  offerTitle: string;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  coachHeadline: string;
  type: 'ONE_ON_ONE' | 'COURSE' | 'COMMUNITY';
  amount: number;
  currency: string;
  billingInterval: 'month' | 'year' | string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  razorpaySubscriptionId?: string;
  format?: string;
}

export interface BuyerDashboardData {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
    points: number;
    tier: string;
  };
  stats: {
    enrolledCoursesCount: number;
    activeBookingsCount: number;
    totalHoursLearned: number;
  };
  enrolledCourses: EnrolledCourseItem[];
  upcomingBookings: BuyerBookingItem[];
  subscriptions?: BuyerSubscriptionItem[];
  purchaseHistory: PurchaseRecordItem[];
}

export const SAMPLE_BUYER_DASHBOARD: BuyerDashboardData = {
  user: {
    name: 'Member',
    email: '',
    avatarUrl: '',
    points: 0,
    tier: 'Bronze Member',
  },
  stats: {
    enrolledCoursesCount: 0,
    activeBookingsCount: 0,
    totalHoursLearned: 0,
  },
  enrolledCourses: [],
  upcomingBookings: [],
  subscriptions: [],
  purchaseHistory: [],
};

/**
 * Fetches buyer space dashboard from B3 (progress) and B5 (bookings) "me" routes
 */
export const fetchBuyerDashboardData = async (): Promise<BuyerDashboardData> => {
  try {
    const [progressRes, bookingsRes] = await Promise.all([
      fetch('/api/users/me/progress', {
        headers: { 'Authorization': 'Bearer mock_valid_jwt_token' },
      }),
      fetch('/api/users/me/bookings', {
        headers: { 'Authorization': 'Bearer mock_valid_jwt_token' },
      }),
    ]);

    if (progressRes.ok && bookingsRes.ok) {
      const pData = await progressRes.json();
      const bData = await bookingsRes.json();
      if (pData.data && bData.data) {
        return {
          ...SAMPLE_BUYER_DASHBOARD,
          enrolledCourses: pData.data.courses || SAMPLE_BUYER_DASHBOARD.enrolledCourses,
          upcomingBookings: bData.data.bookings || SAMPLE_BUYER_DASHBOARD.upcomingBookings,
        };
      }
    }
  } catch (err) {
    console.warn('[API]: fetchBuyerDashboardData fallback', err);
  }
  return SAMPLE_BUYER_DASHBOARD;
};

export interface CreatorStudentItem {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  enrolledProgram: string;
  progressPercent: number;
  totalCompletedModules: number;
  totalModules: number;
  lastActive: string;
  reputationPoints: number;
  phone: string;
}

export interface CreatorBookingSlot {
  id: string;
  studentName: string;
  studentAvatar: string;
  studentEmail?: string;
  programTitle: string;
  scheduledAt: string;
  durationMinutes?: number;
  date: string;
  time: string;
  meetLink: string;
  meetingUrl?: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  format: string;
}

export interface CreatorDashboardData {
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string;
    handle: string;
    headline: string;
    verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
    verifiedAt?: string | null;
    agreementAccepted?: boolean;
    agreementAcceptedAt?: string | null;
    rating: number;
    totalReviews: number;
    credentials: string[];
    bio?: string;
    specialtyTags?: string[];
    socialLinks?: {
      youtube?: string;
      instagram?: string;
      discord?: string;
    };
  };
  earnings: {
    grossRevenue: number;
    netPayoutAvailable: number;
    growthMoMPercent: number;
    activePaidStudents: number;
    avgOrderValue: number;
    monthlyBreakdown: Array<{ month: string; amount: number }>;
  };
  offers: Array<{
    id: string;
    title: string;
    description: string;
    type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
    price: number;
    currency: string;
    isActive: boolean;
    totalSalesCount: number;
    totalRevenue: number;
  }>;
  students: CreatorStudentItem[];
  bookings: CreatorBookingSlot[];
}

export const SAMPLE_CREATOR_DASHBOARD: CreatorDashboardData = {
  creator: {
    id: 'creator-chadtag',
    fullName: 'Chadtag',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    handle: 'chadtag',
    headline: "Men's Self-Improvement & Aesthetics Coach",
    bio: "A men's self-improvement and aesthetics coach covering facial aesthetics, diet, physique training, and confidence/mindset.",
    specialtyTags: ['looksmaxxing', 'grooming', 'physique', 'confidence-building'],
    socialLinks: {
      youtube: 'https://youtube.com/@chadtag',
      instagram: 'https://instagram.com/chadtagyt',
      discord: 'https://discord.gg/aTpvfD2SU',
    },
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-09-01T00:00:00Z',
    agreementAccepted: true,
    agreementAcceptedAt: '2026-09-01T00:00:00Z',
    rating: 5.0,
    totalReviews: 0,
    credentials: [
      'Facial Aesthetics & Structure Consultant',
      'Physique & Hypertrophy Coach',
      'Mindset & Confidence Specialist',
    ],
  },
  earnings: {
    grossRevenue: 0,
    netPayoutAvailable: 0,
    growthMoMPercent: 0,
    activePaidStudents: 0,
    avgOrderValue: 0,
    monthlyBreakdown: [],
  },
  offers: [
    {
      id: 'offer-chadtag-1on1',
      title: '1:1 Coaching Call',
      description: 'Private 1-on-1 consultation session covering facial aesthetics assessment, customized nutrition framework, physique roadmap, and confidence building.',
      type: 'ONE_ON_ONE',
      price: 150,
      currency: 'USD',
      isActive: false, // draft pending pricing/availability
      totalSalesCount: 0,
      totalRevenue: 0,
    },
  ],
  students: [],
  bookings: [],
};

/**
 * Fetches Creator Studio Dashboard
 */
export const fetchCreatorDashboardData = async (): Promise<CreatorDashboardData> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/creators/studio', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.warn('[API]: fetchCreatorDashboardData fallback', err);
  }
  return SAMPLE_CREATOR_DASHBOARD;
};

/**
 * Updates creator profile details via PUT /api/creators/profile
 */
export const updateCreatorProfileApi = async (profileData: {
  fullName?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  specialtyTags?: string[];
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    discord?: string;
  };
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/creators/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(profileData),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setStoredAuth(token || '', {
          ...storedUser,
          fullName: profileData.fullName || storedUser.fullName,
          avatarUrl: profileData.avatarUrl !== undefined ? profileData.avatarUrl : storedUser.avatarUrl,
        });
      }
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to update profile.' };
  } catch (err: any) {
    console.warn('[updateCreatorProfileApi Fallback]:', err);
    return {
      success: true,
      data: {
        id: 'creator-chadtag',
        ...profileData,
      },
    };
  }
};

/**
 * Toggles offer publish/draft status via PATCH /api/offers/:id/status
 */
export const toggleOfferStatusApi = async (
  offerId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/offers/${encodeURIComponent(offerId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ isActive }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
    return { success: false, error: json.error || 'Failed to update offer status.' };
  } catch {
    return { success: true };
  }
};

/**
 * Creates a new offer via POST /offers (B2 creator-only endpoint)
 */
export const createOfferApi = async (data: {
  title: string;
  description: string;
  type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
  price: number;
  currency?: string;
}): Promise<{ success: boolean; offer: any }> => {
  try {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_creator_jwt_token',
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API]: createOfferApi fallback', err);
  }

  const newOff = {
    id: `off_${Date.now()}`,
    title: data.title,
    description: data.description,
    type: data.type,
    price: data.price,
    currency: data.currency || 'USD',
    isActive: true,
    totalSalesCount: 0,
    totalRevenue: 0,
  };

  return { success: true, offer: newOff };
};

export interface AuthUserData {
  id: string;
  email: string;
  role: 'BUYER' | 'CREATOR' | 'ADMIN';
  token: string;
  profile?: {
    fullName: string;
    avatarUrl?: string;
    handle?: string;
    verificationStatus?: string;
  };
}

const AUTH_TOKEN_KEY = 'ascend_auth_token';
const AUTH_USER_KEY = 'ascend_auth_user';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getStoredUser = (): AuthUserData | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string, user: AuthUserData): void => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('[API]: Could not save session to storage', err);
  }
};

export const clearStoredAuth = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.warn('[API]: Could not clear session storage', err);
  }
};

/**
 * Authenticates user via POST /auth/login (Real Backend JWT)
 * Never returns fake mocked success
 */
export const loginUserApi = async (email: string, password: string): Promise<{ success: boolean; user: AuthUserData; token: string }> => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Authentication failed. Please check your credentials.');
  }

  const userData: AuthUserData = {
    ...data.user,
    token: data.token,
  };

  setStoredAuth(data.token, userData);
  return { success: true, user: userData, token: data.token };
};

/**
 * Registers new user via POST /auth/register (Real Backend DB & JWT)
 * Never returns fake mocked success
 */
export const signupUserApi = async (data: {
  fullName: string;
  email: string;
  password: string;
  role: 'BUYER' | 'CREATOR';
  referralCode?: string;
}): Promise<{ success: boolean; user: AuthUserData; token: string }> => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const resData = await res.json();

  if (!res.ok || !resData.success) {
    throw new Error(resData.error || 'Registration failed. Please try again.');
  }

  const userData: AuthUserData = {
    ...resData.user,
    token: resData.token,
  };

  setStoredAuth(resData.token, userData);
  return { success: true, user: userData, token: resData.token };
};

/**
 * Verifies the current session with backend GET /auth/me
 * Only confirms authentication when the backend validates the JWT signature and user
 */
export const verifySessionApi = async (providedToken?: string): Promise<{ success: boolean; user?: AuthUserData; error?: string }> => {
  const token = providedToken || getStoredToken();
  if (!token) {
    return { success: false, error: 'No active session token found.' };
  }

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      clearStoredAuth();
      return { success: false, error: 'Session expired or invalid.' };
    }

    const data = await res.json();
    if (data.success && data.user) {
      const userData: AuthUserData = {
        ...data.user,
        token,
      };
      setStoredAuth(token, userData);
      return { success: true, user: userData };
    }

    clearStoredAuth();
    return { success: false, error: 'Could not verify user profile.' };
  } catch (err: any) {
    clearStoredAuth();
    return { success: false, error: err.message || 'Network error verifying session.' };
  }
};

/**
 * Logs out user by clearing stored credentials
 */
export const logoutUserApi = (): void => {
  clearStoredAuth();
};

/**
 * Sends Password Reset Request via POST /api/auth/forgot-password
 */
export const forgotPasswordApi = async (
  email: string
): Promise<{ success: boolean; message: string; resetToken?: string; resetCode?: string }> => {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to send password reset email.');
  }

  return data;
};

/**
 * Resets user password via POST /api/auth/reset-password
 */
export const resetPasswordApi = async (
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reset password. The link may have expired.');
  }

  return data;
};

/**
 * Verifies email address via POST /api/auth/verify-email
 */
export const verifyEmailApi = async (params: {
  token?: string;
  code?: string;
  email?: string;
}): Promise<{ success: boolean; message: string; user?: AuthUserData; token?: string }> => {
  const res = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Invalid or expired verification code.');
  }

  if (data.token && data.user) {
    const userData: AuthUserData = {
      ...data.user,
      token: data.token,
    };
    setStoredAuth(data.token, userData);
  }

  return data;
};

/**
 * Resends verification email via POST /api/auth/resend-verification
 */
export const resendVerificationApi = async (
  email: string
): Promise<{ success: boolean; message: string; verificationCode?: string }> => {
  const res = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to resend verification email.');
  }

  return data;
};

/**
 * Submits Creator Onboarding Profile & Verification Documents (B7: POST /creators/:id/verification-docs)
 */
export const submitCreatorOnboardingApi = async (data: {
  creatorId: string;
  handle: string;
  headline: string;
  bio: string;
  yearsExperience: string;
  specialtyTags: string[];
  credentials: string[];
  docFileName?: string;
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
}): Promise<{ success: boolean; message: string; verificationStatus: 'PENDING' | 'VERIFIED' }> => {
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(data.creatorId)}/verification-docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock_creator_jwt_token',
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[API]: submitCreatorOnboardingApi simulation', err);
  }

  return {
    success: true,
    message: 'Profile saved and verification documents queued for administrator audit (B7).',
    verificationStatus: 'PENDING',
  };
};

export interface AdminCreatorItem {
  id: string;
  userId: string;
  handle: string;
  headline: string | null;
  bio: string | null;
  specialtyTags: string[];
  credentials: string[];
  verificationDocs: string[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  verifiedAt: string | null;
  rating: number;
  totalClients: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    points?: number;
    createdAt?: string;
  };
  counts?: {
    offers: number;
    courses: number;
    bookings: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch creators list for administrator audit (GET /admin/creators?status=...)
 */
export const getAdminCreatorsApi = async (
  status: string = 'pending'
): Promise<{ success: boolean; creators: AdminCreatorItem[]; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/admin/creators?status=${encodeURIComponent(status)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.creators) {
        return { success: true, creators: data.data.creators };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, creators: [], error: errData.error || `HTTP ${res.status} Error` };
    }
  } catch (err: any) {
    return { success: false, creators: [], error: err.message || 'Failed to fetch admin creators' };
  }

  return { success: false, creators: [], error: 'Could not load creators from server' };
};

/**
 * Approve or reject a creator application (PATCH /admin/creators/:id/verify)
 */
export const verifyAdminCreatorApi = async (
  creatorId: string,
  status: 'VERIFIED' | 'REJECTED' | 'PENDING',
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/admin/creators/${encodeURIComponent(creatorId)}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, reason }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, data: data.data };
    }
    return { success: false, error: data.error || 'Verification update failed.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating verification.' };
  }
};

// ==============================================================================
// COURSE STUDIO API & TYPES (F13)
// ==============================================================================

export interface StudioLessonInput {
  id?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  order?: number;
  dripDays?: number;
  dripDate?: string | null;
  isPreview?: boolean;
}

export interface StudioCourseInput {
  id?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
  isPublished: boolean;
  lessons: StudioLessonInput[];
}

export interface StudioCourseItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  offerId?: string;
  price: number;
  currency: string;
  totalLessons: number;
  totalEnrollments: number;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    durationSeconds: number;
    order: number;
    dripDays: number;
    dripDate: string | null;
    isPreview: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request a direct video upload URL for Mux / Cloudflare Stream
 */
export const getVideoUploadUrlApi = async (
  fileName?: string,
  fileType?: string
): Promise<{
  success: boolean;
  data?: {
    provider: string;
    uploadUrl: string;
    assetId: string;
    playbackUrl: string;
    thumbnailUrl?: string;
  };
  error?: string;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/courses/video-upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ fileName, fileType }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to generate video upload URL.' };
  } catch (err: any) {
    return {
      success: true,
      data: {
        provider: 'mock',
        uploadUrl: 'https://api.ascend.io/mock-stream-upload',
        assetId: 'mock_' + Math.random().toString(36).slice(2, 9),
        playbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=900&auto=format&fit=crop&q=80',
      },
    };
  }
};

/**
 * Fetch all courses (published and draft) for the creator studio
 */
export const fetchCreatorCoursesApi = async (): Promise<{
  success: boolean;
  courses: StudioCourseItem[];
  error?: string;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/courses/studio/my-courses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, courses: json.data.courses || [] };
    }
  } catch (err: any) {
    console.warn('[fetchCreatorCoursesApi Fallback]:', err);
  }

  return {
    success: true,
    courses: [
      {
        id: 'course-chadmax',
        title: 'ChadMax',
        description: "Comprehensive men's self-improvement and aesthetics protocol covering facial aesthetics, diet, physique training, height & posture optimization, and confidence & aura building.",
        thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
        isPublished: false, // draft
        price: 180,
        currency: 'USD',
        totalLessons: 5,
        totalEnrollments: 0,
        lessons: [
          {
            id: 'lesson-chadmax-1',
            title: 'Facial Aesthetics & Structure',
            description: 'Video upload pending — placeholder module.',
            videoUrl: '',
            durationSeconds: 0,
            order: 1,
            dripDays: 0,
            dripDate: null,
            isPreview: false,
          },
          {
            id: 'lesson-chadmax-2',
            title: 'Diet & Nutrition Framework',
            description: 'Video upload pending — placeholder module.',
            videoUrl: '',
            durationSeconds: 0,
            order: 2,
            dripDays: 0,
            dripDate: null,
            isPreview: false,
          },
          {
            id: 'lesson-chadmax-3',
            title: 'Physique & Muscle Building',
            description: 'Video upload pending — placeholder module.',
            videoUrl: '',
            durationSeconds: 0,
            order: 3,
            dripDays: 0,
            dripDate: null,
            isPreview: false,
          },
          {
            id: 'lesson-chadmax-4',
            title: 'Height & Posture Optimization',
            description: 'Video upload pending — placeholder module.',
            videoUrl: '',
            durationSeconds: 0,
            order: 4,
            dripDays: 0,
            dripDate: null,
            isPreview: false,
          },
          {
            id: 'lesson-chadmax-5',
            title: 'Confidence & Aura Building',
            description: 'Video upload pending — placeholder module.',
            videoUrl: '',
            durationSeconds: 0,
            order: 5,
            dripDays: 0,
            dripDate: null,
            isPreview: false,
          },
        ],
      },
    ],
  };
};

/**
 * Create a new course with lessons and linked offer
 */
export const createCourseApi = async (
  courseData: StudioCourseInput
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(courseData),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to create course.' };
  } catch (err: any) {
    return {
      success: true,
      data: {
        id: 'c-new-' + Math.random().toString(36).slice(2, 8),
        ...courseData,
        createdAt: new Date().toISOString(),
      },
    };
  }
};

/**
 * Update an existing course and synchronize lessons
 */
export const updateCourseApi = async (
  courseId: string,
  courseData: Partial<StudioCourseInput>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(courseData),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to update course.' };
  } catch (err: any) {
    return {
      success: true,
      data: { id: courseId, ...courseData, updatedAt: new Date().toISOString() },
    };
  }
};

/**
 * Delete a course and its lessons
 */
export const deleteCourseApi = async (
  courseId: string
): Promise<{ success: boolean; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
    return { success: false, error: json.error || 'Failed to delete course.' };
  } catch (err: any) {
    return { success: true };
  }
};

// ==============================================================================
// PAYOUT SETUP & BANKING API (F14)
// ==============================================================================

export interface PayoutDetails {
  payoutMethod: 'BANK_TRANSFER' | 'UPI';
  accountHolderName: string;
  accountNumber?: string;
  maskedAccountNumber?: string;
  ifscOrSwift?: string;
  bankName?: string;
  upiId?: string;
  taxId?: string;
  gstin?: string;
  payoutSetupCompleted: boolean;
  updatedAt?: string;
}

/**
 * Fetch creator payout configuration
 */
export const getPayoutSettingsApi = async (): Promise<{
  success: boolean;
  data: PayoutDetails;
  error?: string;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/creators/payout-settings', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn('[getPayoutSettingsApi Fallback]:', err);
  }

  return {
    success: true,
    data: {
      payoutMethod: 'BANK_TRANSFER',
      accountHolderName: '',
      maskedAccountNumber: '',
      ifscOrSwift: '',
      bankName: '',
      taxId: '',
      gstin: '',
      payoutSetupCompleted: false,
    },
  };
};

/**
 * Update creator payout configuration
 */
export const updatePayoutSettingsApi = async (
  payoutData: Partial<PayoutDetails>
): Promise<{ success: boolean; data?: PayoutDetails; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/creators/payout-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payoutData),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to update payout settings.' };
  } catch (err: any) {
    return {
      success: true,
      data: {
        payoutMethod: payoutData.payoutMethod || 'BANK_TRANSFER',
        accountHolderName: payoutData.accountHolderName || '',
        maskedAccountNumber: payoutData.accountNumber
          ? `••••••••${payoutData.accountNumber.slice(-4)}`
          : '',
        ifscOrSwift: payoutData.ifscOrSwift || '',
        bankName: payoutData.bankName || '',
        upiId: payoutData.upiId,
        taxId: payoutData.taxId,
        gstin: payoutData.gstin || '27AAPFV8921M1Z5',
        payoutSetupCompleted: !!(
          (payoutData.accountNumber && payoutData.ifscOrSwift) ||
          (payoutData.upiId && payoutData.upiId.includes('@'))
        ),
      },
    };
  }
};

// ==============================================================================
// AVAILABILITY SCHEDULE & BLACKOUT DATES API (F14)
// ==============================================================================

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dayName: string;
  isActive: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface AvailabilityScheduleConfig {
  weeklySlots: DaySchedule[];
  slotDurationMinutes: number;
  bufferMinutes: number;
  blackoutDates: string[]; // "YYYY-MM-DD"
  updatedAt?: string;
}

export const SAMPLE_SCHEDULE_CONFIG: AvailabilityScheduleConfig = {
  weeklySlots: [
    { dayOfWeek: 1, dayName: 'Monday', isActive: false, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 2, dayName: 'Tuesday', isActive: false, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 3, dayName: 'Wednesday', isActive: false, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 4, dayName: 'Thursday', isActive: false, startTime: '09:00', endTime: '18:00' },
    { dayOfWeek: 5, dayName: 'Friday', isActive: false, startTime: '09:00', endTime: '16:00' },
    { dayOfWeek: 6, dayName: 'Saturday', isActive: false, startTime: '10:00', endTime: '14:00' },
    { dayOfWeek: 0, dayName: 'Sunday', isActive: false, startTime: '10:00', endTime: '14:00' },
  ],
  slotDurationMinutes: 45,
  bufferMinutes: 15,
  blackoutDates: [],
};

/**
 * Fetch availability schedule and blackout dates
 */
export const getAvailabilityScheduleApi = async (): Promise<{
  success: boolean;
  data: AvailabilityScheduleConfig;
  error?: string;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/creators/availability/schedule', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn('[getAvailabilityScheduleApi Fallback]:', err);
  }

  return { success: true, data: SAMPLE_SCHEDULE_CONFIG };
};

/**
 * Save availability schedule and blackout dates
 */
export const updateAvailabilityScheduleApi = async (
  schedule: Partial<AvailabilityScheduleConfig>
): Promise<{ success: boolean; data?: AvailabilityScheduleConfig; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/creators/availability/schedule', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(schedule),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to save availability schedule.' };
  } catch (err: any) {
    return {
      success: true,
      data: {
        ...SAMPLE_SCHEDULE_CONFIG,
        ...schedule,
      },
    };
  }
};

// ==============================================================================
// CREATOR-BUYER MESSAGING API (F15)
// ==============================================================================

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  enrollmentId?: string;
  bookingId?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  partnerId: string;
  partner: {
    id: string;
    fullName: string;
    avatarUrl: string;
    role: 'BUYER' | 'CREATOR' | 'ADMIN';
    handle?: string;
  };
  contextType: 'ENROLLMENT' | 'BOOKING' | 'GENERAL';
  contextId?: string;
  contextTitle: string;
  lastMessage: {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export const SAMPLE_CONVERSATIONS: ConversationItem[] = [];

export const SAMPLE_THREAD_MESSAGES: Record<string, MessageItem[]> = {};

/**
 * Fetch conversation list
 */
export const fetchConversationsApi = async (): Promise<{
  success: boolean;
  data: ConversationItem[];
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/messages/conversations', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && Array.isArray(json.data)) {
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn('[fetchConversationsApi Fallback]:', err);
  }

  return { success: true, data: SAMPLE_CONVERSATIONS };
};

/**
 * Fetch chronological message thread
 */
export const fetchThreadApi = async (
  partnerId: string
): Promise<{ success: boolean; data: { partnerId: string; messages: MessageItem[] } }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/messages/thread/${encodeURIComponent(partnerId)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn('[fetchThreadApi Fallback]:', err);
  }

  const fallbackMessages = SAMPLE_THREAD_MESSAGES[partnerId] || [];
  return {
    success: true,
    data: {
      partnerId,
      messages: fallbackMessages,
    },
  };
};

/**
 * Send a direct message
 */
export const sendMessageApi = async (payload: {
  receiverId: string;
  text: string;
  enrollmentId?: string;
  bookingId?: string;
}): Promise<{ success: boolean; data?: MessageItem; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to send message.' };
  } catch (err: any) {
    const localMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderId: 'mock_buyer_id',
      receiverId: payload.receiverId,
      enrollmentId: payload.enrollmentId,
      bookingId: payload.bookingId,
      text: payload.text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (SAMPLE_THREAD_MESSAGES[payload.receiverId]) {
      SAMPLE_THREAD_MESSAGES[payload.receiverId].push(localMsg);
    } else {
      SAMPLE_THREAD_MESSAGES[payload.receiverId] = [localMsg];
    }

    return { success: true, data: localMsg };
  }
};

/**
 * Mark thread messages as read
 */
export const markThreadReadApi = async (
  partnerId: string
): Promise<{ success: boolean }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/messages/read/${encodeURIComponent(partnerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
  } catch (err) {
    console.warn('[markThreadReadApi Fallback]:', err);
  }
  return { success: true };
};

// ==============================================================================
// CREATOR REVIEWS & RATINGS API (F16)
// ==============================================================================

export interface ReviewItem {
  id: string;
  creatorId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  rating: number; // 1 to 5
  reviewText: string;
  programTitle: string;
  enrollmentId?: string;
  bookingId?: string;
  verifiedBuyer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorReviewsResponse {
  creatorId: string;
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ReviewItem[];
}

export type CreatorReviewsSummary = CreatorReviewsResponse;

export const SAMPLE_CREATOR_REVIEWS: Record<string, CreatorReviewsResponse> = {};

/**
 * Fetch reviews for creator storefront
 */
export const fetchCreatorReviewsApi = async (
  creatorId: string
): Promise<{ success: boolean; data: CreatorReviewsSummary }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/reviews`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn('[fetchCreatorReviewsApi Fallback]:', err);
  }

  const fallback: CreatorReviewsResponse = SAMPLE_CREATOR_REVIEWS[creatorId] || {
    creatorId,
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  };

  return { success: true, data: fallback };
};

/**
 * Submit a verified buyer review
 */
export const submitReviewApi = async (payload: {
  creatorId: string;
  rating: number;
  reviewText: string;
  programTitle?: string;
  enrollmentId?: string;
  bookingId?: string;
}): Promise<{ success: boolean; data?: ReviewItem; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to submit review.' };
  } catch (err: any) {
    const localReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      creatorId: payload.creatorId,
      buyerId: 'mock_buyer_id',
      buyerName: 'Akshat Sharma',
      buyerAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      rating: payload.rating,
      reviewText: payload.reviewText,
      programTitle: payload.programTitle || 'Verified Coaching Program',
      enrollmentId: payload.enrollmentId,
      bookingId: payload.bookingId,
      verifiedBuyer: true,
      createdAt: 'Just now',
      updatedAt: 'Just now',
    };

    if (SAMPLE_CREATOR_REVIEWS[payload.creatorId]) {
      SAMPLE_CREATOR_REVIEWS[payload.creatorId].reviews.unshift(localReview);
      SAMPLE_CREATOR_REVIEWS[payload.creatorId].totalReviews += 1;
    }

    return { success: true, data: localReview };
  }
};

/**
 * Update an existing review (Editable by author only)
 */
export const updateReviewApi = async (
  reviewId: string,
  payload: { rating?: number; reviewText?: string }
): Promise<{ success: boolean; data?: ReviewItem; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true, data: json.data };
    }
    return { success: false, error: json.error || 'Failed to update review.' };
  } catch (err: any) {
    return { success: true };
  }
};

/**
 * Delete a review (Author only)
 */
export const deleteReviewApi = async (
  reviewId: string
): Promise<{ success: boolean; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
    return { success: false, error: json.error || 'Failed to delete review.' };
  } catch (err: any) {
    return { success: true };
  }
};

// ==============================================================================
// IN-APP NOTIFICATIONS API (F17)
// ==============================================================================

export type NotificationType =
  | 'BOOKING_NEW'
  | 'BOOKING_CONFIRMED'
  | 'MESSAGE_RECEIVED'
  | 'COURSE_PUBLISHED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'PAYMENT_SUCCESS'
  | 'REVIEW_RECEIVED';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  isRead: boolean;
  emailSent: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
}

export const SAMPLE_NOTIFICATIONS: NotificationItem[] = [];

/**
 * Fetch notifications for current authenticated user
 */
export const fetchNotificationsApi = async (): Promise<{
  success: boolean;
  data: NotificationsResponse;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/notifications', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
  } catch (err) {
    console.warn('[fetchNotificationsApi Fallback]:', err);
  }

  const unreadCount = SAMPLE_NOTIFICATIONS.filter((n) => !n.isRead).length;
  return {
    success: true,
    data: {
      notifications: SAMPLE_NOTIFICATIONS,
      unreadCount,
      totalCount: SAMPLE_NOTIFICATIONS.length,
    },
  };
};

/**
 * Mark a single notification as read
 */
export const markNotificationReadApi = async (
  notificationId: string
): Promise<{ success: boolean }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
  } catch (err) {
    console.warn('[markNotificationReadApi Fallback]:', err);
  }

  const found = SAMPLE_NOTIFICATIONS.find((n) => n.id === notificationId);
  if (found) found.isRead = true;

  return { success: true };
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsReadApi = async (): Promise<{ success: boolean }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return { success: true };
    }
  } catch (err) {
    console.warn('[markAllNotificationsReadApi Fallback]:', err);
  }

  SAMPLE_NOTIFICATIONS.forEach((n) => {
    n.isRead = true;
  });

  return { success: true };
};

// ============================================================================
// SUPPORT TICKET MODULE API & INTERFACES
// ============================================================================

export type TicketCategory = 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  userId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  enrollmentId?: string;
  bookingId?: string;
  adminResponse?: string;
  respondedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
  enrollment?: {
    id: string;
    offerId: string;
  };
  booking?: {
    id: string;
    scheduledAt: string;
    status: string;
  };
}

export const SAMPLE_SUPPORT_TICKETS: SupportTicketItem[] = [];

/**
 * Raise a new support ticket (Buyer / Creator)
 */
export const createSupportTicketApi = async (data: {
  category: TicketCategory;
  subject: string;
  description: string;
  enrollmentId?: string;
  bookingId?: string;
}): Promise<{ success: boolean; data: SupportTicketItem; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[createSupportTicketApi Fallback]:', err);
  }

  const user = getStoredUser();
  const count = SAMPLE_SUPPORT_TICKETS.length + 1;
  const seqStr = String(count).padStart(5, '0');
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7).replace('-', '');

  const newTicket: SupportTicketItem = {
    id: `tkt_${Date.now()}`,
    ticketNumber: `TKT-${monthStr}-${seqStr}`,
    userId: user?.id || 'user-akshat',
    category: data.category,
    subject: data.subject,
    description: data.description,
    status: 'OPEN',
    enrollmentId: data.enrollmentId,
    bookingId: data.bookingId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    user: {
      id: user?.id || 'user-akshat',
      fullName: (user as any)?.name || (user as any)?.fullName || 'Akshat Sharma',
      email: user?.email || 'akshat@ascend.io',
      role: user?.role || 'BUYER',
    },
  };

  SAMPLE_SUPPORT_TICKETS.unshift(newTicket);

  return {
    success: true,
    message: 'Support ticket raised successfully. Support team will review shortly.',
    data: newTicket,
  };
};

/**
 * Fetch current user's submitted support tickets
 */
export const fetchUserSupportTicketsApi = async (): Promise<SupportTicketItem[]> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/support/tickets/my', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('[fetchUserSupportTicketsApi Fallback]:', err);
  }

  const user = getStoredUser();
  const currentUserId = user?.id || 'user-akshat';
  return SAMPLE_SUPPORT_TICKETS.filter((t) => t.userId === currentUserId || !t.userId);
};

/**
 * Admin: Fetch all platform support tickets with optional filters
 */
export const fetchAdminSupportTicketsApi = async (filters?: {
  status?: string;
  category?: string;
}): Promise<{
  data: SupportTicketItem[];
  counts: { total: number; open: number; inProgress: number; resolved: number };
}> => {
  const token = getStoredToken();
  const queryParams = new URLSearchParams();
  if (filters?.status && filters.status !== 'ALL') queryParams.set('status', filters.status);
  if (filters?.category && filters.category !== 'ALL') queryParams.set('category', filters.category);

  try {
    const res = await fetch(`/api/support/tickets/admin?${queryParams.toString()}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.data) {
      return {
        data: json.data,
        counts: json.counts || {
          total: json.data.length,
          open: json.data.filter((t: any) => t.status === 'OPEN').length,
          inProgress: json.data.filter((t: any) => t.status === 'IN_PROGRESS').length,
          resolved: json.data.filter((t: any) => t.status === 'RESOLVED').length,
        },
      };
    }
  } catch (err) {
    console.warn('[fetchAdminSupportTicketsApi Fallback]:', err);
  }

  let filtered = [...SAMPLE_SUPPORT_TICKETS];
  if (filters?.status && filters.status !== 'ALL') {
    filtered = filtered.filter((t) => t.status === filters.status);
  }
  if (filters?.category && filters.category !== 'ALL') {
    filtered = filtered.filter((t) => t.category === filters.category);
  }

  return {
    data: filtered,
    counts: {
      total: SAMPLE_SUPPORT_TICKETS.length,
      open: SAMPLE_SUPPORT_TICKETS.filter((t) => t.status === 'OPEN').length,
      inProgress: SAMPLE_SUPPORT_TICKETS.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: SAMPLE_SUPPORT_TICKETS.filter((t) => t.status === 'RESOLVED').length,
    },
  };
};

/**
 * Admin: Update ticket status and submit resolution reply
 */
export const adminRespondSupportTicketApi = async (
  ticketId: string,
  data: {
    status?: TicketStatus;
    adminResponse?: string;
  }
): Promise<{ success: boolean; data: SupportTicketItem; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/support/tickets/admin/${encodeURIComponent(ticketId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[adminRespondSupportTicketApi Fallback]:', err);
  }

  const found = SAMPLE_SUPPORT_TICKETS.find((t) => t.id === ticketId);
  if (found) {
    if (data.status) {
      found.status = data.status;
      if (data.status === 'RESOLVED') found.resolvedAt = new Date().toISOString();
    }
    if (data.adminResponse !== undefined) {
      found.adminResponse = data.adminResponse;
      found.respondedAt = new Date().toISOString();
    }
    found.updatedAt = new Date().toISOString();
    return {
      success: true,
      data: found,
      message: 'Support ticket updated successfully.',
    };
  }

  throw new Error('Support ticket not found');
};

// ----------------------------------------------------
// Coupon & Promotional Code API Types and Endpoints
// ----------------------------------------------------

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  value: number;
  expiryDate?: string | null;
  creatorId: string;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateCouponResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  error?: string;
  data?: {
    couponId: string;
    code: string;
    discountType: 'PERCENT' | 'FLAT';
    value: number;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    currency: string;
  };
}

export const SAMPLE_COUPONS: CouponItem[] = [];

/**
 * Fetch all coupons created by a specific creator
 */
export const fetchCreatorCouponsApi = async (
  creatorId?: string
): Promise<{ success: boolean; data: CouponItem[] }> => {
  const token = getStoredToken();
  const url = creatorId
    ? `/api/coupons/creator/${encodeURIComponent(creatorId)}`
    : `/api/coupons/creator`;

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchCreatorCouponsApi Fallback]:', err);
  }

  return {
    success: true,
    data: SAMPLE_COUPONS,
  };
};

/**
 * Create a new coupon
 */
export const createCouponApi = async (data: {
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  value: number;
  expiryDate?: string;
  usageLimit?: number;
  creatorId?: string;
}): Promise<{ success: boolean; data: CouponItem; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create coupon');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    console.warn('[createCouponApi Fallback]:', err);
  }

  const cleanCode = data.code.trim().toUpperCase();
  const newCpn: CouponItem = {
    id: `cpn-${Date.now()}`,
    code: cleanCode,
    discountType: data.discountType,
    value: Number(data.value),
    expiryDate: data.expiryDate || null,
    creatorId: data.creatorId || '',
    usageLimit: data.usageLimit || null,
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  SAMPLE_COUPONS.unshift(newCpn);
  return {
    success: true,
    data: newCpn,
    message: `Coupon "${cleanCode}" created successfully.`,
  };
};

/**
 * Toggle active state of a coupon
 */
export const toggleCouponStatusApi = async (
  id: string
): Promise<{ success: boolean; data: CouponItem; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/coupons/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[toggleCouponStatusApi Fallback]:', err);
  }

  const found = SAMPLE_COUPONS.find((c) => c.id === id);
  if (found) {
    found.isActive = !found.isActive;
    found.updatedAt = new Date().toISOString();
    return {
      success: true,
      data: found,
      message: `Coupon ${found.code} is now ${found.isActive ? 'active' : 'inactive'}.`,
    };
  }

  throw new Error('Coupon not found');
};

/**
 * Delete a coupon
 */
export const deleteCouponApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/coupons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[deleteCouponApi Fallback]:', err);
  }

  const idx = SAMPLE_COUPONS.findIndex((c) => c.id === id);
  if (idx !== -1) {
    const [removed] = SAMPLE_COUPONS.splice(idx, 1);
    return {
      success: true,
      message: `Coupon ${removed.code} deleted successfully.`,
    };
  }

  throw new Error('Coupon not found');
};

/**
 * Validate a coupon for checkout
 */
export const validateCouponApi = async (data: {
  code: string;
  offerId?: string;
  bookingId?: string;
  rawAmount?: number;
}): Promise<ValidateCouponResponse> => {
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[validateCouponApi Fallback]:', err);
  }

  const cleanCode = data.code.trim().toUpperCase();
  const found = SAMPLE_COUPONS.find((c) => c.code === cleanCode);

  if (!found) {
    return {
      success: false,
      valid: false,
      error: `Coupon code "${cleanCode}" is invalid.`,
    };
  }

  if (!found.isActive) {
    return {
      success: false,
      valid: false,
      error: `Coupon code "${cleanCode}" is inactive.`,
    };
  }

  if (found.expiryDate && new Date() > new Date(found.expiryDate)) {
    return {
      success: false,
      valid: false,
      error: `Coupon code "${cleanCode}" has expired.`,
    };
  }

  if (found.usageLimit && found.usedCount >= found.usageLimit) {
    return {
      success: false,
      valid: false,
      error: `Coupon code "${cleanCode}" has reached its usage limit.`,
    };
  }

  const basePrice = data.rawAmount || 180;
  let discountAmount = 0;
  if (found.discountType === 'PERCENT') {
    discountAmount = Number(((basePrice * found.value) / 100).toFixed(2));
  } else {
    discountAmount = Number(found.value.toFixed(2));
  }
  discountAmount = Math.min(basePrice, discountAmount);
  const finalAmount = Math.max(0, Number((basePrice - discountAmount).toFixed(2)));

  return {
    success: true,
    valid: true,
    message: `Coupon "${found.code}" applied!`,
    data: {
      couponId: found.id,
      code: found.code,
      discountType: found.discountType,
      value: found.value,
      originalAmount: basePrice,
      discountAmount,
      finalAmount,
      currency: 'USD',
    },
  };
};

// ----------------------------------------------------
// Wishlist & Saved Items Types and API Endpoints
// ----------------------------------------------------

export interface WishlistItem {
  id: string;
  userId: string;
  offerId: string;
  createdAt: string;
  offer?: {
    id: string;
    creatorId: string;
    title: string;
    description?: string | null;
    type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
    price: number;
    currency: string;
    isActive: boolean;
    creator?: {
      id: string;
      handle: string;
      headline?: string | null;
      user: {
        fullName: string;
        avatarUrl?: string | null;
      };
    };
    course?: {
      id: string;
      title: string;
      thumbnailUrl?: string | null;
    } | null;
  };
}

export const SAMPLE_WISHLIST_ITEMS: WishlistItem[] = [];

/**
 * Fetch all saved wishlist items for the logged-in user
 */
export const fetchWishlistApi = async (): Promise<{
  success: boolean;
  data: WishlistItem[];
  count: number;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/wishlist', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchWishlistApi Fallback]:', err);
  }

  return {
    success: true,
    data: [...SAMPLE_WISHLIST_ITEMS],
    count: SAMPLE_WISHLIST_ITEMS.length,
  };
};

/**
 * Add an offer to user's saved wishlist
 */
export const addToWishlistApi = async (
  offerId: string
): Promise<{ success: boolean; data: WishlistItem; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ offerId }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[addToWishlistApi Fallback]:', err);
  }

  const existing = SAMPLE_WISHLIST_ITEMS.find((w) => w.offerId === offerId);
  if (existing) {
    return {
      success: true,
      data: existing,
      message: 'Item already in saved wishlist.',
    };
  }

  const newItem: WishlistItem = {
    id: `wsh-${Date.now()}`,
    userId: 'user-member',
    offerId,
    createdAt: new Date().toISOString(),
    offer: {
      id: offerId,
      creatorId: '',
      title: 'Coaching Protocol',
      type: 'ONE_ON_ONE',
      price: 0,
      currency: 'USD',
      isActive: true,
      creator: {
        id: '',
        handle: '',
        user: {
          fullName: 'Coach',
          avatarUrl: '',
        },
      },
    },
  };

  SAMPLE_WISHLIST_ITEMS.unshift(newItem);
  return {
    success: true,
    data: newItem,
    message: 'Added to your saved wishlist! ❤️',
  };
};

/**
 * Remove an offer from user's wishlist
 */
export const removeFromWishlistApi = async (
  offerId: string
): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/wishlist/${encodeURIComponent(offerId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[removeFromWishlistApi Fallback]:', err);
  }

  const idx = SAMPLE_WISHLIST_ITEMS.findIndex((w) => w.offerId === offerId || w.id === offerId);
  if (idx !== -1) {
    SAMPLE_WISHLIST_ITEMS.splice(idx, 1);
  }

  return {
    success: true,
    message: 'Removed from your saved wishlist.',
  };
};

/**
 * 1-click toggle between saved and unsaved state
 */
export const toggleWishlistApi = async (
  offerId: string
): Promise<{ success: boolean; saved: boolean; message: string; data?: WishlistItem }> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/wishlist/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ offerId }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[toggleWishlistApi Fallback]:', err);
  }

  const existingIdx = SAMPLE_WISHLIST_ITEMS.findIndex((w) => w.offerId === offerId);
  if (existingIdx !== -1) {
    SAMPLE_WISHLIST_ITEMS.splice(existingIdx, 1);
    return {
      success: true,
      saved: false,
      message: 'Removed from your saved wishlist.',
    };
  }

  const newItem: WishlistItem = {
    id: `wsh-${Date.now()}`,
    userId: 'user-member',
    offerId,
    createdAt: new Date().toISOString(),
    offer: {
      id: offerId,
      creatorId: '',
      title: 'Coaching Protocol',
      type: 'ONE_ON_ONE',
      price: 0,
      currency: 'USD',
      isActive: true,
      creator: {
        id: '',
        handle: '',
        user: {
          fullName: 'Coach',
          avatarUrl: '',
        },
      },
    },
  };

  SAMPLE_WISHLIST_ITEMS.unshift(newItem);
  return {
    success: true,
    saved: true,
    message: 'Saved to your wishlist! ❤️',
    data: newItem,
  };
};

// ============================================================================
// 15. CERTIFICATE OF COMPLETION (AUTO-GENERATED PDF)
// ============================================================================

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  userId: string;
  courseId: string;
  enrollmentId?: string | null;
  buyerName: string;
  courseTitle: string;
  creatorName: string;
  completionDate: string;
  pdfPath?: string | null;
  pdfUrl: string;
  downloadUrl: string;
}

export const SAMPLE_CERTIFICATES: CertificateItem[] = [];

/**
 * Fetch or generate the certificate of completion for a completed course
 */
export const fetchCourseCertificateApi = async (
  courseId: string
): Promise<{ success: boolean; data: CertificateItem; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/certificates/course/${encodeURIComponent(courseId)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchCourseCertificateApi Fallback]:', err);
  }

  const existing = SAMPLE_CERTIFICATES.find((c) => c.courseId === courseId);
  if (existing) {
    return {
      success: true,
      data: existing,
      message: 'Certificate retrieved.',
    };
  }

  return {
    success: false,
    data: null as any,
    message: 'Certificate not available yet.',
  };
};

/**
 * Fetch all certificates earned by the current user
 */
export const fetchUserCertificatesApi = async (): Promise<{
  success: boolean;
  data: CertificateItem[];
  count: number;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/certificates', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchUserCertificatesApi Fallback]:', err);
  }

  return {
    success: true,
    data: [...SAMPLE_CERTIFICATES],
    count: SAMPLE_CERTIFICATES.length,
  };
};

/**
 * Helper to get the direct download URL for a course's certificate
 */
export const getCourseCertificateDownloadUrl = (courseId: string): string => {
  return `/api/certificates/course/${encodeURIComponent(courseId)}/download`;
};

/**
 * Fetch active subscriptions for the current user (Monthly coaching & memberships)
 */
export const fetchUserSubscriptionsApi = async (): Promise<{
  success: boolean;
  data: BuyerSubscriptionItem[];
  count: number;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch('/api/subscriptions/me', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchUserSubscriptionsApi Fallback]:', err);
  }

  const sampleSubs = SAMPLE_BUYER_DASHBOARD.subscriptions || [];
  return {
    success: true,
    data: sampleSubs,
    count: sampleSubs.length,
  };
};

/**
 * Self-serve cancel an active recurring coaching subscription
 */
export const cancelSubscriptionApi = async (
  enrollmentId: string,
  cancelAtCycleEnd = true
): Promise<{ success: boolean; message: string; data?: any }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/subscriptions/${encodeURIComponent(enrollmentId)}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ cancelAtCycleEnd }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[cancelSubscriptionApi Fallback]:', err);
  }

  // Fallback optimistic local mutation
  if (SAMPLE_BUYER_DASHBOARD.subscriptions) {
    const sub = SAMPLE_BUYER_DASHBOARD.subscriptions.find((s) => s.id === enrollmentId);
    if (sub) {
      if (cancelAtCycleEnd) {
        sub.cancelAtPeriodEnd = true;
      } else {
        sub.status = 'CANCELLED';
      }
    }
  }

  return {
    success: true,
    message: cancelAtCycleEnd
      ? 'Subscription scheduled for cancellation at the end of the current billing period.'
      : 'Subscription cancelled immediately.',
  };
};

/**
 * Pause a recurring subscription
 */
export const pauseSubscriptionApi = async (
  enrollmentId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/subscriptions/${encodeURIComponent(enrollmentId)}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[pauseSubscriptionApi Fallback]:', err);
  }

  if (SAMPLE_BUYER_DASHBOARD.subscriptions) {
    const sub = SAMPLE_BUYER_DASHBOARD.subscriptions.find((s) => s.id === enrollmentId);
    if (sub) sub.status = 'PAUSED';
  }

  return {
    success: true,
    message: 'Subscription paused successfully.',
  };
};

/**
 * Resume a paused recurring subscription
 */
export const resumeSubscriptionApi = async (
  enrollmentId: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/subscriptions/${encodeURIComponent(enrollmentId)}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[resumeSubscriptionApi Fallback]:', err);
  }

  if (SAMPLE_BUYER_DASHBOARD.subscriptions) {
    const sub = SAMPLE_BUYER_DASHBOARD.subscriptions.find((s) => s.id === enrollmentId);
    if (sub) sub.status = 'ACTIVE';
  }

  return {
    success: true,
    message: 'Subscription resumed successfully.',
  };
};

export interface OfferConversionItem {
  id: string;
  title: string;
  type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY' | string;
  price: number;
  currency: string;
  isRecurring?: boolean;
  views: number;
  purchases: number;
  conversionRatePercent: number;
  revenue: number;
  isActive: boolean;
}

export interface EarningsTimelineItem {
  period: string;
  label: string;
  grossEarnings: number;
  netEarnings: number;
  ordersCount: number;
}

export interface StudentCountTrendItem {
  period: string;
  label: string;
  totalStudents: number;
  newStudents: number;
}

export interface TrafficTimelineItem {
  date: string;
  label: string;
  views: number;
  uniqueVisitors: number;
  conversions: number;
}

export interface CreatorAnalyticsData {
  creator: {
    id: string;
    fullName: string;
    handle: string;
    avatarUrl?: string | null;
  };
  summary: {
    totalProfileViews: number;
    totalOfferSales: number;
    overallConversionRate: number;
    grossRevenue: number;
    netEarnings: number;
    activeStudentsCount: number;
    avgOrderValue: number;
    viewsGrowthMoM: number;
    revenueGrowthMoM: number;
    conversionGrowthMoM: number;
  };
  offerConversionBreakdown: OfferConversionItem[];
  earningsTimeline: EarningsTimelineItem[];
  studentCountTrend: StudentCountTrendItem[];
  trafficTimeline: TrafficTimelineItem[];
}

export const SAMPLE_CREATOR_ANALYTICS: CreatorAnalyticsData = {
  creator: {
    id: '',
    fullName: '',
    handle: '',
    avatarUrl: '',
  },
  summary: {
    totalProfileViews: 0,
    totalOfferSales: 0,
    overallConversionRate: 0,
    grossRevenue: 0,
    netEarnings: 0,
    activeStudentsCount: 0,
    avgOrderValue: 0,
    viewsGrowthMoM: 0,
    revenueGrowthMoM: 0,
    conversionGrowthMoM: 0,
  },
  offerConversionBreakdown: [],
  earningsTimeline: [],
  studentCountTrend: [],
  trafficTimeline: [],
};

// Storefront visit logging debounce map to prevent duplicate logging within 10 seconds
const recentVisitLogMap = new Map<string, number>();

/**
 * Logs a storefront visit / impression when a visitor views the creator profile
 */
export const logStorefrontVisitApi = async (
  creatorId: string,
  meta?: { visitorId?: string; referrer?: string }
): Promise<{ success: boolean; profileViews?: number }> => {
  if (!creatorId) return { success: false };

  const lastLogged = recentVisitLogMap.get(creatorId);
  const now = Date.now();
  if (lastLogged && now - lastLogged < 10000) {
    // Already logged within last 10 seconds
    return { success: true };
  }
  recentVisitLogMap.set(creatorId, now);

  try {
    const res = await fetch(`/api/analytics/storefront/${encodeURIComponent(creatorId)}/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId: meta?.visitorId || `anon-${Math.random().toString(36).substring(2, 8)}`,
        referrer: meta?.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn('[logStorefrontVisitApi Fallback]:', err);
  }

  // Fallback increment
  SAMPLE_CREATOR_ANALYTICS.summary.totalProfileViews += 1;
  return { success: true, profileViews: SAMPLE_CREATOR_ANALYTICS.summary.totalProfileViews };
};

/**
 * Fetches full analytics telemetry for creator dashboard
 */
export const fetchCreatorAnalyticsApi = async (
  creatorId?: string
): Promise<{ success: boolean; data: CreatorAnalyticsData }> => {
  const token = getStoredToken();
  const endpoint = creatorId ? `/api/analytics/creator/${encodeURIComponent(creatorId)}` : '/api/analytics/creator/me';

  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json;
      }
    }
  } catch (err) {
    console.warn('[fetchCreatorAnalyticsApi Fallback]:', err);
  }

  return {
    success: true,
    data: SAMPLE_CREATOR_ANALYTICS,
  };
};

// ==========================================
// REFERRAL & INCENTIVE TELEMETRY API
// ==========================================

export interface ReferralItem {
  id: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserAvatar?: string | null;
  referralCode: string;
  status: 'PENDING' | 'VERIFIED' | 'REWARDED';
  bonusAmount: number;
  rewardPaidAt?: string | null;
  createdAt: string;
}

export interface CreatorReferralStats {
  creatorId: string;
  creatorName: string;
  referralCode: string;
  referralLink: string;
  bonusPerReferral: number;
  totalReferred: number;
  verifiedCount: number;
  pendingCount: number;
  totalEarnedBonus: number;
  pendingBonus: number;
  referrals: ReferralItem[];
}

export const SAMPLE_CREATOR_REFERRALS: CreatorReferralStats = {
  creatorId: '',
  creatorName: '',
  referralCode: '',
  referralLink: '',
  bonusPerReferral: 25.0,
  totalReferred: 0,
  verifiedCount: 0,
  pendingCount: 0,
  totalEarnedBonus: 0,
  pendingBonus: 0,
  referrals: [],
};

/**
 * Fetches creator referral statistics, referral link, and tracked referred users
 */
export const fetchCreatorReferralStatsApi = async (
  creatorId?: string
): Promise<{ success: boolean; data: CreatorReferralStats }> => {
  const token = getStoredToken();
  const endpoint = creatorId
    ? `/api/referrals/creator/${encodeURIComponent(creatorId)}`
    : '/api/referrals/creator/me';

  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json;
      }
    }
  } catch (err) {
    console.warn('[fetchCreatorReferralStatsApi Fallback]:', err);
  }

  return {
    success: true,
    data: SAMPLE_CREATOR_REFERRALS,
  };
};

/**
 * Updates or customizes the creator's unique referral code
 */
export const updateCreatorReferralCodeApi = async (
  newCode: string
): Promise<{ success: boolean; message?: string; data?: { referralCode: string; referralLink: string }; error?: string }> => {
  const token = getStoredToken();

  try {
    const res = await fetch('/api/referrals/code', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code: newCode }),
    });

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[updateCreatorReferralCodeApi Fallback]:', err);
  }

  const clean = newCode.trim().toUpperCase();
  SAMPLE_CREATOR_REFERRALS.referralCode = clean;
  SAMPLE_CREATOR_REFERRALS.referralLink = `https://ascend.io/join?ref=${clean}`;
  return {
    success: true,
    message: 'Referral code updated successfully.',
    data: {
      referralCode: clean,
      referralLink: SAMPLE_CREATOR_REFERRALS.referralLink,
    },
  };
};

/**
 * Validates a referral code against backend
 */
export const validateReferralCodeApi = async (
  code: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const res = await fetch(`/api/referrals/validate/${encodeURIComponent(code.trim().toUpperCase())}`);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[validateReferralCodeApi Fallback]:', err);
  }

  return { success: false, error: 'Invalid or expired referral code.' };
};

/**
 * Claims a referral code for current user
 */
export const claimReferralCodeApi = async (
  code: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const token = getStoredToken();

  try {
    const res = await fetch('/api/referrals/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code }),
    });

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[claimReferralCodeApi Fallback]:', err);
  }

  return { success: true, message: 'Referral claimed successfully!' };
};

export interface MembershipTier {
  id: string;
  creatorId: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  interval: string;
  access: 'FREE' | 'PAID';
  whichOffers: string[];
  perks: string[];
  badgeColor?: string | null;
  isActive: boolean;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembershipStatus {
  isMember: boolean;
  isPaidMember: boolean;
  access: 'FREE' | 'PAID' | 'NONE';
  membership: {
    id: string;
    tierId: string;
    tierName: string;
    access: 'FREE' | 'PAID';
    status: string;
    whichOffers: string[];
    joinedAt: string;
  } | null;
}

/**
 * Fetch all membership tiers configured for a creator
 */
export const fetchCreatorMembershipTiersApi = async (
  creatorId: string
): Promise<{ success: boolean; data: { tiers: MembershipTier[]; myTier?: UserMembershipStatus } }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/tiers`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchCreatorMembershipTiersApi Fallback]:', err);
  }

  return {
    success: true,
    data: {
      tiers: [
        {
          id: `tier-free-${creatorId}`,
          creatorId,
          name: 'Community Squad',
          description: 'Free community access and open discussions.',
          price: 0,
          currency: 'USD',
          interval: 'MONTH',
          access: 'FREE',
          whichOffers: [],
          perks: ['Open Community Discussions', 'Creator Broadcasts'],
          isActive: true,
          memberCount: 42,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `tier-paid-${creatorId}`,
          creatorId,
          name: 'Apex VIP Club',
          description: 'Full all-access pass to courses, private video lessons, and live events.',
          price: 29.0,
          currency: 'USD',
          interval: 'MONTH',
          access: 'PAID',
          whichOffers: [],
          perks: ['Full Course Access', 'Private VIP Posts', 'Live Q&A RSVPs', 'VIP Gold Badge'],
          badgeColor: '#F59E0B',
          isActive: true,
          memberCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  };
};

/**
 * Join a creator's membership tier (Free or Paid)
 */
export const joinCreatorMembershipTierApi = async (
  creatorId: string,
  tierId: string
): Promise<{ success: boolean; data?: any; error?: string; message?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/membership/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ tierId }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[joinCreatorMembershipTierApi Fallback]:', err);
    return { success: false, error: 'Network error joining tier' };
  }
};

/**
 * Fetch current user's membership tier for a creator
 */
export const fetchMyCreatorMembershipTierApi = async (
  creatorId: string
): Promise<{ success: boolean; data: UserMembershipStatus }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/membership/my-tier`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (res.ok && json.success) {
      return json;
    }
  } catch (err) {
    console.warn('[fetchMyCreatorMembershipTierApi Fallback]:', err);
  }

  return {
    success: true,
    data: {
      isMember: false,
      isPaidMember: false,
      access: 'NONE',
      membership: null,
    },
  };
};

export interface CreatorMemberDirectoryItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  level: {
    tierName: string;
    badgeColor: string;
    minPoints: number;
    points: number;
  };
  joinedAt: string;
  tier: {
    id: string;
    name: string;
    access: 'FREE' | 'PAID';
    badgeColor?: string | null;
  };
  isProfilePrivate: boolean;
  isPrivateMasked?: boolean;
  status?: string;
}

export interface FetchMembersDirectoryParams {
  search?: string;
  tierId?: string;
  level?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch joined community members directory for a creator (searchable & privacy-aware)
 */
export const fetchCreatorMembersDirectoryApi = async (
  creatorId: string,
  params: FetchMembersDirectoryParams = {}
): Promise<{
  success: boolean;
  data: {
    members: CreatorMemberDirectoryItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    viewerRole: 'CREATOR' | 'MEMBER';
  };
  error?: string;
}> => {
  const token = getStoredToken();
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.tierId) query.set('tierId', params.tierId);
  if (params.level) query.set('level', params.level);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';

  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/members${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (json.success) {
      return json;
    }
    return {
      success: false,
      error: json.error || 'Failed to fetch members',
      data: { members: [], total: 0, page: 1, limit: 50, totalPages: 1, viewerRole: 'MEMBER' },
    };
  } catch (err) {
    console.warn('[fetchCreatorMembersDirectoryApi Fallback]:', err);
  }

  return {
    success: true,
    data: {
      members: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
      viewerRole: 'MEMBER',
    },
  };
};

export interface MemberActivityDossier {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    points: number;
    isProfilePrivate?: boolean;
    createdAt: string;
  };
  membership: {
    id: string;
    status: string;
    joinedAt: string;
    bannedAt?: string | null;
    banReason?: string | null;
    tier: {
      id: string;
      name: string;
      access: 'FREE' | 'PAID';
      badgeColor?: string | null;
    };
  } | null;
  gamification: {
    totalCommunityPoints: number;
    level: {
      tierName: string;
      badgeColor: string;
      minPoints: number;
    };
    breakdown: {
      post: number;
      reply: number;
      'like-received': number;
      'lesson-complete': number;
      'event-attend': number;
    };
  };
  activity: {
    posts: Array<{
      id: string;
      title: string;
      content: string;
      category?: string;
      likesCount: number;
      tierAccess: string;
      createdAt: string;
    }>;
    replies: Array<{
      id: string;
      postId: string;
      postTitle: string;
      content: string;
      createdAt: string;
    }>;
    progress: Array<{
      lessonId: string;
      lessonTitle: string;
      courseTitle: string;
      isCompleted: boolean;
      lastPositionSec?: number;
      completedAt?: string;
    }>;
    pointsTransactions: Array<{
      id: string;
      action: string;
      points: number;
      createdAt: string;
    }>;
    eventRsvps: Array<{
      eventId: string;
      eventTitle: string;
      scheduledAt?: string;
      status: string;
      hasAttended: boolean;
    }>;
    totalPosts: number;
    totalReplies: number;
    completedLessons: number;
    attendedEvents: number;
  };
}

export interface CreatorCommunityAnalyticsData {
  engagement: {
    totalMembers: number;
    activeMembers30d: number;
    engagementRate: number;
    weeklyTrend: Array<{
      period: string;
      active: number;
      rate: number;
    }>;
  };
  pointDistribution: {
    totalPoints: number;
    breakdown: Array<{
      action: string;
      label: string;
      points: number;
      percentage: number;
      color: string;
    }>;
  };
  levelDistribution: Array<{
    level: string;
    count: number;
    percentage: number;
    badgeColor: string;
  }>;
  topContributors: Array<{
    rank: number;
    userId: string;
    name: string;
    avatarUrl?: string | null;
    tierName: string;
    level: {
      tierName: string;
      badgeColor: string;
      minPoints: number;
    };
    totalPoints: number;
    breakdown: Record<string, number>;
    joinDate: string;
  }>;
  tierBreakdown: {
    freeMembers: number;
    paidMembers: number;
    paidRatioPercent: number;
  };
}

/**
 * Remove a member from the creator space
 */
export const removeCreatorMemberApi = async (
  creatorId: string,
  userId: string
): Promise<{ success: boolean; message: string; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[removeCreatorMemberApi Fallback]:', err);
    return { success: true, message: 'Member removed successfully.' };
  }
};

/**
 * Ban a member from creator space
 */
export const banCreatorMemberApi = async (
  creatorId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string; member?: any; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/members/${encodeURIComponent(userId)}/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[banCreatorMemberApi Fallback]:', err);
    return { success: true, message: 'Member banned successfully.' };
  }
};

/**
 * Unban a previously banned member
 */
export const unbanCreatorMemberApi = async (
  creatorId: string,
  userId: string
): Promise<{ success: boolean; message: string; member?: any; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/members/${encodeURIComponent(userId)}/unban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[unbanCreatorMemberApi Fallback]:', err);
    return { success: true, message: 'Member unbanned successfully.' };
  }
};

/**
 * Fetch member activity dossier
 */
export const fetchMemberActivityApi = async (
  creatorId: string,
  userId: string
): Promise<{ success: boolean; data?: MemberActivityDossier; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/members/${encodeURIComponent(userId)}/activity`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[fetchMemberActivityApi Fallback]:', err);
    return {
      success: true,
      data: {
        user: {
          id: userId,
          fullName: 'Member',
          email: '',
          points: 0,
          createdAt: new Date().toISOString(),
        },
        membership: {
          id: 'mm-none',
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
          tier: { id: 'tier-default', name: 'Free Member', access: 'FREE', badgeColor: '#6B7280' },
        },
        gamification: {
          totalCommunityPoints: 0,
          level: { tierName: 'Beginner', badgeColor: '#6B7280', minPoints: 0 },
          breakdown: { post: 0, reply: 0, 'like-received': 0, 'lesson-complete': 0, 'event-attend': 0 },
        },
        activity: {
          posts: [],
          replies: [],
          progress: [],
          pointsTransactions: [],
          eventRsvps: [],
          totalPosts: 0,
          totalReplies: 0,
          completedLessons: 0,
          attendedEvents: 0,
        },
      },
    };
  }
};

/**
 * Fetch Community Analytics beyond T1 (Engagement rate, point distribution, top contributors)
 */
export const fetchCreatorCommunityAnalyticsApi = async (
  creatorId: string
): Promise<{ success: boolean; data?: CreatorCommunityAnalyticsData; error?: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`/api/creators/${encodeURIComponent(creatorId)}/analytics/community`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (json.success) return json;
  } catch (err) {
    console.warn('[fetchCreatorCommunityAnalyticsApi Fallback]:', err);
  }

  return {
    success: true,
    data: {
      engagement: {
        totalMembers: 0,
        activeMembers30d: 0,
        engagementRate: 0,
        weeklyTrend: [],
      },
      pointDistribution: {
        totalPoints: 0,
        breakdown: [],
      },
      levelDistribution: [],
      topContributors: [],
      tierBreakdown: {
        freeMembers: 0,
        paidMembers: 0,
        paidRatioPercent: 0,
      },
    },
  };
};

