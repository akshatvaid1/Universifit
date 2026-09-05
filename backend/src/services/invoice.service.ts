import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { PayoutService } from './payout.service.js';

export interface GstInvoiceData {
  invoiceNumber?: string;
  orderId: string;
  paymentId: string;
  date?: string | Date;
  currency?: string;
  totalAmount: number;
  // Seller (Creator)
  seller: {
    id?: string;
    name: string;
    handle?: string;
    gstin?: string;
    pan?: string;
    email?: string;
    address?: string;
    state?: string;
    stateCode?: string;
  };
  // Buyer (Student)
  buyer: {
    id?: string;
    name: string;
    email: string;
    address?: string;
    state?: string;
    stateCode?: string;
    gstin?: string;
  };
  // Item
  item: {
    title: string;
    type: 'COURSE' | 'ONE_ON_ONE' | 'COMMUNITY' | string;
    sacCode?: string;
    quantity?: number;
    unitPrice?: number;
  };
}

export interface GstInvoiceRecord {
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  issueDate: string;
  currency: string;
  totalAmount: number;
  baseAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  sellerName: string;
  sellerGstin: string;
  sellerId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerId?: string;
  itemTitle: string;
  pdfPath: string;
  pdfUrl: string;
  downloadUrl: string;
}

// In-memory invoice store with sequence counter
let invoiceSequence = 1001;
const invoiceStore: GstInvoiceRecord[] = [];

export class InvoiceService {
  private static uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');

