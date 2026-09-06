import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  Lock,
  Download,
  ChevronLeft,
  Clock,
  BookOpen,
  FileText,
  Trophy,
  Check,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Film,
  Star,
  Award,
} from 'lucide-react';
import { Card, Badge, Button, ProgressBar, Breadcrumbs } from './ui';
import { ReviewModal } from './ReviewModal';
import {
  fetchCourseById,
  completeLessonApi,
  fetchCourseCertificateApi,
  getCourseCertificateDownloadUrl,
  type CourseDetail,
  type LessonItem,
  type CertificateItem,
} from '../services/api';
import { updatePageMetadata, setCourseSchema, clearCourseSchema, getCourseOgImageUrl } from '../utils/seo';

interface CoursePlayerPageProps {
  courseId?: string;
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigateDiscover?: (category?: string) => void;
  onNavigateCreator?: (creatorId: string) => void;
  onSelectCourse?: (courseId: string) => void;
}

export const CoursePlayerPage: React.FC<CoursePlayerPageProps> = ({
  courseId = '',
  onBack,
  onNavigateHome,
  onNavigateDiscover,
  onNavigateCreator,
  onSelectCourse,
}) => {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [isMarkingComplete, setIsMarkingComplete] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [certificate, setCertificate] = useState<CertificateItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = () => {
    if (!courseId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchCourseById(courseId)
      .then((data) => {
        if (data) {
          setCourse(data);
          const firstIncomplete = data.lessons.find((l) => !l.isCompleted && !l.isLocked);
          if (firstIncomplete) {
            setActiveLessonId(firstIncomplete.id);
          } else if (data.lessons.length > 0) {
            setActiveLessonId(data.lessons[0].id);
          }

          // If all lessons completed, prefetch certificate
          if (data.lessons.length > 0 && data.lessons.every((l) => l.isCompleted)) {
            fetchCourseCertificateApi(courseId)
              .then((res) => {
                if (res && res.data) setCertificate(res.data);
              })
              .catch(() => {});
          }
        } else {
          setError('Course curriculum not found');
        }
      })
      .catch((err) => {
        console.debug('fetchCourseById error', err);
        setError('Network interruption while streaming course data');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCourse();
  }, [courseId]);

  // Dynamic Course SEO Metadata Injection (Title, Description, Canonical URL)
  useEffect(() => {
    if (course && course.title) {
      const activeLesson = course.lessons.find((l) => l.id === activeLessonId) || course.lessons[0];
      const lessonPart = activeLesson?.title ? ` — ${activeLesson.title}` : '';
      const descSnippet = course.description
        ? course.description.length > 140
          ? `${course.description.slice(0, 137)}...`
          : course.description
        : `Master ${course.title} by Coach ${course.coachName}. Video syllabus, spreadsheet protocols, and coach form checks.`;

      const ogImage = getCourseOgImageUrl({
        id: course.id || courseId,
        title: course.title,
        coachName: course.coachName,
        coachAvatar: course.coachAvatar,
      });

      updatePageMetadata({
        title: `${course.title}${lessonPart} | Universifit Curriculum`,
        description: `${descSnippet} Verified coaching protocol on Universifit.`,
        ogImage,
        ogType: 'article',
        canonicalUrl: `${window.location.origin}/course/${encodeURIComponent(course.id || courseId)}`,
      });

      // Inject Schema.org Course Structured Data
      setCourseSchema({
        id: course.id || courseId,
        title: course.title,
        description: course.description || undefined,
        coachName: course.coachName,
        thumbnailUrl: course.coachAvatar,
        price: 150,
        currency: 'USD',
      });
    } else if (error) {
      clearCourseSchema();
      updatePageMetadata({
        title: 'Curriculum Stream Unavailable | Universifit',
        description: 'Unable to load course modules or streaming media on Universifit.',
        ogImage: '/og-image.svg',
        ogType: 'article',
        canonicalUrl: `${window.location.origin}/course/${encodeURIComponent(courseId)}`,
      });
    }

    return () => {
      clearCourseSchema();
    };
  }, [course, activeLessonId, error, courseId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-28">
        {/* Top Navbar Skeleton */}
        <div className="border-b border-white/[0.08] bg-[#16171A] sticky top-20 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
              <span>Back to Dashboard</span>
            </button>
            <div className="w-32 h-6 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* Classroom Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
            {/* Video Player Skeleton (Span 8) */}
            <div className="lg:col-span-8 space-y-6">
              <Card variant="charcoal" className="relative aspect-video rounded-3xl bg-white/[0.04] border-white/[0.08] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <Play className="w-7 h-7 text-white/20 fill-current ml-1" />
                </div>
              </Card>
              <div className="space-y-3">
                <div className="h-7 w-2/3 bg-white/[0.08] rounded-xl" />
                <div className="h-4 w-full bg-white/[0.04] rounded" />
                <div className="h-4 w-4/5 bg-white/[0.04] rounded" />
              </div>
            </div>

            {/* Sidebar Syllabus Skeleton (Span 4) */}
            <div className="lg:col-span-4">
              <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] space-y-4">
                <div className="h-5 w-1/2 bg-white/[0.08] rounded" />
                <div className="h-2 w-full bg-white/[0.04] rounded-full" />
                <div className="space-y-3 pt-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-28 flex flex-col justify-center items-center px-4">
        <Card
          variant="charcoal"
          className="p-8 sm:p-10 max-w-lg w-full text-center space-y-6 border-rose-500/30 bg-[#16171A] shadow-2xl my-16"
        >
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              Unable to Load Curriculum Stream
            </h1>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
              We were unable to load the modules for this course. Your session token may need renewal or the streaming server is momentarily unreachable.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={loadCourse}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retry Video Stream
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={onBack}
            >
              Return to My Space
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!course || course.lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-28 flex flex-col justify-center items-center px-4">
        <Card
          variant="charcoal"
          className="p-8 sm:p-10 max-w-lg w-full text-center space-y-6 border-white/[0.08] bg-[#16171A] shadow-2xl my-16"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center">
            <Film className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">
              No curriculum lessons published yet
            </h1>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
              The coach has registered this course syllabus but has not yet published active video lessons. Check back soon for module drops.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={onBack}
            >
              Back to My Space
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeLesson: LessonItem =
    course.lessons.find((l) => l.id === activeLessonId) || course.lessons[0];

  const completedCount = course.lessons.filter((l) => l.isCompleted).length;
  const totalCount = course.lessons.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Handle Mark Complete with B3 API
  const handleMarkComplete = async () => {
    if (activeLesson.isLocked || isMarkingComplete) return;

    setIsMarkingComplete(true);
    try {
      await completeLessonApi(activeLesson.id);

      // Update local state
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              lessons: prev.lessons.map((l) =>
                l.id === activeLesson.id ? { ...l, isCompleted: true } : l
              ),
            }
          : prev
      );

      // Trigger celebration if all complete
      if (completedCount + 1 === totalCount) {
        setShowCelebration(true);
        fetchCourseCertificateApi(courseId)
          .then((res) => {
            if (res && res.data) setCertificate(res.data);
          })
          .catch(() => {});
      } else {
        // Automatically find next unlocked lesson
        const currentIndex = course.lessons.findIndex((l) => l.id === activeLesson.id);
        const nextLesson = course.lessons[currentIndex + 1];
        if (nextLesson && !nextLesson.isLocked) {
          setActiveLessonId(nextLesson.id);
        }
      }
    } catch (err) {
      console.debug('Error marking lesson complete', err);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans pb-28">
      
      {/* Top Navbar Bar with Breadcrumb Navigation */}
      <div className="border-b border-white/[0.08] bg-[#16171A] sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] rounded-lg px-2 py-1 shrink-0"
              title="Return to Dashboard"
            >
              <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />
            <Breadcrumbs
              items={[
                { label: 'Home', onClick: onNavigateHome },
                { label: 'Discover', onClick: () => onNavigateDiscover ? onNavigateDiscover() : onBack?.() },
                {
                  label: course.coachName ? `Coach ${course.coachName}` : 'Curriculums',
                  onClick: course.coachId && onNavigateCreator ? () => onNavigateCreator(course.coachId) : undefined,
                },
                { label: course.title, isCurrent: true },
              ]}
              className="min-w-0"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => course.coachId && onNavigateCreator ? onNavigateCreator(course.coachId) : undefined}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
              title={`View ${course.coachName} profile`}
            >
              <img
                src={course.coachAvatar}
                alt={`Coach ${course.coachName} avatar`}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
              />
              <span className="text-xs font-semibold text-[#F7F4EF]/90 hidden sm:inline">
                {course.coachName}
              </span>
            </button>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="hidden xs:inline">Rate Course</span>
            </button>

            <Badge variant="verified" size="sm">
              Verified
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Course Classroom Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================================= */}
          {/* MAIN VIDEO PLAYER & STUDY AREA (Span 8) */}
          {/* ========================================================================= */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Celebration Banner */}
            {showCelebration && (
              <div className="p-5 rounded-3xl bg-[#6E8B6F]/20 border border-[#6E8B6F]/40 flex items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#6E8B6F] text-black font-bold flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">
                      Congratulations! You've Completed All Available Modules!
                    </h4>
                    <p className="text-xs text-[#F7F4EF]/70">
                      Share your experience to help other athletes find vetted protocols.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                  <a
                    href={certificate?.downloadUrl || getCourseCertificateDownloadUrl(course.id || courseId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#B8703F] hover:bg-[#a35f32] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Certificate (PDF)</span>
                  </a>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsReviewModalOpen(true)}
                    leftIcon={<Star className="w-3.5 h-3.5 fill-current" />}
                  >
                    Rate & Review
                  </Button>
                  <button
                    onClick={() => setShowCelebration(false)}
                    className="text-xs text-white/60 hover:text-white cursor-pointer px-2 py-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Video Player Container */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/15 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)]">
              {!activeLesson.isLocked && activeLesson.videoUrl ? (
                /* Unlocked Video Player */
                <video
                  key={activeLesson.id}
                  src={activeLesson.videoUrl}
                  controls
                  controlsList="nodownload"
                  poster="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80"
                  className="w-full h-full object-contain bg-black"
                />
              ) : activeLesson.isLocked ? (
                /* DRIP-LOCKED SCREEN (B3 Server-Side Enforced) */
                <div className="absolute inset-0 bg-[#16171A] flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] flex items-center justify-center shadow-lg">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div className="max-w-md space-y-2">
                    <Badge variant="copper" size="sm">
                      Drip Lock Active
                    </Badge>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F7F4EF]">
                      Module Locked: {activeLesson.dripDate || 'Scheduled Release'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
                      This lesson unlocks on a structured progression schedule to allow proper neuromuscular recovery, exercise logging, and coach feedback before advancing.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-[#F7F4EF]/70 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#B8703F]" />
                    <span>Drip Schedule: {activeLesson.dripDays} Days from Enrollment</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-[#16171A] flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#B8703F]">
                    <Film className="w-7 h-7" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                      Module Registered • Video Upload Pending
                    </span>
                    <h3 className="text-lg font-display font-bold text-[#F7F4EF]">
                      {activeLesson.title}
                    </h3>
                    <p className="text-xs text-[#F7F4EF]/60">
                      Chadtag is currently recording high-definition footage for this module in Course Studio. Module notes and video stream will go live upon creator publication.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Title & Mark-Complete Action Bar */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#B8703F] uppercase tracking-wider">
                      Module {activeLesson.order}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-xs text-[#F7F4EF]/50 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeLesson.durationMinutes} minutes
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F7F4EF]">
                    {activeLesson.title}
                  </h1>
                </div>

                {/* Mark-Complete Button */}
                <div className="shrink-0">
                  {activeLesson.isLocked ? (
                    <Button
                      variant="outline"
                      size="md"
                      disabled
                      leftIcon={<Lock className="w-4 h-4 text-[#B8703F]" />}
                    >
                      Drip Locked
                    </Button>
                  ) : activeLesson.isCompleted ? (
                    <Button
                      variant="sage"
                      size="md"
                      onClick={handleMarkComplete}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Completed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={isMarkingComplete}
                      onClick={handleMarkComplete}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Mark Complete & Next
                    </Button>
                  )}
                </div>
              </div>

              {/* Lesson Overview & Study Notes */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50">
                  Module Summary & Key Biomechanical Cues
                </h3>
                <p className="text-sm text-[#F7F4EF]/80 leading-relaxed font-normal">
                  {activeLesson.description}
                </p>
              </div>

              {/* Downloadable Resources Row */}
              {activeLesson.resources && activeLesson.resources.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-white/[0.08]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/50 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#B8703F]" />
                    <span>Downloadable Worksheets & Logs</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeLesson.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        onClick={(e) => {
                          e.preventDefault();
                          const content = `# UNIVERSIFIT TRAINING RESOURCE\n\nTitle: ${res.title}\nLesson: ${activeLesson.title}\nCourse: ${course.title}\nCoach: ${course.coachName || 'Verified Coach'}\n\nKey Action Items:\n- Review biomechanics cues covered in the video\n- Log your working sets with target RPE\n- Upload your top set video for weekly form audit\n\nGenerated by Universifit Academy Platform.`;
                          const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `${res.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#B8703F]/40 flex items-center justify-between text-xs font-medium text-[#F7F4EF] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <BookOpen className="w-4 h-4 text-[#B8703F] shrink-0" />
                          <span className="truncate">{res.title}</span>
                        </div>
                        <Download className="w-3.5 h-3.5 text-white/50 group-hover:text-white shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </main>

          {/* ========================================================================= */}
          {/* LESSON SIDEBAR (Span 4) */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-4 space-y-6 sticky top-36 self-start">
            
            {/* Progress Card (Reusing ProgressBar Component) */}
            <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/10 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/50 block">
                    Curriculum Status
                  </span>
                  <h3 className="text-base font-display font-bold text-[#F7F4EF] mt-0.5">
                    {completedCount} of {totalCount} Lessons Complete
                  </h3>
                </div>

                <Badge variant={progressPercentage === 100 ? 'verified' : 'copper'} size="sm">
                  {progressPercentage}%
                </Badge>
              </div>

              {/* REUSABLE PROGRESS BAR COMPONENT */}
              <ProgressBar
                value={progressPercentage}
                size="md"
                variant={progressPercentage === 100 ? 'sage' : 'copper'}
              />

              {progressPercentage === 100 && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-2xl bg-[#6E8B6F]/15 border border-[#6E8B6F]/30 text-xs font-semibold text-[#6E8B6F] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 shrink-0" />
                      <span>Curriculum fully mastered!</span>
                    </div>
                    <Badge variant="verified" size="sm">100%</Badge>
                  </div>

                  {/* Certificate Download Card */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-white">
                        <Award className="w-4 h-4 text-[#B8703F]" />
                        <span className="text-xs font-bold font-display">Certificate of Completion</span>
                      </div>
                      <Badge variant="copper" size="sm">Verified</Badge>
                    </div>

                    <p className="text-[11px] text-[#F7F4EF]/60 leading-relaxed">
                      Official tamper-evident credential verified by Universifit & {course.coachName}.
                    </p>

                    <a
                      href={certificate?.downloadUrl || getCourseCertificateDownloadUrl(course.id || courseId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline w-full py-2.5 px-3 rounded-xl bg-[#B8703F] hover:bg-[#a35f32] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Certificate (PDF)</span>
                    </a>
                  </div>
                </div>
              )}
            </Card>

            {/* Lesson Modules List */}
            <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-xl space-y-2">
              <div className="px-3 py-2 border-b border-white/[0.08] flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-[#F7F4EF]/50 tracking-wider">
                  Course Modules
                </span>
                <span className="text-xs text-[#F7F4EF]/40 font-mono">
                  {course.lessons.length} Modules
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {course.lessons.map((lesson) => {
                  const isActive = lesson.id === activeLesson.id;
                  const isLocked = lesson.isLocked;
                  const isCompleted = lesson.isCompleted;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                      disabled={isLocked}
                      className={`w-full text-left p-3 rounded-2xl text-xs font-medium transition-all flex items-start gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-1 focus-visible:ring-offset-[#16171A] ${
                        isActive
                          ? 'bg-[#B8703F]/15 text-[#F7F4EF] border border-[#B8703F]/40 shadow-sm'
                          : isLocked
                          ? 'bg-transparent text-white/30 border border-transparent cursor-not-allowed opacity-60'
                          : 'bg-white/[0.02] text-[#F7F4EF]/80 hover:bg-white/[0.05] hover:text-white border border-white/[0.04] cursor-pointer'
                      }`}
                    >
                      {/* State Icon Indicator */}
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#6E8B6F]" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4 text-white/30" />
                        ) : isActive ? (
                          <Play className="w-4 h-4 text-[#B8703F] fill-[#B8703F]" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-[9px] font-mono">
                            {lesson.order}
                          </div>
                        )}
                      </div>

                      {/* Lesson Title & Drip Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-semibold line-clamp-1 ${
                              isActive ? 'text-white font-bold' : ''
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#F7F4EF]/50 mt-1">
                          <span>{lesson.durationMinutes} min</span>
                          {isLocked && (
                            <span className="text-[#B8703F] text-[10px] font-semibold">
                              {lesson.dripDate || 'Locked'}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[#6E8B6F] text-[10px] font-semibold">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

          </aside>

        </div>

        {/* ========================================================================= */}
        {/* RELATED COURSES & MASTERCLASSES (Contextual Internal Links) */}
        {/* ========================================================================= */}
        <section className="pt-16 mt-16 border-t border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <Badge variant="copper" size="sm" className="mb-2">
                Curated Masterclasses
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Related Training Curriculums
              </h2>
              <p className="text-xs sm:text-sm text-[#F7F4EF]/60 mt-1">
                Deepen your athlete progression with complementary protocols taught by top 1% vetted practitioners.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateDiscover ? onNavigateDiscover('All') : undefined}
              className="text-xs font-semibold text-[#B8703F] hover:text-[#E29A68] transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Explore All Masterclasses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 'c-big3-mechanics',
                title: 'Big 3 Biomechanics: Squat, Bench & Deadlift',
                description: 'Evidence-based biomechanics, moment arm physics, and bar path trajectories for injury-free powerlifting.',
                coachId: 'marcus.vance',
                coachName: 'Marcus Vance',
                coachAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
                category: 'Strength & Biomechanics',
                lessonsCount: 4,
              },
              {
                id: 'course-chadmax',
                title: 'ChadMax: Aesthetics & Stature Masterclass',
                description: 'Complete protocol covering facial aesthetics, clean bulking nutrition, V-taper symmetry, and posture reset.',
                coachId: 'chadtag',
                coachName: 'Chadtag',
                coachAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
                thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
                category: 'Aesthetics & Stature',
                lessonsCount: 5,
              },
              {
                id: 'course-nutrition-recomp',
                title: 'Metabolic Nutrition & Lean Recomposition',
                description: 'Biomarker tracking, carb cycling, and clinical gut health protocols for optimal body composition.',
                coachId: 'dr.elena.metabolism',
                coachName: 'Dr. Elena Rostova',
                coachAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
                thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80',
                category: 'Metabolic Diet',
                lessonsCount: 6,
              },
            ]
              .filter((c) => c.id !== (course.id || courseId))
              .map((relCourse) => (
                <Card
                  key={relCourse.id}
                  variant="charcoal"
                  interactive
                  className="p-5 bg-[#16171A] border-white/[0.08] hover:border-[#B8703F]/40 flex flex-col justify-between space-y-4 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#121315]">
                      <img
                        src={relCourse.thumbnail}
                        alt={relCourse.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="verified" size="sm">
                          {relCourse.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white">
                        {relCourse.lessonsCount} Modules
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-base text-white group-hover:text-[#E29A68] transition-colors line-clamp-1">
                        {relCourse.title}
                      </h3>
                      <p className="text-xs text-[#F7F4EF]/60 mt-1 line-clamp-2 leading-relaxed">
                        {relCourse.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (relCourse.coachId && onNavigateCreator) {
                          onNavigateCreator(relCourse.coachId);
                        }
                      }}
                      className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0"
                      title={`View Coach ${relCourse.coachName}`}
                    >
                      <img
                        src={relCourse.coachAvatar}
                        alt={relCourse.coachName}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                      />
                      <span className="text-xs text-[#F7F4EF]/80 font-medium truncate">
                        Coach {relCourse.coachName}
                      </span>
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => onSelectCourse && onSelectCourse(relCourse.id)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Start Course
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </section>

      </div>

      {/* Review Modal for Course Rating (F16) */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        creatorId={course.coachName.includes('Marcus') ? 'creator-marcus' : 'creator-kai'}
        creatorName={course.coachName}
        programTitle={course.title}
        enrollmentId={course.id}
        onReviewSaved={() => {
          setShowCelebration(false);
        }}
      />
    </div>
  );
};
