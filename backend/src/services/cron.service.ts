/**
 * Ascend Scheduled Job & Background Cron Service
 * Handles periodic automated sequences including "Complete Your Profile" creator nudges (24h+ inactive/incomplete).
 */

import { prisma } from '../config/db.js';
import { EmailService } from './email.service.js';

export interface NudgeRecord {
  creatorId: string;
  creatorName: string;
  email: string;
  missingFields: string[];
  sentAt: string;
  daysPending: number;
}

export class CronService {
  private static intervalTimer: NodeJS.Timeout | null = null;
  private static lastRunAt: Date | null = null;
  private static nudgedCreatorsMap: Map<string, number> = new Map(); // creatorId -> lastNudgeTimestamp
  private static nudgeHistory: NudgeRecord[] = [];
  private static isRunning: boolean = false;

  /**
   * Initializes background schedule on server startup
   * Runs check every 1 hour (3600000 ms) + initial deferred startup check
   */
  static start(intervalMs: number = 60 * 60 * 1000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[CronService] ⏰ Automated background scheduler initialized (Interval: 1h).');

    // Run initial scan 5 seconds after startup
    setTimeout(() => {
      this.checkIncompleteCreatorProfiles().catch((err) =>
        console.error('[CronService Startup Error]:', err)
      );
    }, 5000);

    // Set recurring timer
    this.intervalTimer = setInterval(() => {
      this.checkIncompleteCreatorProfiles().catch((err) =>
        console.error('[CronService Scheduled Error]:', err)
      );
    }, intervalMs);
  }

  /**
   * Stops scheduler gracefully
   */
  static stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    console.log('[CronService] ⏹️ Background scheduler stopped.');
  }

  /**
   * Evaluates all Creator Profiles and sends a nudge email if incomplete after 24h
   */
  static async checkIncompleteCreatorProfiles(options?: { forceCheckAll?: boolean }): Promise<{
    checkedCount: number;
    incompleteCount: number;
    nudgedCount: number;
    details: NudgeRecord[];
  }> {
    this.lastRunAt = new Date();
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    let checkedCount = 0;
    let incompleteCount = 0;
    const newlyNudged: NudgeRecord[] = [];

    try {
      const creators = await prisma.creatorProfile.findMany({
        include: { user: true, offers: true },
      });

      checkedCount = creators.length;

      for (const cp of creators) {
        if (!cp.user || !cp.user.email) continue;

        const profileAgeMs = now - new Date(cp.createdAt).getTime();
        const isOlderThan24h = profileAgeMs >= twentyFourHoursMs || options?.forceCheckAll;

        if (!isOlderThan24h) continue;

        // Evaluate Missing Profile Components
        const missingFields: string[] = [];

        if (!cp.bio || cp.bio.trim().length < 20) {
          missingFields.push('Biography & Coaching Methodology (min 20 chars)');
        }

        if (!cp.headline || cp.headline.trim() === 'Ascend Coach Partner') {
          missingFields.push('Specific Coaching Title & Niche Headline');
        }

        if (!cp.specialtyTags || cp.specialtyTags.length === 0) {
          missingFields.push('Specialty Tags & Category Focus (e.g. Hypertrophy, Biomechanics)');
        }

        if (
          (!cp.credentials || cp.credentials.length === 0) &&
          (!cp.verificationDocs || cp.verificationDocs.length === 0) &&
          cp.verificationStatus === 'PENDING'
        ) {
          missingFields.push('Coaching Accreditations / Certifications Upload (CSCS/MD/NASM)');
        }

        if (!cp.offers || cp.offers.length === 0) {
          missingFields.push('At least 1 Published Offer or Course (Video syllabus or 1:1 slot)');
        }

        if (missingFields.length > 0) {
          incompleteCount++;

          // Check if nudged within the last 7 days to prevent email fatigue
          const lastNudged = this.nudgedCreatorsMap.get(cp.id) || 0;
          const canSendNudge = now - lastNudged > sevenDaysMs || options?.forceCheckAll;

          if (canSendNudge) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const profileLink = `${frontendUrl}/dashboard`;
            const daysPending = Math.max(1, Math.floor(profileAgeMs / twentyFourHoursMs));

            await EmailService.sendCreatorProfileNudgeEmail(cp.user.email, {
              creatorName: cp.user.fullName || cp.handle,
              missingFields,
              profileLink,
              daysPending,
            }).catch((err) => console.warn(`[CronService Nudge Warning ${cp.id}]:`, err));

            const nudgeRecord: NudgeRecord = {
              creatorId: cp.id,
              creatorName: cp.user.fullName || cp.handle,
              email: cp.user.email,
              missingFields,
              sentAt: new Date().toISOString(),
              daysPending,
            };

            this.nudgedCreatorsMap.set(cp.id, now);
            this.nudgeHistory.unshift(nudgeRecord);
            newlyNudged.push(nudgeRecord);

            console.log(
              `[CronService] 📬 Profile Nudge sent to Coach ${nudgeRecord.creatorName} (${nudgeRecord.email}) - Missing: ${missingFields.length} items.`
            );
          }
        }
      }
    } catch (err: any) {
      console.error('[CronService Scan Error]:', err);
    }

    return {
      checkedCount,
      incompleteCount,
      nudgedCount: newlyNudged.length,
      details: newlyNudged,
    };
  }

  /**
   * Returns telemetry & status for admin monitor
   */
  static getStatus(): {
    isRunning: boolean;
    lastRunAt: string | null;
    totalNudgesSent: number;
    history: NudgeRecord[];
  } {
    return {
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : null,
      totalNudgesSent: this.nudgeHistory.length,
      history: this.nudgeHistory.slice(0, 50),
    };
  }
}
