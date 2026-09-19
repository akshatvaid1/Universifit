import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fetchDiscoverCreators, type CreatorItem } from '../services/api';

interface CreatorsSectionProps {
  onBookCreator: (creatorName: string) => void;
}

export const CreatorsSection: React.FC<CreatorsSectionProps> = ({ onBookCreator }) => {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Physique', 'Grooming', 'Looksmaxxing', 'Confidence'];

  useEffect(() => {
    fetchDiscoverCreators({ limit: 8 })
      .then((res) => {
        if (res.data?.creators) {
          setCreators(res.data.creators);
        }
      })
      .catch((err) => {
        console.debug('Could not load creators in CreatorsSection', err);
      });
  }, []);

  const filtered = creators.filter((c) => {
    if (activeFilter === 'All') return true;
    return c.specialtyTags.some((tag) => tag.toLowerCase().includes(activeFilter.toLowerCase()));
  });

  if (creators.length === 0) {
    return (
      <section id="explore-creators" className="py-16 sm:py-20 lg:py-24 bg-[#F7F7F5] text-[#14161A] border-t border-[#E8E8E6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-[#E8E8E6] bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
            <h3 className="text-xl sm:text-2xl font-semibold font-sans text-[#14161A]">
              Creator Roster In Onboarding
            </h3>
            <p className="text-sm sm:text-base text-[#8B8D91] max-w-md font-normal">
              Founding coaches and practitioners are currently completing platform onboarding. Newly verified profiles will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="explore-creators" className="py-20 lg:py-28 bg-[#F7F7F5] text-[#14161A] relative font-sans border-t border-[#E8E8E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Hierarchy via size/weight/spacing only. No eyebrow labels. */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-semibold tracking-tight text-[#14161A]">
              Explore Active Creators
            </h2>
            <p className="text-sm sm:text-base text-[#8B8D91] max-w-xl font-normal leading-relaxed">
              Find creators who provide structured curriculums, communities, and coaching sessions.
            </p>
          </div>

          {/* Filter Pills - Clean functional border, no shadows */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-md border border-[#E8E8E6] overflow-x-auto self-start md:self-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-[#14161A] text-white'
                    : 'text-[#8B8D91] hover:text-[#14161A] hover:bg-[#F7F7F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Creators Grid - Functional borders only, no shadows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((creator) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl p-5 border border-[#E8E8E6] hover:border-[#14161A] transition-colors duration-150 flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="relative mb-4">
                  <div className="h-48 w-full rounded-lg overflow-hidden bg-[#F7F7F5] border border-[#E8E8E6]">
                    <img
                      src={creator.avatarUrl || '/chadtag.png'}
                      alt={`${creator.fullName} profile`}
                      loading="lazy"
                      decoding="async"
                      width={280}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Body Details - No floating badges or icon-lists */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-sans font-semibold text-base text-[#14161A] truncate">
                      {creator.fullName}
                    </h3>
                    {creator.verificationStatus === 'VERIFIED' && (
                      <span className="text-xs text-[#5A5D62] font-normal shrink-0">
                        Verified
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="inline-block text-[11px] font-medium text-[#14161A] bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E8E8E6]">
                      {creator.specialtyTags[0] || 'Verified Creator'}
                    </span>
                  </div>

                  <p className="text-xs text-[#5A5D62] line-clamp-2 leading-relaxed font-normal">
                    {creator.headline}
                  </p>
                </div>
              </div>

              {/* Action Buttons: single accent signal-blue CTA */}
              <div className="pt-4 mt-4 border-t border-[#E8E8E6] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-[#5A5D62] uppercase font-medium block">Price</span>
                  <p className="text-xs font-semibold text-[#14161A]">
                    {creator.featuredOffers[0]?.price ? `$${creator.featuredOffers[0].price}` : 'Consultation'}
                  </p>
                </div>

                <button
                  onClick={() => onBookCreator(creator.fullName)}
                  className="px-3.5 py-1.5 rounded-md bg-[#3652C4] text-white font-medium text-xs hover:bg-[#2D44A6] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
