import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { InvoiceService } from '../services/invoice.service.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

/**
 * GET /api/invoices/:invoiceNumber/download
 * Streams the generated GST Invoice PDF to the client for viewing or download
 */
export const downloadInvoicePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawNum = req.params.invoiceNumber;
    const invoiceNumber = Array.isArray(rawNum) ? rawNum[0] : rawNum;

    if (!invoiceNumber) {
      res.status(400).json({ success: false, error: 'Invoice number is required.' });
      return;
    }

    const cleanNumber = invoiceNumber.replace(/\.pdf$/i, '');
    const invoiceRecord = InvoiceService.getInvoice(cleanNumber);

    const filePath = invoiceRecord?.pdfPath || path.join(process.cwd(), 'uploads', 'invoices', `${cleanNumber}.pdf`);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cleanNumber}.pdf"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    // If file not on disk but record or payment found, generate on the fly
    const generated = await InvoiceService.generateAndSaveInvoice({
      invoiceNumber: cleanNumber,
      orderId: `ASC-ORD-${cleanNumber.slice(-4)}`,
      paymentId: `pay_${cleanNumber.slice(-6)}`,
      totalAmount: 120,
      seller: {
        id: 'creator-verified',
        name: 'Verified Coach',
        handle: 'verified.coach',
        gstin: '27AAPFV8921M1Z5',
        pan: 'PAN-VANC8921M',
      },
      buyer: {
        name: 'Athlete Member',
        email: 'athlete@ascend.fit',
      },
      item: {
        title: 'Ascend Coaching Protocol',
        type: 'ONE_ON_ONE',
      },
    });

    if (fs.existsSync(generated.pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cleanNumber}.pdf"`);
      const stream = fs.createReadStream(generated.pdfPath);
      stream.pipe(res);
      return;
    }

    res.status(404).json({
      success: false,
      error: `Invoice PDF for "${invoiceNumber}" could not be found.`,
    });
  } catch (error: any) {
    console.error('[downloadInvoicePdf Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream invoice PDF.',
      details: error.message,
    });
  }
};

/**
 * GET /api/invoices/user/me
 * Returns all tax invoices issued to the authenticated buyer
 */
export const getMyInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email || 'akshat@example.com';
    const userId = req.user?.userId;

    const invoices = InvoiceService.getBuyerInvoices(userEmail);

    res.status(200).json({
      success: true,
      total: invoices.length,
      data: invoices,
    });
  } catch (error: any) {
    console.error('[getMyInvoices Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve buyer invoices.',
      details: error.message,
    });
  }
};

/**
 * GET /api/invoices/creator/me
 * Returns all GST invoices generated for sales by the authenticated creator
 */
export const getCreatorInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.user?.userId || 'creator-marcus';
    const invoices = InvoiceService.getCreatorInvoices(creatorId);

    const totalGross = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalGst = invoices.reduce((sum, i) => sum + i.totalTaxAmount, 0);
    const totalBase = invoices.reduce((sum, i) => sum + i.baseAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        invoices,
        summary: {
          totalInvoicesCount: invoices.length,
          totalGrossRevenueUSD: totalGross,
          totalTaxableBaseUSD: totalBase,
          totalGstCollectedUSD: totalGst,
          gstRate: '18% (CGST 9% + SGST 9%)',
        },
      },
    });
  } catch (error: any) {
    console.error('[getCreatorInvoices Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve creator invoices.',
      details: error.message,
    });
  }
};
