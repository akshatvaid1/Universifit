import { PrismaClient } from '@prisma/client';
import { inMemoryStore, MemoryUser, MemoryCreatorProfile, MemoryOffer, MemoryCourse, MemoryLesson, MemoryLessonProgress, MemoryBooking, MemoryEnrollment, MemoryCommunityPost, MemoryPostReply, MemoryPostLike, MemoryPayment, MemorySupportTicket, MemoryCoupon, MemoryWishlistItem, MemoryCertificate, MemoryStorefrontVisit, MemoryMembershipTier, MemoryMembershipMember } from './inMemoryDb.js';

const realPrisma = new PrismaClient({
  log: ['error'],
});

let isDbDisconnected = false;

// Check if an error is a database connectivity issue
function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toString();
  return (
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    msg.includes("can't reach database server") ||
    msg.includes('econnrefused') ||
    msg.includes('connection timed out') ||
    msg.includes('database is disconnected')
  );
}

// Helpers to format relations for in-memory queries
function enrichUser(u: MemoryUser, include?: any) {
  if (!u) return null;
  const clone: any = { ...u };
  if (include?.creatorProfile) {
    const cp = inMemoryStore.creatorProfiles.find((c) => c.userId === u.id);
    clone.creatorProfile = cp ? { ...cp } : null;
  }
  return clone;
}

function enrichCreator(cp: MemoryCreatorProfile, include?: any) {
  if (!cp) return null;
  const clone: any = { ...cp };
  const user = inMemoryStore.users.find((u) => u.id === cp.userId);
  clone.user = user
    ? { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, role: user.role }
    : { id: cp.userId, fullName: cp.handle, email: `${cp.handle}@ascend.io`, avatarUrl: undefined, role: 'CREATOR' };
  clone.offers = inMemoryStore.offers.filter((o) => o.creatorId === cp.id);
  clone._count = {
    offers: clone.offers.length,
    bookings: inMemoryStore.bookings.filter((b) => b.creatorId === cp.id).length,
  };
  return clone;
}

function enrichBooking(b: MemoryBooking, include?: any) {
  if (!b) return null;
  const clone: any = { ...b };
  const user = inMemoryStore.users.find((u) => u.id === b.userId);
  clone.user = user
    ? { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl }
    : { id: b.userId, fullName: 'Ascend Athlete', email: 'athlete@ascend.io', avatarUrl: undefined };
  const cp = inMemoryStore.creatorProfiles.find((c) => c.id === b.creatorId);
  clone.creator = cp ? enrichCreator(cp, { user: true }) : { id: b.creatorId, handle: 'coach', user: { fullName: 'Coach', email: 'coach@ascend.io' } };
  clone.offer = inMemoryStore.offers.find((o) => o.id === b.offerId) || null;
  return clone;
}

function enrichCourse(c: MemoryCourse, include?: any) {
  if (!c) return null;
  const clone: any = { ...c };
  if (include?.lessons) {
    clone.lessons = inMemoryStore.lessons
      .filter((l) => l.courseId === c.id)
      .sort((a, b) => a.order - b.order);
  }
  if (include?.creator) {
    const creator = inMemoryStore.creatorProfiles.find((cp) => cp.id === c.creatorId);
    clone.creator = creator ? enrichCreator(creator, { user: true }) : null;
  }
  if (include?.offer) {
    clone.offer = inMemoryStore.offers.find((o) => o.id === c.offerId) || null;
  }
  return clone;
}

function enrichPost(p: MemoryCommunityPost, include?: any) {
  if (!p) return null;
  const clone: any = { ...p };
  const author = inMemoryStore.users.find((u) => u.id === p.authorId);
  const creator = p.creatorId ? inMemoryStore.creatorProfiles.find((c) => c.id === p.creatorId) : null;
  
  if (include?.author || clone.author === undefined) {
    clone.author = author
      ? { id: author.id, fullName: author.fullName, avatarUrl: author.avatarUrl, role: author.role, points: author.points }
      : { id: p.authorId, fullName: 'Ascend Athlete', avatarUrl: undefined, role: 'BUYER', points: 10 };
  }
  if (include?.creator) {
    clone.creator = creator ? enrichCreator(creator, { user: true }) : null;
  }
  if (include?.replies) {
    clone.replies = inMemoryStore.postReplies
      .filter((r) => r.postId === p.id)
      .map((r) => {
        const rAuthor = inMemoryStore.users.find((u) => u.id === r.authorId);
        return {
          ...r,
          author: rAuthor
            ? { id: rAuthor.id, fullName: rAuthor.fullName, avatarUrl: rAuthor.avatarUrl, role: rAuthor.role, points: rAuthor.points }
            : { id: r.authorId, fullName: 'Ascend Member', avatarUrl: undefined, role: 'BUYER', points: 0 },
        };
      });
  }
  if (include?._count) {
    clone._count = {
      replies: inMemoryStore.postReplies.filter((r) => r.postId === p.id).length,
      likes: p.likesCount || inMemoryStore.postLikes.filter((l) => l.postId === p.id).length,
    };
  }
  return clone;
}

function enrichSupportTicket(tkt: MemorySupportTicket, include?: any) {
  if (!tkt) return null;
  const clone: any = { ...tkt };
  if (include?.user) {
    const user = inMemoryStore.users.find((u) => u.id === tkt.userId);
    clone.user = user ? { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, role: user.role } : null;
  }
  if (include?.enrollment && tkt.enrollmentId) {
    const enrollment = inMemoryStore.enrollments.find((e) => e.id === tkt.enrollmentId);
    clone.enrollment = enrollment ? { id: enrollment.id, offerId: enrollment.offerId } : null;
  }
  if (include?.booking && tkt.bookingId) {
    const booking = inMemoryStore.bookings.find((b) => b.id === tkt.bookingId);
    clone.booking = booking ? { id: booking.id, scheduledAt: booking.scheduledAt, status: booking.status } : null;
  }
  return clone;
}

function enrichCoupon(c: MemoryCoupon, include?: any) {
  if (!c) return null;
  const clone: any = { ...c };
  if (include?.creator) {
    const cp = inMemoryStore.creatorProfiles.find((creator) => creator.id === c.creatorId);
    clone.creator = cp ? enrichCreator(cp, { user: true }) : null;
  }
  return clone;
}

function enrichWishlistItem(w: MemoryWishlistItem, include?: any) {
  if (!w) return null;
  const clone: any = { ...w };
  if (include?.offer) {
    const offer = inMemoryStore.offers.find((o) => o.id === w.offerId);
    if (offer) {
      const offClone: any = { ...offer };
      if (include?.offer?.include?.creator) {
        const cp = inMemoryStore.creatorProfiles.find((c) => c.id === offer.creatorId);
        offClone.creator = cp ? enrichCreator(cp, { user: true }) : null;
      }
      if (include?.offer?.include?.course) {
        offClone.course = inMemoryStore.courses.find((course) => course.offerId === offer.id) || null;
      }
      clone.offer = offClone;
    } else {
      clone.offer = null;
    }
  }
  if (include?.user) {
    const u = inMemoryStore.users.find((user) => user.id === w.userId);
    clone.user = u ? enrichUser(u) : null;
  }
  return clone;
}

