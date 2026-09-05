import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button, Badge } from './ui';
import {
  submitReviewApi,
  updateReviewApi,
  type ReviewItem,
} from '../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  programTitle?: string;
  enrollmentId?: string;
  bookingId?: string;
  existingReview?: ReviewItem | null;
  onReviewSaved: (savedReview: ReviewItem) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  programTitle = 'Coaching Program / Consultation',
  enrollmentId,
  bookingId,
  existingReview,
  onReviewSaved,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setReviewText(existingReview.reviewText || '');
    } else {
      setRating(5);
      setReviewText('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating from 1 to 5.');
      return;
    }

    if (reviewText.trim().length < 5) {
      setErrorMessage('Please write at least a sentence sharing your experience (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (existingReview?.id) {
        res = await updateReviewApi(existingReview.id, {
          rating,
          reviewText: reviewText.trim(),
        });
      } else {
        res = await submitReviewApi({
          creatorId,
          rating,
          reviewText: reviewText.trim(),
          programTitle,
          enrollmentId,
          bookingId,
        });
      }

      if (res.success) {
        setSuccessMessage(
          existingReview?.id
            ? 'Your verified review has been updated! ⭐'
            : 'Thank you! Your verified review is now published on the coach storefront. 🎉'
        );
        if (res.data) onReviewSaved(res.data);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to save review.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error publishing review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return 'Exceptional — Exceeded expectations (5/5)';
      case 4:
        return 'Very Good — Highly recommended (4/5)';
      case 3:
        return 'Satisfactory — Met expectations (3/5)';
      case 2:
        return 'Below Expectations (2/5)';
      case 1:
        return 'Needs Significant Improvement (1/5)';
      default:
        return 'Rate your experience';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-[#16171A] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#121315]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-bold text-white tracking-tight">
                  {existingReview ? 'Edit Your Review' : 'Rate & Review Coach'}
                </h3>
                <Badge variant="verified" size="sm">
                  VERIFIED BUYER
                </Badge>
              </div>
              <p className="text-xs text-[#F7F4EF]/50">
                Sharing feedback for Coach {creatorName}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Program Context Chip */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#B8703F] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Completed Program
              </span>
              <span className="text-xs font-semibold text-white truncate block">
                {programTitle}
              </span>
            </div>
          </div>

          {/* Error / Success Notifications */}
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

          {/* Interactive Star Rating */}
          <div className="space-y-2 text-center py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/70 block">
              Overall Experience Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-xl hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-neutral-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#B8703F] font-medium transition-all">
              {getRatingLabel(hoverRating !== null ? hoverRating : rating)}
            </p>
          </div>

          {/* Review Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/70 block">
                Your Detailed Feedback
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                {reviewText.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="What was your experience like? How did the coach explain concepts or handle form corrections? What results did you achieve?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full bg-[#121315] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#B8703F] leading-relaxed resize-none"
            />
          </div>

          {/* Verified Guarantee note */}
          <div className="p-3.5 rounded-2xl bg-[#6E8B6F]/10 border border-[#6E8B6F]/20 text-[11px] text-[#6E8B6F] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              Your review will appear with the <strong>Verified Athlete</strong> badge. You can edit or update your review anytime.
            </span>
          </div>

          {/* Submit Actions */}
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
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {existingReview ? 'Update Review' : 'Publish Verified Review'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
