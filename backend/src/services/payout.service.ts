/**
 * Ascend Creator Payout & Banking Service
 * Securely manages payout profiles (Bank Transfer & UPI) and validates payout setup before publishing paid monetization offers.
 */

export interface PayoutDetails {
  payoutMethod: 'BANK_TRANSFER' | 'UPI';
  accountHolderName: string;
  accountNumber?: string;
  maskedAccountNumber?: string;
  ifscOrSwift?: string;
  bankName?: string;
  upiId?: string;
  taxId?: string;
  gstin?: string;
  payoutSetupCompleted: boolean;
  updatedAt?: string;
}

// In-memory persistent store for creator payout configurations
const creatorPayoutStore = new Map<string, PayoutDetails>();

export class PayoutService {
  /**
   * Fetch current payout configuration for creator (with masked sensitive fields)
   */
  static getPayoutDetails(creatorId: string): PayoutDetails {
    const existing = creatorPayoutStore.get(creatorId);
    if (!existing) {
      return {
        payoutMethod: 'BANK_TRANSFER',
        accountHolderName: '',
        gstin: '27AAPFV8921M1Z5',
        payoutSetupCompleted: false,
      };
    }

    const { accountNumber, ...safeFields } = existing;
    return {
      ...safeFields,
      maskedAccountNumber: accountNumber ? `••••••••${accountNumber.slice(-4)}` : undefined,
    };
  }

  /**
   * Save or update payout configuration for creator
   */
  static savePayoutDetails(
    creatorId: string,
    details: {
      payoutMethod: 'BANK_TRANSFER' | 'UPI';
      accountHolderName: string;
      accountNumber?: string;
      ifscOrSwift?: string;
      bankName?: string;
      upiId?: string;
      taxId?: string;
      gstin?: string;
    }
  ): PayoutDetails {
    const isBank = details.payoutMethod === 'BANK_TRANSFER';
    const isValid = isBank
      ? Boolean(details.accountHolderName && details.accountNumber && details.ifscOrSwift)
      : Boolean(details.accountHolderName && details.upiId);

    const record: PayoutDetails = {
      payoutMethod: details.payoutMethod,
      accountHolderName: details.accountHolderName?.trim(),
      accountNumber: details.accountNumber?.trim(),
      maskedAccountNumber: details.accountNumber
        ? `••••••••${details.accountNumber.trim().slice(-4)}`
        : undefined,
      ifscOrSwift: details.ifscOrSwift?.trim().toUpperCase(),
      bankName: details.bankName?.trim() || (isBank ? 'Scheduled Commercial Bank' : undefined),
      upiId: details.upiId?.trim().toLowerCase(),
      taxId: details.taxId?.trim().toUpperCase(),
      gstin: details.gstin?.trim().toUpperCase() || '27AAPFV8921M1Z5',
      payoutSetupCompleted: isValid,
      updatedAt: new Date().toISOString(),
    };

    creatorPayoutStore.set(creatorId, record);
    return this.getPayoutDetails(creatorId);
  }

  /**
   * Check if creator is eligible to publish paid monetization products
   */
  static isPayoutSetupCompleted(creatorId: string): boolean {
    const details = creatorPayoutStore.get(creatorId);
    return Boolean(details?.payoutSetupCompleted);
  }
}
