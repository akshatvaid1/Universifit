import { hashPasswordSync } from './jwt.js';

export interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
  role: 'BUYER' | 'CREATOR' | 'ADMIN';
  points: number;
  isProfilePrivate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryCreatorProfile {
  id: string;
  userId: string;
  handle: string;
  headline?: string;
  bio?: string;
  specialtyTags: string[];
  credentials: string[];
  verificationDocs: string[];
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    discord?: string;
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: Date;
  agreementAccepted: boolean;
  agreementAcceptedAt?: Date;
  rating: number;
  totalClients: number;
  profileViews?: number;
  referralCode?: string;
  referralBonus?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryReferral {
  id: string;
  creatorId: string;
  referredUserId: string;
  referralCode: string;
  status: 'PENDING' | 'VERIFIED' | 'REWARDED';
  bonusAmount: number;
  rewardPaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PointsAction = 'post' | 'reply' | 'like-received' | 'lesson-complete' | 'event-attend';

export interface MemoryPointsRule {
  id: string;
  creatorId: string | null; // null = global default rule
  action: PointsAction;
  points: number;
  isActive: boolean;
}

export interface MemoryUserLevel {
  id: string;
  creatorId: string | null; // null = global default tier
  tierName: string;        // e.g. 'Beginner', 'Consistent', 'Elite'
  minPoints: number;
  badgeColor: string;      // hex color for UI badge
}

export interface MemoryPointsTransaction {
  id: string;
  userId: string;
  creatorId: string;       // community this transaction belongs to
  action: PointsAction;
  points: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface MemoryOffer {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY';
  price: any;
  currency: string;
  isRecurring?: boolean;
  billingInterval?: string;
  razorpayPlanId?: string;
  viewCount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryStorefrontVisit {
  id: string;
  creatorId: string;
  visitorId?: string;
  referrer?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface MemoryCourse {
  id: string;
  creatorId: string;
  offerId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryLesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationSeconds: number;
  order: number;
  dripDays: number;
  dripDate?: Date;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Date;
  lastWatchedSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryBooking {
  id: string;
  userId: string;
  creatorId: string;
  offerId?: string;
  availabilityId?: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  meetingUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryEnrollment {
  id: string;
  userId: string;
  offerId: string;
  courseId?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  isRecurring?: boolean;
  billingInterval?: string;
  razorpaySubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date;
  enrolledAt: Date;
  updatedAt: Date;
}

export interface MemoryCommunityPost {
  id: string;
  creatorId?: string;
  authorId: string;
  title: string;
  content: string;
  category?: string;
  likesCount: number;
  tierAccess?: 'FREE' | 'PAID';
  isPinned?: boolean;
  pinnedAt?: Date;
  isReported?: boolean;
  reportReason?: string;
  reportCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryPostReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryPostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface MemoryPayment {
  id: string;
  userId: string;
  offerId?: string;
  bookingId?: string;
  couponId?: string;
  discountAmount?: any;
  amount: any;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemorySupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  category: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  enrollmentId?: string;
  bookingId?: string;
  adminResponse?: string;
  respondedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryCoupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  value: any;
  expiryDate?: Date;
  creatorId: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryWishlistItem {
  id: string;
  userId: string;
  offerId: string;
  createdAt: Date;
}

export interface MemoryCertificate {
  id: string;
  certificateNumber: string;
  userId: string;
  courseId: string;
  enrollmentId?: string;
  buyerName: string;
  courseTitle: string;
  creatorName: string;
  completionDate: Date;
  pdfPath?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EventStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type RSVPStatus = 'GOING' | 'NOT_GOING' | 'WAITLISTED';
export type TierAccess = 'FREE' | 'PAID';

export interface MemoryMembershipTier {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  access: TierAccess;
  includedOfferIds: string[];   // offer IDs this tier grants access to
  isDefault: boolean;           // true = auto-join, free tier
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryMembershipMember {
  id: string;
  userId: string;
  creatorId: string;
  tierId: string;
  status?: 'ACTIVE' | 'BANNED' | 'CANCELLED';
  bannedAt?: Date;
  banReason?: string;
  joinedAt: Date;
  updatedAt: Date;
}

export interface MemoryEvent {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  capacity?: number;
  isRecurring: boolean;
  recurrenceRule?: string;
  meetingUrl?: string;
  meetingCode?: string;
  conferenceId?: string;
  calendarEventId?: string;
  eventOfferId?: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryEventRSVP {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  hasAttended: boolean;
  attendedAt?: Date;
  joinToken: string;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryStore {
  users: MemoryUser[] = [];
  creatorProfiles: MemoryCreatorProfile[] = [];
  offers: MemoryOffer[] = [];
  courses: MemoryCourse[] = [];
  lessons: MemoryLesson[] = [];
  lessonProgress: MemoryLessonProgress[] = [];
  bookings: MemoryBooking[] = [];
  enrollments: MemoryEnrollment[] = [];
  communityPosts: MemoryCommunityPost[] = [];
  postReplies: MemoryPostReply[] = [];
  postLikes: MemoryPostLike[] = [];
  payments: MemoryPayment[] = [];
  supportTickets: MemorySupportTicket[] = [];
  coupons: MemoryCoupon[] = [];
  wishlistItems: MemoryWishlistItem[] = [];
  certificates: MemoryCertificate[] = [];
  storefrontVisits: MemoryStorefrontVisit[] = [];
  referrals: MemoryReferral[] = [];
  pointsRules: MemoryPointsRule[] = [];
  userLevels: MemoryUserLevel[] = [];
  pointsTransactions: MemoryPointsTransaction[] = [];
  events: MemoryEvent[] = [];
  eventRsvps: MemoryEventRSVP[] = [];
  membershipTiers: MemoryMembershipTier[] = [];
  membershipMembers: MemoryMembershipMember[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    const adminPasswordHash = hashPasswordSync('admin123');

    // Only maintain platform administrator account for verification audits
    const uAdmin: MemoryUser = {
      id: 'user-admin',
      email: 'admin@ascend.io',
      passwordHash: adminPasswordHash,
      fullName: 'Ascend Platform Admin',
      role: 'ADMIN',
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Real Production Creator: Chadtag
    const chadtagPasswordHash = hashPasswordSync('chadtag123');
    const uChadtag: MemoryUser = {
      id: 'user-chadtag',
      email: 'chadtag@ascend.io',
      passwordHash: chadtagPasswordHash,
      fullName: 'Chadtag',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      role: 'CREATOR',
      points: 0,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
    };

    const cpChadtag: MemoryCreatorProfile = {
      id: 'creator-chadtag',
      userId: 'user-chadtag',
      handle: 'chadtag',
      headline: "Men's Self-Improvement & Aesthetics Coach",
      bio: "A men's self-improvement and aesthetics coach covering facial aesthetics, diet, physique training, and confidence/mindset.",
      specialtyTags: ['looksmaxxing', 'grooming', 'physique', 'confidence-building'],
      credentials: [
        'Facial Aesthetics & Structure Consultant',
        'Physique & Hypertrophy Coach',
        'Mindset & Confidence Specialist',
      ],
      verificationDocs: [
        'https://youtube.com/@chadtag',
        'https://instagram.com/chadtagyt',
        'https://discord.gg/aTpvfD2SU',
      ],
      socialLinks: {
        youtube: 'https://youtube.com/@chadtag',
        instagram: 'https://instagram.com/chadtagyt',
        discord: 'https://discord.gg/aTpvfD2SU',
      },
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2026-09-01T00:00:00Z'),
      agreementAccepted: true,
      agreementAcceptedAt: new Date('2026-09-01T00:00:00Z'),
      rating: 5.0,
      totalClients: 0,
      profileViews: 0,
      referralCode: 'CHADTAG',
      referralBonus: 25,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
    };

    // 1:1 Coaching Call Offer (Price placeholder, marked draft pending his input on pricing/availability)
    const offChadtag1on1: MemoryOffer = {
      id: 'offer-chadtag-1on1',
      creatorId: 'creator-chadtag',
      title: '1:1 Coaching Call',
      description: 'Private 1-on-1 consultation session covering facial aesthetics assessment, customized nutrition framework, physique roadmap, and confidence building.',
      type: 'ONE_ON_ONE',
      price: 150, // placeholder
      currency: 'USD',
      isActive: false, // draft pending creator pricing & availability
      viewCount: 0,
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
    };

    // Course "ChadMax" (Status "draft" until Chadtag uploads real videos and publishes it himself via Course Studio M1)
    const courseChadMax: MemoryCourse = {
      id: 'course-chadmax',
      creatorId: 'creator-chadtag',
      title: 'ChadMax',
      description: "A men's self-improvement and aesthetics protocol covering facial aesthetics, diet, physique training, height & posture optimization, and confidence & aura building.",
      thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
      isPublished: false, // draft
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-01T00:00:00Z'),
    };

    // 5 modules as structured lessons (curriculum loaded)
    const lessonsChadMax: MemoryLesson[] = [
      {
        id: 'lesson-chadmax-1',
        courseId: 'course-chadmax',
        title: 'Facial Aesthetics & Structure',
        description: 'Master cranial posture, tongue resting mechanics, and jawline definition protocols for structural symmetry.',
        videoUrl: '',
        durationSeconds: 0,
        order: 1,
        dripDays: 0,
        isPreview: false,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-01T00:00:00Z'),
      },
      {
        id: 'lesson-chadmax-2',
        courseId: 'course-chadmax',
        title: 'Diet & Nutrition Framework',
        description: 'Structured micronutrient timing, clean bulking ratios, and hydration frameworks for muscular density.',
        videoUrl: '',
        durationSeconds: 0,
        order: 2,
        dripDays: 0,
        isPreview: false,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-01T00:00:00Z'),
      },
      {
        id: 'lesson-chadmax-3',
        courseId: 'course-chadmax',
        title: 'Physique & Muscle Building',
        description: 'Progressive overload blueprints targeting clavicle width, upper chest fullness, and V-taper taper ratios.',
        videoUrl: '',
        durationSeconds: 0,
        order: 3,
        dripDays: 0,
        isPreview: false,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-01T00:00:00Z'),
      },
      {
        id: 'lesson-chadmax-4',
        courseId: 'course-chadmax',
        title: 'Height & Posture Optimization',
        description: 'Decompression routines, anterior pelvic tilt correction, and spinal hygiene for optimal natural stature.',
        videoUrl: '',
        durationSeconds: 0,
        order: 4,
        dripDays: 0,
        isPreview: false,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-01T00:00:00Z'),
      },
      {
        id: 'lesson-chadmax-5',
        courseId: 'course-chadmax',
        title: 'Confidence & Aura Building',
        description: 'Gaze stability, vocal resonance, nonverbal poise, and psychological grounding for calm social dominance.',
        videoUrl: '',
        durationSeconds: 0,
        order: 5,
        dripDays: 0,
        isPreview: false,
        createdAt: new Date('2026-09-01T00:00:00Z'),
        updatedAt: new Date('2026-09-01T00:00:00Z'),
      },
    ];

    this.users = [uAdmin, uChadtag];
    this.creatorProfiles = [cpChadtag];
    this.offers = [offChadtag1on1];
    this.courses = [courseChadMax];
    this.lessons = lessonsChadMax;
    this.lessonProgress = [];
    this.bookings = [];
    this.enrollments = [];
    this.communityPosts = [];
    this.postReplies = [];
    this.postLikes = [];
    this.payments = [];
    this.supportTickets = [];
    this.coupons = [];
    this.wishlistItems = [];
    this.certificates = [];
    this.storefrontVisits = [];
    this.referrals = [];
    this.pointsRules = [];
    this.userLevels = [];
    this.pointsTransactions = [];
    this.events = [];
    this.eventRsvps = [];
    this.membershipTiers = [];
    this.membershipMembers = [];
  }
}

export const inMemoryStore = new InMemoryStore();

