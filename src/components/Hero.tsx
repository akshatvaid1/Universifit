import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui';

interface HeroProps {
  onExploreCommunities?: () => void;
  onGetStarted?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCommunities, onGetStarted }) => {
  const handleCtaClick = () => {
    if (onExploreCommunities) {
      onExploreCommunities();
      return;
    }
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    const target = document.getElementById('community') || document.getElementById('explore-creators');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#community';
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-[#F7F7F5] text-[#14161A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          
          {/* Left Column: Plain-language Headline, Subtext, Single CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-7"
          >
            {/* Plain-Language Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-semibold tracking-tight text-[#14161A] leading-[1.12]">
              Creators sell courses, coaching, and community here.
            </h1>

            {/* Subtext: 1-2 sentences on what a buyer actually does here */}
            <p className="text-base sm:text-lg lg:text-xl text-[#5A5D62] font-sans font-normal leading-relaxed max-w-2xl">
              Join a coach's private community, take their step-by-step video course, or book dedicated 1-on-1 coaching time directly with them.
            </p>

            {/* Exactly One CTA: Explore Communities */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCtaClick}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Explore Communities
              </Button>
            </div>
          </motion.div>

          {/* Right Column: Clean Real Creator Visual (Functional border, no shadows or floating badges) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-5 relative flex flex-col items-center"
          >
            <div className="relative w-full max-w-md bg-white rounded-xl p-3 sm:p-4 border border-[#E8E8E6]">
              <div className="relative h-[420px] sm:h-[460px] w-full rounded-lg overflow-hidden bg-[#F7F7F5]">
                <img
                  src="/chadtag.png"
                  alt="Chadtag, Men's Self-Improvement & Aesthetics Coach"
                  width={450}
                  height={460}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Genuine Creator Caption (Clean typography, no floating pill or badge) */}
              <div className="pt-3 pb-1 px-1 flex items-center justify-between">
                <div>
                  <h2 className="font-sans font-semibold text-base text-[#14161A]">
                    Chadtag
                  </h2>
                  <p className="text-xs text-[#5A5D62] font-sans">
                    Men's Self-Improvement & Aesthetics Coach
                  </p>
                </div>
                <span className="text-xs font-normal font-sans text-[#5A5D62]">
                  Verified
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
