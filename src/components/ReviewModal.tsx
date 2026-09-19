import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Button } from './ui';
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
            ? 'Your verified review has been updated.'
            : 'Thank you. Your verified review is now published on this profile.'
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
        return 'Exceptional (5/5)';
      case 4:
        return 'Very Good (4/5)';
      case 3:
        return 'Satisfactory (3/5)';
      case 2:
        return 'Below Expectations (2/5)';
      case 1:
        return 'Needs Improvement (1/5)';
      default:
        return 'Select rating';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-lg bg-white border border-[#E8E8E6] rounded-xl flex flex-col overflow-hidden text-[#14161A] font-sans"
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-[#E8E8E6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#14161A]">
                {existingReview ? 'Edit Your Review' : 'Rate & Review Practitioner'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A]">
                <ShieldCheck className="w-3 h-3 text-[#3652C4]" />
                Verified
              </span>
            </div>
            <p className="text-xs text-[#8B8D91] mt-0.5">
              Client evaluation for {creatorName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8B8D91] hover:text-[#14161A] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
            aria-label="Close review dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Program Context Chip */}
          <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#3652C4] shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[#8B8D91] block">
                Completed Program / Session
              </span>
              <span className="text-xs font-semibold text-[#14161A] truncate block">
                {programTitle}
              </span>
            </div>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Interactive Star Rating */}
          <div className="space-y-2 text-center py-2">
            <label className="text-xs font-medium text-[#8B8D91] block">
              Overall Rating
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4]"
                    aria-label={`${starValue} Stars`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        isFilled
                          ? 'text-[#14161A] fill-[#14161A]'
                          : 'text-[#E8E8E6] fill-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium text-[#14161A]">
              {getRatingLabel(hoverRating !== null ? hoverRating : rating)}
            </p>
          </div>

          {/* Review Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#14161A] block">
                Your Feedback
              </label>
              <span className="text-[11px] text-[#8B8D91]">
                {reviewText.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Describe your coaching or curriculum experience, specific improvements, and communication with the practitioner..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full bg-white border border-[#E8E8E6] rounded-md p-3 text-sm text-[#14161A] placeholder-[#8B8D91] focus:outline-none focus:border-[#14161A] focus:ring-1 focus:ring-[#14161A] leading-relaxed resize-none"
            />
          </div>

          {/* Verified Guarantee note */}
          <div className="p-3 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-[11px] text-[#8B8D91] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3652C4] shrink-0" />
            <span>
              Reviews are verified against platform purchases and bookings. Fake or incentivized reviews are strictly prohibited.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E8E8E6]">
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              size="sm"
              isLoading={isSubmitting}
            >
              {existingReview ? 'Update Review' : 'Publish Verified Review'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
