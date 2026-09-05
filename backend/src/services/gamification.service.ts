import { inMemoryStore, PointsAction, MemoryPointsRule, MemoryUserLevel, MemoryPointsTransaction } from '../config/inMemoryDb.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  points: number;          // points in the requested window
  totalAllTimePoints: number;
  level: {
    tierName: string;
    minPoints: number;
    badgeColor: string;
  };
  breakdown: {
    post: number;
    reply: number;
    'like-received': number;
    'lesson-complete': number;
    'event-attend': number;
  };
}

export type LeaderboardWindow = '7d' | '30d' | 'all';

export interface AwardResult {
  userId: string;
  creatorId: string;
  action: PointsAction;
  pointsAwarded: number;
  totalCommunityPoints: number;
  totalGlobalPoints: number;
  level: {
    tierName: string;
    minPoints: number;
    badgeColor: string;
  };
  alreadyAwarded: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the effective rule: creator-specific first, then global.
 */
function resolveRule(creatorId: string, action: PointsAction): MemoryPointsRule | undefined {
  const creatorRule = inMemoryStore.pointsRules.find(
    (r) => r.creatorId === creatorId && r.action === action && r.isActive
  );
  if (creatorRule) return creatorRule;
  return inMemoryStore.pointsRules.find(
    (r) => r.creatorId === null && r.action === action && r.isActive
  );
}

/**
 * Resolve the highest tier the user qualifies for, from creator-specific tiers
 * falling back to global tiers.
 */
function resolveLevel(totalPoints: number, creatorId: string): MemoryUserLevel {
  const tiers = [
    ...inMemoryStore.userLevels.filter((l) => l.creatorId === creatorId),
    ...inMemoryStore.userLevels.filter((l) => l.creatorId === null),
  ].filter((l) => l.minPoints <= totalPoints);

  if (tiers.length === 0) {
    return { id: 'fallback', creatorId: null, tierName: 'Beginner', minPoints: 0, badgeColor: '#6B7280' };
  }

  return tiers.reduce((best, t) => (t.minPoints > best.minPoints ? t : best));
}

/**
 * Sum community points for a user within a time window.
 */
function sumInWindow(txns: MemoryPointsTransaction[], userId: string, creatorId: string, since: Date): number {
  return txns
    .filter((t) => t.userId === userId && t.creatorId === creatorId && t.createdAt >= since)
    .reduce((s, t) => s + t.points, 0);
}

/**
 * Sum all-time community points for a user.
 */
function sumAllTime(txns: MemoryPointsTransaction[], userId: string, creatorId: string): number {
  return txns
    .filter((t) => t.userId === userId && t.creatorId === creatorId)
    .reduce((s, t) => s + t.points, 0);
}

// ---------------------------------------------------------------------------
// GamificationService
// ---------------------------------------------------------------------------

export const GamificationService = {
  /**
   * Award points to a user for a qualifying action within a creator's community.
   * For lesson-complete: de-duplication is enforced (first-time only per lesson).
   * All other actions are always awarded.
   */
  async awardPoints(
    userId: string,
    creatorId: string,
    action: PointsAction,
    metadata?: Record<string, unknown>
  ): Promise<AwardResult> {
    const txns = inMemoryStore.pointsTransactions;

    // Lesson-complete deduplication: skip if same lessonId already awarded in this community
    if (action === 'lesson-complete' && metadata?.lessonId) {
      const alreadyAwarded = txns.some(
        (t) =>
          t.userId === userId &&
          t.creatorId === creatorId &&
          t.action === 'lesson-complete' &&
          t.metadata?.lessonId === metadata.lessonId
      );

      if (alreadyAwarded) {
        const totalCommunityPoints = sumAllTime(txns, userId, creatorId);
        const globalUser = inMemoryStore.users.find((u) => u.id === userId);
        const level = resolveLevel(totalCommunityPoints, creatorId);
        console.log(`[GamificationService] Skipped lesson-complete (already awarded) → user:${userId}`);
        return {
          userId,
          creatorId,
          action,
          pointsAwarded: 0,
          totalCommunityPoints,
          totalGlobalPoints: globalUser?.points ?? 0,
          level: { tierName: level.tierName, minPoints: level.minPoints, badgeColor: level.badgeColor },
          alreadyAwarded: true,
        };
      }
    }

    // Resolve point value
    const rule = resolveRule(creatorId, action);
    const pts = rule?.points ?? 0;

    if (pts === 0) {
      console.warn(`[GamificationService] No active rule for action="${action}" creatorId="${creatorId}"`);
    }

    // Append transaction
    const newTxn: MemoryPointsTransaction = {
      id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      creatorId,
      action,
      points: pts,
      metadata,
      createdAt: new Date(),
    };
    txns.push(newTxn);

    // Increment global user.points
    const globalUser = inMemoryStore.users.find((u) => u.id === userId);
    if (globalUser) {
      globalUser.points += pts;
    }

    const totalCommunityPoints = sumAllTime(txns, userId, creatorId);
    const level = resolveLevel(totalCommunityPoints, creatorId);

    console.log(
      `[GamificationService] Awarded ${pts} pts (${action}) → user:${userId} | community:${creatorId} | total:${totalCommunityPoints}`
    );

    return {
      userId,
      creatorId,
      action,
      pointsAwarded: pts,
      totalCommunityPoints,
      totalGlobalPoints: globalUser?.points ?? pts,
      level: { tierName: level.tierName, minPoints: level.minPoints, badgeColor: level.badgeColor },
      alreadyAwarded: false,
    };
  },

  /**
   * Build a ranked leaderboard for a creator's community.
   * window: '7d' = last 7 days, '30d' = last 30 days, 'all' = all-time.
   */
  async getLeaderboard(creatorId: string, window: LeaderboardWindow): Promise<LeaderboardEntry[]> {
    const txns = inMemoryStore.pointsTransactions.filter((t) => t.creatorId === creatorId);

    const now = new Date();
    const windowMs = window === '7d' ? 7 * 24 * 60 * 60 * 1000 : window === '30d' ? 30 * 24 * 60 * 60 * 1000 : null;
    const since = windowMs ? new Date(now.getTime() - windowMs) : new Date(0);

    // Aggregate points per user in the window
    const userPointsMap = new Map<string, number>();
    for (const t of txns) {
      if (t.createdAt >= since) {
        userPointsMap.set(t.userId, (userPointsMap.get(t.userId) ?? 0) + t.points);
      }
    }

    if (userPointsMap.size === 0) return [];

    // Build entries
    const entries: LeaderboardEntry[] = [];
    for (const [userId, points] of userPointsMap) {
      const user = inMemoryStore.users.find((u) => u.id === userId);
      if (!user) continue;

      const allTime = sumAllTime(txns, userId, creatorId);
      const level = resolveLevel(allTime, creatorId);

      // Per-action breakdown in window
      const breakdown = { post: 0, reply: 0, 'like-received': 0, 'lesson-complete': 0, 'event-attend': 0 };
      for (const t of txns) {
        if (t.userId === userId && t.createdAt >= since) {
          breakdown[t.action as PointsAction] += t.points;
        }
      }

      entries.push({
        rank: 0, // set after sort
        userId,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        points,
        totalAllTimePoints: allTime,
        level: { tierName: level.tierName, minPoints: level.minPoints, badgeColor: level.badgeColor },
        breakdown,
      });
    }

    // Sort descending by window points, then all-time as tiebreaker
    entries.sort((a, b) =>
      b.points !== a.points ? b.points - a.points : b.totalAllTimePoints - a.totalAllTimePoints
    );

    // Assign ranks
    entries.forEach((e, i) => { e.rank = i + 1; });

    return entries;
  },

  /**
   * Resolve the current tier for a given total points value in a creator's community.
   */
  getUserLevel(totalPoints: number, creatorId: string) {
    return resolveLevel(totalPoints, creatorId);
  },

  /**
   * Get all points rules for a creator (creator-specific merged with global defaults).
   */
  getPointsRules(creatorId: string): MemoryPointsRule[] {
    const actions: PointsAction[] = ['post', 'reply', 'like-received', 'lesson-complete', 'event-attend'];
    return actions.map((action) => {
      const rule = resolveRule(creatorId, action);
      return rule ?? { id: `default-${action}`, creatorId: null, action, points: 0, isActive: false };
    });
  },

  /**
   * Upsert a creator-specific points rule.
   */
  upsertPointsRule(creatorId: string, action: PointsAction, points: number): MemoryPointsRule {
    const existing = inMemoryStore.pointsRules.find(
      (r) => r.creatorId === creatorId && r.action === action
    );
    if (existing) {
      existing.points = points;
      existing.isActive = true;
      return existing;
    }
    const newRule: MemoryPointsRule = {
      id: `rule-${creatorId}-${action}-${Date.now()}`,
      creatorId,
      action,
      points,
      isActive: true,
    };
    inMemoryStore.pointsRules.push(newRule);
    return newRule;
  },

  /**
   * Get a user's total community points and level for a given creator.
   */
  getUserStats(userId: string, creatorId: string) {
    const txns = inMemoryStore.pointsTransactions;
    const totalCommunityPoints = sumAllTime(txns, userId, creatorId);
    const last7d = sumInWindow(txns, userId, creatorId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const last30d = sumInWindow(txns, userId, creatorId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const level = resolveLevel(totalCommunityPoints, creatorId);
    const globalUser = inMemoryStore.users.find((u) => u.id === userId);

    const breakdown = { post: 0, reply: 0, 'like-received': 0, 'lesson-complete': 0, 'event-attend': 0 };
    txns
      .filter((t) => t.userId === userId && t.creatorId === creatorId)
      .forEach((t) => { breakdown[t.action as PointsAction] += t.points; });

    return {
      userId,
      creatorId,
      totalCommunityPoints,
      last7dPoints: last7d,
      last30dPoints: last30d,
      globalPoints: globalUser?.points ?? 0,
      level: { tierName: level.tierName, minPoints: level.minPoints, badgeColor: level.badgeColor },
      breakdown,
    };
  },
};
