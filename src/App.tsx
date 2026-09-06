import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { ExploreByGoal } from './components/ExploreByGoal';
import { VerifiedCoachesCarousel } from './components/VerifiedCoachesCarousel';
import { TestimonialCarousel } from './components/TestimonialCarousel';
import { MobileAppBanner } from './components/MobileAppBanner';
import { CreatorsSection } from './components/CreatorsSection';
import { Footer } from './components/Footer';
import type { StaticPageType } from './components/StaticPages';

// Code-split and lazy-load non-homepage routes & heavy modals
const DiscoverPage = lazy(() => import('./components/DiscoverPage').then((m) => ({ default: m.DiscoverPage })));
const CreatorProfilePage = lazy(() => import('./components/CreatorProfilePage').then((m) => ({ default: m.CreatorProfilePage })));
const CheckoutPage = lazy(() => import('./components/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CoursePlayerPage = lazy(() => import('./components/CoursePlayerPage').then((m) => ({ default: m.CoursePlayerPage })));
const CommunityPage = lazy(() => import('./components/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const MySpaceDashboard = lazy(() => import('./components/MySpaceDashboard').then((m) => ({ default: m.MySpaceDashboard })));
const CreatorDashboard = lazy(() => import('./components/CreatorDashboard').then((m) => ({ default: m.CreatorDashboard })));
const AuthPages = lazy(() => import('./components/AuthPages').then((m) => ({ default: m.AuthPages })));
const AdminCreatorsPage = lazy(() => import('./components/AdminCreatorsPage').then((m) => ({ default: m.AdminCreatorsPage })));
const StaticPages = lazy(() => import('./components/StaticPages').then((m) => ({ default: m.StaticPages })));
const Forbidden403 = lazy(() => import('./components/Forbidden403').then((m) => ({ default: m.Forbidden403 })));
const NotFound404 = lazy(() => import('./components/NotFound404').then((m) => ({ default: m.NotFound404 })));
const MessagesModal = lazy(() => import('./components/MessagesModal').then((m) => ({ default: m.MessagesModal })));
const SupportTicketModal = lazy(() => import('./components/SupportTicketModal').then((m) => ({ default: m.SupportTicketModal })));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl border-2 border-white/10 border-t-[#B8703F] animate-spin" />
        <div className="absolute w-7 h-7 rounded-xl bg-[#16171A] flex items-center justify-center font-display font-black text-xs text-[#E29A68]">
          U
        </div>
      </div>
      <p className="mt-4 text-xs font-mono text-[#F7F4EF]/50 tracking-wider uppercase animate-pulse">
        Loading Universifit...
      </p>
    </div>
  );
}
import {
  type CreatorItem,
  type CreatorOffer,
  type AuthUserData,
  verifySessionApi,
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
} from './services/api';
import {
  updatePageMetadata,
  STATIC_ROUTE_METADATA,
  setOrganizationSchema,
  clearOrganizationSchema,
  clearCourseSchema,
  clearCreatorSchema,
} from './utils/seo';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'discover' | 'creator' | 'checkout' | 'course' | 'community' | 'myspace' | 'dashboard' | 'auth' | 'admin-creators' | 'static' | 'forbidden' | 'not-found'>('home');
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(() => getStoredUser());
  const [forbiddenRequiredRole, setForbiddenRequiredRole] = useState<'CREATOR' | 'ADMIN' | 'BUYER'>('CREATOR');
  const [staticPage, setStaticPage] = useState<StaticPageType>('privacy');
  const [authPageMode, setAuthPageMode] = useState<'login' | 'signup'>('login');
  const [discoverCategory, setDiscoverCategory] = useState<string>('All');
  const [discoverSearch, setDiscoverSearch] = useState<string>('');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [checkoutOffer, setCheckoutOffer] = useState<CreatorOffer | undefined>(undefined);
  const [checkoutCreator, setCheckoutCreator] = useState<CreatorItem | undefined>(undefined);
  const [dashboardTab, setDashboardTab] = useState<'courses' | 'offers' | 'profile' | 'coupons' | 'availability' | 'community' | 'students' | 'calendar' | 'earnings' | 'analytics' | 'referrals'>('courses');

  // Messaging Modal State (F15)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [messagesPartnerId, setMessagesPartnerId] = useState<string | null>(null);
  const [messagesContextTitle, setMessagesContextTitle] = useState<string | null>(null);

  // Support Ticket Modal State (F18)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState<'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER'>('PAYMENT_ISSUE');
  const [supportEnrollmentId, setSupportEnrollmentId] = useState<string | undefined>(undefined);
  const [supportBookingId, setSupportBookingId] = useState<string | undefined>(undefined);

  const handleOpenMessages = (partnerId?: string, contextTitle?: string) => {
    setMessagesPartnerId(partnerId || null);
    setMessagesContextTitle(contextTitle || null);
    setIsMessagesOpen(true);
  };

  const handleOpenSupport = (
    category: 'PAYMENT_ISSUE' | 'ACCESS_ISSUE' | 'OTHER' = 'PAYMENT_ISSUE',
    refId?: string
  ) => {
    setSupportCategory(category);
    if (refId && refId.startsWith('enr-')) {
      setSupportEnrollmentId(refId);
      setSupportBookingId(undefined);
    } else if (refId && refId.startsWith('bk-')) {
      setSupportBookingId(refId);
      setSupportEnrollmentId(undefined);
    } else if (refId) {
      // generic reference
      setSupportEnrollmentId(refId);
      setSupportBookingId(undefined);
    } else {
      setSupportEnrollmentId(undefined);
      setSupportBookingId(undefined);
    }
    setIsSupportModalOpen(true);
  };

  const handleAuthSuccess = (role: 'BUYER' | 'CREATOR' | 'ADMIN', user?: AuthUserData) => {
    const activeUser = user || getStoredUser();
    if (activeUser) setCurrentUser(activeUser);

    if (role === 'CREATOR') {
      setCurrentRoute('dashboard');
      window.history.pushState({}, '', '/dashboard');
    } else if (role === 'ADMIN') {
      setCurrentRoute('admin-creators');
      window.history.pushState({}, '', '/admin/creators');
    } else {
      setCurrentRoute('myspace');
      window.history.pushState({}, '', '/my-space');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser URL hash or path changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/privacy' || hash === '#privacy') {
        setStaticPage('privacy');
        setCurrentRoute('static');
      } else if (path === '/terms' || hash === '#terms') {
        setStaticPage('terms');
        setCurrentRoute('static');
      } else if (path === '/refund-policy' || hash === '#refund-policy' || path === '/refunds' || hash === '#refunds') {
        setStaticPage('refund-policy');
        setCurrentRoute('static');
      } else if (path === '/contact' || hash === '#contact') {
        setStaticPage('contact');
        setCurrentRoute('static');
      } else if (path === '/admin/creators' || hash === '#admin/creators' || path === '/admin' || hash === '#admin') {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || !user) {
          setAuthPageMode('login');
          setCurrentRoute('auth');
          window.history.replaceState({}, '', '/login');
        } else if (user.role !== 'ADMIN') {
          setForbiddenRequiredRole('ADMIN');
          setCurrentRoute('forbidden');
        } else {
          setCurrentRoute('admin-creators');
        }
      } else if (path === '/login' || hash === '#login') {
        setAuthPageMode('login');
        setCurrentRoute('auth');
      } else if (path === '/signup' || hash === '#signup') {
        setAuthPageMode('signup');
        setCurrentRoute('auth');
      } else if (
        path === '/dashboard' ||
        hash === '#dashboard' ||
        path === '/dashboard/courses' ||
        path === '/dashboard/offers' ||
        path === '/dashboard/profile'
      ) {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || !user) {
          setAuthPageMode('login');
          setCurrentRoute('auth');
          window.history.replaceState({}, '', '/login');
        } else if (user.role !== 'CREATOR') {
          setForbiddenRequiredRole('CREATOR');
          setCurrentRoute('forbidden');
        } else {
          if (path === '/dashboard/profile') setDashboardTab('profile');
          else if (path === '/dashboard/offers') setDashboardTab('offers');
          else if (path === '/dashboard/courses') setDashboardTab('courses');
          setCurrentRoute('dashboard');
        }
      } else if (path === '/my-space' || hash === '#my-space') {
        const token = getStoredToken();
        const user = getStoredUser();
        if (!token || !user) {
          setAuthPageMode('login');
          setCurrentRoute('auth');
          window.history.replaceState({}, '', '/login');
        } else {
          setCurrentRoute('myspace');
        }
      } else if (path.includes('/community') || hash.includes('/community')) {
        const id = path.includes('/community')
          ? path.replace('/creator/', '').replace('/community', '')
          : hash.replace('#creator/', '').replace('/community', '');
        setSelectedCreatorId(id || '');
        setCurrentRoute('community');
      } else if (path.startsWith('/course/') || hash.startsWith('#course/')) {
        const id = path.startsWith('/course/')
          ? path.replace('/course/', '')
          : hash.replace('#course/', '');
        setSelectedCourseId(id || '');
        setCurrentRoute('course');
      } else if (path === '/checkout' || hash === '#checkout') {
        setCurrentRoute('checkout');
      } else if (path.startsWith('/creator/') || hash.startsWith('#creator/')) {
        const id = path.startsWith('/creator/')
          ? path.replace('/creator/', '')
          : hash.replace('#creator/', '');
        setSelectedCreatorId(id || '');
        setCurrentRoute('creator');
      } else if (path === '/discover' || hash === '#discover' || hash.startsWith('#discover?') || path.startsWith('/discover')) {
        setCurrentRoute('discover');
        const searchParams = new URLSearchParams(window.location.search || hash.split('?')[1] || '');
        const cat = searchParams.get('category') || searchParams.get('goal');
        const searchVal = searchParams.get('search') || searchParams.get('q');
        if (cat) setDiscoverCategory(cat);
        if (searchVal !== null) setDiscoverSearch(searchVal);
      } else if (path === '/' || path === '' || hash === '' || hash === '#' || hash === '#home') {
        setCurrentRoute('home');
      } else {
        setCurrentRoute('not-found');
      }
    };

    handleLocationChange();

    // Verify stored session on mount
    const existingToken = getStoredToken();
    if (existingToken) {
      verifySessionApi(existingToken).then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
        } else {
          clearStoredAuth();
          setCurrentUser(null);
          handleLocationChange();
        }
      }).catch(() => {
        // Backend offline or network error, keep offline state
      });
    }

    // Check for Google OAuth callback parameters
    const checkOAuthCallback = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      let token: string | null = null;

      if (hash.includes('auth_token=')) {
        const params = new URLSearchParams(hash.replace('#', ''));
        token = params.get('auth_token');
      } else if (search.includes('token=')) {
        const params = new URLSearchParams(search);
        token = params.get('token');
      }

      if (token) {
        // Backend verification: only accept session after GET /api/auth/me confirms valid JWT
        verifySessionApi(token).then((res) => {
          if (res.success && res.user) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setCurrentUser(res.user);
            const userRole = res.user.role || 'BUYER';
            handleAuthSuccess(userRole as any, res.user);
          } else {
            console.error('[OAuth Callback]: Token verification failed', res.error);
          }
        });
      }
    };

    checkOAuthCallback();

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Manage JSON-LD structured data lifecycle per route (Organization on home, cleanups elsewhere)
  useEffect(() => {
    if (currentRoute === 'home') {
      setOrganizationSchema();
    } else {
      clearOrganizationSchema();
    }

    if (currentRoute !== 'course') {
      clearCourseSchema();
    }

    if (currentRoute !== 'creator') {
      clearCreatorSchema();
    }
  }, [currentRoute]);

  // Synchronize dynamic per-page <title>, meta description, Open Graph, Twitter, and canonical tags
  useEffect(() => {
    if (currentRoute === 'not-found') {
      updatePageMetadata({
        ...STATIC_ROUTE_METADATA.notFound,
        canonicalUrl: `${window.location.origin}${window.location.pathname}`,
      });
      return;
    }

    if (currentRoute === 'creator') {
      // Dynamic per-creator metadata is handled inside CreatorProfilePage after fetching creator details
      return;
    }

    if (currentRoute === 'course') {
      // Dynamic per-course metadata is handled inside CoursePlayerPage after fetching course syllabus
      return;
    }

    if (currentRoute === 'checkout' && checkoutOffer && checkoutCreator) {
      updatePageMetadata({
        title: `Checkout: ${checkoutOffer.title} (${checkoutCreator.fullName}) | Universifit`,
        description: `Enroll in ${checkoutOffer.title} coached by ${checkoutCreator.fullName}. 256-bit encrypted checkout with 30-day money-back guarantee on Universifit.`,
        ogImage: '/og-image.svg',
        ogType: 'website',
        canonicalUrl: `${window.location.origin}/checkout`,
      });
      return;
    }

    if (currentRoute === 'static') {
      const meta = STATIC_ROUTE_METADATA[staticPage] || STATIC_ROUTE_METADATA.privacy;
      updatePageMetadata({
        ...meta,
        canonicalUrl: `${window.location.origin}/${staticPage}`,
      });
      return;
    }

    if (currentRoute === 'discover') {
      if (discoverCategory && discoverCategory !== 'All') {
        updatePageMetadata({
          title: `Discover ${discoverCategory} Coaches & Protocols | Universifit`,
          description: `Browse verified ${discoverCategory} coaching programs, video curriculums, and 1-on-1 consultations with vetted specialists on Universifit.`,
          ogImage: '/og-image.svg',
          ogType: 'website',
          canonicalUrl: `${window.location.origin}/discover?category=${encodeURIComponent(discoverCategory)}`,
        });
      } else {
        updatePageMetadata({
          ...STATIC_ROUTE_METADATA.discover,
          canonicalUrl: `${window.location.origin}/discover`,
        });
      }
      return;
    }

    const routeCanonicalMap: Record<string, string> = {
      home: `${window.location.origin}/`,
      myspace: `${window.location.origin}/my-space`,
      dashboard: `${window.location.origin}/dashboard`,
      auth: `${window.location.origin}/${authPageMode === 'login' ? 'login' : 'signup'}`,
      'admin-creators': `${window.location.origin}/admin/creators`,
      forbidden: `${window.location.origin}/forbidden`,
      community: `${window.location.origin}/community`,
      checkout: `${window.location.origin}/checkout`,
    };

    const routeMeta = STATIC_ROUTE_METADATA[currentRoute] || STATIC_ROUTE_METADATA.home;
    updatePageMetadata({
      ...routeMeta,
      canonicalUrl: routeCanonicalMap[currentRoute] || `${window.location.origin}/${currentRoute}`,
    });
  }, [currentRoute, staticPage, discoverCategory, checkoutOffer, checkoutCreator, authPageMode]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthPageMode(mode === 'login' ? 'login' : 'signup');
    setCurrentRoute('auth');
    window.history.pushState({}, '', mode === 'login' ? '/login' : '/signup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    setCurrentRoute('home');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookCoach = (coach: CreatorItem | string) => {
    const id = typeof coach === 'string' ? coach : coach.handle || coach.id;
    setSelectedCreatorId(id);
    setCurrentRoute('creator');
    window.history.pushState({}, '', `/creator/${encodeURIComponent(id)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookOffer = (offer: CreatorOffer, creator: CreatorItem) => {
    if (offer.type === 'COMMUNITY') {
      setSelectedCreatorId(creator.id);
      setCurrentRoute('community');
      window.history.pushState({}, '', `/creator/${encodeURIComponent(creator.id)}/community`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCheckoutOffer(offer);
    setCheckoutCreator(creator);
    setCurrentRoute('checkout');
    window.history.pushState({}, '', '/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGoalCategory = (categoryParam: string) => {
    setDiscoverCategory(categoryParam);
    setCurrentRoute('discover');
    window.history.pushState({}, '', `/discover?category=${encodeURIComponent(categoryParam)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDiscover = (cat?: string, search?: string) => {
    if (cat) setDiscoverCategory(cat);
    if (search !== undefined) setDiscoverSearch(search);
    setCurrentRoute('discover');
    const params = new URLSearchParams();
    if (cat && cat !== 'All') params.set('category', cat);
    if (search) params.set('q', search);
    const url = params.toString() ? `/discover?${params.toString()}` : '/discover';
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentRoute('home');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateMySpace = () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      setAuthPageMode('login');
      setCurrentRoute('auth');
      window.history.pushState({}, '', '/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentRoute('myspace');
    window.history.pushState({}, '', '/my-space');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDashboard = () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      setAuthPageMode('login');
      setCurrentRoute('auth');
      window.history.pushState({}, '', '/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (user.role !== 'CREATOR') {
      setForbiddenRequiredRole('CREATOR');
      setCurrentRoute('forbidden');
      window.history.pushState({}, '', '/dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentRoute('dashboard');
    window.history.pushState({}, '', '/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentRoute('course');
    window.history.pushState({}, '', `/course/${encodeURIComponent(courseId)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAdmin = () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token || !user) {
      setAuthPageMode('login');
      setCurrentRoute('auth');
      window.history.pushState({}, '', '/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (user.role !== 'ADMIN') {
      setForbiddenRequiredRole('ADMIN');
      setCurrentRoute('forbidden');
      window.history.pushState({}, '', '/admin/creators');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentRoute('admin-creators');
    window.history.pushState({}, '', '/admin/creators');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateStatic = (page: StaticPageType) => {
    setStaticPage(page);
    setCurrentRoute('static');
    window.history.pushState({}, '', `/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#16171A] text-[#F7F4EF] flex flex-col font-sans selection:bg-[#B8703F] selection:text-white">
      {/* Header with Role-Gated Controls & Notification Bell */}
      {currentRoute !== 'auth' && currentRoute !== 'admin-creators' && currentRoute !== 'static' && (
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
          onNavigateMySpace={handleNavigateMySpace}
          onNavigateDashboard={handleNavigateDashboard}
          onNavigateAdmin={handleNavigateAdmin}
          onOpenMessages={handleOpenMessages}
          onOpenSupport={handleOpenSupport}
          onSearchSubmit={(q) => handleNavigateDiscover(undefined, q)}
          onSelectCreator={(id) => {
            setSelectedCreatorId(id);
            setCurrentRoute('creator');
            window.history.pushState({}, '', `/creator/${encodeURIComponent(id)}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectCourse={handleNavigateCourse}
          onNavigate={(route) => {
            if (route === 'myspace') handleNavigateMySpace();
            else if (route === 'dashboard') handleNavigateDashboard();
            else if (route === 'discover') handleNavigateDiscover();
            else if (route === 'course') handleNavigateCourse('c-big3-mechanics');
          }}
        />
      )}

      {/* Main Content Router with Suspense Code-Splitting */}
      <main className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          {currentRoute === 'not-found' ? (
            /* Custom 404 Page Not Found */
            <NotFound404
              onBackHome={handleNavigateHome}
              onNavigateDiscover={(cat) => handleNavigateDiscover(cat)}
            />
          ) : currentRoute === 'forbidden' ? (
            /* HTTP 403 Forbidden Access Page */
            <Forbidden403
              requiredRole={forbiddenRequiredRole}
              userRole={currentUser?.role || 'BUYER'}
              onBackHome={handleNavigateHome}
              onLoginDifferent={() => handleOpenAuth('login')}
            />
          ) : currentRoute === 'static' ? (
            /* /privacy, /terms, /refund-policy, /contact Static Pages */
            <StaticPages
              initialPage={staticPage}
              onBackHome={handleNavigateHome}
              onSelectPage={handleNavigateStatic}
            />
          ) : currentRoute === 'admin-creators' ? (
            /* /admin/creators Verification Audit Table (Admin-only) */
            <AdminCreatorsPage onBackHome={handleNavigateHome} />
          ) : currentRoute === 'auth' ? (
            /* /login & /signup with Role Selection & Onboarding */
            <AuthPages
              initialMode={authPageMode}
              onAuthSuccess={handleAuthSuccess}
              onBack={handleNavigateHome}
              onNavigateTerms={() => handleNavigateStatic('terms')}
              onNavigatePrivacy={() => handleNavigateStatic('privacy')}
            />
          ) : currentRoute === 'dashboard' ? (
            /* /dashboard Creator Studio View (Offers, Students, Calendar, Earnings, Verification) */
            <CreatorDashboard
              onSwitchToBuyer={handleNavigateMySpace}
              onPreviewPublicProfile={handleBookCoach}
              onOpenMessages={handleOpenMessages}
              onOpenSupport={handleOpenSupport}
              initialTab={dashboardTab}
            />
          ) : currentRoute === 'myspace' ? (
            /* /my-space Buyer Dashboard (Enrolled Courses, Bookings, Purchases, Saved) */
            <MySpaceDashboard
              onResumeCourse={handleNavigateCourse}
              onExploreMore={handleNavigateDiscover}
              onOpenMessages={handleOpenMessages}
              onOpenSupport={handleOpenSupport}
              onSelectCreator={handleBookCoach}
            />
          ) : currentRoute === 'community' ? (
            /* /creator/[id]/community Feed & Reply Thread View */
            <CommunityPage
              creatorId={selectedCreatorId}
              onBack={() => {
                setCurrentRoute('creator');
                window.history.pushState({}, '', `/creator/${encodeURIComponent(selectedCreatorId)}`);
              }}
            />
          ) : currentRoute === 'course' ? (
            /* /course/[id] Video Player & Lesson Sidebar View */
            <CoursePlayerPage
              courseId={selectedCourseId}
              onBack={handleNavigateMySpace}
              onNavigateHome={handleNavigateHome}
              onNavigateDiscover={(cat) => handleNavigateDiscover(cat)}
              onNavigateCreator={(id) => {
                setSelectedCreatorId(id);
                setCurrentRoute('creator');
                window.history.pushState({}, '', `/creator/${encodeURIComponent(id)}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectCourse={handleNavigateCourse}
            />
          ) : currentRoute === 'checkout' ? (
            /* /checkout Order & Razorpay View */
            checkoutOffer && checkoutCreator ? (
              <CheckoutPage
                offer={checkoutOffer}
                creator={checkoutCreator}
                onBack={() => {
                  if (selectedCreatorId) {
                    setCurrentRoute('creator');
                    window.history.pushState({}, '', `/creator/${encodeURIComponent(selectedCreatorId)}`);
                  } else {
                    handleNavigateDiscover();
                  }
                }}
                onSuccessNavigate={handleNavigateMySpace}
              />
            ) : (
              <DiscoverPage
                initialCategory={discoverCategory}
                initialSearch={discoverSearch}
                onBookCoach={handleBookCoach}
                onSelectCourse={(courseId) => {
                  setSelectedCourseId(courseId);
                  setCurrentRoute('course');
                  window.history.pushState({}, '', `/course/${encodeURIComponent(courseId)}`);
                }}
                onBackHome={handleNavigateHome}
              />
            )
          ) : currentRoute === 'creator' ? (
            /* /creator/[id] Profile View */
            <CreatorProfilePage
              creatorId={selectedCreatorId}
              onBack={() => handleNavigateDiscover()}
              onNavigateHome={handleNavigateHome}
              onNavigateDiscover={(cat) => handleNavigateDiscover(cat)}
              onSelectCourse={handleNavigateCourse}
              onBookOffer={handleBookOffer}
            />
          ) : currentRoute === 'discover' ? (
            /* /discover View with Filter Sidebar & Results Grid */
            <DiscoverPage
              initialCategory={discoverCategory}
              initialSearch={discoverSearch}
              onBookCoach={handleBookCoach}
              onSelectCourse={handleNavigateCourse}
              onBackHome={handleNavigateHome}
            />
          ) : (
            /* Landing Page View */
            <>
              {/* Hero with Fraunces headline & asymmetric coach visual */}
              <Hero onGetStarted={() => handleOpenAuth('register')} />

              {/* Trust Strip with accent-copper numerals & 4 stat cards */}
              <TrustStrip />

              {/* Explore by Goal */}
              <ExploreByGoal onSelectCategory={handleSelectGoalCategory} />

              {/* Verified Coaches, Real Results (editorial-style horizontal spotlight) */}
              <VerifiedCoachesCarousel onBookCoach={handleBookCoach} />

              {/* Testimonial Carousel with 5 India-context genuine quotes */}
              <TestimonialCarousel />

              {/* Join on the go Banner Section */}
              <MobileAppBanner />

              {/* Explore Creators Section with Link to Discover */}
              <div className="bg-[#121315] py-6 border-t border-white/[0.08] text-center">
                <button
                  onClick={() => handleNavigateDiscover()}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#B8703F] hover:text-[#d48b59] transition-colors cursor-pointer"
                >
                  <span>Looking for advanced filters? Open Full Discover Experience &rarr;</span>
                </button>
              </div>
              <CreatorsSection onBookCreator={handleBookCoach} />
            </>
          )}
        </Suspense>
      </main>

      {/* Multi-Column Footer */}
      {currentRoute !== 'auth' && currentRoute !== 'admin-creators' && currentRoute !== 'static' && (
        <Footer
          currentUser={currentUser}
          onNavigateStatic={handleNavigateStatic}
          onNavigateAdmin={handleNavigateAdmin}
          onNavigateHome={handleNavigateHome}
          onNavigateDiscover={handleNavigateDiscover}
          onSelectCourse={handleNavigateCourse}
          onOpenSupport={() => handleOpenSupport('OTHER')}
        />
      )}

      {/* Direct Creator-Buyer Messaging Modal (F15) - Lazy loaded */}
      {isMessagesOpen && (
        <Suspense fallback={null}>
          <MessagesModal
            isOpen={isMessagesOpen}
            onClose={() => setIsMessagesOpen(false)}
            initialPartnerId={messagesPartnerId}
            initialContextTitle={messagesContextTitle}
          />
        </Suspense>
      )}

      {/* Support & Issue Resolution Desk Modal (F18) - Lazy loaded */}
      {isSupportModalOpen && (
        <Suspense fallback={null}>
          <SupportTicketModal
            isOpen={isSupportModalOpen}
            onClose={() => setIsSupportModalOpen(false)}
            initialCategory={supportCategory}
            initialEnrollmentId={supportEnrollmentId}
            initialBookingId={supportBookingId}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
