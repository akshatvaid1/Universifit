import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Building2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Lock,
  Landmark,
} from 'lucide-react';
import { Button, Badge, Input } from './ui';
import { updatePayoutSettingsApi, type PayoutDetails } from '../services/api';

interface PayoutSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPayout?: PayoutDetails | null;
  onPayoutSaved: (updatedPayout: PayoutDetails) => void;
  gatedActionMessage?: string | null;
}

export const PayoutSetupModal: React.FC<PayoutSetupModalProps> = ({
  isOpen,
  onClose,
  currentPayout,
  onPayoutSaved,
  gatedActionMessage,
}) => {
  const [payoutMethod, setPayoutMethod] = useState<'BANK_TRANSFER' | 'UPI'>('BANK_TRANSFER');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscOrSwift, setIfscOrSwift] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [taxId, setTaxId] = useState('');
  const [gstin, setGstin] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentPayout) {
      setPayoutMethod(currentPayout.payoutMethod || 'BANK_TRANSFER');
      setAccountHolderName(currentPayout.accountHolderName || '');
      setIfscOrSwift(currentPayout.ifscOrSwift || '');
      setBankName(currentPayout.bankName || '');
      setUpiId(currentPayout.upiId || '');
      setTaxId(currentPayout.taxId || '');
      setGstin(currentPayout.gstin || '27AAPFV8921M1Z5');
      setAccountNumber(currentPayout.accountNumber || '');
      setConfirmAccountNumber(currentPayout.accountNumber || '');
    } else {
      setPayoutMethod('BANK_TRANSFER');
      setAccountHolderName('');
      setIfscOrSwift('');
      setBankName('');
      setUpiId('');
      setTaxId('');
      setGstin('');
      setAccountNumber('');
      setConfirmAccountNumber('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [currentPayout, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!accountHolderName.trim()) {
      setErrorMessage('Account holder legal name is required.');
      return;
    }

    if (payoutMethod === 'BANK_TRANSFER') {
      if (!accountNumber.trim()) {
        setErrorMessage('Account number is required.');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setErrorMessage('Account numbers do not match.');
        return;
      }
      if (!ifscOrSwift.trim()) {
        setErrorMessage('Bank IFSC / SWIFT code is required.');
        return;
      }
    } else if (payoutMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMessage('Please provide a valid UPI Virtual Payment Address (e.g. coach@okhdfcbank).');
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await updatePayoutSettingsApi({
        payoutMethod,
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscOrSwift: ifscOrSwift.trim().toUpperCase(),
        bankName: bankName.trim() || (payoutMethod === 'BANK_TRANSFER' ? 'Scheduled Commercial Bank' : undefined),
        upiId: upiId.trim().toLowerCase(),
        taxId: taxId.trim().toUpperCase(),
        gstin: gstin.trim().toUpperCase() || '27AAPFV8921M1Z5',
      });

      if (res.success && res.data) {
        setSuccessMessage('Payout profile verified and securely connected! 🎉');
        onPayoutSaved(res.data);
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setErrorMessage(res.error || 'Failed to save payout configuration.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving payout settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-[#16171A] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#121315]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6E8B6F]/20 text-[#6E8B6F] flex items-center justify-center border border-[#6E8B6F]/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-bold text-white tracking-tight">
                  Creator Payout Setup
                </h3>
                <Badge variant={currentPayout?.payoutSetupCompleted ? 'verified' : 'neutral'} size="sm">
                  {currentPayout?.payoutSetupCompleted ? 'VERIFIED' : 'REQUIRED'}
                </Badge>
              </div>
              <p className="text-xs text-[#F7F4EF]/50">
                Direct bank transfer & UPI settlement for your client revenues
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gated Message Notice */}
        {gatedActionMessage && (
          <div className="mx-6 mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold block">Publish Action Gated</span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                {gatedActionMessage}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#F7F4EF]/70 uppercase tracking-wider block">
              Settlement Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutMethod('BANK_TRANSFER')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  payoutMethod === 'BANK_TRANSFER'
                    ? 'border-[#B8703F] bg-[#B8703F]/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-[#F7F4EF]/60 hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5 text-[#B8703F]" />
                <div>
                  <span className="text-xs font-bold block">Direct Bank Transfer</span>
                  <span className="text-[10px] text-neutral-400 block">NEFT / RTGS / IMPS</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod('UPI')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  payoutMethod === 'UPI'
                    ? 'border-[#B8703F] bg-[#B8703F]/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-[#F7F4EF]/60 hover:text-white'
                }`}
              >
                <Zap className="w-5 h-5 text-[#6E8B6F]" />
                <div>
                  <span className="text-xs font-bold block">Instant UPI VPA</span>
                  <span className="text-[10px] text-neutral-400 block">GPay / PhonePe / Paytm</span>
                </div>
              </button>
            </div>
          </div>

          <Input
            label="Legal Account Holder Name"
            placeholder="As registered with your bank"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            required
          />

          {payoutMethod === 'BANK_TRANSFER' ? (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Account Number"
                  placeholder="e.g. 918237465019"
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Account Number"
                  placeholder="Re-enter account number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Bank IFSC / SWIFT Code"
                  placeholder="e.g. HDFC0001824"
                  value={ifscOrSwift}
                  onChange={(e) => setIfscOrSwift(e.target.value.toUpperCase())}
                  required
                />

                <Input
                  label="Bank Name (Optional)"
                  placeholder="e.g. HDFC Bank Ltd"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            </>
          ) : (
            <Input
              label="UPI ID / VPA Address"
              placeholder="e.g. coach.name@okhdfcbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Tax Identifier / PAN"
              placeholder="e.g. PAN-VANC8921M"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.toUpperCase())}
            />

            <Input
              label="GSTIN (GST Number)"
              placeholder="e.g. 27AAPFV8921M1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-[#F7F4EF]/60 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#6E8B6F] shrink-0" />
            <span>
              256-bit bank-grade encryption. Sensitive account numbers are securely hashed and masked on all client views.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              isLoading={isSaving}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Save & Verify Payout Setup
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