function enrichCertificate(cert: MemoryCertificate, include?: any) {
  if (!cert) return null;
  const clone: any = { ...cert };
  if (include?.user) {
    const u = inMemoryStore.users.find((user) => user.id === cert.userId);
    clone.user = u ? enrichUser(u) : null;
  }
  if (include?.course) {
    const course = inMemoryStore.courses.find((c) => c.id === cert.courseId);
    if (course) {
      const courseClone: any = { ...course };
      if (include?.course?.include?.creator) {
        const cp = inMemoryStore.creatorProfiles.find((c) => c.id === course.creatorId);
        courseClone.creator = cp ? enrichCreator(cp, { user: true }) : null;
      }
      clone.course = courseClone;
    } else {
      clone.course = null;
    }
  }
  if (include?.enrollment && cert.enrollmentId) {
    const enr = inMemoryStore.enrollments.find((e) => e.id === cert.enrollmentId);
    clone.enrollment = enr ? { ...enr } : null;
  }
  return clone;
}

function enrichMembershipTier(tier: MemoryMembershipTier, include?: any) {
  if (!tier) return null;
  const clone: any = { ...tier };
  if (include?.creator) {
    const cp = inMemoryStore.creatorProfiles.find((c) => c.id === tier.creatorId);
    clone.creator = cp ? enrichCreator(cp, { user: true }) : null;
  }
  if (include?.members) {
    clone.members = inMemoryStore.membershipMembers
      .filter((m) => m.tierId === tier.id)
      .map((m) => enrichMembershipMember(m));
  }
  if (include?._count) {
    clone._count = {
      members: inMemoryStore.membershipMembers.filter((m) => m.tierId === tier.id).length,
    };
  }
  return clone;
}

function enrichMembershipMember(member: MemoryMembershipMember, include?: any) {
  if (!member) return null;
  const clone: any = { ...member };
  if (include?.user) {
    const u = inMemoryStore.users.find((user) => user.id === member.userId);
    clone.user = u ? enrichUser(u) : null;
  }
  if (include?.creator) {
    const cp = inMemoryStore.creatorProfiles.find((c) => c.id === member.creatorId);
    clone.creator = cp ? enrichCreator(cp, { user: true }) : null;
  }
  if (include?.tier) {
    const tier = inMemoryStore.membershipTiers.find((t) => t.id === member.tierId);
    clone.tier = tier ? enrichMembershipTier(tier) : null;
  }
  return clone;
}

