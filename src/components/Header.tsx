import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Dumbbell,
  Apple,
  Sparkles,
  UserCheck,
  Users,
  Compass,
  ArrowRight,
  Menu,
  X,
  Flame,
  Zap,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  Search,
  BookOpen,
  Star,
  CheckCircle2,
  Loader2,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from './ui';
import { NotificationBell } from './NotificationBell';
import {
  searchGlobalApi,
  type SearchResultCreator,
  type SearchResultCourse,
  type AuthUserData,
} from '../services/api';

interface HeaderProps {
  currentUser?: AuthUserData | null;
  onLogout?: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateMySpace?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateAdmin?: () => void;
  onOpenMessages?: () => void;
  onOpenSupport?: (category?: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER', refId?: string) => void;
  onNavigate?: (route: string) => void;
  onSearchSubmit?: (query: string) => void;
  onSelectCreator?: (creatorId: string) => void;
  onSelectCourse?: (courseId: string) => void;
  unreadMessagesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenAuth,
  onNavigateMySpace,
  onNavigateDashboard,
  onNavigateAdmin,
  onOpenMessages,
  onOpenSupport,
  onNavigate,
  onSearchSubmit,
  onSelectCreator,
  onSelectCourse,
  unreadMessagesCount = 1,
}) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    creators: SearchResultCreator[];
    courses: SearchResultCourse[];
    total: number;
  }>({ creators: [], courses: [], total: 0 });

  // Debounced Search API Trigger (300ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ creators: [], courses: [], total: 0 });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await searchGlobalApi(searchQuery.trim());
        if (res && res.results) {
          setSearchResults(res.results);
        }
      } catch (err) {
        console.debug('Global search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Keyboard shortcut (Cmd+K / Ctrl+K / slash)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsCategoriesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    {
      id: 'strength-physique',
      title: 'Strength / Physique',
      description: 'Hypertrophy, biomechanics, powerbuilding & body recomp.',
      icon: Dumbbell,
      badge: 'Popular',
      color: 'from-[#B8703F]/20 to-orange-500/10 text-[#B8703F]',
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      description: 'Custom macro protocols, fat loss & metabolic performance.',
      icon: Apple,
      badge: 'Vetted RD',
      color: 'from-[#6E8B6F]/25 to-emerald-500/10 text-[#6E8B6F]',
    },
    {
      id: 'skincare',
      title: 'Skincare',
      description: 'Dermatologist-backed barrier repair, acne & age reversal.',
      icon: Sparkles,
      badge: 'Clinical',
      color: 'from-sky-500/20 to-indigo-500/10 text-sky-400',
    },
    {
      id: 'posture-grooming',
      title: 'Posture & Grooming',
      description: 'Spine alignment, jawline mechanics, hair & aesthetic styling.',
      icon: UserCheck,
      badge: 'New',
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-300',
    },
    {
      id: 'community',
      title: 'Community',
      description: 'Accountability squads, group sprints & weekly coach AMAs.',
      icon: Users,
      badge: '48k+ Members',
      color: 'from-[#6E8B6F]/20 to-[#B8703F]/10 text-[#8cb08d]',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#16171A] border-b border-white/[0.08] text-[#F7F4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#F7F4EF] text-[#16171A] font-display font-black text-xl flex items-center justify-center tracking-tighter transition-transform group-hover:scale-105 shadow-sm">
              U
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-2xl tracking-tight text-[#F7F4EF] leading-none">
                Universifit
              </span>
              <span className="text-[10px] font-semibold text-[#F7F4EF]/50 uppercase tracking-widest mt-0.5">
                Vetted Coaching
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5" ref={megaMenuRef}>
            <a
              href="#explore-creators"
              className="px-4 py-2 rounded-full text-sm font-medium text-[#F7F4EF]/80 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-[#B8703F]" />
              <span>Explore Creators</span>
            </a>

            {/* Categories Mega-Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                onMouseEnter={() => setIsCategoriesOpen(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isCategoriesOpen
                    ? 'text-white bg-white/[0.1]'
                    : 'text-[#F7F4EF]/80 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span>Categories</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCategoriesOpen ? 'rotate-180 text-[#B8703F]' : 'text-[#F7F4EF]/60'
                  }`}
                />
              </button>

              {/* Categories Mega-Menu Dropdown */}
              <AnimatePresence>
                {isCategoriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onMouseLeave={() => setIsCategoriesOpen(false)}
                    className="absolute top-full left-0 mt-3 w-[640px] bg-[#16171A] border border-white/[0.12] rounded-3xl p-5 shadow-2xl z-50 backdrop-blur-2xl"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                      <div>
                        <h4 className="text-sm font-display font-bold text-[#F7F4EF]">
                          Coaching Disciplines
                        </h4>
                        <p className="text-xs text-[#F7F4EF]/50">
                          Hand-selected coaches across physical and aesthetic disciplines
                        </p>
                      </div>
                      <Badge variant="verified" size="sm">
                        100% Vetted
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {categories.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                          <a
                            key={cat.id}
                            href={`#${cat.id}`}
                            onClick={() => setIsCategoriesOpen(false)}
                            className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.04] hover:border-white/[0.12] transition-all flex items-start gap-3"
                          >
                            <div
                              className={`p-2.5 rounded-xl bg-gradient-to-br ${cat.color} shrink-0`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#F7F4EF] group-hover:text-white transition-colors">
                                  {cat.title}
                                </span>
                                {cat.badge && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/[0.08] text-[#F7F4EF]/70">
                                    {cat.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#F7F4EF]/50 line-clamp-1 mt-0.5">
                                {cat.description}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    {/* Mega Menu Footer Banner */}
                    <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="text-[#F7F4EF]/60 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#B8703F]" />
                        Over 500+ coach applications vetted weekly
                      </span>
                      <a
                        href="#all-categories"
                        onClick={() => setIsCategoriesOpen(false)}
                        className="text-[#B8703F] font-semibold flex items-center gap-1 hover:underline"
                      >
                        Browse all disciplines <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Global Full-Text Search Input & Autocomplete Dropdown */}
            <div className="relative hidden lg:block w-64 xl:w-72" ref={searchContainerRef}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    setIsSearchOpen(false);
                    if (onSearchSubmit) onSearchSubmit(searchQuery.trim());
                    else if (onNavigate) onNavigate('discover');
                  }
                }}
                className="relative flex items-center"
              >
                <Search className="w-3.5 h-3.5 text-[#F7F4EF]/40 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search coaches, bio, courses..."
                  className="w-full h-9 pl-9 pr-8 bg-white/[0.04] hover:bg-white/[0.07] focus:bg-[#121315] border border-white/10 focus:border-[#B8703F] rounded-full text-xs text-[#F7F4EF] placeholder:text-[#F7F4EF]/40 transition-all outline-none"
                />
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#B8703F] animate-spin absolute right-3" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-3 text-[#F7F4EF]/40 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="absolute right-3 text-[10px] font-mono text-[#F7F4EF]/30 border border-white/10 px-1.5 py-0.5 rounded pointer-events-none">
                    ⌘K
                  </span>
                )}
              </form>

              {/* Autocomplete Dropdown Popover */}
              <AnimatePresence>
                {isSearchOpen && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-96 bg-[#16171A] border border-white/[0.14] rounded-3xl p-4 shadow-2xl z-50 backdrop-blur-2xl max-h-[80vh] overflow-y-auto space-y-3 divide-y divide-white/[0.08]"
                  >
                    {/* Header Summary */}
                    <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-[#F7F4EF]/60">
                      <span>Search results for "{searchQuery}"</span>
                      {isSearching ? (
                        <span className="text-[#B8703F] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                        </span>
                      ) : (
                        <span className="font-mono text-[#B8703F]">{searchResults.total} found</span>
                      )}
                    </div>

                    {/* Section 1: Coaches */}
                    {searchResults.creators.length > 0 && (
                      <div className="pt-2.5 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7F4EF]/40 block">
                          Verified Coaches ({searchResults.creators.length})
                        </span>
                        <div className="space-y-1">
                          {searchResults.creators.slice(0, 3).map((creator) => (
                            <button
                              key={creator.id}
                              type="button"
                              onClick={() => {
                                setIsSearchOpen(false);
                                if (onSelectCreator) onSelectCreator(creator.id);
                                else if (onNavigate) onNavigate('creator');
                              }}
                              className="w-full p-2 rounded-2xl hover:bg-white/[0.06] transition-colors flex items-center gap-3 text-left cursor-pointer group"
                            >
                              <img
                                src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900'}
                                alt={`${creator.fullName} profile photo`}
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white group-hover:text-[#B8703F] transition-colors truncate">
                                    {creator.fullName}
                                  </span>
                                  <CheckCircle2 className="w-3 h-3 text-[#6E8B6F] shrink-0" />
                                </div>
                                <p className="text-[11px] text-[#F7F4EF]/50 truncate">
                                  {creator.headline || creator.specialtyTags.join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold shrink-0">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{creator.rating.toFixed(1)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 2: Courses */}
                    {searchResults.courses.length > 0 && (
                      <div className="pt-2.5 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7F4EF]/40 block">
                          Curriculums & Protocols ({searchResults.courses.length})
                        </span>
                        <div className="space-y-1">
                          {searchResults.courses.slice(0, 3).map((course) => (
                            <button
                              key={course.id}
                              type="button"
                              onClick={() => {
                                setIsSearchOpen(false);
                                if (onSelectCourse) onSelectCourse(course.id);
                                else if (onNavigate) onNavigate('course');
                              }}
                              className="w-full p-2 rounded-2xl hover:bg-white/[0.06] transition-colors flex items-center gap-3 text-left cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-white group-hover:text-[#B8703F] transition-colors truncate block">
                                  {course.title}
                                </span>
                                <p className="text-[11px] text-[#F7F4EF]/50 truncate">
                                  by {course.coachName} • {course.category}
                                </p>
                              </div>
                              {course.price !== undefined && (
                                <span className="text-xs font-bold font-mono text-[#B8703F] shrink-0">
                                  ${course.price}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No results fallback */}
                    {!isSearching && searchResults.total === 0 && (
                      <div className="py-6 text-center text-xs text-[#F7F4EF]/50 space-y-1">
                        <p className="font-semibold text-white">No matches found</p>
                        <p className="text-[11px]">
                          Try searching for "strength", "nutrition", "marcus", or "posture".
                        </p>
                      </div>
                    )}

                    {/* Footer Discover Link */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          if (onSearchSubmit) onSearchSubmit(searchQuery.trim());
                          else if (onNavigate) onNavigate('discover');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-[#B8703F]/20 text-[#B8703F] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>View all results in Discover</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* Right Side: Login / Register Button & Role-Gated Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {!currentUser ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth('login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenAuth('register')}
              >
                Join Universifit
              </Button>
            </>
          ) : (
            <>
              {/* My Space: for BUYER and CREATOR */}
              {onNavigateMySpace && (currentUser.role === 'BUYER' || currentUser.role === 'CREATOR') && (
                <button
                  onClick={onNavigateMySpace}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-[#F7F4EF] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-[#B8703F]" />
                  <span>My Space</span>
                </button>
              )}

              {/* Creator Studio: only for CREATOR */}
              {onNavigateDashboard && currentUser.role === 'CREATOR' && (
                <button
                  onClick={onNavigateDashboard}
                  className="px-3.5 py-1.5 rounded-full bg-[#B8703F]/15 hover:bg-[#B8703F]/25 border border-[#B8703F]/40 text-xs font-bold text-[#B8703F] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>Creator Studio</span>
                </button>
              )}

              {/* Admin Audit: only for ADMIN */}
              {onNavigateAdmin && currentUser.role === 'ADMIN' && (
                <button
                  onClick={onNavigateAdmin}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-bold text-emerald-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Audit</span>
                </button>
              )}

              {/* Direct Messages */}
              {onOpenMessages && (
                <button
                  onClick={onOpenMessages}
                  className="relative p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#F7F4EF]/80 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                  title="Direct Messages"
                >
                  <MessageSquare className="w-4 h-4 text-[#B8703F]" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B8703F] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
              )}

              {/* Help & Support Desk */}
              {onOpenSupport && (
                <button
                  onClick={() => onOpenSupport()}
                  className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#F7F4EF]/80 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                  title="Help & Support Desk"
                >
                  <HelpCircle className="w-4 h-4 text-[#6E8B6F]" />
                </button>
              )}

              {/* In-App Notification Bell (F17) */}
              <NotificationBell onNavigate={onNavigate} />

              {/* User Avatar Badge & Sign Out Button */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div
                  className="flex items-center gap-1.5 text-xs text-[#F7F4EF]/80 max-w-[130px] truncate"
                  title={currentUser.email}
                >
                  <div className="w-6 h-6 rounded-full bg-[#B8703F]/20 border border-[#B8703F]/40 flex items-center justify-center text-[#B8703F] text-[11px] font-bold shrink-0">
                    {currentUser.profile?.fullName ? currentUser.profile.fullName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                  </div>
                  <span className="truncate">{currentUser.profile?.fullName || currentUser.email.split('@')[0]}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button & Notification Bell */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && <NotificationBell onNavigate={onNavigate} />}

          {!currentUser ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAuth('login')}
            >
              Sign In
            </Button>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#B8703F]/20 border border-[#B8703F]/40 flex items-center justify-center text-[#B8703F] text-xs font-bold">
              {currentUser.profile?.fullName ? currentUser.profile.fullName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#F7F4EF]/80 hover:text-white hover:bg-white/[0.08]"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#16171A] border-b border-white/[0.08] px-4 py-6 space-y-4"
          >
            {/* Mobile Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setIsMobileMenuOpen(false);
                  if (onSearchSubmit) onSearchSubmit(searchQuery.trim());
                  else if (onNavigate) onNavigate('discover');
                }
              }}
              className="relative flex items-center"
            >
              <Search className="w-4 h-4 text-[#F7F4EF]/40 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coaches, specialties, courses..."
                className="w-full h-10 pl-10 pr-4 bg-white/[0.05] border border-white/10 rounded-2xl text-xs text-white placeholder:text-[#F7F4EF]/40 outline-none focus:border-[#B8703F]"
              />
            </form>

            <a
              href="#explore-creators"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-[#F7F4EF]/90"
            >
              Explore Creators
            </a>
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <span className="text-xs font-bold text-[#F7F4EF]/40 uppercase tracking-wider">
                Categories
              </span>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 text-sm text-[#F7F4EF]/80 hover:text-white"
                >
                  <cat.icon className="w-4 h-4 text-[#B8703F]" />
                  <span>{cat.title}</span>
                </a>
              ))}
            </div>

            {!currentUser ? (
              <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                >
                  Join Universifit
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-[#B8703F]/20 border border-[#B8703F]/40 flex items-center justify-center text-[#B8703F] text-xs font-bold">
                    {currentUser.profile?.fullName ? currentUser.profile.fullName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white truncate max-w-[180px]">
                      {currentUser.profile?.fullName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-[#B8703F] font-mono uppercase font-bold">
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {onNavigateMySpace && (currentUser.role === 'BUYER' || currentUser.role === 'CREATOR') && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateMySpace();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/[0.05] text-left text-sm text-[#F7F4EF]/90 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-[#B8703F]" />
                      <span>My Space</span>
                    </button>
                  )}

                  {onNavigateDashboard && currentUser.role === 'CREATOR' && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateDashboard();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-[#B8703F]/10 text-left text-sm font-semibold text-[#B8703F] cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#B8703F]" />
                      <span>Creator Studio</span>
                    </button>
                  )}

                  {onNavigateAdmin && currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateAdmin();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-emerald-500/10 text-left text-sm font-semibold text-emerald-400 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Admin Audit</span>
                    </button>
                  )}

                  {onOpenMessages && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenMessages();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/[0.05] text-left text-sm text-[#F7F4EF]/80 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-[#B8703F]" />
                      <span>Direct Messages</span>
                    </button>
                  )}

                  {onOpenSupport && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenSupport();
                      }}
                      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/[0.05] text-left text-sm text-[#F7F4EF]/80 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-[#6E8B6F]" />
                      <span>Help & Support Desk</span>
                    </button>
                  )}
                </div>

                {onLogout && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 mt-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
