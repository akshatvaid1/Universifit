import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Sparkles,
  Smile,
  ShieldCheck,
  Apple,
  Activity,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card } from './ui';

export interface CategoryItem {
  id: string;
  name: string;
  queryParam: string;
  description: string;
  dbMatchField: string;
  icon: React.ElementType;
}

interface CategoryGridProps {
  onSelectCategory?: (category: string) => void;
}

export const ExploreByGoal: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Real DB Categories directly matching specialtyTags and curriculum modules in PostgreSQL/InMemory store
  const categories: CategoryItem[] = [
    {
      id: 'physique',
      name: 'Physique & Hypertrophy',
      queryParam: 'physique',
      description: 'Progressive overload, upper chest fullness, clavicle width, and barbell mechanics.',
      dbMatchField: 'tag: physique',
      icon: Dumbbell,
    },
    {
      id: 'grooming',
      name: 'Grooming & Skincare',
      queryParam: 'grooming',
      description: 'Skin barrier health, daily grooming frameworks, hair care, and presentation.',
      dbMatchField: 'tag: grooming',
      icon: Sparkles,
    },
    {
      id: 'looksmaxxing',
      name: 'Facial Aesthetics & Structure',
      queryParam: 'looksmaxxing',
      description: 'Cranial posture, masseter balance, tongue resting position, and structural symmetry.',
      dbMatchField: 'tag: looksmaxxing',
      icon: Smile,
    },
    {
      id: 'confidence',
      name: 'Mindset & Confidence',
      queryParam: 'confidence',
      description: 'Gaze stability, vocal resonance, nonverbal poise, and calm psychological grounding.',
      dbMatchField: 'tag: confidence-building',
      icon: ShieldCheck,
    },
    {
      id: 'nutrition',
      name: 'Diet & Metabolic Nutrition',
      queryParam: 'diet',
      description: 'Clean bulking ratios, micronutrient timing, hydration protocols, and body recomposition.',
      dbMatchField: 'module: diet',
      icon: Apple,
    },
    {
      id: 'posture',
      name: 'Posture & Biomechanics',
      queryParam: 'posture',
      description: 'Spinal decompression, pelvic tilt correction, desk reset, and natural stature optimization.',
      dbMatchField: 'module: posture',
      icon: Activity,
    },
  ];

  const handleCardClick = (cat: CategoryItem) => {
    setSelectedCategory(cat.id);
    if (onSelectCategory) {
      onSelectCategory(cat.queryParam);
    }
  };

  return (
    <section id="explore-goals" className="py-16 lg:py-24 bg-[#F7F7F5] text-[#14161A] relative font-sans border-t border-[#E8E8E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Hierarchy via size/weight/spacing only. No eyebrow labels. */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-semibold text-[#14161A] tracking-tight">
              Explore by Goal
            </h2>

            <p className="text-sm sm:text-base text-[#8B8D91] leading-relaxed font-normal">
              Select a discipline to browse verified creator courses, private community spaces, and 1-on-1 coaching offerings.
            </p>
          </div>

          <a
            href="/discover"
            onClick={(e) => {
              e.preventDefault();
              if (onSelectCategory) onSelectCategory('All');
              else window.location.href = '/discover';
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#14161A] hover:text-[#3652C4] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] rounded-md px-1 py-0.5 self-start md:self-auto"
          >
            <span>Browse all categories</span>
            <ArrowRight className="w-4 h-4 text-[#3652C4] transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Real DB Category Cards Grid - Functional borders only, no shadows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {categories.map((cat, index) => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <motion.div
                key={cat.id}
                tabIndex={0}
                role="button"
                aria-label={`Explore programs in ${cat.name}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                onClick={() => handleCardClick(cat)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(cat);
                  }
                }}
                className="h-full cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F7F5]"
              >
                <Card
                  variant="ivory"
                  interactive
                  className={`h-full p-6 sm:p-7 flex flex-col justify-between group transition-colors duration-150 bg-white border-[#E8E8E6] hover:border-[#14161A] rounded-xl ${
                    isSelected ? 'ring-2 ring-[#3652C4] border-[#3652C4]' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Icon */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-md bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6] flex items-center justify-center">
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Title & Description: Inter only, hierarchy via size/weight/spacing */}
                    <div>
                      <h3 className="text-lg font-sans font-semibold text-[#14161A] group-hover:text-[#3652C4] transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-[#8B8D91] leading-relaxed mt-2 font-normal">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Link */}
                  <div className="mt-6 pt-4 border-t border-[#E8E8E6] flex items-center justify-between text-xs font-medium text-[#8B8D91] group-hover:text-[#3652C4] transition-colors">
                    <span>View {cat.name}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