// In-Memory Model Handlers
const memoryDb = {
  user: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      let user: MemoryUser | undefined;
      if (where.id) user = inMemoryStore.users.find((u) => u.id === where.id);
      else if (where.email) user = inMemoryStore.users.find((u) => u.email.toLowerCase() === where.email.toLowerCase());
      return user ? enrichUser(user, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const user = inMemoryStore.users.find((u) => {
        if (where.email && u.email.toLowerCase() !== where.email.toLowerCase()) return false;
        if (where.id && u.id !== where.id) return false;
        if (where.role && u.role !== where.role) return false;
        return true;
      });
      return user ? enrichUser(user, include) : null;
    },
    findMany: async (args?: any) => {
      return inMemoryStore.users.map((u) => enrichUser(u, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newUser: MemoryUser = {
        id: data.id || `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash || '',
        fullName: data.fullName || 'Ascend User',
        avatarUrl: data.avatarUrl,
        role: data.role || 'BUYER',
        points: data.points || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.users.push(newUser);
      return enrichUser(newUser, include);
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const user = inMemoryStore.users.find((u) => (where.id && u.id === where.id) || (where.email && u.email === where.email));
      if (!user) throw new Error('User not found');
      if (data.fullName !== undefined) user.fullName = data.fullName;
      if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
      if (data.role !== undefined) user.role = data.role;
      if (data.points !== undefined) {
        if (typeof data.points === 'object' && data.points.increment) {
          user.points += data.points.increment;
        } else {
          user.points = Number(data.points);
        }
      }
      user.updatedAt = new Date();
      return enrichUser(user, include);
    },
    upsert: async (args: any) => {
      const { where, create, update, include } = args;
      const existing = await memoryDb.user.findUnique({ where, include });
      if (existing) {
        return memoryDb.user.update({ where, data: update, include });
      }
      return memoryDb.user.create({ data: create, include });
    },
    count: async () => inMemoryStore.users.length,
  },

  creatorProfile: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      let cp: MemoryCreatorProfile | undefined;
      if (where.id) cp = inMemoryStore.creatorProfiles.find((c) => c.id === where.id);
      else if (where.userId) cp = inMemoryStore.creatorProfiles.find((c) => c.userId === where.userId);
      else if (where.handle) cp = inMemoryStore.creatorProfiles.find((c) => c.handle.toLowerCase() === where.handle.toLowerCase());
      else if (where.referralCode) cp = inMemoryStore.creatorProfiles.find((c) => c.referralCode?.toUpperCase() === where.referralCode.toUpperCase());
      return cp ? enrichCreator(cp, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const cp = inMemoryStore.creatorProfiles.find((c) => {
        if (where.id && c.id !== where.id) return false;
        if (where.userId && c.userId !== where.userId) return false;
        if (where.handle && c.handle.toLowerCase() !== where.handle.toLowerCase()) return false;
        if (where.referralCode && c.referralCode?.toUpperCase() !== where.referralCode.toUpperCase()) return false;
        if (where.OR) {
          const matched = where.OR.some((cond: any) => {
            if (cond.id && c.id === cond.id) return true;
            if (cond.userId && c.userId === cond.userId) return true;
            if (cond.handle && c.handle.toLowerCase() === cond.handle.toLowerCase()) return true;
            return false;
          });
          if (!matched) return false;
        }
        return true;
      });
      return cp ? enrichCreator(cp, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.creatorProfiles.filter((c) => {
        if (where.verificationStatus && c.verificationStatus !== where.verificationStatus) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((c) => enrichCreator(c, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newCp: MemoryCreatorProfile = {
        id: data.id || `creator-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: data.userId,
        handle: data.handle || `coach.${Date.now()}`,
        headline: data.headline || 'Ascend Coach Partner',
        bio: data.bio || '',
        specialtyTags: data.specialtyTags || ['Strength & Physique'],
        credentials: data.credentials || [],
        verificationDocs: data.verificationDocs || [],
        verificationStatus: data.verificationStatus || 'PENDING',
        agreementAccepted: data.agreementAccepted !== undefined ? data.agreementAccepted : false,
        agreementAcceptedAt: data.agreementAcceptedAt || undefined,
        rating: data.rating || 5.0,
        totalClients: data.totalClients || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.creatorProfiles.push(newCp);
      return enrichCreator(newCp, include);
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const cp = inMemoryStore.creatorProfiles.find((c) => (where.id && c.id === where.id) || (where.userId && c.userId === where.userId) || (where.handle && c.handle === where.handle));
      if (!cp) throw new Error('Creator profile not found');
      if (data.headline !== undefined) cp.headline = data.headline;
      if (data.bio !== undefined) cp.bio = data.bio;
      if (data.specialtyTags !== undefined) cp.specialtyTags = data.specialtyTags;
      if (data.credentials !== undefined) cp.credentials = data.credentials;
      if (data.verificationDocs !== undefined) cp.verificationDocs = data.verificationDocs;
      if (data.verificationStatus !== undefined) cp.verificationStatus = data.verificationStatus;
      if (data.rejectionReason !== undefined) cp.rejectionReason = data.rejectionReason;
      if (data.verifiedAt !== undefined) cp.verifiedAt = data.verifiedAt;
      if (data.agreementAccepted !== undefined) cp.agreementAccepted = data.agreementAccepted;
      if (data.agreementAcceptedAt !== undefined) cp.agreementAcceptedAt = data.agreementAcceptedAt;
      if (data.referralCode !== undefined) cp.referralCode = data.referralCode;
      if (data.referralBonus !== undefined) cp.referralBonus = Number(data.referralBonus);
      cp.updatedAt = new Date();
      return enrichCreator(cp, include);
    },
    upsert: async (args: any) => {
      const { where, create, update, include } = args;
      const existing = await memoryDb.creatorProfile.findUnique({ where, include });
      if (existing) {
        return memoryDb.creatorProfile.update({ where, data: update, include });
      }
      return memoryDb.creatorProfile.create({ data: create, include });
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      if (where.verificationStatus) {
        return inMemoryStore.creatorProfiles.filter((c) => c.verificationStatus === where.verificationStatus).length;
      }
      return inMemoryStore.creatorProfiles.length;
    },
  },

  offer: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const off = inMemoryStore.offers.find((o) => o.id === where.id);
      if (!off) return null;
      const clone: any = { ...off };
      if (include?.creator) {
        const c = inMemoryStore.creatorProfiles.find((cp) => cp.id === off.creatorId);
        clone.creator = c ? enrichCreator(c, { user: true }) : null;
      }
      if (include?.course) {
        clone.course = inMemoryStore.courses.find((course) => course.offerId === off.id) || null;
      }
      return clone;
    },
    findFirst: async (args: any) => {
      return memoryDb.offer.findUnique(args);
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.offers.filter((o) => {
        if (where.creatorId && o.creatorId !== where.creatorId) return false;
        if (where.isActive !== undefined && o.isActive !== where.isActive) return false;
        return true;
      });
      return list.map((o) => {
        const clone: any = { ...o };
        if (args?.include?.creator) {
          const c = inMemoryStore.creatorProfiles.find((cp) => cp.id === o.creatorId);
          clone.creator = c ? enrichCreator(c, { user: true }) : null;
        }
        return clone;
      });
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newOffer: MemoryOffer = {
        id: data.id || `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        creatorId: data.creatorId,
        title: data.title || 'Coaching Offer',
        description: data.description,
        type: data.type || 'ONE_ON_ONE',
        price: data.price || 100,
        currency: data.currency || 'USD',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.offers.push(newOffer);
      return newOffer;
    },
    update: async (args: any) => {
      const { where, data } = args;
      const off = inMemoryStore.offers.find((o) => o.id === where.id);
      if (!off) throw new Error('Offer not found');
      if (data.title !== undefined) off.title = data.title;
      if (data.description !== undefined) off.description = data.description;
      if (data.price !== undefined) off.price = data.price;
      if (data.isActive !== undefined) off.isActive = data.isActive;
      off.updatedAt = new Date();
      return off;
    },
  },

  course: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const course = inMemoryStore.courses.find((c) => c.id === where.id);
      return course ? enrichCourse(course, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const course = inMemoryStore.courses.find((c) => {
        if (where.id && c.id !== where.id) return false;
        if (where.offerId && c.offerId !== where.offerId) return false;
        if (where.creatorId && c.creatorId !== where.creatorId) return false;
        return true;
      });
      return course ? enrichCourse(course, include) : null;
    },
    findMany: async (args?: any) => {
      return inMemoryStore.courses.map((c) => enrichCourse(c, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newCourse: MemoryCourse = {
        id: data.id || `course-${Date.now()}`,
        creatorId: data.creatorId,
        offerId: data.offerId,
        title: data.title,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.courses.push(newCourse);
      return enrichCourse(newCourse, include);
    },
  },

  lesson: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const l = inMemoryStore.lessons.find((les) => les.id === where.id);
      if (!l) return null;
      const clone: any = { ...l };
      if (include?.course) {
        const c = inMemoryStore.courses.find((course) => course.id === l.courseId);
        clone.course = c ? enrichCourse(c, { creator: true }) : null;
      }
      return clone;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.lessons.filter((l) => {
        if (where.courseId && l.courseId !== where.courseId) return false;
        return true;
      });
    },
  },

  lessonProgress: {
    findUnique: async (args: any) => {
      const { where } = args;
      if (where.userId_lessonId) {
        return inMemoryStore.lessonProgress.find(
          (lp) => lp.userId === where.userId_lessonId.userId && lp.lessonId === where.userId_lessonId.lessonId
        ) || null;
      }
      return null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.lessonProgress.filter((lp) => {
        if (where.userId && lp.userId !== where.userId) return false;
        if (where.lessonId && lp.lessonId !== where.lessonId) return false;
        return true;
      });
    },
    upsert: async (args: any) => {
      const { where, create, update } = args;
      let record = inMemoryStore.lessonProgress.find(
        (lp) => lp.userId === where.userId_lessonId.userId && lp.lessonId === where.userId_lessonId.lessonId
      );
      if (record) {
        if (update.isCompleted !== undefined) record.isCompleted = update.isCompleted;
        if (update.completedAt !== undefined) record.completedAt = update.completedAt;
        if (update.lastWatchedSeconds !== undefined) record.lastWatchedSeconds = update.lastWatchedSeconds;
        record.updatedAt = new Date();
      } else {
        record = {
          id: `prog-${Date.now()}`,
          userId: create.userId,
          lessonId: create.lessonId,
          isCompleted: create.isCompleted || false,
          completedAt: create.completedAt,
          lastWatchedSeconds: create.lastWatchedSeconds || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryStore.lessonProgress.push(record);
      }
      return record;
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.lessonProgress.filter((lp) => {
        if (where.userId && lp.userId !== where.userId) return false;
        if (where.isCompleted !== undefined && lp.isCompleted !== where.isCompleted) return false;
        if (where.lesson?.courseId) {
          const l = inMemoryStore.lessons.find((les) => les.id === lp.lessonId);
          if (!l || l.courseId !== where.lesson.courseId) return false;
        }
        return true;
      }).length;
    },
  },

  enrollment: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const enr = inMemoryStore.enrollments.find((e) => {
        if (where.id && e.id === where.id) return true;
        if (where.userId_offerId && e.userId === where.userId_offerId.userId && e.offerId === where.userId_offerId.offerId) return true;
        return false;
      });
      if (!enr) return null;
      const clone: any = { ...enr };
      if (include?.offer) clone.offer = inMemoryStore.offers.find((o) => o.id === enr.offerId) || null;
      if (include?.course) {
        const c = inMemoryStore.courses.find((course) => course.id === enr.courseId);
        clone.course = c ? enrichCourse(c, { creator: true }) : null;
      }
      return clone;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const enr = inMemoryStore.enrollments.find((e) => {
        if (where.id && e.id !== where.id) return false;
        if (where.userId && e.userId !== where.userId) return false;
        if (where.offerId && e.offerId !== where.offerId) return false;
        if (where.courseId && e.courseId !== where.courseId) return false;
        if (where.status && e.status !== where.status) return false;
        if (where.razorpaySubscriptionId && e.razorpaySubscriptionId !== where.razorpaySubscriptionId) return false;
        return true;
      });
      if (!enr) return null;
      const clone: any = { ...enr };
      if (include?.offer) clone.offer = inMemoryStore.offers.find((o) => o.id === enr.offerId) || null;
      if (include?.course) {
        const c = inMemoryStore.courses.find((course) => course.id === enr.courseId);
        clone.course = c ? enrichCourse(c, { creator: true }) : null;
      }
      return clone;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      const list = inMemoryStore.enrollments.filter((e) => {
        if (where.userId && e.userId !== where.userId) return false;
        if (where.status && e.status !== where.status) return false;
        if (where.isRecurring !== undefined && e.isRecurring !== where.isRecurring) return false;
        if (where.offer?.creatorId) {
          const off = inMemoryStore.offers.find((o) => o.id === e.offerId);
          if (!off || off.creatorId !== where.offer.creatorId) return false;
        }
        return true;
      });
      return list.map((enr) => {
        const clone: any = { ...enr };
        const user = inMemoryStore.users.find((u) => u.id === enr.userId);
        clone.user = user ? { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl } : null;
        clone.offer = inMemoryStore.offers.find((o) => o.id === enr.offerId) || null;
        if (enr.courseId) {
          const c = inMemoryStore.courses.find((course) => course.id === enr.courseId);
          clone.course = c ? enrichCourse(c, { creator: true, lessons: true }) : null;
        }
        return clone;
      });
    },
    create: async (args: any) => {
      const { data } = args;
      const newEnr: MemoryEnrollment = {
        id: data.id || `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: data.userId,
        offerId: data.offerId,
        courseId: data.courseId,
        status: data.status || 'ACTIVE',
        progressPercent: data.progressPercent || 0,
        isRecurring: Boolean(data.isRecurring),
        billingInterval: data.billingInterval || 'month',
        razorpaySubscriptionId: data.razorpaySubscriptionId,
        currentPeriodStart: data.currentPeriodStart ? new Date(data.currentPeriodStart) : undefined,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : undefined,
        enrolledAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.enrollments.push(newEnr);
      return newEnr;
    },
    update: async (args: any) => {
      const { where, data } = args;
      const enr = inMemoryStore.enrollments.find((e) => (where.id && e.id === where.id) || (where.userId_offerId && e.userId === where.userId_offerId.userId && e.offerId === where.userId_offerId.offerId));
      if (enr) {
        if (data.progressPercent !== undefined) enr.progressPercent = data.progressPercent;
        if (data.status !== undefined) enr.status = data.status;
        if (data.isRecurring !== undefined) enr.isRecurring = data.isRecurring;
        if (data.billingInterval !== undefined) enr.billingInterval = data.billingInterval;
        if (data.razorpaySubscriptionId !== undefined) enr.razorpaySubscriptionId = data.razorpaySubscriptionId;
        if (data.currentPeriodStart !== undefined) enr.currentPeriodStart = data.currentPeriodStart ? new Date(data.currentPeriodStart) : undefined;
        if (data.currentPeriodEnd !== undefined) enr.currentPeriodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined;
        if (data.cancelAtPeriodEnd !== undefined) enr.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
        if (data.cancelledAt !== undefined) enr.cancelledAt = data.cancelledAt ? new Date(data.cancelledAt) : undefined;
        enr.updatedAt = new Date();
      }
      return enr;
    },
    upsert: async (args: any) => {
      const { where, create, update } = args;
      const existing = inMemoryStore.enrollments.find((e) => where.userId_offerId && e.userId === where.userId_offerId.userId && e.offerId === where.userId_offerId.offerId);
      if (existing) {
        if (update.status !== undefined) existing.status = update.status;
        if (update.progressPercent !== undefined) existing.progressPercent = update.progressPercent;
        if (update.isRecurring !== undefined) existing.isRecurring = update.isRecurring;
        if (update.razorpaySubscriptionId !== undefined) existing.razorpaySubscriptionId = update.razorpaySubscriptionId;
        if (update.currentPeriodStart !== undefined) existing.currentPeriodStart = update.currentPeriodStart ? new Date(update.currentPeriodStart) : undefined;
        if (update.currentPeriodEnd !== undefined) existing.currentPeriodEnd = update.currentPeriodEnd ? new Date(update.currentPeriodEnd) : undefined;
        if (update.cancelAtPeriodEnd !== undefined) existing.cancelAtPeriodEnd = update.cancelAtPeriodEnd;
        if (update.cancelledAt !== undefined) existing.cancelledAt = update.cancelledAt ? new Date(update.cancelledAt) : undefined;
        existing.updatedAt = new Date();
        return existing;
      }
      return memoryDb.enrollment.create({ data: create });
    },
    count: async (args?: any) => {
      return inMemoryStore.enrollments.length;
    },
  },

  booking: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const b = inMemoryStore.bookings.find((bk) => bk.id === where.id);
      return b ? enrichBooking(b, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const b = inMemoryStore.bookings.find((bk) => {
        if (where.creatorId && bk.creatorId !== where.creatorId) return false;
        if (where.status && bk.status !== where.status) return false;
        if (where.scheduledAt) {
          const reqTime = new Date(where.scheduledAt).getTime();
          const bkTime = new Date(bk.scheduledAt).getTime();
          // Check slot conflict (within duration)
          const diffMinutes = Math.abs(reqTime - bkTime) / (1000 * 60);
          if (diffMinutes < (bk.durationMinutes || 45)) return true;
        }
        return false;
      });
      return b ? enrichBooking(b, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      const list = inMemoryStore.bookings.filter((bk) => {
        if (where.userId && bk.userId !== where.userId) return false;
        if (where.creatorId && bk.creatorId !== where.creatorId) return false;
        if (where.status && bk.status !== where.status) return false;
        return true;
      });
      return list.map((b) => enrichBooking(b, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      // Double booking check
      const schedTime = new Date(data.scheduledAt).getTime();
      const existingConflict = inMemoryStore.bookings.find((bk) => {
        if (bk.creatorId !== data.creatorId) return false;
        if (bk.status === 'CANCELLED') return false;
        const bkTime = new Date(bk.scheduledAt).getTime();
        const diffMinutes = Math.abs(schedTime - bkTime) / (1000 * 60);
        return diffMinutes < (bk.durationMinutes || 45);
      });
      if (existingConflict) {
        throw new Error('This time slot is already booked. Please choose an alternate slot.');
      }

      const newBooking: MemoryBooking = {
        id: data.id || `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: data.userId,
        creatorId: data.creatorId,
        offerId: data.offerId,
        availabilityId: data.availabilityId,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes || 45,
        status: data.status || 'SCHEDULED',
        meetingUrl: data.meetingUrl || `https://meet.ascend.io/session/${Date.now()}`,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.bookings.push(newBooking);
      return enrichBooking(newBooking, include);
    },
    update: async (args: any) => {
      const { where, data } = args;
      const b = inMemoryStore.bookings.find((bk) => bk.id === where.id);
      if (!b) throw new Error('Booking not found');
      if (data.status) b.status = data.status;
      if (data.notes) b.notes = data.notes;
      b.updatedAt = new Date();
      return b;
    },
  },

  availability: {
    findMany: async (args?: any) => {
      const now = new Date();
      // Generate dynamically 5 upcoming open slots
      return [1, 2, 3, 4, 5].map((dayOffset) => {
        const start = new Date(now.getTime() + dayOffset * 24 * 3600 * 1000);
        start.setHours(15, 0, 0, 0);
        const end = new Date(start.getTime() + 45 * 60 * 1000);
        return {
          id: `avail-slot-${dayOffset}`,
          creatorId: args?.where?.creatorId || 'creator-marcus',
          startTime: start,
          endTime: end,
          isBooked: false,
        };
      });
    },
    update: async (args: any) => {
      return { id: args?.where?.id || 'avail-1', isBooked: args?.data?.isBooked || true };
    },
  },

  communityPost: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const p = inMemoryStore.communityPosts.find((post) => post.id === where.id);
      return p ? enrichPost(p, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const p = inMemoryStore.communityPosts.find((post) => {
        if (where.id && post.id !== where.id) return false;
        return true;
      });
      return p ? enrichPost(p, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.communityPosts.filter((p) => {
        if (where.category && p.category !== where.category) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((p) => enrichPost(p, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newPost: MemoryCommunityPost = {
        id: data.id || `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        authorId: data.authorId,
        creatorId: data.creatorId,
        title: data.title,
        content: data.content,
        category: data.category || 'General',
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.communityPosts.unshift(newPost);
      return enrichPost(newPost, include);
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const p = inMemoryStore.communityPosts.find((post) => post.id === where.id);
      if (!p) throw new Error('Post not found');
      if (data.likesCount !== undefined) {
        if (typeof data.likesCount === 'object' && data.likesCount.increment) {
          p.likesCount += data.likesCount.increment;
        } else if (typeof data.likesCount === 'object' && data.likesCount.decrement) {
          p.likesCount = Math.max(0, p.likesCount + data.likesCount.decrement);
        } else {
          p.likesCount = Number(data.likesCount);
        }
      }
      p.updatedAt = new Date();
      return enrichPost(p, include);
    },
    count: async (args?: any) => {
      return inMemoryStore.communityPosts.length;
    },
  },

  postReply: {
    create: async (args: any) => {
      const { data } = args;
      const newReply: MemoryPostReply = {
        id: data.id || `reply-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        postId: data.postId,
        authorId: data.authorId,
        content: data.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.postReplies.push(newReply);
      const author = inMemoryStore.users.find((u) => u.id === data.authorId);
      return {
        ...newReply,
        author: author
          ? { id: author.id, fullName: author.fullName, avatarUrl: author.avatarUrl, role: author.role, points: author.points }
          : { id: data.authorId, fullName: 'Ascend Athlete', points: 0 },
      };
    },
  },

  postLike: {
    findUnique: async (args: any) => {
      const { where } = args;
      if (where.userId_postId) {
        return inMemoryStore.postLikes.find(
          (pl) => pl.userId === where.userId_postId.userId && pl.postId === where.userId_postId.postId
        ) || null;
      }
      return null;
    },
    create: async (args: any) => {
      const { data } = args;
      const newLike: MemoryPostLike = {
        id: `like-${Date.now()}`,
        postId: data.postId,
        userId: data.userId,
        createdAt: new Date(),
      };
      inMemoryStore.postLikes.push(newLike);
      return newLike;
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = inMemoryStore.postLikes.findIndex(
        (pl) => pl.userId === where.userId_postId.userId && pl.postId === where.userId_postId.postId
      );
      if (idx !== -1) inMemoryStore.postLikes.splice(idx, 1);
      return { success: true };
    },
  },

  payment: {
    create: async (args: any) => {
      const { data } = args;
      const newPay: MemoryPayment = {
        id: data.id || `pay-${Date.now()}`,
        userId: data.userId,
        offerId: data.offerId,
        bookingId: data.bookingId,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        status: data.status || 'PENDING',
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.payments.push(newPay);
      return newPay;
    },
    findFirst: async (args: any) => {
      const { where } = args;
      return inMemoryStore.payments.find((p) => {
        if (where.razorpayOrderId && p.razorpayOrderId !== where.razorpayOrderId) return false;
        if (where.razorpayPaymentId && p.razorpayPaymentId !== where.razorpayPaymentId) return false;
        return true;
      }) || null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.payments.filter((p) => {
        if (where.userId && p.userId !== where.userId) return false;
        return true;
      });
    },
    updateMany: async (args: any) => {
      const { where, data } = args;
      inMemoryStore.payments.forEach((p) => {
        if (where.razorpayOrderId && p.razorpayOrderId === where.razorpayOrderId) {
          if (data.status) p.status = data.status;
          if (data.razorpayPaymentId) p.razorpayPaymentId = data.razorpayPaymentId;
          p.updatedAt = new Date();
        }
      });
      return { count: 1 };
    },
  },

  supportTicket: {
    create: async (args: any) => {
      const { data, include } = args;
      const count = inMemoryStore.supportTickets.length + 1;
      const seqStr = String(count).padStart(5, '0');
      const now = new Date();
      const monthStr = now.toISOString().slice(0, 7).replace('-', '');
      const newTkt: MemorySupportTicket = {
        id: data.id || `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketNumber: data.ticketNumber || `TKT-${monthStr}-${seqStr}`,
        userId: data.userId,
        category: data.category || 'OTHER',
        subject: data.subject || 'Support Inquiry',
        description: data.description || '',
        status: data.status || 'OPEN',
        enrollmentId: data.enrollmentId || undefined,
        bookingId: data.bookingId || undefined,
        adminResponse: data.adminResponse || undefined,
        respondedAt: data.respondedAt || undefined,
        resolvedAt: data.resolvedAt || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.supportTickets.unshift(newTkt);
      return enrichSupportTicket(newTkt, include);
    },
    findUnique: async (args: any) => {
      const { where, include } = args;
      const tkt = inMemoryStore.supportTickets.find((t) => (where.id && t.id === where.id) || (where.ticketNumber && t.ticketNumber === where.ticketNumber));
      return tkt ? enrichSupportTicket(tkt, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const tkt = inMemoryStore.supportTickets.find((t) => {
        if (where.id && t.id !== where.id) return false;
        if (where.ticketNumber && t.ticketNumber !== where.ticketNumber) return false;
        if (where.userId && t.userId !== where.userId) return false;
        return true;
      });
      return tkt ? enrichSupportTicket(tkt, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.supportTickets.filter((t) => {
        if (where.userId && t.userId !== where.userId) return false;
        if (where.status && t.status !== where.status) return false;
        if (where.category && t.category !== where.category) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((t) => enrichSupportTicket(t, args?.include));
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const tkt = inMemoryStore.supportTickets.find((t) => t.id === where.id);
      if (!tkt) throw new Error('Support ticket not found');
      if (data.status !== undefined) tkt.status = data.status;
      if (data.adminResponse !== undefined) tkt.adminResponse = data.adminResponse;
      if (data.respondedAt !== undefined) tkt.respondedAt = data.respondedAt;
      if (data.resolvedAt !== undefined) tkt.resolvedAt = data.resolvedAt;
      tkt.updatedAt = new Date();
      return enrichSupportTicket(tkt, include);
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.supportTickets.filter((t) => {
        if (where.userId && t.userId !== where.userId) return false;
        if (where.status && t.status !== where.status) return false;
        if (where.category && t.category !== where.category) return false;
        return true;
      }).length;
    },
  },

  coupon: {
    create: async (args: any) => {
      const { data, include } = args;
      const existing = inMemoryStore.coupons.find((c) => c.code.toUpperCase() === (data.code || '').toUpperCase());
      if (existing) {
        throw new Error('A coupon with this promo code already exists.');
      }
      const newCoupon: MemoryCoupon = {
        id: data.id || `cpn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: (data.code || '').trim().toUpperCase(),
        discountType: data.discountType || 'PERCENT',
        value: Number(data.value),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        creatorId: data.creatorId,
        usageLimit: data.usageLimit !== undefined && data.usageLimit !== null && data.usageLimit !== '' ? Number(data.usageLimit) : undefined,
        usedCount: 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.coupons.unshift(newCoupon);
      return enrichCoupon(newCoupon, include);
    },
    findUnique: async (args: any) => {
      const { where, include } = args;
      const cpn = inMemoryStore.coupons.find((c) => {
        if (where.id && c.id === where.id) return true;
        if (where.code && c.code.toUpperCase() === where.code.toUpperCase()) return true;
        return false;
      });
      return cpn ? enrichCoupon(cpn, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const cpn = inMemoryStore.coupons.find((c) => {
        if (where.id && c.id !== where.id) return false;
        if (where.code && c.code.toUpperCase() !== where.code.toUpperCase()) return false;
        if (where.creatorId && c.creatorId !== where.creatorId) return false;
        if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
        return true;
      });
      return cpn ? enrichCoupon(cpn, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.coupons.filter((c) => {
        if (where.creatorId && c.creatorId !== where.creatorId) return false;
        if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((c) => enrichCoupon(c, args?.include));
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const cpn = inMemoryStore.coupons.find((c) => c.id === where.id || (where.code && c.code.toUpperCase() === where.code.toUpperCase()));
      if (!cpn) throw new Error('Coupon not found');
      if (data.code !== undefined) cpn.code = data.code.trim().toUpperCase();
      if (data.discountType !== undefined) cpn.discountType = data.discountType;
      if (data.value !== undefined) cpn.value = Number(data.value);
      if (data.expiryDate !== undefined) cpn.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
      if (data.usageLimit !== undefined) cpn.usageLimit = data.usageLimit !== null && data.usageLimit !== '' ? Number(data.usageLimit) : undefined;
      if (data.usedCount !== undefined) {
        if (typeof data.usedCount === 'object' && data.usedCount.increment) {
          cpn.usedCount += data.usedCount.increment;
        } else {
          cpn.usedCount = Number(data.usedCount);
        }
      }
      if (data.isActive !== undefined) cpn.isActive = data.isActive;
      cpn.updatedAt = new Date();
      return enrichCoupon(cpn, include);
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = inMemoryStore.coupons.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Coupon not found');
      const removed = inMemoryStore.coupons.splice(idx, 1)[0];
      return removed;
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.coupons.filter((c) => {
        if (where.creatorId && c.creatorId !== where.creatorId) return false;
        if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
        return true;
      }).length;
    },
  },

  wishlistItem: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const item = inMemoryStore.wishlistItems.find((w) => {
        if (where.id && w.id === where.id) return true;
        if (where.userId_offerId && w.userId === where.userId_offerId.userId && w.offerId === where.userId_offerId.offerId) return true;
        return false;
      });
      return item ? enrichWishlistItem(item, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const item = inMemoryStore.wishlistItems.find((w) => {
        if (where.id && w.id !== where.id) return false;
        if (where.userId && w.userId !== where.userId) return false;
        if (where.offerId && w.offerId !== where.offerId) return false;
        return true;
      });
      return item ? enrichWishlistItem(item, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.wishlistItems.filter((w) => {
        if (where.userId && w.userId !== where.userId) return false;
        if (where.offerId && w.offerId !== where.offerId) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((w) => enrichWishlistItem(w, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const existing = inMemoryStore.wishlistItems.find(
        (w) => w.userId === data.userId && w.offerId === data.offerId
      );
      if (existing) {
        return enrichWishlistItem(existing, include);
      }
      const newItem: MemoryWishlistItem = {
        id: data.id || `wsh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: data.userId,
        offerId: data.offerId,
        createdAt: new Date(),
      };
      inMemoryStore.wishlistItems.unshift(newItem);
      return enrichWishlistItem(newItem, include);
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = inMemoryStore.wishlistItems.findIndex((w) => {
        if (where.id && w.id === where.id) return true;
        if (where.userId_offerId && w.userId === where.userId_offerId.userId && w.offerId === where.userId_offerId.offerId) return true;
        return false;
      });
      if (idx === -1) throw new Error('Wishlist item not found');
      const removed = inMemoryStore.wishlistItems.splice(idx, 1)[0];
      return removed;
    },
    deleteMany: async (args: any) => {
      const { where } = args;
      const initialLen = inMemoryStore.wishlistItems.length;
      inMemoryStore.wishlistItems = inMemoryStore.wishlistItems.filter((w) => {
        if (where.userId && w.userId !== where.userId) return true;
        if (where.offerId && w.offerId !== where.offerId) return true;
        return false;
      });
      return { count: initialLen - inMemoryStore.wishlistItems.length };
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.wishlistItems.filter((w) => {
        if (where.userId && w.userId !== where.userId) return false;
        if (where.offerId && w.offerId !== where.offerId) return false;
        return true;
      }).length;
    },
  },

  certificate: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const cert = inMemoryStore.certificates.find((c) => {
        if (where.id && c.id === where.id) return true;
        if (where.certificateNumber && c.certificateNumber === where.certificateNumber) return true;
        if (where.userId_courseId && c.userId === where.userId_courseId.userId && c.courseId === where.userId_courseId.courseId) return true;
        return false;
      });
      return cert ? enrichCertificate(cert, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const cert = inMemoryStore.certificates.find((c) => {
        if (where.id && c.id !== where.id) return false;
        if (where.certificateNumber && c.certificateNumber !== where.certificateNumber) return false;
        if (where.userId && c.userId !== where.userId) return false;
        if (where.courseId && c.courseId !== where.courseId) return false;
        return true;
      });
      return cert ? enrichCertificate(cert, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.certificates.filter((c) => {
        if (where.userId && c.userId !== where.userId) return false;
        if (where.courseId && c.courseId !== where.courseId) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((c) => enrichCertificate(c, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const existing = inMemoryStore.certificates.find(
        (c) => c.userId === data.userId && c.courseId === data.courseId
      );
      if (existing) {
        return enrichCertificate(existing, include);
      }
      const newCert: MemoryCertificate = {
        id: data.id || `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        certificateNumber: data.certificateNumber || `ASC-CERT-${new Date().getFullYear()}-${1000 + inMemoryStore.certificates.length + 1}`,
        userId: data.userId,
        courseId: data.courseId,
        enrollmentId: data.enrollmentId,
        buyerName: data.buyerName,
        courseTitle: data.courseTitle,
        creatorName: data.creatorName,
        completionDate: data.completionDate ? new Date(data.completionDate) : new Date(),
        pdfPath: data.pdfPath,
        pdfUrl: data.pdfUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.certificates.unshift(newCert);
      return enrichCertificate(newCert, include);
    },
    upsert: async (args: any) => {
      const { where, create, update, include } = args;
      const existing = inMemoryStore.certificates.find((c) => {
        if (where.id && c.id === where.id) return true;
        if (where.userId_courseId && c.userId === where.userId_courseId.userId && c.courseId === where.userId_courseId.courseId) return true;
        return false;
      });
      if (existing) {
        if (update.buyerName !== undefined) existing.buyerName = update.buyerName;
        if (update.courseTitle !== undefined) existing.courseTitle = update.courseTitle;
        if (update.creatorName !== undefined) existing.creatorName = update.creatorName;
        if (update.pdfPath !== undefined) existing.pdfPath = update.pdfPath;
        if (update.pdfUrl !== undefined) existing.pdfUrl = update.pdfUrl;
        existing.updatedAt = new Date();
        return enrichCertificate(existing, include);
      }
      return (memoryDb as any).certificate.create({ data: create, include });
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = inMemoryStore.certificates.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error('Certificate not found');
      return inMemoryStore.certificates.splice(idx, 1)[0];
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.certificates.filter((c) => {
        if (where.userId && c.userId !== where.userId) return false;
        if (where.courseId && c.courseId !== where.courseId) return false;
        return true;
      }).length;
    },
  },

  storefrontVisit: {
    findMany: async (args?: any) => {
      const { where, orderBy, take } = args || {};
      let results = inMemoryStore.storefrontVisits.filter((v) => {
        if (where?.creatorId && v.creatorId !== where.creatorId) return false;
        if (where?.createdAt?.gte && new Date(v.createdAt) < new Date(where.createdAt.gte)) return false;
        if (where?.createdAt?.lte && new Date(v.createdAt) > new Date(where.createdAt.lte)) return false;
        return true;
      });

      if (orderBy?.createdAt === 'desc') {
        results = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (orderBy?.createdAt === 'asc') {
        results = results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      if (take && typeof take === 'number') {
        results = results.slice(0, take);
      }

      return results.map((v) => ({ ...v }));
    },
    create: async (args: any) => {
      const { data } = args;
      const visit: MemoryStorefrontVisit = {
        id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        creatorId: data.creatorId,
        visitorId: data.visitorId,
        referrer: data.referrer,
        userAgent: data.userAgent,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      };
      inMemoryStore.storefrontVisits.push(visit);

      // Increment profileViews on creator profile
      const cp = inMemoryStore.creatorProfiles.find((c) => c.id === data.creatorId);
      if (cp) {
        cp.profileViews = (cp.profileViews || 0) + 1;
      }

      return { ...visit };
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.storefrontVisits.filter((v) => {
        if (where.creatorId && v.creatorId !== where.creatorId) return false;
        if (where.createdAt?.gte && new Date(v.createdAt) < new Date(where.createdAt.gte)) return false;
        if (where.createdAt?.lte && new Date(v.createdAt) > new Date(where.createdAt.lte)) return false;
        return true;
      }).length;
    },
  },

  referral: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      const ref = inMemoryStore.referrals.find((r) => {
        if (where.id && r.id === where.id) return true;
        if (where.referredUserId && r.referredUserId === where.referredUserId) return true;
        return false;
      });
      if (!ref) return null;
      const clone: any = { ...ref };
      if (include?.referredUser) {
        const u = inMemoryStore.users.find((user) => user.id === ref.referredUserId);
        clone.referredUser = u ? { id: u.id, fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl } : null;
      }
      if (include?.creator) {
        const cp = inMemoryStore.creatorProfiles.find((c) => c.id === ref.creatorId);
        clone.creator = cp ? enrichCreator(cp, { user: true }) : null;
      }
      return clone;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const ref = inMemoryStore.referrals.find((r) => {
        if (where.id && r.id !== where.id) return false;
        if (where.creatorId && r.creatorId !== where.creatorId) return false;
        if (where.referredUserId && r.referredUserId !== where.referredUserId) return false;
        if (where.referralCode && r.referralCode.toUpperCase() !== where.referralCode.toUpperCase()) return false;
        if (where.status && r.status !== where.status) return false;
        return true;
      });
      if (!ref) return null;
      const clone: any = { ...ref };
      if (include?.referredUser) {
        const u = inMemoryStore.users.find((user) => user.id === ref.referredUserId);
        clone.referredUser = u ? { id: u.id, fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl } : null;
      }
      if (include?.creator) {
        const cp = inMemoryStore.creatorProfiles.find((c) => c.id === ref.creatorId);
        clone.creator = cp ? enrichCreator(cp, { user: true }) : null;
      }
      return clone;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      const list = inMemoryStore.referrals.filter((r) => {
        if (where.creatorId && r.creatorId !== where.creatorId) return false;
        if (where.status && r.status !== where.status) return false;
        if (where.referralCode && r.referralCode.toUpperCase() !== where.referralCode.toUpperCase()) return false;
        return true;
      });
      const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return sorted.map((r) => {
        const clone: any = { ...r };
        if (args?.include?.referredUser) {
          const u = inMemoryStore.users.find((user) => user.id === r.referredUserId);
          clone.referredUser = u ? { id: u.id, fullName: u.fullName, email: u.email, avatarUrl: u.avatarUrl } : null;
        }
        if (args?.include?.creator) {
          const cp = inMemoryStore.creatorProfiles.find((c) => c.id === r.creatorId);
          clone.creator = cp ? enrichCreator(cp, { user: true }) : null;
        }
        return clone;
      });
    },
    create: async (args: any) => {
      const data = args.data;
      const newRef = {
        id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        creatorId: data.creatorId,
        referredUserId: data.referredUserId,
        referralCode: data.referralCode,
        status: data.status || 'PENDING',
        bonusAmount: data.bonusAmount !== undefined ? Number(data.bonusAmount) : 25.0,
        rewardPaidAt: data.rewardPaidAt || (data.status === 'VERIFIED' ? new Date() : undefined),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.referrals.push(newRef);
      return { ...newRef };
    },
    update: async (args: any) => {
      const { where, data } = args;
      const ref = inMemoryStore.referrals.find((r) => r.id === where.id || (where.referredUserId && r.referredUserId === where.referredUserId));
      if (!ref) throw new Error('Referral record not found');
      if (data.status !== undefined) ref.status = data.status;
      if (data.bonusAmount !== undefined) ref.bonusAmount = Number(data.bonusAmount);
      if (data.rewardPaidAt !== undefined) ref.rewardPaidAt = data.rewardPaidAt;
      ref.updatedAt = new Date();
      return { ...ref };
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.referrals.filter((r) => {
        if (where.creatorId && r.creatorId !== where.creatorId) return false;
        if (where.status && r.status !== where.status) return false;
        return true;
      }).length;
    },
  },

  membershipTier: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      let tier: MemoryMembershipTier | undefined;
      if (where.id) tier = inMemoryStore.membershipTiers.find((t) => t.id === where.id);
      else if (where.creatorId_name) {
        tier = inMemoryStore.membershipTiers.find(
          (t) => t.creatorId === where.creatorId_name.creatorId && t.name.toLowerCase() === where.creatorId_name.name.toLowerCase()
        );
      }
      return tier ? enrichMembershipTier(tier, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const tier = inMemoryStore.membershipTiers.find((t) => {
        if (where.id && t.id !== where.id) return false;
        if (where.creatorId && t.creatorId !== where.creatorId) return false;
        if (where.access && t.access !== where.access) return false;
        if (where.isDefault !== undefined && t.isDefault !== where.isDefault) return false;
        if (where.isActive !== undefined && t.isActive !== where.isActive) return false;
        return true;
      });
      return tier ? enrichMembershipTier(tier, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.membershipTiers.filter((t) => {
        if (where.creatorId && t.creatorId !== where.creatorId) return false;
        if (where.access && t.access !== where.access) return false;
        if (where.isActive !== undefined && t.isActive !== where.isActive) return false;
        if (where.isDefault !== undefined && t.isDefault !== where.isDefault) return false;
        return true;
      });
      if (args?.orderBy?.sortOrder === 'asc') list.sort((a, b) => a.sortOrder - b.sortOrder);
      else if (args?.orderBy?.sortOrder === 'desc') list.sort((a, b) => b.sortOrder - a.sortOrder);
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((t) => enrichMembershipTier(t, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newTier: MemoryMembershipTier = {
        id: data.id || `tier-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        creatorId: data.creatorId,
        name: data.name,
        description: data.description,
        price: data.price !== undefined ? Number(data.price) : 0,
        currency: data.currency || 'USD',
        access: data.access || (data.price > 0 ? 'PAID' : 'FREE'),
        includedOfferIds: data.includedOfferIds || [],
        isDefault: Boolean(data.isDefault),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : inMemoryStore.membershipTiers.length + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryStore.membershipTiers.push(newTier);
      return enrichMembershipTier(newTier, include);
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const tier = inMemoryStore.membershipTiers.find((t) => t.id === where.id);
      if (!tier) throw new Error('Membership tier not found');
      if (data.name !== undefined) tier.name = data.name;
      if (data.description !== undefined) tier.description = data.description;
      if (data.price !== undefined) tier.price = Number(data.price);
      if (data.currency !== undefined) tier.currency = data.currency;
      if (data.access !== undefined) tier.access = data.access;
      if (data.includedOfferIds !== undefined) tier.includedOfferIds = data.includedOfferIds;
      if (data.isDefault !== undefined) tier.isDefault = Boolean(data.isDefault);
      if (data.isActive !== undefined) tier.isActive = Boolean(data.isActive);
      if (data.sortOrder !== undefined) tier.sortOrder = Number(data.sortOrder);
      tier.updatedAt = new Date();
      return enrichMembershipTier(tier, include);
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = inMemoryStore.membershipTiers.findIndex((t) => t.id === where.id);
      if (idx === -1) throw new Error('Membership tier not found');
      const removed = inMemoryStore.membershipTiers.splice(idx, 1)[0];
      return removed;
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.membershipTiers.filter((t) => {
        if (where.creatorId && t.creatorId !== where.creatorId) return false;
        if (where.isActive !== undefined && t.isActive !== where.isActive) return false;
        return true;
      }).length;
    },
  },

  membershipMember: {
    findUnique: async (args: any) => {
      const { where, include } = args;
      let member: MemoryMembershipMember | undefined;
      if (where.id) member = inMemoryStore.membershipMembers.find((m) => m.id === where.id);
      else if (where.userId_creatorId) {
        member = inMemoryStore.membershipMembers.find(
          (m) => m.userId === where.userId_creatorId.userId && m.creatorId === where.userId_creatorId.creatorId
        );
      }
      return member ? enrichMembershipMember(member, include) : null;
    },
    findFirst: async (args: any) => {
      const { where, include } = args;
      const member = inMemoryStore.membershipMembers.find((m) => {
        if (where.id && m.id !== where.id) return false;
        if (where.userId && m.userId !== where.userId) return false;
        if (where.creatorId && m.creatorId !== where.creatorId) return false;
        if (where.tierId && m.tierId !== where.tierId) return false;
        return true;
      });
      return member ? enrichMembershipMember(member, include) : null;
    },
    findMany: async (args?: any) => {
      const where = args?.where || {};
      let list = inMemoryStore.membershipMembers.filter((m) => {
        if (where.creatorId && m.creatorId !== where.creatorId) return false;
        if (where.userId && m.userId !== where.userId) return false;
        if (where.tierId && m.tierId !== where.tierId) return false;
        return true;
      });
      if (args?.skip) list = list.slice(args.skip);
      if (args?.take) list = list.slice(0, args.take);
      return list.map((m) => enrichMembershipMember(m, args?.include));
    },
    create: async (args: any) => {
      const { data, include } = args;
      const newMember: MemoryMembershipMember = {
        id: data.id || `mm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: data.userId,
        creatorId: data.creatorId,
        tierId: data.tierId,
        joinedAt: new Date(),
        updatedAt: new Date(),
      };
      // Ensure unique per user per creator
      const existingIdx = inMemoryStore.membershipMembers.findIndex(
        (m) => m.userId === data.userId && m.creatorId === data.creatorId
      );
      if (existingIdx >= 0) {
        inMemoryStore.membershipMembers[existingIdx].tierId = data.tierId;
        inMemoryStore.membershipMembers[existingIdx].updatedAt = new Date();
        return enrichMembershipMember(inMemoryStore.membershipMembers[existingIdx], include);
      }
      inMemoryStore.membershipMembers.push(newMember);
      return enrichMembershipMember(newMember, include);
    },
    update: async (args: any) => {
      const { where, data, include } = args;
      const member = inMemoryStore.membershipMembers.find((m) => {
        if (where.id && m.id === where.id) return true;
        if (where.userId_creatorId && m.userId === where.userId_creatorId.userId && m.creatorId === where.userId_creatorId.creatorId) return true;
        return false;
      });
      if (!member) throw new Error('Membership member record not found');
      if (data.tierId !== undefined) member.tierId = data.tierId;
      if (data.status !== undefined) member.status = data.status;
      if (data.bannedAt !== undefined) member.bannedAt = data.bannedAt;
      if (data.banReason !== undefined) member.banReason = data.banReason;
      member.updatedAt = new Date();
      return enrichMembershipMember(member, include);
    },
    upsert: async (args: any) => {
      const { where, create, update, include } = args;
      const existing = inMemoryStore.membershipMembers.find((m) => {
        if (where.id && m.id === where.id) return true;
        if (where.userId_creatorId && m.userId === where.userId_creatorId.userId && m.creatorId === where.userId_creatorId.creatorId) return true;
        return false;
      });
      if (existing) {
        if (update.tierId !== undefined) existing.tierId = update.tierId;
        existing.updatedAt = new Date();
        return enrichMembershipMember(existing, include);
      }
      return (memoryDb as any).membershipMember.create({ data: create, include });
    },
    delete: async (args: any) => {
      const { where } = args;
      const idx = inMemoryStore.membershipMembers.findIndex((m) => {
        if (where.id && m.id === where.id) return true;
        if (where.userId_creatorId && m.userId === where.userId_creatorId.userId && m.creatorId === where.userId_creatorId.creatorId) return true;
        return false;
      });
      if (idx === -1) throw new Error('Membership member record not found');
      return inMemoryStore.membershipMembers.splice(idx, 1)[0];
    },
    count: async (args?: any) => {
      const where = args?.where || {};
      return inMemoryStore.membershipMembers.filter((m) => {
        if (where.creatorId && m.creatorId !== where.creatorId) return false;
        if (where.tierId && m.tierId !== where.tierId) return false;
        if (where.userId && m.userId !== where.userId) return false;
        return true;
      }).length;
    },
  },

  $transaction: async (arg: any) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    if (typeof arg === 'function') {
      return arg(memoryDb);
    }
    return arg;
  },

  $queryRaw: async (..._args: any[]) => {
    if (isDbDisconnected) {
      throw new Error("Can't reach database server");
    }
    return [{ '?column?': 1 }];
  },
};

// Create resilient proxy that intercepts all model calls and routes to inMemoryStore when DB is unavailable
function createModelProxy(modelName: string) {
  const memoryModel = (memoryDb as any)[modelName];

  return new Proxy({}, {
    get(_target, prop: string) {
      return async (...args: any[]) => {
        // If we already know DB is unreachable, execute in-memory directly
        if (isDbDisconnected) {
          if (memoryModel && typeof memoryModel[prop] === 'function') {
            return memoryModel[prop](...args);
          }
        }

        try {
          const realModel = (realPrisma as any)[modelName];
          if (realModel && typeof realModel[prop] === 'function') {
            return await realModel[prop](...args);
          }
        } catch (err: any) {
          if (isConnectionError(err)) {
            isDbDisconnected = true;
            if (memoryModel && typeof memoryModel[prop] === 'function') {
              return memoryModel[prop](...args);
            }
          }
          throw err;
        }

        if (memoryModel && typeof memoryModel[prop] === 'function') {
          return memoryModel[prop](...args);
        }
      };
    },
  });
}

export const prisma: any = new Proxy(realPrisma, {
  get(target, prop: string) {
    if (prop === '$transaction') {
      return async (arg: any) => {
        if (isDbDisconnected) {
          return memoryDb.$transaction(arg);
        }
        try {
          return await (target as any).$transaction(arg);
        } catch (err: any) {
          if (isConnectionError(err)) {
            isDbDisconnected = true;
            return memoryDb.$transaction(arg);
          }
          throw err;
        }
      };
    }

    if (prop === '$queryRaw') {
      return async (...args: any[]) => {
        return (target as any).$queryRaw(...args);
      };
    }

    if (typeof prop === 'string' && prop in memoryDb) {
      return createModelProxy(prop);
    }

    return (target as any)[prop];
  },
});

export default prisma;
