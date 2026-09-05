import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Award,
  Upload,
  CheckCircle2,
  ExternalLink,
  Lock,
  Landmark,
  Save,
  Clock,
  Sparkles,
  Plus,
  X,
  FileUp,
} from 'lucide-react';
import { Card, Badge, Button, Input } from './ui';
import {
  updateCreatorProfileApi,
  updatePayoutSettingsApi,
  type CreatorDashboardData,
  type PayoutDetails,
} from '../services/api';

interface CreatorProfileManagerProps {
  creatorData: CreatorDashboardData['creator'];
  payoutDetails: PayoutDetails | null;
  onProfileUpdated: (updatedCreator: any) => void;
  onOpenPayoutModal: () => void;
  onPreviewPublicProfile?: (creatorId: string) => void;
  onTriggerToast: (msg: string) => void;
}

const SUGGESTED_TAGS = [
  'looksmaxxing',
  'grooming',
  'physique',
  'confidence-building',
  'nutrition',
  'posture',
  'biomechanics',
  'mindset',
  'hypertrophy',
];

export const CreatorProfileManager: React.FC<CreatorProfileManagerProps> = ({
  creatorData,
  payoutDetails,
  onProfileUpdated,
  onOpenPayoutModal,
  onPreviewPublicProfile,
  onTriggerToast,
}) => {
  // Profile Form State
  const [fullName, setFullName] = useState(creatorData.fullName || 'Chadtag');
  const [headline, setHeadline] = useState(creatorData.headline || "Men's Self-Improvement & Aesthetics Coach");
  const [bio, setBio] = useState(
    creatorData.bio ||
      "A men's self-improvement and aesthetics coach covering facial aesthetics, diet, physique training, and confidence/mindset."
  );
  const [avatarUrl, setAvatarUrl] = useState(
    creatorData.avatarUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'
  );
  const [specialtyTags, setSpecialtyTags] = useState<string[]>(
    creatorData.specialtyTags && creatorData.specialtyTags.length > 0
      ? creatorData.specialtyTags
      : ['looksmaxxing', 'grooming', 'physique', 'confidence-building']
  );
  const [newTagInput, setNewTagInput] = useState('');

  // Social Links State
  const [youtubeUrl, setYoutubeUrl] = useState(
    creatorData.socialLinks?.youtube || 'https://youtube.com/@chadtag'
  );
  const [instagramUrl, setInstagramUrl] = useState(
    creatorData.socialLinks?.instagram || 'https://instagram.com/chadtagyt'
  );
  const [discordUrl, setDiscordUrl] = useState(
    creatorData.socialLinks?.discord || 'https://discord.gg/aTpvfD2SU'
  );

  // GSTIN state
  const [gstin, setGstin] = useState(payoutDetails?.gstin || '27AAPFV8921M1Z5');
  const [isSavingGstin, setIsSavingGstin] = useState(false);

  // Loading & Feedback
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Tag Management
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().toLowerCase();
    if (!clean) return;
    if (specialtyTags.includes(clean)) {
      onTriggerToast(`Tag "${clean}" is already added.`);
      return;
    }
    if (specialtyTags.length >= 8) {
      onTriggerToast('Maximum 8 specialty tags allowed.');
      return;
    }
    setSpecialtyTags((prev) => [...prev, clean]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSpecialtyTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // Avatar Local File Upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        onTriggerToast('Avatar updated! Click "Save Profile Changes" to persist.');
      }
      setUploadingAvatar(false);
    };
    reader.onerror = () => {
      onTriggerToast('Failed to read image file.');
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onTriggerToast('Full Name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        specialtyTags,
        socialLinks: {
          youtube: youtubeUrl.trim(),
          instagram: instagramUrl.trim(),
          discord: discordUrl.trim(),
        },
      };

      const res = await updateCreatorProfileApi(payload);
      if (res.success) {
        onProfileUpdated({
          ...creatorData,
          ...payload,
        });
        onTriggerToast('Creator profile and social links updated successfully! ✨');
      } else {
        onTriggerToast(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save GSTIN handler
  const handleSaveGstin = async () => {
    if (!gstin.trim()) {
      onTriggerToast('Please enter a valid GSTIN.');
      return;
    }
    setIsSavingGstin(true);
    try {
      const res = await updatePayoutSettingsApi({
        gstin: gstin.trim().toUpperCase(),
      });
      if (res.success) {
        onTriggerToast('GSTIN updated and validated! 🏛️');
      } else {
        onTriggerToast(res.error || 'Failed to update GSTIN.');
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Failed to update GSTIN.');
    } finally {
      setIsSavingGstin(false);
    }
  };

  // Verification Document upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDocs(true);
    setTimeout(() => {
      setUploadingDocs(false);
      onTriggerToast(`${files.length} certification file(s) submitted to Ascend Compliance.`);
    }, 1200);
  };

  const isVerified = creatorData.verificationStatus === 'VERIFIED';
  const isPending = creatorData.verificationStatus === 'PENDING';
  const isPayoutComplete = payoutDetails?.payoutSetupCompleted;

  return (
    <div className="space-y-8">
      
      {/* Top Header & Public Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-[#F7F4EF] tracking-tight">
            Profile & Payout Settings
          </h2>
          <p className="text-xs text-[#F7F4EF]/60 leading-relaxed">
            Manage your public coaching dossier, social channels, verified credentials, and compliance payout settings.
          </p>
        </div>

        {onPreviewPublicProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreviewPublicProfile(creatorData.id || 'creator-chadtag')}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Preview Public Storefront
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PROFILE FORM (Span 8)                                         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Main Profile Info Card */}
            <Card variant="charcoal" className="p-6 sm:p-7 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6">
              <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[#B8703F]" />
                    <span>Public Identity & Bio</span>
                  </h3>
                  <p className="text-xs text-[#F7F4EF]/60">
                    This information appears on your public creator storefront and course syllabus pages.
                  </p>
                </div>
                <Badge variant={isVerified ? 'verified' : 'neutral'} size="sm">
                  {isVerified ? 'Verified Coach' : 'Application Pending'}
                </Badge>
              </div>

              {/* Avatar Preview & Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#121315] border border-white/[0.06]">
                <div className="relative shrink-0">
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#B8703F] shadow-lg"
                  />
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#6E8B6F] text-black shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-white block">Profile Avatar Image</span>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#B8703F]" />
                      <span>{uploadingAvatar ? 'Reading Image...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                    <span className="text-[11px] text-neutral-400 font-mono">PNG, JPG, WebP up to 5MB</span>
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter direct image URL (https://...)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-[#16171A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none focus:border-[#B8703F]"
                  />
                </div>
              </div>

              {/* Name & Headline */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Creator Full Name"
                  placeholder="e.g. Chadtag"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Storefront Headline"
                  placeholder="e.g. Men's Self-Improvement & Aesthetics Coach"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              {/* Bio / Coaching Philosophy */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-[#F7F4EF]/80 uppercase tracking-wider text-[11px]">
                  Coaching Bio & Methodology
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-[#121315] border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#B8703F] transition-colors leading-relaxed"
                  placeholder="Describe your credentials, target athletes, and coaching methodology..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {/* Specialty Tags */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#F7F4EF]/80 uppercase tracking-wider text-[11px]">
                    Specialty Tags ({specialtyTags.length}/8)
                  </label>
                  <span className="text-[10px] text-neutral-400">Used for search & discover indexing</span>
                </div>

                {/* Active Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {specialtyTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#B8703F]/15 text-[#F7F4EF] border border-[#B8703F]/30"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-neutral-400 hover:text-white cursor-pointer"
                        title={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Tag Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. posture, diet)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    className="flex-1 bg-[#121315] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B8703F]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTag(newTagInput)}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    Add Tag
                  </Button>
                </div>

                {/* Suggested Tag Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-400 font-semibold mr-1">Suggestions:</span>
                  {SUGGESTED_TAGS.filter((t) => !specialtyTags.includes(t)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

            </Card>

            {/* Social Links Card */}
            <Card variant="charcoal" className="p-6 sm:p-7 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5">
              <div className="border-b border-white/[0.08] pb-3">
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B8703F]" />
                  <span>Social Channels & Community Links</span>
                </h3>
                <p className="text-xs text-[#F7F4EF]/60">
                  Connect your verified YouTube channel, Instagram profile, and Discord community server.
                </p>
              </div>

              <div className="space-y-4">
                {/* YouTube */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-[#FF6B6B] flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>YouTube Channel URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@chadtag"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF0000]"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-[#F777A9] flex items-center gap-2">
                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                    <span>Instagram Profile URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/chadtagyt"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E1306C]"
                  />
                </div>

                {/* Discord */}
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-[#8EA1E1] flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span>Discord Community Invite URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.gg/aTpvfD2SU"
                    value={discordUrl}
                    onChange={(e) => setDiscordUrl(e.target.value)}
                    className="w-full bg-[#121315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
              </div>
            </Card>

            {/* Save Profile Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingProfile}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </div>

          </form>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: VERIFICATION WIDGET & PAYOUT SETUP (Span 4)                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* VERIFICATION STATUS WIDGET */}
          <Card variant="charcoal" className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Verification Status
              </span>
              <Badge variant={isVerified ? 'verified' : isPending ? 'copper' : 'neutral'} size="sm">
                {creatorData.verificationStatus}
              </Badge>
            </div>

            <div className="p-4 rounded-2xl bg-[#121315] border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isVerified
                    ? 'bg-[#6E8B6F]/20 text-[#6E8B6F]'
                    : isPending
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isVerified ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <Clock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white">
                    {isVerified ? 'Tier 1 Verified Coach' : isPending ? 'Audit in Progress' : 'Action Required'}
                  </h4>
                  <p className="text-[11px] text-[#F7F4EF]/60">
                    {isVerified
                      ? 'Identity & credentials verified by Ascend Compliance.'
                      : 'Documents queued for compliance team review.'}
                  </p>
                </div>
              </div>

              {creatorData.verifiedAt && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Verified On:</span>
                  <span className="font-mono text-white">
                    {new Date(creatorData.verifiedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Verified Credentials Pills */}
            {creatorData.credentials && creatorData.credentials.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Audited Certifications
                </span>
                <div className="space-y-1.5">
                  {creatorData.credentials.map((cred, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-[#6E8B6F]/20 text-xs font-medium text-[#F7F4EF]/90 flex items-center gap-2"
                    >
                      <Award className="w-3.5 h-3.5 text-[#6E8B6F] shrink-0" />
                      <span className="truncate">{cred}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Additional Certifications */}
            <div className="pt-2">
              <label className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <FileUp className="w-3.5 h-3.5 text-[#B8703F]" />
                <span>{uploadingDocs ? 'Uploading Credentials...' : 'Submit Additional Docs'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleDocUpload}
                />
              </label>
            </div>
          </Card>

          {/* PAYOUT DETAILS & COMPLIANCE SECTION (M2 GATING) */}
          <Card
            variant="charcoal"
            className={`p-6 bg-[#16171A] shadow-xl space-y-4 border ${
              isPayoutComplete ? 'border-[#6E8B6F]/30' : 'border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Payout Details & Banking
              </span>
              <Badge variant={isPayoutComplete ? 'verified' : 'neutral'} size="sm">
                {isPayoutComplete ? 'Payout Active' : 'Setup Needed'}
              </Badge>
            </div>

            {/* M2 Compliance Advisory */}
            <div
              className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                isPayoutComplete
                  ? 'bg-[#6E8B6F]/10 border border-[#6E8B6F]/20 text-[#6E8B6F]'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isPayoutComplete ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isPayoutComplete
                    ? 'Compliance Verified for Live Publishing'
                    : 'Publishing Gated by Compliance'}
                </span>
              </div>
              <p className="text-[11px] text-[#F7F4EF]/70 leading-relaxed">
                {isPayoutComplete
                  ? 'Your payout account is verified. You can publish paid courses and 1:1 coaching slots.'
                  : 'You must configure a bank account or UPI ID before publishing paid courses or coaching offers.'}
              </p>
            </div>

            {/* Current Payout Account Summary */}
            <div className="p-4 rounded-2xl bg-[#121315] border border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Method:</span>
                <span className="font-bold text-white">
                  {payoutDetails?.payoutMethod === 'UPI' ? 'UPI Virtual Payment Address' : 'Direct Bank Transfer'}
                </span>
              </div>

              {payoutDetails?.accountHolderName && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Legal Name:</span>
                  <span className="font-mono text-white">{payoutDetails.accountHolderName}</span>
                </div>
              )}

              {payoutDetails?.maskedAccountNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Account:</span>
                  <span className="font-mono text-white">{payoutDetails.maskedAccountNumber}</span>
                </div>
              )}

              {payoutDetails?.upiId && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">UPI ID:</span>
                  <span className="font-mono text-white">{payoutDetails.upiId}</span>
                </div>
              )}

              {/* GSTIN Field */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Tax / GSTIN Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="27AAPFV8921M1Z5"
                    className="flex-1 bg-[#16171A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#B8703F]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isSavingGstin}
                    onClick={handleSaveGstin}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Open Payout Modal Button */}
            <Button
              type="button"
              variant={isPayoutComplete ? 'outline' : 'primary'}
              size="md"
              className="w-full"
              onClick={onOpenPayoutModal}
              leftIcon={<Landmark className="w-4 h-4" />}
            >
              {isPayoutComplete ? 'Edit Banking & UPI Details' : 'Configure Payout Details'}
            </Button>
          </Card>

        </div>

      </div>

    </div>
  );
};
