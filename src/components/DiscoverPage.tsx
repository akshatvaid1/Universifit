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
  Smile,
  ShieldCheck,
  Apple,
  Activity,
  Video,
  BookOpen,
  Users,
  Check,
  AlertCircle,
} from 'lucide-react';
import { CoachCard } from './CoachCard';
import { Input, Button, Breadcrumbs } from './ui';
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

  // Sync state when props change
  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedGoal(initialCategory || 'All');
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Keep URL search params in sync with active filter/query
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/discover')) {
      const params = new URLSearchParams(window.location.search);
      if (selectedGoal && selectedGoal !== 'All') {
        params.set('category', selectedGoal);
      } else {
        params.delete('category');
        params.delete('goal');
      }
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      } else {
        params.delete('q');
        params.delete('search');
      }
      const newQuery = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', `/discover${newQuery}`);
    }
  }, [selectedGoal, searchQuery]);

  // Goal & Discipline options (Real DB categories)
  const goalOptions = [
    { id: 'All', label: 'All Disciplines', icon: Sparkles },
    { id: 'physique', label: 'Strength & Physique', icon: Dumbbell },
    { id: 'grooming', label: 'Grooming & Skincare', icon: Sparkles },
    { id: 'looksmaxxing', label: 'Facial Aesthetics', icon: Smile },
    { id: 'confidence', label: 'Mindset & Confidence', icon: ShieldCheck },
    { id: 'diet', label: 'Diet & Nutrition', icon: Apple },
    { id: 'posture', label: 'Posture & Biomechanics', icon: Activity },
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
    { id: 'COMMUNITY', label: 'Group Cohort', icon: Users },
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

      if (searchRes?.results?.courses) {
        setMatchingCourses(searchRes.results.courses);
      } else {
        setMatchingCourses([]);
      }
    } catch (error: any) {
      console.error('[DiscoverPage]: Failed to fetch coaches:', error);
      setFetchError('Unable to query coach directory. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadCoachesAndCourses();
    }, 300);

    return () => clearTimeout(handler);
  }, [selectedGoal, searchQuery]);

  // Client-side filtering & sorting
  const filteredCoaches = useMemo(() => {
    return coaches
      .filter((c) => {
        // Goal Filter
        if (selectedGoal !== 'All') {
          const term = selectedGoal.toLowerCase();
          const goalMatches =
            c.specialtyTags.some((tag) =>
              tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())
            ) ||
            c.headline?.toLowerCase().includes(term) ||
            c.bio?.toLowerCase().includes(term);
          if (!goalMatches) return false;
        }

        // Format Filter
        if (selectedFormat !== 'all') {
          const hasFormat = c.featuredOffers?.some((o) => o.type === selectedFormat);
          if (!hasFormat) return false;
        }

        // Budget Filter
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
  }, [coaches, selectedGoal, selectedFormat, selectedBudget, sortBy]);

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
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-24">
      {/* Top Breadcrumb & Search Header */}
      <div className="border-b border-[#E8E8E6] bg-white pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                          label: goalOptions.find((g) => g.id === selectedGoal)?.label || selectedGoal,
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

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-semibold text-[#14161A] tracking-tight">
                Discover Vetted Coaches
              </h1>
              <p className="text-sm sm:text-base text-[#8B8D91] mt-1.5 max-w-xl font-normal leading-relaxed">
                Browse verified practitioners across physique, grooming, facial aesthetics, and posture optimization.
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full lg:w-96">
              <Input
                aria-label="Search coach, discipline, or curriculum"
                placeholder="Search coach, discipline, or curriculum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-[#5A5D62]" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="cursor-pointer text-[#5A5D62] hover:text-[#14161A] p-1 rounded focus-visible:ring-2 focus-visible:ring-[#3652C4]"
                      aria-label="Clear search query"
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
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24 self-start">
            <div className="p-5 rounded-xl bg-white border border-[#E8E8E6] space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E6]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#14161A]" />
                  <h3 className="font-sans font-semibold text-sm text-[#14161A]">Filters</h3>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-medium text-[#3652C4] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Goal / Discipline Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91] block">
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
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] ${
                          isSelected
                            ? 'bg-[#14161A] text-white'
                            : 'text-[#14161A] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IconComp className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{goal.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Filter */}
              <div className="space-y-2 pt-4 border-t border-[#E8E8E6]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91] block">
                  Coaching Format
                </label>
                <div className="space-y-1">
                  {formatOptions.map((fmt) => {
                    const isSelected = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] ${
                          isSelected
                            ? 'bg-[#14161A] text-white'
                            : 'text-[#14161A] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        <span>{fmt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Range Filter */}
              <div className="space-y-2 pt-4 border-t border-[#E8E8E6]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91] block">
                  Budget Range
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {budgetOptions.map((b) => {
                    const isSelected = selectedBudget === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBudget(b.id)}
                        className={`px-2.5 py-2 rounded-md text-xs font-medium text-center border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] ${
                          isSelected
                            ? 'bg-[#14161A] text-white border-[#14161A]'
                            : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
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
          <section className="lg:col-span-9 space-y-6" aria-label="Coach search results">
            
            {/* Action Bar: Total Count, Active Filters Pills, Sort Dropdown & Mobile Filter Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E8E6]">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  aria-expanded={isMobileFilterOpen}
                  aria-controls="mobile-filter-drawer"
                  className="lg:hidden px-3 py-1.5 rounded-md bg-white border border-[#E8E8E6] text-xs font-medium text-[#14161A] flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3652C4]"
                >
                  <Filter className="w-3.5 h-3.5 text-[#3652C4]" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3652C4]" />
                  )}
                </button>

                <p className="text-sm font-medium text-[#14161A]">
                  Showing{' '}
                  <span className="font-semibold text-[#14161A]">
                    {filteredCoaches.length}
                  </span>{' '}
                  verified coaches
                </p>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 text-xs font-medium text-[#5A5D62]">
                <span>Sort by:</span>
                <div className="flex items-center bg-white p-0.5 rounded-md border border-[#E8E8E6]">
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      sortBy === 'rating' ? 'bg-[#14161A] text-white' : 'text-[#5A5D62] hover:text-[#14161A]'
                    }`}
                  >
                    Rating
                  </button>
                  <button
                    onClick={() => setSortBy('clients')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      sortBy === 'clients' ? 'bg-[#14161A] text-white' : 'text-[#5A5D62] hover:text-[#14161A]'
                    }`}
                  >
                    Popular
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Chips Bar */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Active filters">
                <span className="text-xs text-[#5A5D62] font-medium mr-1">Active:</span>

                {selectedGoal !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E8E8E6] text-[#14161A]">
                    <span>{goalOptions.find((g) => g.id === selectedGoal)?.label || selectedGoal}</span>
                    <button
                      onClick={() => setSelectedGoal('All')}
                      className="hover:text-[#3652C4] cursor-pointer rounded p-0.5"
                      aria-label={`Remove goal filter ${selectedGoal}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedFormat !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E8E8E6] text-[#14161A]">
                    <span>
                      {formatOptions.find((f) => f.id === selectedFormat)?.label}
                    </span>
                    <button
                      onClick={() => setSelectedFormat('all')}
                      className="hover:text-[#3652C4] cursor-pointer rounded p-0.5"
                      aria-label="Remove format filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedBudget !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E8E8E6] text-[#14161A]">
                    <span>
                      {budgetOptions.find((b) => b.id === selectedBudget)?.label}
                    </span>
                    <button
                      onClick={() => setSelectedBudget('all')}
                      className="hover:text-[#3652C4] cursor-pointer rounded p-0.5"
                      aria-label="Remove budget filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-[#E8E8E6] text-[#14161A]">
                    <span>"{searchQuery}"</span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-[#3652C4] cursor-pointer rounded p-0.5"
                      aria-label="Remove search query filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#3652C4] hover:underline font-medium ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* MATCHING COURSES (When searching) */}
            {matchingCourses.length > 0 && searchQuery.trim().length > 0 && (
              <div className="p-5 rounded-xl bg-white border border-[#E8E8E6] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#3652C4]" />
                    <h3 className="text-sm font-sans font-semibold text-[#14161A]">
                      Matching Curriculums & Video Protocols ({matchingCourses.length})
                    </h3>
                  </div>
                  <span className="text-xs text-[#8B8D91]">
                    Universifit Video Player
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchingCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse && onSelectCourse(course.id)}
                      className="p-3 rounded-lg bg-[#F7F7F5] hover:bg-white border border-[#E8E8E6] hover:border-[#14161A] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-white border border-[#E8E8E6] text-[#14161A] flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-[#3652C4]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-[#14161A] group-hover:text-[#3652C4] transition-colors truncate">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-[#8B8D91] truncate">
                            by {course.coachName} • {course.category}
                          </p>
                        </div>
                      </div>
                      {course.price !== undefined && (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#14161A] block">
                            ${course.price}
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
              /* CARD-BASED SKELETON LOADERS */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 pt-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="p-5 rounded-xl bg-white border border-[#E8E8E6] animate-pulse space-y-4"
                  >
                    <div className="h-44 rounded-lg bg-[#F7F7F5]" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-[#F7F7F5] rounded" />
                      <div className="h-3 w-1/2 bg-[#F7F7F5] rounded" />
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-[#E8E8E6]">
                      <div className="h-3 w-full bg-[#F7F7F5] rounded" />
                      <div className="h-3 w-4/5 bg-[#F7F7F5] rounded" />
                    </div>
                    <div className="h-9 bg-[#F7F7F5] rounded-md mt-2" />
                  </div>
                ))}
              </div>
            ) : fetchError ? (
              /* ERROR STATE */
              <div className="py-16 px-6 text-center max-w-xl mx-auto space-y-5 my-8 rounded-xl bg-white border border-[#E8E8E6]">
                <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-rose-500 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-sans font-semibold text-[#14161A] tracking-tight">
                    Unable to load coach catalog
                  </h3>
                  <p className="text-sm text-[#8B8D91] leading-relaxed max-w-md mx-auto font-normal">
                    We encountered a connection issue while querying practitioner profiles. Please verify your connection or retry below.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={loadCoachesAndCourses}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            ) : filteredCoaches.length > 0 ? (
              /* RESULTS GRID */
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
              /* CLEAR INFORMATIVE EMPTY STATE */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-8"
              >
                <div className="py-16 px-6 bg-white border border-[#E8E8E6] rounded-xl text-center max-w-xl mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A] mx-auto flex items-center justify-center">
                    <SearchX className="w-6 h-6 text-[#14161A]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-sans font-semibold text-[#14161A] tracking-tight">
                      {hasActiveFilters
                        ? 'No coaches found matching your criteria'
                        : 'No verified coaches currently listed'}
                    </h3>
                    <p className="text-sm text-[#8B8D91] leading-relaxed font-normal max-w-md mx-auto">
                      {hasActiveFilters
                        ? "We couldn't find any coaches for your exact filter combination. Try clearing some filters or searching for broader terms like 'Physique' or 'Nutrition'."
                        : 'New expert practitioners are currently completing platform onboarding. Check back soon or apply to join as a creator.'}
                    </p>
                  </div>

                  {hasActiveFilters && (
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleResetFilters}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </section>
        </div>
      </div>

      {/* MOBILE FILTER MODAL DRAWER */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div
            id="mobile-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-heading"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-xl border border-[#E8E8E6] p-6 space-y-6 max-h-[90vh] overflow-y-auto text-[#14161A]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E6]">
                <h3 id="mobile-filter-heading" className="font-sans font-semibold text-base text-[#14161A]">Filter Coaches</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-md hover:bg-[#F7F7F5] text-[#5A5D62] hover:text-[#14161A] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3652C4]"
                  aria-label="Close filters dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Goal Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8B8D91] uppercase">Goal & Discipline</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {goalOptions.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGoal(g.id)}
                      className={`p-2.5 rounded-md text-xs font-medium text-left border transition-colors cursor-pointer ${
                        selectedGoal === g.id
                          ? 'bg-[#14161A] text-white border-[#14161A]'
                          : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Filter */}
              <div className="space-y-2 pt-2 border-t border-[#E8E8E6]">
                <label className="text-xs font-semibold text-[#8B8D91] uppercase">Format</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {formatOptions.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`p-2.5 rounded-md text-xs font-medium text-left border transition-colors cursor-pointer ${
                        selectedFormat === f.id
                          ? 'bg-[#14161A] text-white border-[#14161A]'
                          : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Filter */}
              <div className="space-y-2 pt-2 border-t border-[#E8E8E6]">
                <label className="text-xs font-semibold text-[#8B8D91] uppercase">Budget Range</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {budgetOptions.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBudget(b.id)}
                      className={`p-2.5 rounded-md text-xs font-medium text-left border transition-colors cursor-pointer ${
                        selectedBudget === b.id
                          ? 'bg-[#14161A] text-white border-[#14161A]'
                          : 'bg-white text-[#14161A] border-[#E8E8E6] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3 border-t border-[#E8E8E6]">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
