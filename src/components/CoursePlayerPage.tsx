import React, { useState, useEffect, useCallback } from 'react';
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
  MessageSquare,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Button, ProgressBar, Breadcrumbs } from './ui';
import { ReviewModal } from './ReviewModal';
import {
  fetchCourseById,
  completeLessonApi,
  fetchCourseCertificateApi,
  getCourseCertificateDownloadUrl,
  getStoredUser,
  getStoredToken,
  type CourseDetail,
  type LessonItem,
  type CertificateItem,
} from '../services/api';
import { updatePageMetadata, setCourseSchema, clearCourseSchema, getCourseOgImageUrl } from '../utils/seo';

interface DiscussionComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  isInstructor?: boolean;
  role: string;
  timestamp: string;
  content: string;
  likes: number;
}

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

  // Active Tab: 'notes' | 'discussion'
  const [activeTab, setActiveTab] = useState<'notes' | 'discussion'>('notes');

  // Enrollment status (verified via stored auth token or sample enrolled state)
  const [isEnrolled, setIsEnrolled] = useState<boolean>(() => {
    const user = getStoredUser();
    const token = getStoredToken();
    return Boolean(token || user);
  });

  // Discussion state
  const [discussions, setDiscussions] = useState<DiscussionComment[]>([
    {
      id: 'disc-1',
      authorName: 'Chadtag',
      authorAvatar: '/chadtag.png',
      isInstructor: true,
      role: 'Practitioner & Course Creator',
      timestamp: '2 days ago',
      content: 'Welcome to this module. Pay close attention to thoracic extension and chin posture during every rep. Drop your video links below for personal review.',
      likes: 14,
    },
    {
      id: 'disc-2',
      authorName: 'Akshat S.',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isInstructor: false,
      role: 'Enrolled Athlete',
      timestamp: '1 day ago',
      content: 'Completed the routine this morning. The cues on cervical decompression made an immediate difference in neck fatigue.',
      likes: 6,
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCourseById(courseId);
      if (data) {
        setCourse(data);
        const firstIncomplete = data.lessons.find((l) => !l.isCompleted && !l.isLocked);
        if (firstIncomplete) {
          setActiveLessonId(firstIncomplete.id);
        } else if (data.lessons.length > 0) {
          setActiveLessonId(data.lessons[0].id);
        }

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
    } catch (err) {
      console.debug('fetchCourseById error', err);
      setError('Network interruption while querying course curriculum');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadCourse();
  }, [loadCourse]);

  // Dynamic Course SEO Metadata Injection
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
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-28">
        <div className="border-b border-[#E8E8E6] bg-white py-3.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="h-4 w-32 bg-[#F7F7F5] rounded animate-pulse" />
            <div className="h-7 w-20 bg-[#F7F7F5] rounded-md animate-pulse" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-8 space-y-4">
              <div className="aspect-video rounded-xl bg-white border border-[#E8E8E6]" />
              <div className="h-6 w-1/3 bg-white rounded" />
              <div className="h-4 w-2/3 bg-white rounded" />
            </div>
            <div className="lg:col-span-4">
              <div className="p-6 bg-white border border-[#E8E8E6] rounded-xl h-96" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-28 flex flex-col justify-center items-center px-4">
        <div className="p-8 max-w-lg w-full text-center space-y-5 bg-white border border-[#E8E8E6] rounded-xl my-16">
          <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-[#14161A] tracking-tight">
              Unable to Load Curriculum Stream
            </h1>
            <p className="text-xs sm:text-sm text-[#8B8D91] leading-relaxed font-normal">
              We were unable to load the modules for this course. Please verify your connection or retry below.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={loadCourse}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              Return to My Space
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course || course.lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-28 flex flex-col justify-center items-center px-4">
        <div className="p-8 max-w-lg w-full text-center space-y-5 bg-white border border-[#E8E8E6] rounded-xl my-16">
          <div className="w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A] mx-auto flex items-center justify-center">
            <Film className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-[#14161A] tracking-tight">
              No Curriculum Lessons Published Yet
            </h1>
            <p className="text-xs sm:text-sm text-[#8B8D91] leading-relaxed font-normal">
              The coach has registered this course syllabus and is finalizing active video modules.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onBack}
            >
              Back to My Space
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeLesson: LessonItem =
    course.lessons.find((l) => l.id === activeLessonId) || course.lessons[0];

  const completedCount = course.lessons.filter((l) => l.isCompleted).length;
  const totalCount = course.lessons.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const handleMarkComplete = async () => {
    if (activeLesson.isLocked || isMarkingComplete) return;

    setIsMarkingComplete(true);
    try {
      await completeLessonApi(activeLesson.id);

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

      if (completedCount + 1 === totalCount) {
        setShowCelebration(true);
        fetchCourseCertificateApi(courseId)
          .then((res) => {
            if (res && res.data) setCertificate(res.data);
          })
          .catch(() => {});
      } else {
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

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: DiscussionComment = {
      id: `disc-${Date.now()}`,
      authorName: 'Akshat S.',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isInstructor: false,
      role: 'Enrolled Athlete',
      timestamp: 'Just now',
      content: newCommentText.trim(),
      likes: 0,
    };

    setDiscussions([newComment, ...discussions]);
    setNewCommentText('');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#14161A] font-sans pb-28">
      
      {/* Top Navbar with Breadcrumbs */}
      <div className="border-b border-[#E8E8E6] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-medium text-[#8B8D91] hover:text-[#14161A] transition-colors cursor-pointer rounded px-1.5 py-1 shrink-0"
              title="Return to Dashboard"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-3.5 w-px bg-[#E8E8E6] hidden sm:block shrink-0" />
            <Breadcrumbs
              items={[
                { label: 'Home', onClick: onNavigateHome },
                { label: 'Discover', onClick: () => (onNavigateDiscover ? onNavigateDiscover() : onBack?.()) },
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
            {/* Coach Profile Pill */}
            <button
              type="button"
              onClick={() => (course.coachId && onNavigateCreator ? onNavigateCreator(course.coachId) : undefined)}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
              title={`View ${course.coachName} profile`}
            >
              <img
                src={course.coachAvatar}
                alt={`Coach ${course.coachName} avatar`}
                loading="lazy"
                decoding="async"
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover border border-[#E8E8E6]"
              />
              <span className="text-xs font-medium text-[#14161A] hidden sm:inline">
                {course.coachName}
              </span>
            </button>

            {/* Rate Course CTA */}
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-2.5 py-1 rounded-md bg-[#F7F7F5] hover:bg-white border border-[#E8E8E6] text-[#14161A] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-[#14161A]" />
              <span className="hidden xs:inline">Rate Course</span>
            </button>

            {/* Enrollment Simulator Toggle for verification */}
            <button
              onClick={() => setIsEnrolled(!isEnrolled)}
              className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                isEnrolled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title="Toggle enrollment preview state"
            >
              {isEnrolled ? 'Status: Enrolled' : 'Status: Unenrolled'}
            </button>
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
              <div className="p-5 rounded-xl bg-white border border-[#E8E8E6] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#F7F7F5] border border-[#E8E8E6] text-[#3652C4] flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#14161A]">
                      Congratulations! You've Completed All Modules!
                    </h4>
                    <p className="text-xs text-[#8B8D91] mt-0.5">
                      Your verified certificate of completion has been issued and is available below.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={certificate?.downloadUrl || getCourseCertificateDownloadUrl(course.id || courseId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3652C4] text-white text-xs font-medium transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Certificate (PDF)</span>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            )}

            {/* Video Player Container */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#14161A] border border-[#E8E8E6]">
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
                /* DRIP-LOCKED SCREEN */
                <div className="absolute inset-0 bg-[#F7F7F5] flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-md bg-white border border-[#E8E8E6] text-[#14161A] flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>

                  <div className="max-w-md space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91]">
                      Module Locked
                    </span>
                    <h3 className="text-lg font-semibold text-[#14161A]">
                      Scheduled Release: {activeLesson.dripDate || 'Upcoming Drip'}
                    </h3>
                    <p className="text-xs text-[#8B8D91] leading-relaxed">
                      This lesson unlocks on a structured progression schedule to allow proper recovery, logging, and coach feedback before advancing.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-md bg-white border border-[#E8E8E6] text-xs font-medium text-[#14161A] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8B8D91]" />
                    <span>Unlock Timeline: {activeLesson.dripDays} Days from Enrollment</span>
                  </div>
                </div>
              ) : (
                /* VIDEO PENDING / CURRICULUM SYLLABUS SCREEN */
                <div className="absolute inset-0 bg-[#F7F7F5] flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-md bg-white border border-[#E8E8E6] text-[#3652C4] flex items-center justify-center">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91]">
                      Module Active • High-Definition Stream Processing
                    </span>
                    <h3 className="text-base font-semibold text-[#14161A]">
                      {activeLesson.title}
                    </h3>
                    <p className="text-xs text-[#8B8D91] leading-relaxed">
                      Course notes and protocol blueprints are active below. The live stream recording will populate directly into this player.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Title & Mark-Complete Action Bar */}
            <div className="p-6 bg-white border border-[#E8E8E6] rounded-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#3652C4]">
                      Module {activeLesson.order}
                    </span>
                    <span className="text-[#E8E8E6]">•</span>
                    <span className="text-xs text-[#8B8D91] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeLesson.durationMinutes} minutes
                    </span>
                  </div>

                  <h1 className="text-2xl font-semibold text-[#14161A] tracking-tight">
                    {activeLesson.title}
                  </h1>
                </div>

                {/* Mark Complete Button */}
                <div className="shrink-0">
                  {activeLesson.isLocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      leftIcon={<Lock className="w-3.5 h-3.5 text-[#8B8D91]" />}
                    >
                      Locked
                    </Button>
                  ) : activeLesson.isCompleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkComplete}
                      leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      Completed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isMarkingComplete}
                      onClick={handleMarkComplete}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Mark Complete & Next
                    </Button>
                  )}
                </div>
              </div>

              {/* TABS: Overview / Discussion (Enrolled-Only) */}
              <div className="border-t border-[#E8E8E6] pt-4 space-y-5">
                
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-[#E8E8E6] pb-2" role="tablist" aria-label="Lesson content tabs">
                  <button
                    role="tab"
                    id="tab-notes"
                    aria-selected={activeTab === 'notes'}
                    aria-controls="panel-notes"
                    onClick={() => setActiveTab('notes')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3652C4] ${
                      activeTab === 'notes'
                        ? 'bg-[#14161A] text-white'
                        : 'text-[#5A5D62] hover:text-[#14161A]'
                    }`}
                  >
                    Overview & Notes
                  </button>

                  <button
                    role="tab"
                    id="tab-discussion"
                    aria-selected={activeTab === 'discussion'}
                    aria-controls="panel-discussion"
                    onClick={() => setActiveTab('discussion')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#3652C4] ${
                      activeTab === 'discussion'
                        ? 'bg-[#14161A] text-white'
                        : 'text-[#5A5D62] hover:text-[#14161A]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discussion & Q&A</span>
                    {!isEnrolled && (
                      <Lock className="w-3 h-3 text-[#5A5D62]" />
                    )}
                  </button>
                </div>

                {/* TAB 1: OVERVIEW & NOTES */}
                {activeTab === 'notes' && (
                  <div id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" className="space-y-5">
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5A5D62]">
                        Module Summary & Key Biomechanical Cues
                      </h3>
                      <p className="text-sm text-[#14161A] leading-relaxed font-normal">
                        {activeLesson.description ||
                          'Comprehensive training guidelines covering execution tempo, kinetic loading, and common mechanical compensations.'}
                      </p>
                    </div>

                    {/* Downloadable Resources */}
                    {activeLesson.resources && activeLesson.resources.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-[#E8E8E6]">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#3652C4]" />
                          <span>Downloadable Worksheets & Templates</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeLesson.resources.map((res, i) => (
                            <a
                              key={i}
                              href={res.url}
                              onClick={(e) => {
                                e.preventDefault();
                                const content = `# UNIVERSIFIT TRAINING RESOURCE\n\nTitle: ${res.title}\nLesson: ${activeLesson.title}\nCourse: ${course.title}\nCoach: ${course.coachName || 'Verified Coach'}\n\nAction Checklist:\n1. Execute specified working sets at prescribed RIR\n2. Note velocity decay on final reps\n3. Record form audit check from a 45-degree angle\n\nUniversifit Practitioner Protocol.`;
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
                              className="p-3 rounded-lg bg-[#F7F7F5] hover:bg-white border border-[#E8E8E6] flex items-center justify-between text-xs font-medium text-[#14161A] transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <BookOpen className="w-3.5 h-3.5 text-[#3652C4] shrink-0" />
                                <span className="truncate">{res.title}</span>
                              </div>
                              <Download className="w-3.5 h-3.5 text-[#8B8D91] group-hover:text-[#14161A] shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DISCUSSION TAB (ENROLLED-ONLY) */}
                {activeTab === 'discussion' && (
                  <div id="panel-discussion" role="tabpanel" aria-labelledby="tab-discussion" className="space-y-6">
                    {isEnrolled ? (
                      /* ENROLLED MEMBER VIEW */
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-[#14161A]">
                              Practitioner & Peer Discussion
                            </h3>
                            <p className="text-xs text-[#5A5D62]">
                              Ask technical questions or submit form timestamps for feedback.
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <UserCheck className="w-3.5 h-3.5" />
                            Enrolled Member
                          </span>
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handlePostDiscussion} className="space-y-2">
                          <textarea
                            rows={3}
                            aria-label="Ask a question about this module's cues or execution"
                            placeholder="Ask a question about this module's cues or execution..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            className="w-full bg-white text-[#14161A] placeholder-[#5A5D62] border border-[#E8E8E6] focus:border-[#3652C4] focus:ring-1 focus:ring-[#3652C4] rounded-md p-3 text-xs font-sans focus:outline-none transition-colors"
                          />
                          <div className="flex justify-end">
                            <Button
                              variant="primary"
                              size="sm"
                              type="submit"
                              leftIcon={<Send className="w-3.5 h-3.5" />}
                            >
                              Post to Discussion
                            </Button>
                          </div>
                        </form>

                        {/* Discussion Threads */}
                        <div className="space-y-3 pt-2">
                          {discussions.map((disc) => (
                            <div
                              key={disc.id}
                              className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] space-y-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={disc.authorAvatar}
                                    alt={`${disc.authorName}'s avatar`}
                                    loading="lazy"
                                    decoding="async"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full object-cover border border-[#E8E8E6]"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-semibold text-[#14161A]">
                                        {disc.authorName}
                                      </span>
                                      {disc.isInstructor && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded bg-white text-[#3652C4] border border-[#E8E8E6]">
                                          <ShieldCheck className="w-3 h-3" />
                                          Instructor
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-[#8B8D91]">
                                      {disc.role} • {disc.timestamp}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-[#14161A] leading-relaxed pl-10">
                                {disc.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* UNENROLLED RESTRICTED GATE */
                      <div className="p-8 text-center bg-[#F7F7F5] border border-[#E8E8E6] rounded-xl space-y-3 max-w-lg mx-auto">
                        <div className="w-10 h-10 rounded-md bg-white border border-[#E8E8E6] text-[#14161A] mx-auto flex items-center justify-center">
                          <Lock className="w-5 h-5 text-[#3652C4]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-[#14161A]">
                            Discussion Restricted to Enrolled Students
                          </h3>
                          <p className="text-xs text-[#8B8D91] leading-relaxed">
                            Direct practitioner Q&A, lesson feedback threads, and video form audit feedback are only accessible to enrolled members of this curriculum.
                          </p>
                        </div>
                        <div className="pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => (course.coachId && onNavigateCreator ? onNavigateCreator(course.coachId) : undefined)}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            Enroll in Course to Join Discussion
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>

          </main>

          {/* ========================================================================= */}
          {/* LESSON SIDEBAR (Span 4) */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-4 space-y-6 sticky top-20 self-start">
            
            {/* Progress Card */}
            <div className="p-5 bg-white border border-[#E8E8E6] rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#8B8D91] block">
                    Curriculum Status
                  </span>
                  <h3 className="text-sm font-semibold text-[#14161A] mt-0.5">
                    {completedCount} of {totalCount} Lessons Complete
                  </h3>
                </div>

                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E6] text-[#14161A]">
                  {progressPercentage}%
                </span>
              </div>

              {/* Minimalist Progress Bar */}
              <ProgressBar
                value={progressPercentage}
                size="sm"
                variant={progressPercentage === 100 ? 'sage' : 'copper'}
              />

              {progressPercentage === 100 && (
                <div className="pt-3 border-t border-[#E8E8E6] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Curriculum fully completed</span>
                  </div>
                  <a
                    href={certificate?.downloadUrl || getCourseCertificateDownloadUrl(course.id || courseId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-md bg-[#14161A] hover:bg-[#3652C4] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Certificate (PDF)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Lesson Modules List */}
            <div className="p-4 bg-white border border-[#E8E8E6] rounded-xl space-y-2">
              <div className="px-2 py-1.5 border-b border-[#E8E8E6] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8B8D91]">
                  Course Modules
                </span>
                <span className="text-xs text-[#8B8D91]">
                  {course.lessons.length} Modules
                </span>
              </div>

              <div className="space-y-1 pt-1">
                {course.lessons.map((lesson) => {
                  const isActive = lesson.id === activeLesson.id;
                  const isLocked = lesson.isLocked;
                  const isCompleted = lesson.isCompleted;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                      disabled={isLocked}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-start gap-2.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] ${
                        isActive
                          ? 'bg-[#14161A] text-white'
                          : isLocked
                          ? 'bg-transparent text-[#8B8D91] opacity-50 cursor-not-allowed'
                          : 'text-[#14161A] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      {/* State Icon Indicator */}
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#3652C4]'}`} />
                        ) : isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-[#8B8D91]" />
                        ) : isActive ? (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-[#E8E8E6] flex items-center justify-center text-[9px]">
                            {lesson.order}
                          </span>
                        )}
                      </div>

                      {/* Lesson Title & Drip Details */}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium line-clamp-1 block">
                          {lesson.title}
                        </span>

                        <div className={`flex items-center justify-between text-[11px] mt-0.5 ${isActive ? 'text-white/70' : 'text-[#8B8D91]'}`}>
                          <span>{lesson.durationMinutes} min</span>
                          {isLocked && (
                            <span className="text-[10px]">
                              {lesson.dripDate || 'Locked'}
                            </span>
                          )}
                          {isCompleted && (
                            <span className={`text-[10px] ${isActive ? 'text-white' : 'text-[#3652C4]'}`}>
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

        {/* RELATED COURSES (Bottom section) */}
        <section className="pt-14 mt-14 border-t border-[#E8E8E6]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#14161A] tracking-tight">
                Related Training Curriculums
              </h2>
              <p className="text-xs sm:text-sm text-[#8B8D91] mt-0.5">
                Explore complementary protocols taught by top practitioners.
              </p>
            </div>

            <button
              type="button"
              onClick={() => (onNavigateDiscover ? onNavigateDiscover('All') : undefined)}
              className="text-xs font-medium text-[#3652C4] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Explore All Masterclasses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                <div
                  key={relCourse.id}
                  onClick={() => onSelectCourse && onSelectCourse(relCourse.id)}
                  className="p-4 bg-white border border-[#E8E8E6] hover:border-[#14161A] rounded-xl flex flex-col justify-between space-y-3 cursor-pointer transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="rounded-lg overflow-hidden aspect-video bg-[#F7F7F5] border border-[#E8E8E6]">
                      <img
                        src={relCourse.thumbnail}
                        alt={relCourse.title}
                        loading="lazy"
                        decoding="async"
                        width={300}
                        height={169}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-[#14161A] line-clamp-1">
                        {relCourse.title}
                      </h3>
                      <p className="text-xs text-[#5A5D62] mt-1 line-clamp-2 leading-relaxed">
                        {relCourse.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E8E8E6] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={relCourse.coachAvatar}
                        alt={relCourse.coachName}
                        loading="lazy"
                        decoding="async"
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover border border-[#E8E8E6] shrink-0"
                      />
                      <span className="text-xs text-[#5A5D62] truncate">
                        {relCourse.coachName}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-[#3652C4] shrink-0">
                      View Curriculum &rarr;
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>

      </div>

      {/* Course Review Rating Modal */}
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
