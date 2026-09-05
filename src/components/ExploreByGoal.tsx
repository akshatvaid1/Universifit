import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Scale,
  Sparkles,
  UserCheck,
  Apple,
  Trophy,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card, Badge } from './ui';
import { fetchDiscoverCreators } from '../services/api';

interface GoalCategory {
  id: string;
  name: string;
  queryParam: string;
  description: string;
  icon: React.ElementType;
  tag: string;
  accentGradient: string;
  borderHover: string;
}

interface ExploreByGoalProps {
  onSelectCategory?: (category: string) => void;
}

export const ExploreByGoal: React.FC<ExploreByGoalProps> = ({ onSelectCategory }) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [totalCoachesCount, setTotalCoachesCount] = useState<number>(500);

  useEffect(() => {
    // Fetch live categories / creator stats from GET /discover
    fetchDiscoverCreators({ limit: 1 })
      .then((res) => {
        if (res.data.pagination.totalItems) {
          setTotalCoachesCount(res.data.pagination.totalItems);
        }
      })
      .catch(() => {});
  }, []);

  const goals: GoalCategory[] = [
    {
      id: 'strength',
      name: 'Strength & Physique',
      queryParam: 'Strength & Physique',
      description: 'Hypertrophy, barbell biomechanics, powerbuilding & progressive overload.',
      icon: Dumbbell,
      tag: '140+ Coaches',
      accentGradient: 'from-[#B8703F]/20 to-orange-500/5 text-[#B8703F]',
      borderHover: 'hover:border-[#B8703F]/50',
    },
    {
      id: 'weight-loss',
      name: 'Weight Loss & Recomp',
      queryParam: 'Weight Loss',
      description: 'Metabolic rate enhancement, visceral fat loss & muscle sparing protocols.',
      icon: Scale,
      tag: '85+ Coaches',
      accentGradient: 'from-[#6E8B6F]/25 to-emerald-500/5 text-[#6E8B6F]',
      borderHover: 'hover:border-[#6E8B6F]/50',
    },
    {
      id: 'skincare',
      name: 'Skincare & Grooming',
      queryParam: 'Skincare & Grooming',
      description: 'Dermatologist regimens for acne remission, skin barrier health & anti-aging.',
      icon: Sparkles,
      tag: '45+ Specialists',
      accentGradient: 'from-sky-500/20 to-indigo-500/5 text-sky-400',
      borderHover: 'hover:border-sky-500/50',
    },
    {
      id: 'posture',
      name: 'Posture & Alignment',
      queryParam: 'Posture',
      description: 'Neuromuscular desk reset, scapular retraction & forward head correction.',
      icon: UserCheck,
      tag: '60+ DPTs',
      accentGradient: 'from-amber-500/20 to-yellow-500/5 text-amber-300',
      borderHover: 'hover:border-amber-500/50',
    },
    {
      id: 'nutrition',
      name: 'Nutrition Coaching',
      queryParam: 'Nutrition Coaching',
      description: 'Evidence-based macro targets, gut microbiome balance & longevity eating.',
      icon: Apple,
      tag: '90+ Dietitians',
      accentGradient: 'from-[#6E8B6F]/20 to-teal-500/5 text-[#8cb08d]',
      borderHover: 'hover:border-[#6E8B6F]/50',
    },
    {
      id: 'challenges',
      name: 'Cohorts & Challenges',
      queryParam: 'Challenges',
      description: '30-day body transformation sprints with daily coach accountability.',
      icon: Trophy,
      tag: 'Active Sprints',
      accentGradient: 'from-[#B8703F]/25 to-rose-500/5 text-[#d48b59]',
      borderHover: 'hover:border-[#B8703F]/50',
    },
  ];

  const handleCardClick = (goal: GoalCategory) => {
    setSelectedGoal(goal.id);
    if (onSelectCategory) {
      onSelectCategory(goal.queryParam);
    }
  };

  return (
    <section id="explore-by-goal" className="py-16 lg:py-24 bg-[#16171A] relative font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2">
              <Badge variant="copper" size="sm">
                Targeted Protocols
              </Badge>
              <span className="text-xs text-[#F7F4EF]/50">
                {totalCoachesCount}+ verified practitioners
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#F7F4EF] tracking-tight">
              Explore by <span className="italic text-[#B8703F]">Goal</span>
            </h2>

            <p className="text-sm sm:text-base text-[#F7F4EF]/70 leading-relaxed font-normal">
              Select your primary physical or aesthetic objective. We match you with vetted coaches who specialize specifically in that discipline.
            </p>
          </div>

          <a
            href="/discover"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B8703F] hover:text-[#d48b59] transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded-lg px-2 py-1"
          >
            <span>Browse all categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Goal Category Cards Grid: 1-col mobile, 2-col tablet, 3-col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {goals.map((goal, index) => {
            const IconComponent = goal.icon;
            const isSelected = selectedGoal === goal.id;

            return (
              <motion.div
                key={goal.id}
                tabIndex={0}
                role="button"
                aria-label={`Explore coaches in ${goal.name}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                onClick={() => handleCardClick(goal)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(goal);
                  }
                }}
                className="h-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A]"
              >
                <Card
                  variant="charcoal"
                  interactive
                  className={`h-full p-6 sm:p-7 flex flex-col justify-between group transition-all duration-300 border-white/[0.08] ${goal.borderHover} ${
                    isSelected ? 'border-[#B8703F] bg-[#1a1b1f] shadow-[0_0_25px_-5px_rgba(184,112,63,0.25)]' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Icon & Tag */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${goal.accentGradient} border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}
                      >
                        <IconComponent className="w-7 h-7" />
                      </div>

                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[#F7F4EF]/70 group-hover:border-white/20 transition-colors">
                        {goal.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-xl font-display font-bold text-[#F7F4EF] group-hover:text-white transition-colors">
                        {goal.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed mt-2 line-clamp-2">
                        {goal.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom CTA Link */}
                  <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-[#F7F4EF]/70 group-hover:text-[#B8703F] transition-colors">
                    <span>Explore coaches in {goal.name.split(' ')[0]}</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#B8703F]" />
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
