import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/db.js';

export interface CertificateData {
  certificateNumber: string;
  buyerName: string;
  courseTitle: string;
  creatorName: string;
  completionDate: Date | string;
  userId: string;
  courseId: string;
  enrollmentId?: string;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  userId: string;
  courseId: string;
  enrollmentId?: string | null;
  buyerName: string;
  courseTitle: string;
  creatorName: string;
  completionDate: string | Date;
  pdfPath?: string | null;
  pdfUrl: string;
  downloadUrl: string;
}

let certSequence = 1001;

export class CertificateService {
  private static uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');

  private static ensureDirExists() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generates next unique certificate number (e.g. ASC-CERT-2026-1002)
   */
  static generateNextCertificateNumber(): string {
    const year = new Date().getFullYear();
    const num = certSequence++;
    return `ASC-CERT-${year}-${num}`;
  }

  /**
   * Generates the PDF document for the certificate and saves to disk
   */
  static async generateCertificatePdf(data: CertificateData): Promise<{ filePath: string; relativePath: string }> {
    this.ensureDirExists();
    const fileName = `certificate-${data.certificateNumber}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);
    const relativePath = `uploads/certificates/${fileName}`;

    return new Promise((resolve, reject) => {
      // Landscape A4 (841.89 x 595.28 points)
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 36,
        info: {
          Title: `Certificate of Completion - ${data.courseTitle}`,
          Author: 'Ascend Creator Platform',
          Subject: `Course Completion Certificate for ${data.buyerName}`,
          Keywords: 'Ascend, Certificate, Course, Completion, Coaching, Fitness',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageWidth = 841.89;
      const pageHeight = 595.28;

      // 1. Background Fill - Premium Charcoal
      doc.rect(0, 0, pageWidth, pageHeight).fill('#121315');

      // 2. Decorative Outer Border (Copper)
      doc
        .lineWidth(3)
        .strokeColor('#B8703F')
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .stroke();

      // 3. Decorative Inner Border (Subtle White/Gold)
      doc
        .lineWidth(1)
        .strokeColor('#3D3A36')
        .rect(28, 28, pageWidth - 56, pageHeight - 56)
        .stroke();

      // 4. Corner Ornaments (Copper accents)
      const corners = [
        { x: 28, y: 28 },
        { x: pageWidth - 28, y: 28 },
        { x: 28, y: pageHeight - 28 },
        { x: pageWidth - 28, y: pageHeight - 28 },
      ];

      doc.fillColor('#B8703F');
      corners.forEach((c) => {
        doc.circle(c.x, c.y, 4).fill();
      });

      // 5. Header: Platform Brand Crest
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#B8703F')
        .text('A S C E N D', 0, 52, { align: 'center', characterSpacing: 4 });

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#A39E93')
        .text('ELITE COACHING & PROTOCOL ACADEMY', 0, 72, { align: 'center', characterSpacing: 2 });

      // Subtle Divider
      doc
        .strokeColor('#B8703F')
        .lineWidth(1)
        .moveTo(pageWidth / 2 - 80, 88)
        .lineTo(pageWidth / 2 + 80, 88)
        .stroke();

      // 6. Certificate Title
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#F7F4EF')
        .text('CERTIFICATE OF MASTERY', 0, 105, { align: 'center', characterSpacing: 2 });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#B5B0A4')
        .text('THIS IS PROUDLY PRESENTED TO', 0, 138, { align: 'center', characterSpacing: 1.5 });

      // 7. Student Name (Hero Display)
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#F7F4EF')
        .text(data.buyerName || 'Dedicated Athlete', 0, 168, { align: 'center' });

      // Decorative Name Underline
      const nameLineWidth = 220;
      doc
        .strokeColor('#B8703F')
        .lineWidth(1.5)
        .moveTo(pageWidth / 2 - nameLineWidth / 2, 205)
        .lineTo(pageWidth / 2 + nameLineWidth / 2, 205)
        .stroke();

      // 8. Description & Course Title
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#A39E93')
        .text(
          'for successfully demonstrating mastery and 100% completion of the verified curriculum modules in',
          80,
          225,
          { align: 'center', width: pageWidth - 160 }
        );

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#D48B59')
        .text(`"${data.courseTitle}"`, 80, 255, { align: 'center', width: pageWidth - 160 });

      // 9. Verification Badge & Protocol Details
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#7A766F')
        .text(
          'Delivered under the rigorous technical standards of the Ascend Verified Coach Network.',
          80,
          295,
          { align: 'center', width: pageWidth - 160 }
        );

      // 10. Seal & Crest (Center Bottom)
      const sealX = pageWidth / 2;
      const sealY = 385;

      // Concentric circles for Seal
      doc.lineWidth(1.5).strokeColor('#B8703F').circle(sealX, sealY, 34).stroke();
      doc.lineWidth(0.5).strokeColor('#D48B59').circle(sealX, sealY, 28).stroke();
      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor('#B8703F')
        .text('VERIFIED', sealX - 25, sealY - 10, { width: 50, align: 'center' })
        .text('100% PASS', sealX - 25, sealY, { width: 50, align: 'center' })
        .text('ASCEND', sealX - 25, sealY + 10, { width: 50, align: 'center' });

      // 11. Left Column: Date & Certificate ID
      const colLeftX = 90;
      const bottomRowY = 460;

      const dateStr =
        data.completionDate instanceof Date
          ? data.completionDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : new Date(data.completionDate || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#F7F4EF')
        .text(dateStr, colLeftX, bottomRowY, { width: 220, align: 'center' });

      doc
        .strokeColor('#5A564F')
        .lineWidth(0.75)
        .moveTo(colLeftX + 20, bottomRowY + 16)
        .lineTo(colLeftX + 200, bottomRowY + 16)
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#A39E93')
        .text('DATE OF COMPLETION', colLeftX, bottomRowY + 22, { width: 220, align: 'center' });

      doc
        .fontSize(7)
        .font('Courier')
        .fillColor('#7A766F')
        .text(`ID: ${data.certificateNumber}`, colLeftX, bottomRowY + 34, { width: 220, align: 'center' });

      // 12. Right Column: Instructor / Coach Signature
      const colRightX = pageWidth - 310;

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#F7F4EF')
        .text(data.creatorName || 'Lead Protocol Coach', colRightX, bottomRowY, {
          width: 220,
          align: 'center',
        });

      doc
        .strokeColor('#5A564F')
        .lineWidth(0.75)
        .moveTo(colRightX + 20, bottomRowY + 16)
        .lineTo(colRightX + 200, bottomRowY + 16)
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#A39E93')
        .text('VERIFIED PROTOCOL INSTRUCTOR', colRightX, bottomRowY + 22, {
          width: 220,
          align: 'center',
        });

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#7A766F')
        .text('Ascend Creator Signature', colRightX, bottomRowY + 34, {
          width: 220,
          align: 'center',
        });

      // 13. Footer Disclaimer
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#4E4B45')
        .text(
          'Ascend Platform • Tamper-evident curriculum certificate • Authenticity verifiable at ascend.io/verify',
          0,
          pageHeight - 34,
          { align: 'center' }
        );

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, relativePath });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Fetches or auto-generates a completion certificate for a user and course.
   */
  static async getOrCreateCertificate(
    userId: string,
    courseId: string
  ): Promise<CertificateRecord> {
    // 1. Check if certificate already exists in DB
    const existing = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing && existing.pdfPath && fs.existsSync(existing.pdfPath)) {
      return {
        id: existing.id,
        certificateNumber: existing.certificateNumber,
        userId: existing.userId,
        courseId: existing.courseId,
        enrollmentId: existing.enrollmentId,
        buyerName: existing.buyerName,
        courseTitle: existing.courseTitle,
        creatorName: existing.creatorName,
        completionDate: existing.completionDate,
        pdfPath: existing.pdfPath,
        pdfUrl: `/api/certificates/${existing.id}/download`,
        downloadUrl: `/api/certificates/${existing.id}/download`,
      };
    }

    // 2. Fetch User, Course, Creator Profile, and Enrollment
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!user || !course) {
      throw new Error('User or Course not found');
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        OR: [{ courseId: course.id }, ...(course.offerId ? [{ offerId: course.offerId }] : [])],
      },
    });

    const buyerName = user.fullName || 'Ascend Athlete';
    const courseTitle = course.title;
    const creatorName =
      course.creator?.user?.fullName ||
      (course.creator as any)?.name ||
      course.creator?.handle ||
      'Verified Coach';

    const certificateNumber = existing?.certificateNumber || this.generateNextCertificateNumber();
    const completionDate = new Date();

    // 3. Generate PDF
    const { filePath, relativePath } = await this.generateCertificatePdf({
      certificateNumber,
      buyerName,
      courseTitle,
      creatorName,
      completionDate,
      userId,
      courseId,
      enrollmentId: enrollment?.id,
    });

    // 4. Save/Update record in database
    const certRecord = await prisma.certificate.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        certificateNumber,
        userId,
        courseId,
        enrollmentId: enrollment?.id,
        buyerName,
        courseTitle,
        creatorName,
        completionDate,
        pdfPath: filePath,
        pdfUrl: `/api/certificates/${certificateNumber}/download`,
      },
      update: {
        buyerName,
        courseTitle,
        creatorName,
        completionDate,
        pdfPath: filePath,
        pdfUrl: `/api/certificates/${certificateNumber}/download`,
      },
    });

    return {
      id: certRecord.id,
      certificateNumber: certRecord.certificateNumber,
      userId: certRecord.userId,
      courseId: certRecord.courseId,
      enrollmentId: certRecord.enrollmentId,
      buyerName: certRecord.buyerName,
      courseTitle: certRecord.courseTitle,
      creatorName: certRecord.creatorName,
      completionDate: certRecord.completionDate,
      pdfPath: certRecord.pdfPath,
      pdfUrl: `/api/certificates/${certRecord.id}/download`,
      downloadUrl: `/api/certificates/${certRecord.id}/download`,
    };
  }

  /**
   * Finds a certificate by ID or Certificate Number
   */
  static async findCertificateByIdOrNumber(idOrNumber: string) {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { certificateNumber: idOrNumber }],
      },
    });
    return cert;
  }
}
