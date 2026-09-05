/**
 * Ascend Transactional Email Service
 * Integrates Resend / SendGrid API with development logger fallback.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static resendApiKey = process.env.RESEND_API_KEY;
  private static sendgridApiKey = process.env.SENDGRID_API_KEY;
  private static fromEmail = process.env.EMAIL_FROM || 'notifications@ascend.fit';

  /**
   * Send raw transactional email
   */
  static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, subject, html, text } = payload;

    // Resend Provider
    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Ascend <${this.fromEmail}>`,
            to,
            subject,
            html,
            text,
          }),
        });

        const data: any = await response.json();
        if (response.ok) {
          console.log(`[EmailService] Resend email dispatched to ${to} (ID: ${data.id})`);
          return { success: true, messageId: data.id };
        }
        console.warn(`[EmailService] Resend API error:`, data);
      } catch (err: any) {
        console.error(`[EmailService] Resend network error:`, err.message);
      }
    }

    // SendGrid Provider
    if (this.sendgridApiKey) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: this.fromEmail, name: 'Ascend Platform' },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });

        if (response.ok) {
          console.log(`[EmailService] SendGrid email dispatched to ${to}`);
          return { success: true, messageId: `sg-${Date.now()}` };
        }
      } catch (err: any) {
        console.error(`[EmailService] SendGrid error:`, err.message);
      }
    }

    // Development fallback logger (Simulated Delivery)
    console.log('\n================== [TRANSACTIONAL EMAIL DISPATCH] ==================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: Ascend <${this.fromEmail}>`);
    console.log(`Preview: ${text || subject}`);
    console.log('=====================================================================\n');

    return {
      success: true,
      messageId: `mock-email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
  }

  /**
   * 1. Welcome Email on Signup (Buyer & Creator sequences)
   */
  static async sendWelcomeEmail(
    to: string,
    data: {
      name: string;
      role: 'BUYER' | 'CREATOR' | 'ADMIN';
      loginUrl?: string;
    }
  ) {
    const isCreator = data.role === 'CREATOR';
    const subject = isCreator
      ? `Welcome to Ascend, Coach ${data.name}! Let's Build Your Storefront 🚀`
      : `Welcome to Ascend, ${data.name}! Your Journey to Physical Mastery Begins 🌟`;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const destinationUrl = isCreator ? `${frontendUrl}/dashboard` : `${frontendUrl}/discover`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">Elite Physical Mastery & Coaching Ecosystem</p>
        </div>

        <div style="background: #16171A; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <h2 style="color: #F7F4EF; font-size: 22px; margin-top: 0; line-height: 1.3;">
            Welcome to the Community, ${data.name}! 👋
          </h2>
          
          <p style="color: rgba(247,244,239,0.85); line-height: 1.6; font-size: 14px;">
            ${
              isCreator
                ? `You've taken the first step to monetizing your proprietary training methodologies, video syllabi, and 1-on-1 consultations with verified high-intent athletes.`
                : `You've joined an exclusive platform dedicated to verified sports scientists, powerlifting biomechanists, and elite coaches. No gimmicks—only periodized, evidence-based results.`
            }
          </p>

          <!-- 3 Step Getting Started Strip -->
          <div style="margin: 25px 0; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #B8703F; margin-bottom: 15px;">
              ${isCreator ? '3 Quick Steps to Launch Your Storefront' : 'How to Make the Most of Ascend'}
            </p>

            ${
              isCreator
                ? `
              <div style="display: flex; margin-bottom: 12px;">
                <span style="background: rgba(184,112,63,0.2); color: #B8703F; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 12px; flex-shrink: 0;">1</span>
                <span style="font-size: 13px; color: rgba(247,244,239,0.8);"><strong>Complete Your Bio & Credentials:</strong> Submit your CSCS/MD accreditations to earn your Verified Coach badge.</span>
              </div>
              <div style="display: flex; margin-bottom: 12px;">
                <span style="background: rgba(184,112,63,0.2); color: #B8703F; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 12px; flex-shrink: 0;">2</span>
                <span style="font-size: 13px; color: rgba(247,244,239,0.8);"><strong>Publish an Offer or Masterclass:</strong> Create a video course, 1:1 coaching sprint, or community cohort.</span>
              </div>
              <div style="display: flex;">
                <span style="background: rgba(184,112,63,0.2); color: #B8703F; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 12px; flex-shrink: 0;">3</span>
                <span style="font-size: 13px; color: rgba(247,244,239,0.8);"><strong>Share Your Referral Code:</strong> Earn a flat $25 bonus for every athlete or fellow coach who registers with your link.</span>
              </div>
            `
                : `
              <div style="display: flex; margin-bottom: 12px;">
                <span style="background: rgba(110,139,111,0.2); color: #6E8B6F; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 12px; flex-shrink: 0;">1</span>
                <span style="font-size: 13px; color: rgba(247,244,239,0.8);"><strong>Discover Vetted Coaches:</strong> Explore verified profiles in biomechanics, sports nutrition, and Olympic lifting.</span>
              </div>
              <div style="display: flex; margin-bottom: 12px;">
                <span style="background: rgba(110,139,111,0.2); color: #6E8B6F; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 12px; flex-shrink: 0;">2</span>
                <span style="font-size: 13px; color: rgba(247,244,239,0.8);"><strong>Interactive Video Classroom:</strong> Access streamable course syllabi with auto-generated certificates upon completion.</span>
              </div>
              <div style="display: flex;">
                <span style="background: rgba(110,139,111,0.2); color: #6E8B6F; font-weight: bold; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 12px; flex-shrink: 0;">3</span>
                <span style="font-size: 13px; color: rgba(247,244,239,0.8);"><strong>Book 1:1 Video Consultations:</strong> Direct Google Meet bookings synced to your calendar.</span>
              </div>
            `
            }
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${destinationUrl}" style="display: inline-block; background: #B8703F; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 14px rgba(184,112,63,0.4);">
              ${isCreator ? 'Open Creator Studio &rarr;' : 'Explore Coaches & Programs &rarr;'}
            </a>
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Ascend Inc. • Need assistance? Reach out to support@ascend.fit anytime.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: `Welcome to Ascend, ${data.name}! Access your account at ${destinationUrl}`,
    });
  }

  /**
   * 2. "Complete Your Profile" Nudge Email (Sent after 24h of inactivity if profile incomplete)
   */
  static async sendCreatorProfileNudgeEmail(
    to: string,
    data: {
      creatorName: string;
      missingFields: string[];
      profileLink: string;
      daysPending?: number;
    }
  ) {
    const subject = `⚠️ Coach ${data.creatorName}: Complete Your Ascend Storefront to Start Accepting Clients`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">Creator Studio Growth Concierge</p>
        </div>

        <div style="background: #16171A; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <div style="display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #F59E0B; margin-bottom: 15px;">
            Action Required: Storefront Draft
          </div>

          <h2 style="color: #F7F4EF; font-size: 20px; margin-top: 0; line-height: 1.3;">
            Hi Coach ${data.creatorName}, your storefront is almost ready! ⏱️
          </h2>

          <p style="color: rgba(247,244,239,0.8); line-height: 1.6; font-size: 14px;">
            We noticed your creator profile has been active for ${data.daysPending || 1} day(s), but athletes cannot discover your offers yet because your profile is missing key details:
          </p>

          <!-- Missing Fields Checklist -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 12px; font-weight: bold; color: rgba(247,244,239,0.9); text-transform: uppercase; letter-spacing: 0.5px;">
              Pending Setup Items:
            </p>
            <ul style="margin: 0; padding-left: 18px; color: #E06D53; font-size: 13px; line-height: 1.8;">
              ${data.missingFields.map((field) => `<li><span style="color: rgba(247,244,239,0.85);">${field}</span></li>`).join('')}
            </ul>
          </div>

          <p style="color: rgba(247,244,239,0.7); font-size: 13px; line-height: 1.5;">
            Verified coaches on Ascend receive <strong>4.8x more organic profile visits</strong> and higher checkout conversion rates once their credentials and intro video are uploaded.
          </p>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${data.profileLink}" style="display: inline-block; background: #B8703F; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 30px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 14px rgba(184,112,63,0.35);">
              Complete Your Creator Profile &rarr;
            </a>
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Ascend Inc. • Need guidance? Schedule an onboarding session with creator support at support@ascend.fit
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: `Hi Coach ${data.creatorName}, please complete your Ascend creator profile to start accepting clients: ${data.profileLink}. Missing: ${data.missingFields.join(', ')}`,
    });
  }

  /**
   * 3. Payment Success & Itemized Tax Invoice / Receipt Email
   */
  static async sendPaymentSuccessEmail(
    to: string,
    data: {
      studentName: string;
      offerTitle: string;
      creatorName: string;
      amount: number | string;
      currency?: string;
      invoiceId: string;
      downloadUrl?: string;
      taxBreakdown?: {
        baseAmount: number;
        gstAmount: number;
        discountAmount?: number;
      };
    }
  ) {
    const currency = data.currency || 'USD';
    const subject = `Payment Confirmed: Tax Invoice & Access to "${data.offerTitle}" 🧾`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const classroomUrl = `${frontendUrl}/my-space`;
    const invoiceDownload = data.downloadUrl
      ? (data.downloadUrl.startsWith('http') ? data.downloadUrl : `${frontendUrl}${data.downloadUrl}`)
      : `${frontendUrl}/api/invoices/${data.invoiceId}/download`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">Official Payment Receipt & Tax Invoice</p>
        </div>
        
        <div style="background: #16171A; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-b: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
            <span style="color: #6E8B6F; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              ✓ Payment Verified
            </span>
            <span style="font-family: monospace; font-size: 12px; color: rgba(247,244,239,0.5);">
              Invoice #${data.invoiceId}
            </span>
          </div>

          <h2 style="color: #F7F4EF; font-size: 20px; margin-top: 0;">
            Thank you, ${data.studentName}!
          </h2>
          <p style="color: rgba(247,244,239,0.8); line-height: 1.6; font-size: 14px;">
            Your transaction for <strong>${data.offerTitle}</strong> with Coach <strong>${data.creatorName}</strong> has been confirmed. Full classroom access is now unlocked on your account.
          </p>

          <!-- Itemized Receipt Box -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: rgba(247,244,239,0.7);">
              <span>Item / Program</span>
              <span style="color: #ffffff; font-weight: bold;">${data.offerTitle}</span>
            </div>
            ${
              data.taxBreakdown?.discountAmount && data.taxBreakdown.discountAmount > 0
                ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #6E8B6F;">
              <span>Coupon Promo Discount</span>
              <span>-$${data.taxBreakdown.discountAmount.toFixed(2)}</span>
            </div>
            `
                : ''
            }
            ${
              data.taxBreakdown
                ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: rgba(247,244,239,0.7);">
              <span>Taxable Base (SAC 999293)</span>
              <span>$${data.taxBreakdown.baseAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: rgba(247,244,239,0.7);">
              <span>GST (18% CGST + SGST)</span>
              <span>$${data.taxBreakdown.gstAmount.toFixed(2)}</span>
            </div>
            `
                : ''
            }
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px; font-size: 15px; font-weight: bold;">
              <span style="color: #F7F4EF;">Total Paid</span>
              <span style="color: #B8703F; font-family: monospace;">$${data.amount} ${currency}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${classroomUrl}" style="display: inline-block; background: #B8703F; color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 30px; font-weight: bold; font-size: 14px; margin-right: 10px; box-shadow: 0 4px 12px rgba(184,112,63,0.3);">
              Enter Your Classroom &rarr;
            </a>
            <a href="${invoiceDownload}" target="_blank" style="display: inline-block; background: rgba(255,255,255,0.06); color: #F7F4EF; text-decoration: none; padding: 12px 22px; border-radius: 30px; font-weight: 500; font-size: 13px; border: 1px solid rgba(255,255,255,0.15);">
              ⬇ Download Tax Invoice (PDF)
            </a>
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Ascend Inc. • Secured by Razorpay & Stripe • 24/7 Concierge Support • 18% GST Compliant
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: `Payment confirmed for ${data.offerTitle} ($${data.amount} ${currency}). Invoice #: ${data.invoiceId}. Download invoice: ${invoiceDownload}`,
    });
  }

  /**
   * 4. Booking Confirmed 1-on-1 Session Email with Google Meet Link
   */
  static async sendBookingConfirmedEmail(
    to: string,
    data: {
      clientName: string;
      creatorName: string;
      offerTitle: string;
      sessionDate: string;
      sessionTime: string;
      meetLink: string;
    }
  ) {
    const subject = `Session Confirmed: 1-on-1 with Coach ${data.creatorName} [Google Meet]`;
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Ascend 1:1: ${data.offerTitle} with Coach ${data.creatorName}`
    )}&details=${encodeURIComponent(
      `Ascend 1-on-1 Coaching Session\nCoach: ${data.creatorName}\nAthlete: ${data.clientName}\n\nGoogle Meet Link: ${data.meetLink}`
    )}&location=${encodeURIComponent(data.meetLink)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">1-on-1 Private Video Consultation</p>
        </div>

        <div style="background: #16171A; padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <h2 style="color: #6E8B6F; font-size: 20px; margin-top: 0;">Your Google Meet Session is Confirmed! 🗓️</h2>
          <p style="color: rgba(247,244,239,0.8); line-height: 1.6; font-size: 14px;">
            Hello ${data.clientName}, your 1-on-1 coaching consultation for <strong>${data.offerTitle}</strong> with Coach <strong>${data.creatorName}</strong> has been secured.
          </p>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: rgba(247,244,239,0.9);">
              📅 <strong>Date:</strong> ${data.sessionDate}
            </p>
            <p style="margin: 0 0 8px; font-size: 13px; color: rgba(247,244,239,0.9);">
              ⏰ <strong>Time:</strong> ${data.sessionTime}
            </p>
            <p style="margin: 0 0 8px; font-size: 13px; color: #6E8B6F;">
              📹 <strong>Google Meet URL:</strong> <a href="${data.meetLink}" style="color: #6E8B6F; text-decoration: underline;">${data.meetLink}</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: rgba(247,244,239,0.6);">
              💡 <em>The "Join Call" button becomes active 15 minutes before your scheduled slot.</em>
            </p>
          </div>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${data.meetLink}" style="display: inline-block; background: #6E8B6F; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; margin-right: 10px;">
              Join Google Meet &rarr;
            </a>
            <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background: rgba(255,255,255,0.08); color: #F7F4EF; text-decoration: none; padding: 12px 20px; border-radius: 30px; font-weight: 500; font-size: 13px; border: 1px solid rgba(255,255,255,0.15);">
              + Google Calendar
            </a>
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Please join 3 minutes early with stable audio and video. Ascend Coaching Concierge.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: `Your 1-on-1 session with Coach ${data.creatorName} is scheduled for ${data.sessionDate} at ${data.sessionTime}. Google Meet link: ${data.meetLink}`,
    });
  }

  /**
   * 3. Coach Verification Status Update Email
   */
  static async sendVerificationStatusEmail(
    to: string,
    data: {
      creatorName: string;
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }
  ) {
    const isApproved = data.status === 'APPROVED';
    const subject = isApproved
      ? `🎉 Congratulations! Your Coach Verification on Ascend is Approved`
      : `Update Regarding Your Ascend Coach Verification Application`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">Coach Verification & Trust Council</p>
        </div>

        <div style="background: #16171A; padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <h2 style="color: ${isApproved ? '#6E8B6F' : '#E06D53'}; font-size: 20px; margin-top: 0;">
            ${isApproved ? 'Verification Approved — You are now a Verified Coach!' : 'Verification Application Update'}
          </h2>
          <p style="color: rgba(247,244,239,0.8); line-height: 1.6; font-size: 14px;">
            Hello ${data.creatorName},
            ${
              isApproved
                ? 'Our manual vetting committee has approved your credentials. Your verified badge is now active across your storefront, and your courses/offers are live for athletes worldwide.'
                : `Thank you for your application. Unfortunately, we were unable to verify your credentials at this time. Reason: ${
                    data.rejectionReason || 'Uploaded certificates require additional accreditation documentation.'
                  }`
            }
          </p>
          <div style="text-align: center; margin-top: 25px;">
            <a href="http://localhost:5173/dashboard" style="display: inline-block; background: #B8703F; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: bold; font-size: 14px;">
              ${isApproved ? 'Open Creator Studio &rarr;' : 'Review & Re-apply &rarr;'}
            </a>
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Ascend Verification Trust Council • Setting the standard for elite fitness coaching
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: isApproved
        ? `Your coach verification application on Ascend has been approved!`
        : `Your coach verification application requires changes: ${data.rejectionReason || 'Please review docs.'}`,
    });
  }

  /**
   * 4. Forgot / Reset Password Email
   */
  static async sendPasswordResetEmail(
    to: string,
    data: {
      name: string;
      resetLink: string;
      resetCode: string;
    }
  ) {
    const subject = `Reset Your Ascend Password`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">Account Security & Password Recovery</p>
        </div>

        <div style="background: #16171A; padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <h2 style="color: #F7F4EF; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: rgba(247,244,239,0.8); line-height: 1.6; font-size: 14px;">
            Hello ${data.name}, we received a request to reset your Ascend password. Click the button below to choose a new password:
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${data.resetLink}" style="display: inline-block; background: #B8703F; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: bold; font-size: 14px;">
              Reset Password &rarr;
            </a>
          </div>

          <p style="color: rgba(247,244,239,0.6); font-size: 12px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <span style="color: #B8703F; word-break: break-all;">${data.resetLink}</span>
          </p>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px; margin-top: 15px; font-size: 12px; color: rgba(247,244,239,0.6);">
            🔒 This reset link is valid for 1 hour. If you didn't request this change, you can safely ignore this email.
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Ascend Inc. • Security Department
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: `Reset your Ascend password: ${data.resetLink}. Code: ${data.resetCode}`,
    });
  }

  /**
   * 5. Email Verification on Signup
   */
  static async sendEmailVerification(
    to: string,
    data: {
      name: string;
      verifyLink: string;
      verificationCode: string;
    }
  ) {
    const subject = `Verify Your Email — Welcome to Ascend`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121315; color: #F7F4EF; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8703F; font-size: 28px; margin: 0; font-family: Georgia, serif;">ASCEND</h1>
          <p style="color: rgba(247,244,239,0.6); font-size: 13px; margin-top: 5px;">Elite Fitness Coaching & Masterclasses</p>
        </div>

        <div style="background: #16171A; padding: 25px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px;">
          <h2 style="color: #F7F4EF; font-size: 20px; margin-top: 0;">Welcome to Ascend, ${data.name}! 🚀</h2>
          <p style="color: rgba(247,244,239,0.8); line-height: 1.6; font-size: 14px;">
            Please verify your email address to activate your account and start your physical transformation journey.
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: rgba(184, 112, 63, 0.15); border: 1px solid rgba(184, 112, 63, 0.4); padding: 12px 24px; border-radius: 12px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #B8703F; font-family: monospace;">
              ${data.verificationCode}
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.verifyLink}" style="display: inline-block; background: #B8703F; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: bold; font-size: 14px;">
              Verify Email Address &rarr;
            </a>
          </div>
        </div>

        <p style="color: rgba(247,244,239,0.4); font-size: 11px; text-align: center; margin: 0;">
          Ascend Inc. • By signing up, you agreed to our Terms of Service & Privacy Policy
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: `Verify your Ascend email: ${data.verifyLink}. Verification Code: ${data.verificationCode}`,
    });
  }
}
