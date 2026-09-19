import { PrismaClient, Role, VerificationStatus, OfferType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed for Ascend...');

  // Clean existing data in dependency order
  console.log('[Seed] Cleaning legacy records...');
  try {
    await prisma.lessonProgress.deleteMany({});
    await prisma.courseDiscussionReply.deleteMany({});
    await prisma.courseDiscussionPost.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.certificate.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.availability.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.wishlistItem.deleteMany({});
    await prisma.offer.deleteMany({});
    await prisma.postReply.deleteMany({});
    await prisma.postLike.deleteMany({});
    await prisma.communityPost.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.storefrontVisit.deleteMany({});
    await prisma.pointsTransaction.deleteMany({});
    await prisma.eventRSVP.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.membershipMember.deleteMany({});
    await prisma.membershipTier.deleteMany({});
    await prisma.pointsRule.deleteMany({});
    await prisma.userLevel.deleteMany({});
    await prisma.creatorProfile.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('[Seed] Legacy data cleaned.');
  } catch (err: any) {
    console.log('[Seed] Note: DB wipe encountered (database may be empty or offline):', err.message);
  }

  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const chadtagPasswordHash = bcrypt.hashSync('chadtag123', salt);

  // 1. Platform Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ascend.io' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@ascend.io',
      passwordHash: adminPasswordHash,
      fullName: 'Ascend Platform Admin',
      role: Role.ADMIN,
      points: 0,
      isEmailVerified: true,
    },
  });
  console.log('[Seed] Admin user seeded:', adminUser.email);

  // 2. Real Creator: Chadtag
  const chadtagUser = await prisma.user.upsert({
    where: { email: 'chadtag@ascend.io' },
    update: {},
    create: {
      id: 'user-chadtag',
      email: 'chadtag@ascend.io',
      passwordHash: chadtagPasswordHash,
      fullName: 'Chadtag',
      avatarUrl: '/chadtag.png',
      role: Role.CREATOR,
      points: 0,
      isEmailVerified: true,
    },
  });
  console.log('[Seed] Chadtag user seeded:', chadtagUser.email);

  // 3. Creator Profile: Chadtag (Verified, Social Links, Bio, Tags)
  const chadtagProfile = await prisma.creatorProfile.upsert({
    where: { handle: 'chadtag' },
    update: {
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date('2026-09-01T00:00:00Z'),
      agreementAccepted: true,
      agreementAcceptedAt: new Date('2026-09-01T00:00:00Z'),
    },
    create: {
      id: 'creator-chadtag',
      userId: chadtagUser.id,
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
        'https://instagram.com/chadtag',
        'https://discord.gg/chadtag',
      ],
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date('2026-09-01T00:00:00Z'),
      agreementAccepted: true,
      agreementAcceptedAt: new Date('2026-09-01T00:00:00Z'),
      rating: 5.0,
      totalClients: 0,
      referralCode: 'CHADTAG',
      referralBonus: 25.00,
    },
  });
  console.log('[Seed] Chadtag creator profile seeded (VERIFIED):', chadtagProfile.handle);

  // 4. Draft 1:1 Offer (Not auto-published: isActive = false)
  const offer1on1 = await prisma.offer.upsert({
    where: { id: 'offer-chadtag-1on1' },
    update: { isActive: false },
    create: {
      id: 'offer-chadtag-1on1',
      creatorId: chadtagProfile.id,
      title: '1:1 Coaching Call',
      description: 'Private 1-on-1 consultation session covering facial aesthetics assessment, customized nutrition framework, physique roadmap, and confidence building.',
      type: OfferType.ONE_ON_ONE,
      price: 150.00,
      currency: 'USD',
      isActive: false, // DRAFT
    },
  });
  console.log('[Seed] 1:1 draft offer seeded (isActive=false):', offer1on1.id);

  // 5. Draft Course Offer (Not auto-published: isActive = false)
  const offerCourse = await prisma.offer.upsert({
    where: { id: 'offer-chadtag-course' },
    update: { isActive: false },
    create: {
      id: 'offer-chadtag-course',
      creatorId: chadtagProfile.id,
      title: 'ChadMax',
      description: "A men's self-improvement and aesthetics protocol covering facial aesthetics, diet, physique training, height & posture optimization, and confidence & aura building.",
      type: OfferType.COURSE,
      price: 118.00,
      currency: 'USD',
      isActive: false, // DRAFT
    },
  });
  console.log('[Seed] Course draft offer seeded (isActive=false):', offerCourse.id);

  // 6. Draft Course "ChadMax" (Not auto-published: isPublished = false)
  const courseChadMax = await prisma.course.upsert({
    where: { id: 'course-chadmax' },
    update: { isPublished: false, title: 'ChadMax' },
    create: {
      id: 'course-chadmax',
      creatorId: chadtagProfile.id,
      offerId: offerCourse.id,
      title: 'ChadMax',
      description: "A men's self-improvement and aesthetics protocol covering facial aesthetics, diet, physique training, height & posture optimization, and confidence & aura building.",
      thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
      isPublished: false, // DRAFT
    },
  });
  console.log('[Seed] Course seeded in DRAFT status (isPublished=false):', courseChadMax.title);

  // 7. Five Structured Modules
  const modules = [
    {
      id: 'lesson-chadmax-1',
      title: 'Facial Aesthetics',
      description: 'Master cranial posture, tongue resting mechanics, and jawline definition protocols for structural symmetry.',
      order: 1,
    },
    {
      id: 'lesson-chadmax-2',
      title: 'Diet Framework',
      description: 'Structured micronutrient timing, clean bulking ratios, and hydration frameworks for muscular density.',
      order: 2,
    },
    {
      id: 'lesson-chadmax-3',
      title: 'Physique Building',
      description: 'Progressive overload blueprints targeting clavicle width, upper chest fullness, and V-taper taper ratios.',
      order: 3,
    },
    {
      id: 'lesson-chadmax-4',
      title: 'Height & Posture',
      description: 'Decompression routines, anterior pelvic tilt correction, and spinal hygiene for optimal natural stature.',
      order: 4,
    },
    {
      id: 'lesson-chadmax-5',
      title: 'Confidence',
      description: 'Gaze stability, vocal resonance, nonverbal poise, and psychological grounding for calm social dominance.',
      order: 5,
    },
  ];

  for (const mod of modules) {
    await prisma.lesson.upsert({
      where: { id: mod.id },
      update: { title: mod.title, description: mod.description, order: mod.order },
      create: {
        id: mod.id,
        courseId: courseChadMax.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        durationSeconds: 0,
        dripDays: 0,
        isPreview: false,
      },
    });
    console.log(`[Seed] Module ${mod.order}: "${mod.title}" seeded.`);
  }

  // 8. Global Gamification Rules & Levels
  const pointsRules = [
    { id: 'rule-global-post', action: 'post', points: 10 },
    { id: 'rule-global-reply', action: 'reply', points: 5 },
    { id: 'rule-global-like', action: 'like-received', points: 2 },
    { id: 'rule-global-lesson', action: 'lesson-complete', points: 25 },
    { id: 'rule-global-event', action: 'event-attend', points: 50 },
  ];
  for (const rule of pointsRules) {
    await prisma.pointsRule.upsert({
      where: { id: rule.id },
      update: { points: rule.points },
      create: {
        id: rule.id,
        creatorId: null,
        action: rule.action as any,
        points: rule.points,
        isActive: true,
      },
    });
  }

  const levels = [
    { id: 'lvl-global-1', tierName: 'Beginner', minPoints: 0, badgeColor: '#6B7280' },
    { id: 'lvl-global-2', tierName: 'Consistent', minPoints: 50, badgeColor: '#3B82F6' },
    { id: 'lvl-global-3', tierName: 'Elite', minPoints: 200, badgeColor: '#F59E0B' },
  ];
  for (const lvl of levels) {
    await prisma.userLevel.upsert({
      where: { id: lvl.id },
      update: { minPoints: lvl.minPoints },
      create: {
        id: lvl.id,
        creatorId: null,
        tierName: lvl.tierName,
        minPoints: lvl.minPoints,
        badgeColor: lvl.badgeColor,
      },
    });
  }

  console.log('[Seed] Database seeding completed successfully. Clean Chadtag creator state ready.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