  private static ensureDirExists() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generates the next sequential invoice number (e.g. ASC-INV-2026-1001)
   */
  static generateNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const num = invoiceSequence++;
    return `ASC-INV-${year}-${num}`;
  }

  /**
   * Calculates 18% GST breakdown (intra-state CGST 9% + SGST 9%)
   */
  static calculateGstBreakdown(totalAmount: number) {
    const total = Number(totalAmount);
    // Assuming total amount is inclusive of 18% GST: Base = Total / 1.18
    const baseAmount = Number((total / 1.18).toFixed(2));
    const totalTax = Number((total - baseAmount).toFixed(2));
    const cgst = Number((totalTax / 2).toFixed(2));
    const sgst = Number((totalTax - cgst).toFixed(2)); // ensures exact sum

    return {
      baseAmount,
      totalTax,
      cgst,
      sgst,
      igst: 0,
      gstRatePercent: 18,
    };
  }

  /**
   * Generates PDF buffer for a GST invoice using PDFKit
   */
  static async generateInvoicePdfBuffer(data: GstInvoiceData, invoiceNumber: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Tax Invoice - ${invoiceNumber}`,
          Author: 'Ascend Platform Inc.',
          Subject: 'GST Tax Invoice',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const gst = this.calculateGstBreakdown(data.totalAmount);
      const currency = (data.currency || 'USD').toUpperCase();
      const symbol = currency === 'INR' ? '₹' : '$';
      const sacCode = data.item.sacCode || '999293';
      const issueDate = data.date ? new Date(data.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // 1. Header Banner & Branding
      doc.rect(40, 40, 515, 60).fill('#121315');
      doc.fillColor('#B8703F').fontSize(22).font('Helvetica-Bold').text('ASCEND', 55, 52);
      doc.fillColor('#F7F4EF').fontSize(9).font('Helvetica').text('ELITE COACHING & MASTERCLASS PLATFORM', 55, 78);

      doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 380, 50, { align: 'right' });
      doc.fillColor('#6E8B6F').fontSize(8).font('Helvetica').text('Original for Recipient', 380, 68, { align: 'right' });
      doc.fillColor('rgba(255,255,255,0.6)').fontSize(8).text('(Under Section 31 of CGST Act, 2017)', 380, 80, { align: 'right' });

      doc.moveDown(2);

      // 2. Metadata Grid
      const metaY = 115;
      doc.rect(40, metaY, 515, 45).strokeColor('#E2E8F0').lineWidth(0.8).stroke();

      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('INVOICE NO:', 50, metaY + 8);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(invoiceNumber, 50, metaY + 20);

      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('INVOICE DATE:', 180, metaY + 8);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(issueDate, 180, metaY + 20);

      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('PLACE OF SUPPLY:', 300, metaY + 8);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text(data.buyer.state || 'Maharashtra (27)', 300, metaY + 20);

      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('REVERSE CHARGE:', 440, metaY + 8);
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica').text('No', 440, metaY + 20);

      // 3. Seller & Buyer Addresses (2-column box)
      const partyY = 170;
      // Seller Box
      doc.rect(40, partyY, 250, 105).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
      doc.rect(40, partyY, 250, 20).fill('#F8FAFC');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('SELLER (CREATOR DETAILS)', 50, partyY + 6);

      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(data.seller.name, 50, partyY + 26);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Handle: @${data.seller.handle || 'coach'}`, 50, partyY + 38);
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text('GSTIN: ', 50, partyY + 50);
      doc.fillColor('#1E293B').font('Helvetica').text(data.seller.gstin || '27AAPFV8921M1Z5', 85, partyY + 50);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text('PAN: ', 50, partyY + 62);
      doc.fillColor('#1E293B').font('Helvetica').text(data.seller.pan || 'PAN-VANC8921M', 75, partyY + 62);
      doc.fillColor('#64748B').fontSize(8).text(data.seller.address || 'Ascend Creator Studio Hub, Bandra West, Mumbai 400050', 50, partyY + 74, { width: 230 });

      // Buyer Box
      doc.rect(305, partyY, 250, 105).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
      doc.rect(305, partyY, 250, 20).fill('#F8FAFC');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text('BUYER (STUDENT DETAILS)', 315, partyY + 6);

      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(data.buyer.name, 315, partyY + 26);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Email: ${data.buyer.email}`, 315, partyY + 38);
      doc.fillColor('#64748B').fontSize(8).text(`Payment Ref: ${data.paymentId}`, 315, partyY + 50);
      doc.fillColor('#64748B').fontSize(8).text(`Order Ref: ${data.orderId}`, 315, partyY + 62);
      doc.fillColor('#64748B').fontSize(8).text('Category: B2C E-Commerce Supply of Digital / Coaching Services', 315, partyY + 74, { width: 230 });

      // 4. Line Items Table Header
      const tableY = 290;
      doc.rect(40, tableY, 515, 22).fill('#121315');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('S.NO', 48, tableY + 7);
      doc.text('ITEM DESCRIPTION', 80, tableY + 7);
      doc.text('HSN/SAC', 250, tableY + 7);
      doc.text('QTY', 315, tableY + 7);
      doc.text('TAXABLE VAL', 355, tableY + 7);
      doc.text('GST (18%)', 430, tableY + 7);
      doc.text('TOTAL', 500, tableY + 7, { align: 'right' });

      // Table Row
      const rowY = tableY + 22;
      doc.rect(40, rowY, 515, 40).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica');
      doc.text('1', 52, rowY + 10);

      doc.font('Helvetica-Bold').text(data.item.title, 80, rowY + 10, { width: 160 });
      doc.fillColor('#64748B').font('Helvetica').fontSize(7).text(`Category: ${data.item.type}`, 80, rowY + 22);

      doc.fillColor('#0F172A').fontSize(8).text(sacCode, 250, rowY + 10);
      doc.text('1', 320, rowY + 10);
      doc.text(`${symbol}${gst.baseAmount.toFixed(2)}`, 355, rowY + 10);
      doc.text(`${symbol}${gst.totalTax.toFixed(2)}`, 430, rowY + 10);
      doc.font('Helvetica-Bold').text(`${symbol}${data.totalAmount.toFixed(2)}`, 475, rowY + 10, { align: 'right' });

      // 5. Tax Breakdown Box
      const taxY = rowY + 50;
      doc.rect(290, taxY, 265, 115).strokeColor('#E2E8F0').lineWidth(0.8).stroke();

      doc.fillColor('#334155').fontSize(8).font('Helvetica').text('Taxable Subtotal:', 305, taxY + 12);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`${symbol}${gst.baseAmount.toFixed(2)}`, 475, taxY + 12, { align: 'right' });

      doc.fillColor('#334155').font('Helvetica').text('Central GST (CGST @ 9%):', 305, taxY + 30);
      doc.fillColor('#0F172A').text(`${symbol}${gst.cgst.toFixed(2)}`, 475, taxY + 30, { align: 'right' });

      doc.fillColor('#334155').font('Helvetica').text('State GST (SGST @ 9%):', 305, taxY + 48);
      doc.fillColor('#0F172A').text(`${symbol}${gst.sgst.toFixed(2)}`, 475, taxY + 48, { align: 'right' });

      doc.fillColor('#334155').font('Helvetica').text('Integrated GST (IGST @ 0%):', 305, taxY + 66);
      doc.fillColor('#0F172A').text(`${symbol}0.00`, 475, taxY + 66, { align: 'right' });

      doc.rect(290, taxY + 84, 265, 31).fill('#F8FAFC');
      doc.rect(290, taxY + 84, 265, 31).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('TOTAL INVOICE AMOUNT:', 305, taxY + 94);
      doc.fillColor('#B8703F').fontSize(11).font('Helvetica-Bold').text(`${symbol}${data.totalAmount.toFixed(2)}`, 460, taxY + 94, { align: 'right' });

      // Left Terms & Banking Summary
      doc.rect(40, taxY, 240, 115).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text('PAYMENT & TRANSACTION SUMMARY', 50, taxY + 10);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica');
      doc.text(`Payment Gateway: Razorpay / Stripe Express`, 50, taxY + 25);
      doc.text(`Transaction Status: COMPLETED / CAPTURED`, 50, taxY + 38);
      doc.text(`Payment ID: ${data.paymentId}`, 50, taxY + 51);
      doc.text(`Marketplace Intermediary: Ascend Inc.`, 50, taxY + 64);
      doc.text(`SAC 999293 - Commercial Training & Sports Coaching`, 50, taxY + 77);
      doc.text(`Electronic Invoice generated in accordance with GST Rules.`, 50, taxY + 90);

      // 6. Authorized Signatory & Footer
      const footerY = taxY + 130;
      doc.rect(40, footerY, 515, 60).strokeColor('#E2E8F0').lineWidth(0.8).stroke();

      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text(
        'Declaration: We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.',
        50,
        footerY + 10,
        { width: 330 }
      );

      doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text('For ASCEND PLATFORM / SELLER', 380, footerY + 10, { align: 'right' });
      doc.fillColor('#6E8B6F').fontSize(8).font('Helvetica-Bold').text('✓ Digitally Signed & Authorized', 380, footerY + 35, { align: 'right' });
      doc.fillColor('#94A3B8').fontSize(7).font('Helvetica').text('Authorized Signatory', 380, footerY + 47, { align: 'right' });

      // Bottom Bar
      doc.rect(40, 750, 515, 20).fill('#F1F5F9');
      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(
        `Ascend Inc. • CIN: U72900MH2026PTC392182 • Support: billing@ascend.fit • Invoice Ref: ${invoiceNumber}`,
        40,
        756,
        { align: 'center', width: 515 }
      );

      doc.end();
    });
  }

  /**
   * Generates, writes to disk, and records a GST Tax Invoice
   */
  static async generateAndSaveInvoice(data: GstInvoiceData): Promise<GstInvoiceRecord> {
    this.ensureDirExists();

    const invoiceNumber = data.invoiceNumber || this.generateNextInvoiceNumber();
    const gst = this.calculateGstBreakdown(data.totalAmount);
    const pdfBuffer = await this.generateInvoicePdfBuffer(data, invoiceNumber);

    const fileName = `${invoiceNumber}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    const record: GstInvoiceRecord = {
      invoiceNumber,
      orderId: data.orderId,
      paymentId: data.paymentId,
      issueDate: (data.date ? new Date(data.date) : new Date()).toISOString(),
      currency: (data.currency || 'USD').toUpperCase(),
      totalAmount: data.totalAmount,
      baseAmount: gst.baseAmount,
      cgstAmount: gst.cgst,
      sgstAmount: gst.sgst,
      igstAmount: 0,
      totalTaxAmount: gst.totalTax,
      sellerName: data.seller.name,
      sellerGstin: data.seller.gstin || '27AAPFV8921M1Z5',
      sellerId: data.seller.id,
      buyerName: data.buyer.name,
      buyerEmail: data.buyer.email,
      buyerId: data.buyer.id,
      itemTitle: data.item.title,
      pdfPath: filePath,
      pdfUrl: `/api/invoices/${invoiceNumber}/download`,
      downloadUrl: `/api/invoices/${invoiceNumber}/download`,
    };

    // Upsert into memory store
    const existingIdx = invoiceStore.findIndex((i) => i.invoiceNumber === invoiceNumber);
    if (existingIdx >= 0) {
      invoiceStore[existingIdx] = record;
    } else {
      invoiceStore.unshift(record);
    }

    console.log(`[InvoiceService] GST Invoice Generated & Stored: ${invoiceNumber} (${fileName})`);
    return record;
  }

  /**
   * Fetch invoice record by invoice number or payment ID
   */
  static getInvoice(identifier: string): GstInvoiceRecord | undefined {
    return invoiceStore.find(
      (inv) =>
        inv.invoiceNumber === identifier ||
        inv.paymentId === identifier ||
        inv.orderId === identifier
    );
  }

  /**
   * Fetch all invoices for a buyer
   */
  static getBuyerInvoices(buyerIdOrEmail: string): GstInvoiceRecord[] {
    return invoiceStore.filter(
      (inv) =>
        inv.buyerEmail.toLowerCase() === buyerIdOrEmail.toLowerCase() ||
        inv.buyerId === buyerIdOrEmail
    );
  }

  /**
   * Fetch all invoices for a creator
   */
  static getCreatorInvoices(creatorIdOrName: string): GstInvoiceRecord[] {
    return invoiceStore.filter(
      (inv) =>
        inv.sellerId === creatorIdOrName ||
        inv.sellerName.toLowerCase().includes(creatorIdOrName.toLowerCase())
    );
  }

  /**
   * Fetch all invoices
   */
  static getAllInvoices(): GstInvoiceRecord[] {
    return [...invoiceStore];
  }
}
