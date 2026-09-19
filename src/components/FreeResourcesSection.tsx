import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Table,
  CheckSquare,
  BookOpen,
  ArrowRight,
  X,
  Download,
} from 'lucide-react';
import { Button } from './ui';

export interface FreeResourceItem {
  id: string;
  title: string;
  category: string;
  author: string;
  format: string;
  description: string;
  content: string[];
  icon: React.ElementType;
}

export const FreeResourcesSection: React.FC = () => {
  const [selectedResource, setSelectedResource] = useState<FreeResourceItem | null>(null);

  const resources: FreeResourceItem[] = [
    {
      id: 'res-facial-primer',
      title: 'Facial Aesthetics & Cranial Posture Primer',
      category: 'Aesthetics & Structure',
      author: 'Chadtag',
      format: 'PDF Guide • 8 pages',
      description: 'Foundational cranial posture guide covering tongue resting position, masseter muscle balance, and breathing mechanics.',
      content: [
        '1. Palatal Tongue Placement: Maintain gentle suction of the entire tongue body against the hard and soft palate.',
        '2. Nasal Respiration Habituation: Eliminate mouth breathing during sleep and light cardiovascular work to preserve facial width.',
        '3. Masseter Symmetry Assessment: Chew evenly on both dental arches to prevent asymmetric muscular hypertrophy.',
        '4. Hyoid Posture Reset: Keep chin tucked parallel to the ground to optimize jawline angularity.',
      ],
      icon: BookOpen,
    },
    {
      id: 'res-overload-sheet',
      title: 'Hypertrophy & Progressive Overload Tracking Sheet',
      category: 'Physique & Strength',
      author: 'Universifit Biomechanics',
      format: 'Sheet Template • 4 Weeks',
      description: 'Standardized progressive overload log for compound movements, tracking volume load, RPE targets, and weekly increments.',
      content: [
        '1. Weekly Volume Thresholds: 10–16 direct working sets per target muscle group per week.',
        '2. RPE Target Range: Keep working sets between RPE 7.5 to RPE 9 to stimulate mechanical tension without systemic burnout.',
        '3. Micro-Progression Rule: Add 1.25kg to barbell lifts or 1 repetition once top-of-bracket rep goal is achieved.',
        '4. Scheduled Deload Frequency: Reduce volume by 40% every 5th or 6th week to clear connective tissue fatigue.',
      ],
      icon: Table,
    },
    {
      id: 'res-posture-reset',
      title: '10-Minute Desk Posture & Spine Restoration Routine',
      category: 'Posture & Mobility',
      author: 'Universifit Movement',
      format: 'Checklist • Daily Routine',
      description: 'Neuromuscular decompression sequence designed for desk workers to reverse anterior pelvic tilt and forward head carriage.',
      content: [
        '1. Chin Tucks (3 sets x 10 reps): Retract the cervical spine without flexing the neck downward.',
        '2. Prone Cobra (3 sets x 30s holds): Activate the mid-trapezius and rhomboids with external shoulder rotation.',
        '3. Couch Stretch / Hip Flexor Release (2 min per side): Open anterior pelvic chain to decompress lower back lumbar curve.',
        '4. Dead Hangs (2 sets x 45s): Passive spinal traction from a pull-up bar to hydrate intervertebral discs.',
      ],
      icon: CheckSquare,
    },
    {
      id: 'res-diet-framework',
      title: 'Metabolic Diet & Clean Bulking Ratio Sheet',
      category: 'Nutrition Coaching',
      author: 'Universifit Nutrition',
      format: 'Reference Guide • Macro Blueprint',
      description: 'Evidence-based macronutrient partition guide for lean tissue accrual without excess visceral adiposity.',
      content: [
        '1. Protein Floor: 1.8g to 2.2g per kilogram of bodyweight, distributed across 4-5 meal intervals.',
        '2. Caloric Surplus Ceiling: +200 to +300 kcal above maintenance to optimize muscle protein synthesis while mitigating fat accumulation.',
        '3. Micronutrient Anchor: Minimum 400g of fibrous vegetables and 25g+ soluble/insoluble fiber daily for gut microbiome integrity.',
        '4. Hydration Standard: 35-40ml of water per kg bodyweight with baseline electrolyte replenishment.',
      ],
      icon: FileText,
    },
  ];

  return (
    <section id="free-resources" className="py-16 sm:py-20 lg:py-24 bg-white text-[#14161A] border-t border-[#E8E8E6] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Hierarchy via size/weight/spacing only */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-semibold text-[#14161A] tracking-tight">
              Free Resources & Practitioner Guides
            </h2>
            <p className="text-sm sm:text-base text-[#8B8D91] font-normal leading-relaxed">
              Download evidence-based guides, templates, and introductory protocols authored by verified platform coaches.
            </p>
          </div>

          <div className="text-xs text-[#8B8D91] font-normal">
            No payment or subscription required
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((res) => {
            const IconComponent = res.icon;

            return (
              <div
                key={res.id}
                className="p-5 rounded-xl bg-white border border-[#E8E8E6] hover:border-[#14161A] transition-colors duration-150 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Icon & Category */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-md bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6] flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-[#8B8D91]">
                      {res.category}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="font-sans font-semibold text-base text-[#14161A] group-hover:text-[#3652C4] transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-xs text-[#8B8D91] mt-1 font-normal">
                      By {res.author}
                    </p>
                  </div>

                  <p className="text-xs text-[#8B8D91] leading-relaxed line-clamp-3 font-normal">
                    {res.description}
                  </p>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-4 border-t border-[#E8E8E6] flex items-center justify-between">
                  <span className="text-[11px] text-[#8B8D91]">
                    {res.format}
                  </span>

                  <button
                    onClick={() => setSelectedResource(res)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#14161A] hover:text-[#3652C4] transition-colors cursor-pointer"
                  >
                    <span>View Protocol</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#3652C4]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Clean Modal for Previewing / Reading Free Resource */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-xl border border-[#E8E8E6] max-w-lg w-full p-6 sm:p-8 space-y-5 text-[#14161A]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-[#8B8D91] font-medium uppercase tracking-wider block">
                    {selectedResource.category} • {selectedResource.format}
                  </span>
                  <h3 className="text-xl font-sans font-semibold text-[#14161A] mt-1">
                    {selectedResource.title}
                  </h3>
                  <p className="text-xs text-[#8B8D91] mt-0.5 font-normal">
                    Authored by {selectedResource.author}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-1.5 rounded-md hover:bg-[#F7F7F5] text-[#8B8D91] hover:text-[#14161A] transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] space-y-3">
                <span className="text-xs font-semibold text-[#14161A] block">
                  Key Protocol Guidelines:
                </span>
                <ul className="space-y-2 text-xs text-[#14161A]/90 font-normal leading-relaxed">
                  {selectedResource.content.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E8E8E6]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedResource(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const textContent = `${selectedResource.title}\nBy ${selectedResource.author}\n\n${selectedResource.description}\n\nKey Guidelines:\n${selectedResource.content.join('\n')}`;
                    const blob = new Blob([textContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedResource.id}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Summary
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
