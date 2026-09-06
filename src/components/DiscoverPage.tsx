import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  SearchX,
  Dumbbell,
  Sparkles,
  UserCheck,
  Apple,
  Video,
  BookOpen,
  Users,
  DollarSign,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CoachCard } from './CoachCard';
import { Card, Input, Button, Badge, Breadcrumbs } from './ui';
import {
  fetchDiscoverCreators,
  searchGlobalApi,
  type CreatorItem,
  type SearchResultCourse,
} from '../services/api';

interface DiscoverPageProps {
  initialCategory?: string;
  initialSearch?: string;
  onBookCoach?: (coach: CreatorItem) => void;
  onSelectCourse?: (courseId: string) => void;
  onBackHome?: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  initialCategory,
  initialSearch = '',
  onBookCoach,
  onSelectCourse,
  onBackHome,
}) => {
  // Filter States
  const [selectedGoal, setSelectedGoal] = useState<string>(initialCategory || 'All');
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'clients' | 'newest'>('rating');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [matchingCourses, setMatchingCourses] = useState<SearchResultCourse[]>([]);
  
  // Data States
  const [coaches, setCoaches] = useState<CreatorItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Goal options
  const goalOptions = [
    { id: 'All', label: 'All Disciplines', icon: Sparkles },
    { id: 'Strength & Physique', label: 'Strength & Physique', icon: Dumbbell },
    { id: 'Weight Loss', label: 'Weight Loss & Recomp', icon: DollarSign },
    { id: 'Skincare & Grooming', label: 'Skincare & Grooming', icon: Sparkles },
    { id: 'Posture', label: 'Posture & Alignment', icon: UserCheck },
    { id: 'Nutrition Coaching', label: 'Nutrition Coaching', icon: Apple },
    { id: 'Challenges', label: 'Cohorts & Challenges', icon: Users },
  ];

  // Budget options
  const budgetOptions = [
    { id: 'all', label: 'Any Budget' },
    { id: 'under-100', label: 'Under $100' },
    { id: '100-200', label: '$100 - $200' },
    { id: '200-plus', label: '$200+' },
  ];

  // Format options
  const formatOptions = [
    { id: 'all', label: 'All Formats', icon: Sparkles },
    { id: 'ONE_ON_ONE', label: '1-on-1 Coaching', icon: Video },
    { id: 'COURSE', label: 'Video Curriculum', icon: BookOpen },
    { id: 'COMMUNITY', label: 'Group Cohorts', icon: Users },
  ];

  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadCoachesAndCourses = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const [discRes, searchRes] = await Promise.all([
        fetchDiscoverCreators({
          goal: selectedGoal !== 'All' ? selectedGoal : undefined,
          category: selectedGoal !== 'All' ? selectedGoal : undefined,
          search: searchQuery.trim() || undefined,
          limit: 20,
        }),
        searchQuery.trim()
          ? searchGlobalApi(searchQuery.trim(), selectedGoal !== 'All' ? selectedGoal : undefined)
          : Promise.resolve(null),
      ]);

      if (discRes.data?.creators) {
        setCoaches(discRes.data.creators);
      }

      if (searchRes && searchRes.results?.courses) {
        setMatchingCourses(searchRes.results.courses);
      } else if (!searchQuery.trim()) {
        setMatchingCourses([]);
      }
    } catch (err) {
      console.debug('Discovery search API error, using fallback dataset', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search & filter effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      loadCoachesAndCourses();
    }, 300);

    return () => clearTimeout(handler);
  }, [selectedGoal, searchQuery]);

  // Client-side Budget & Format Filtering & Sorting
  const filteredCoaches = useMemo(() => {
    return coaches
      .filter((c) => {
        // Format filter
        if (selectedFormat !== 'all') {
          const hasFormat = c.featuredOffers.some((o) => o.type === selectedFormat);
          if (!hasFormat) return false;
        }

        // Budget filter
        if (selectedBudget !== 'all') {
          const price = Number(c.featuredOffers[0]?.price || 150);
          if (selectedBudget === 'under-100' && price >= 100) return false;
          if (selectedBudget === '100-200' && (price < 100 || price > 200)) return false;
          if (selectedBudget === '200-plus' && price <= 200) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'clients') return b.totalClients - a.totalClients;
        return 0;
      });
  }, [coaches, selectedFormat, selectedBudget, sortBy]);

  const handleResetFilters = () => {
    setSelectedGoal('All');
    setSelectedBudget('all');
    setSelectedFormat('all');
    setSortBy('rating');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedGoal !== 'All' ||
    selectedBudget !== 'all' ||
    selectedFormat !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#16171A] text-[#F7F4EF] font-sans pb-24">
      {/* Top Breadcrumb & Title Bar */}
      <div className="border-b border-white/[0.08] bg-[#121315] pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Breadcrumbs
                items={[
                  { label: 'Home', onClick: onBackHome },
                  ...(selectedGoal !== 'All' || searchQuery.trim()
                    ? [
                        {
                          label: 'Discover',
                          onClick: () => {
                            setSelectedGoal('All');
                            setSearchQuery('');
                          },
                        },
                      ]
                    : [{ label: 'Discover Coaches', isCurrent: true }]),
                  ...(selectedGoal !== 'All'
                    ? [
                        {
                          label: selectedGoal,
                          isCurrent: !searchQuery.trim(),
                          onClick: searchQuery.trim() ? () => setSearchQuery('') : undefined,
                        },
                      ]
                    : []),
                  ...(searchQuery.trim()
                    ? [
                        {
                          label: `Search: "${searchQuery.trim()}"`,
                          isCurrent: true,
                        },
                      ]
                    : []),
                ]}
                className="mb-3"
              />

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#F7F4EF] tracking-tight">
                Discover <span className="italic text-[#B8703F]">Vetted Coaches</span>
              </h1>
              <p className="text-sm text-[#F7F4EF]/60 mt-1 max-w-xl font-normal">
                Browse verified practitioners across strength, metabolic nutrition, clinical skincare, and posture optimization.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search coach, discipline, or goal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="cursor-pointer hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Discover Layout: Sidebar + Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* DESKTOP FILTER SIDEBAR (Span 3) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8 sticky top-24 self-start">
            <div className="p-6 rounded-2xl bg-[#121315] border border-white/[0.08] shadow-lg space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#B8703F]" />
                  <h3 className="font-display font-bold text-base text-[#F7F4EF]">Filters</h3>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-[#B8703F] hover:text-[#d48b59] flex items-center gap-1 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded-md px-1.5 py-0.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Goal / Discipline Filter */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50 block">
                  Goal & Discipline
                </label>
                <div className="space-y-1">
                  {goalOptions.map((goal) => {
                    const isSelected = selectedGoal === goal.id;
                    const IconComp = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setSelectedGoal(goal.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-1 focus-visible:ring-offset-[#121315] ${
                          isSelected
                            ? 'bg-[#B8703F]/15 text-[#B8703F] border border-[#B8703F]/30 font-semibold'
                            : 'text-[#F7F4EF]/70 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{goal.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#B8703F] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Filter */}
              <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50 block">
                  Coaching Format
                </label>
                <div className="space-y-1">
                  {formatOptions.map((fmt) => {
                    const isSelected = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-1 focus-visible:ring-offset-[#121315] ${
                          isSelected
                            ? 'bg-[#6E8B6F]/15 text-[#6E8B6F] border border-[#6E8B6F]/30 font-semibold'
                            : 'text-[#F7F4EF]/70 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <span>{fmt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#6E8B6F]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Range Filter */}
              <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50 block">
                  Budget Range
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {budgetOptions.map((b) => {
                    const isSelected = selectedBudget === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBudget(b.id)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-medium text-center border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-1 focus-visible:ring-offset-[#121315] ${
                          isSelected
                            ? 'bg-white/[0.1] text-white border-[#B8703F] font-bold'
                            : 'bg-white/[0.02] text-[#F7F4EF]/60 border-white/[0.08] hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </aside>

          {/* MAIN RESULTS CONTENT (Span 9) */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Action Bar: Total Count, Active Filters Pills, Sort Dropdown & Mobile Filter Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-bold text-white flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F]"
                >
                  <Filter className="w-4 h-4 text-[#B8703F]" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[#B8703F]" />
                  )}
                </button>

                <p className="text-sm font-semibold text-[#F7F4EF]/80">
                  Showing{' '}
                  <span className="text-[#B8703F] font-bold font-mono">
                    {filteredCoaches.length}
                  </span>{' '}
                  verified coaches
                </p>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 text-xs font-medium text-[#F7F4EF]/60">
                <span>Sort by:</span>
                <div className="flex items-center bg-[#121315] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] ${
                      sortBy === 'rating' ? 'bg-white text-black' : 'text-[#F7F4EF]/60 hover:text-white'
                    }`}
                  >
                    Rating
                  </button>
                  <button
                    onClick={() => setSortBy('clients')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] ${
                      sortBy === 'clients' ? 'bg-white text-black' : 'text-[#F7F4EF]/60 hover:text-white'
                    }`}
                  >
                    Popular
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Chips Bar */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#F7F4EF]/40 font-medium mr-1">Active:</span>

                {selectedGoal !== 'All' && (
                  <Badge variant="copper" size="sm" className="gap-1.5">
                    <span>{selectedGoal}</span>
                    <button
                      onClick={() => setSelectedGoal('All')}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {selectedFormat !== 'all' && (
                  <Badge variant="verified" size="sm" className="gap-1.5">
                    <span>
                      {formatOptions.find((f) => f.id === selectedFormat)?.label}
                    </span>
                    <button
                      onClick={() => setSelectedFormat('all')}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {selectedBudget !== 'all' && (
                  <Badge variant="neutral" size="sm" className="gap-1.5">
                    <span>
                      {budgetOptions.find((b) => b.id === selectedBudget)?.label}
                    </span>
                    <button
                      onClick={() => setSelectedBudget('all')}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {searchQuery && (
                  <Badge variant="ivory" size="sm" className="gap-1.5">
                    <span>"{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-black/60 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#B8703F] hover:underline font-semibold ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* MATCHING COURSES SECTION (When searching) */}
            {matchingCourses.length > 0 && searchQuery.trim().length > 0 && (
              <div className="p-5 rounded-3xl bg-[#16171A] border border-white/[0.08] space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#B8703F]" />
                    <h3 className="text-sm font-display font-bold text-white">
                      Matching Curriculums & Video Protocols ({matchingCourses.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#F7F4EF]/50">
                    Direct access via Universifit Player
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse && onSelectCourse(course.id)}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#B8703F]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#B8703F] transition-colors truncate">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-[#F7F4EF]/50 truncate">
                            by {course.coachName} • {course.category}
                          </p>
                        </div>
                      </div>
                      {course.price !== undefined && (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-[#B8703F] block">
                            ${course.price}
                          </span>
                          <span className="text-[10px] text-[#6E8B6F] font-semibold">
                            Enrolled / Available
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS GRID, SKELETONS, ERROR, OR EMPTY STATE */}
            {isLoading ? (
              /* CARD-BASED SKELETON LOADERS (NOT SPINNERS) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Card
                    key={n}
                    variant="charcoal"
                    className="p-5 bg-[#121315] border-white/[0.08] animate-pulse space-y-4"
                  >
                    <div className="h-44 rounded-xl bg-white/[0.04]" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                        <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <div className="h-3 w-full bg-white/[0.04] rounded" />
                      <div className="h-3 w-4/5 bg-white/[0.04] rounded" />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <div className="h-6 w-16 bg-white/[0.04] rounded-full" />
                      <div className="h-6 w-20 bg-white/[0.04] rounded-full" />
                    </div>
                    <div className="h-10 bg-white/[0.05] rounded-full mt-2" />
                  </Card>
                ))}
              </div>
            ) : fetchError ? (
              /* ACTIONABLE ERROR STATE (NOT GENERIC) */
              <Card
                variant="charcoal"
                className="py-16 px-6 text-center max-w-xl mx-auto space-y-5 my-8 border-rose-500/30 bg-[#121315] shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-white tracking-tight">
                    Unable to load coach catalog
                  </h3>
                  <p className="text-sm text-[#F7F4EF]/60 leading-relaxed max-w-md mx-auto">
                    We encountered a connection issue while querying verified practitioner profiles. Please verify your internet connection or tap the button below to retry.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={loadCoachesAndCourses}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Retry Fetching Coaches
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleResetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            ) : filteredCoaches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 pt-2">
                {filteredCoaches.map((coach) => (
                  <CoachCard
                    key={coach.id}
                    coach={coach}
                    onBook={onBookCoach}
                  />
                ))}
              </div>
            ) : (
              /* CLEAR INFORMATIVE EMPTY STATE REUSING CARD & BUTTON */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-8"
              >
                <Card
                  variant="charcoal"
                  className="py-16 px-6 bg-[#121315] border-white/[0.08] text-center max-w-xl mx-auto space-y-5 shadow-xl"
                >
                  <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center shadow-sm">
                    <SearchX className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF] tracking-tight">
                      {hasActiveFilters
                        ? 'No coaches found matching your criteria'
                        : 'No verified coaches currently listed'}
                    </h3>
                    <p className="text-sm text-[#F7F4EF]/60 leading-relaxed font-normal">
                      {hasActiveFilters
                        ? "We couldn't find any coaches for your exact filter combination. Try broadening your budget range, clearing the format filter, or searching for broader terms like 'Strength' or 'Nutrition'."
                        : 'New expert practitioners are currently completing the Universifit credential verification review. Check back soon or apply to join as a verified coach.'}
                    </p>
                  </div>

                  {hasActiveFilters && (
                    <div className="pt-3 flex items-center justify-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleResetFilters}
                        leftIcon={<RotateCcw className="w-4 h-4" />}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

          </main>
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#16171A] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-lg text-white">Filter Coaches</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-full bg-white/[0.06] text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Goal Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase">Goal</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {goalOptions.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGoal(g.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium text-left border ${
                        selectedGoal === g.id
                          ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F]'
                          : 'bg-white/[0.03] text-white/70 border-white/10'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Filter */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-white/50 uppercase">Format</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {formatOptions.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium text-left border ${
                        selectedFormat === f.id
                          ? 'bg-[#6E8B6F]/20 text-[#6E8B6F] border-[#6E8B6F]'
                          : 'bg-white/[0.03] text-white/70 border-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
