import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { GamificationService, LeaderboardWindow } from '../services/gamification.service.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
import { PointsAction } from '../config/inMemoryDb.js';
import { prisma } from '../config/db.js';

// ---------------------------------------------------------------------------
// Helper: resolve creatorId from param (id | handle | userId)
// ---------------------------------------------------------------------------
async function resolveCreatorId(identifier: string): Promise<string | null> {
  // Try in-memory first
  const mem = inMemoryStore.creatorProfiles.find(
    (p) => p.id === identifier || p.handle === identifier || p.userId === identifier
  );
  if (mem) return mem.id;

  // Fallback to Prisma
  try {
    const creator = await prisma.creatorProfile.findFirst({
      where: { OR: [{ id: identifier }, { handle: identifier }, { userId: identifier }] },
      select: { id: true },
    });
    return creator?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET /creators/:id/leaderboard?window=7d|30d|all
// ---------------------------------------------------------------------------
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const identifier = Array.isArray(rawId) ? rawId[0] : rawId;
    const windowParam = (req.query.window as string) || '7d';

    const validWindows: LeaderboardWindow[] = ['7d', '30d', 'all'];
    const window: LeaderboardWindow = validWindows.includes(windowParam as LeaderboardWindow)
      ? (windowParam as LeaderboardWindow)
      : '7d';

    const creatorId = await resolveCreatorId(identifier);
    if (!creatorId) {
      res.status(404).json({ success: false, error: `Creator "${identifier}" not found.` });
      return;
    }

    const entries = await GamificationService.getLeaderboard(creatorId, window);

    res.status(200).json({
      success: true,
      data: {
        creatorId,
        window,
        generatedAt: new Date().toISOString(),
        totalParticipants: entries.length,
        entries,
      },
    });
  } catch (error: any) {
    console.error('[getLeaderboard Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error fetching leaderboard.' });
  }
};

// ---------------------------------------------------------------------------
// GET /creators/:id/gamification/rules
// ---------------------------------------------------------------------------
export const getPointsRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const identifier = Array.isArray(rawId) ? rawId[0] : rawId;

    const creatorId = await resolveCreatorId(identifier);
    if (!creatorId) {
      res.status(404).json({ success: false, error: `Creator "${identifier}" not found.` });
      return;
    }

    const rules = GamificationService.getPointsRules(creatorId);
    const levels = inMemoryStore.userLevels
      .filter((l) => l.creatorId === creatorId || l.creatorId === null)
      .sort((a, b) => a.minPoints - b.minPoints);

    res.status(200).json({
      success: true,
      data: {
        creatorId,
        rules: rules.map((r) => ({
          action: r.action,
          points: r.points,
          isActive: r.isActive,
          scope: r.creatorId === creatorId ? 'creator-specific' : 'global-default',
        })),
        levels,
      },
    });
  } catch (error: any) {
    console.error('[getPointsRules Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error fetching rules.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /creators/:id/gamification/rules — creator-only
// Body: { action: PointsAction, points: number }[]
// ---------------------------------------------------------------------------
export const upsertPointsRules = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const rawId = req.params.id;
    const identifier = Array.isArray(rawId) ? rawId[0] : rawId;
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: `Creator "${identifier}" not found.` });
      return;
    }

    // Verify caller is the creator or admin
    const creatorProfile = inMemoryStore.creatorProfiles.find((p) => p.id === creatorId);
    const isOwner = creatorProfile?.userId === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, error: 'Forbidden: Only the creator or admin can update rules.' });
      return;
    }

    const updates: Array<{ action: string; points: number }> = Array.isArray(req.body)
      ? req.body
      : req.body.rules ?? [];

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'Body must be an array of { action, points } objects.' });
      return;
    }

    const validActions: PointsAction[] = ['post', 'reply', 'like-received', 'lesson-complete', 'event-attend'];
    const saved: Array<{ action: PointsAction; points: number }> = [];

    for (const { action, points } of updates) {
      if (!validActions.includes(action as PointsAction)) continue;
      if (typeof points !== 'number' || points < 0 || points > 1000) continue;
      const rule = GamificationService.upsertPointsRule(creatorId, action as PointsAction, points);
      saved.push({ action: rule.action, points: rule.points });
    }

    res.status(200).json({
      success: true,
      message: `Updated ${saved.length} rule(s) for creator community.`,
      data: { creatorId, updated: saved },
    });
  } catch (error: any) {
    console.error('[upsertPointsRules Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error updating rules.' });
  }
};

// ---------------------------------------------------------------------------
// GET /creators/:id/gamification/me — authenticated user stats
// ---------------------------------------------------------------------------
export const getMyGamificationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const rawId = req.params.id;
    const identifier = Array.isArray(rawId) ? rawId[0] : rawId;
    const creatorId = await resolveCreatorId(identifier);

    if (!creatorId) {
      res.status(404).json({ success: false, error: `Creator "${identifier}" not found.` });
      return;
    }

    const stats = GamificationService.getUserStats(req.user.userId, creatorId);

    // Rank: find position on all-time leaderboard
    const allTimeBoard = await GamificationService.getLeaderboard(creatorId, 'all');
    const myEntry = allTimeBoard.find((e) => e.userId === req.user!.userId);

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        rank: myEntry?.rank ?? null,
        totalParticipants: allTimeBoard.length,
      },
    });
  } catch (error: any) {
    console.error('[getMyGamificationStats Error]:', error);
    res.status(500).json({ success: false, error: 'Internal server error fetching your stats.' });
  }
};
