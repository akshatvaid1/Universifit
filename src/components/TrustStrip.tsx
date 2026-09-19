import React from 'react';
import { motion } from 'framer-motion';

export const TrustStrip: React.FC = () => {
  const stats = [
    {
      id: 'verified-coaches',
      number: '500+',
      label: 'Verified Coaches',
      description: 'Top vetted practitioners across biomechanics, nutrition & aesthetics',
    },
    {
      id: 'sessions',
      number: '12,000+',
      label: 'Sessions Hosted',
      description: 'Interactive consultations, curriculum modules, and library archives',
    },
    {
      id: 'tracking',
      number: '24/7',
      label: 'Accountability Sync',
      description: 'Continuous habit metrics, private discussions, and coach feedback',
    },
    {
      id: 'members',
      number: '48,000+',
      label: 'Enrolled Members',
      description: 'Dedicated athletes and buyers training and progressing together',
    },
  ];

  return (
    <section className="py-12 lg:py-16 bg-[#14161A] border-y border-[#26282E] relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Clean Typographic Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
          <h3 className="text-base font-semibold text-white">
            Platform Scale & Performance
          </h3>
          <p className="text-xs text-[#8B8D91]">
            Real metrics across active communities and coaching programs
          </p>
        </div>

        {/* 4 Clean Stat Blocks (Typographic Hierarchy, No Shadows, No Icon-Lists) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="p-6 rounded-lg bg-[#14161A] border border-[#26282E] flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight tabular-nums mb-1">
                  {stat.number}
                </div>
                <h4 className="text-sm font-medium text-white">
                  {stat.label}
                </h4>
              </div>

              <p className="text-xs text-[#8B8D91] leading-relaxed font-sans mt-4 pt-4 border-t border-[#26282E]">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
