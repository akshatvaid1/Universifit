import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote, ArrowRight } from 'lucide-react';

export interface RealReviewItem {
  id: string;
  buyerName: string;
  rating: number;
  reviewText: string;
  programTitle: string;
  verifiedBuyer: boolean;
  createdAt: string;
}

interface TestimonialsSectionProps {
  onExplore?: () => void;
}

export const TestimonialCarousel: React.FC<TestimonialsSectionProps> = ({ onExplore }) => {
  const [reviews, setReviews] = useState<RealReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch real authenticated client reviews from backend
    fetch('/api/reviews/creator/creator-chadtag')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.data?.reviews && Array.isArray(data.data.reviews)) {
          setReviews(data.data.reviews);
        }
      })
      .catch((err) => {
        console.debug('No reviews currently returned by API:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-[#F7F7F5] text-[#14161A] border-t border-[#E8E8E6] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Plain-language, no eyebrow labels */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-semibold text-[#14161A] tracking-tight">
              Client Testimonials & Outcomes
            </h2>
            <p className="text-sm sm:text-base text-[#8B8D91] font-normal leading-relaxed">
              Real reviews only. Verified feedback submitted by clients and athletes enrolled in creator offerings.
            </p>
          </div>

          <div className="text-xs font-normal text-[#8B8D91]">
            100% Authenticated Buyers
          </div>
        </div>

        {/* Real Reviews Grid or Graceful Empty State */}
        {!isLoading && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-white border border-[#E8E8E6] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(rev.rating) ? 'fill-current' : 'text-neutral-300'}`}
                        />
                      ))}
                    </div>
                    {rev.verifiedBuyer && (
                      <span className="text-xs text-[#8B8D91] font-normal">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#14161A] leading-relaxed font-normal">
                    "{rev.reviewText}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E8E8E6] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#14161A] block">{rev.buyerName}</span>
                    <span className="text-[#8B8D91]">{rev.programTitle}</span>
                  </div>
                  <span className="text-[#8B8D91]">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Graceful Empty State (Real Data Policy: zero fake testimonials) */
          <div className="rounded-xl border border-[#E8E8E6] bg-white p-8 sm:p-14 text-center max-w-2xl mx-auto flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] flex items-center justify-center text-[#14161A]">
              <MessageSquareQuote className="w-6 h-6 text-[#14161A]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold font-sans text-[#14161A]">
              No Client Reviews Submitted Yet
            </h3>

            <p className="text-sm text-[#8B8D91] leading-relaxed max-w-lg font-normal">
              Universifit enforces a strict real-data policy. Reviews are published exclusively after paying clients complete their 1-on-1 coaching consultations or curriculum milestones. We do not generate simulated or fabricated testimonials.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onExplore) {
                    onExplore();
                  } else {
                    const el = document.getElementById('explore-goals') || document.getElementById('explore-creators');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else window.location.href = '/discover';
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#14161A] hover:text-[#3652C4] transition-colors cursor-pointer"
              >
                <span>Browse verified programs to get started</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#3652C4]" />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
