import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  Lock,
  Search,
  RefreshCw,
  X,
  Check,
  Sparkles,
  LifeBuoy,
  MessageSquare,
  AlertCircle,
  Send,
} from 'lucide-react';
import type {
  AdminCreatorItem,
  AuthUserData,
  SupportTicketItem,
  TicketStatus,
} from '../services/api';
import {
  getAdminCreatorsApi,
  verifyAdminCreatorApi,
  getStoredUser,
  loginUserApi,
  fetchAdminSupportTicketsApi,
  adminRespondSupportTicketApi,
} from '../services/api';

interface AdminCreatorsPageProps {
  onBackHome: () => void;
}

export const AdminCreatorsPage: React.FC<AdminCreatorsPageProps> = ({ onBackHome }) => {
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(getStoredUser());
  const [activeAdminSection, setActiveAdminSection] = useState<'creators' | 'support'>('creators');

  // Creator Applications State
  const [creators, setCreators] = useState<AdminCreatorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Support Desk State
  const [supportTickets, setSupportTickets] = useState<SupportTicketItem[]>([]);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('ALL');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [supportCounts, setSupportCounts] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [newTicketStatus, setNewTicketStatus] = useState<TicketStatus>('IN_PROGRESS');
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<AdminCreatorItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Documents do not satisfy the credential verification guidelines.');

  // Document Lightbox / Preview Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Demo Admin Login State
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCreators = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await getAdminCreatorsApi(statusFilter);
      if (res.success && res.creators) {
        setCreators(res.creators);
      } else {
        setCreators([]);
      }
    } catch {
      setCreators([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupportTickets = async () => {
    if (!isAdmin) return;
    setIsLoadingSupport(true);
    try {
      const res = await fetchAdminSupportTicketsApi({
        status: ticketStatusFilter,
        category: ticketCategoryFilter,
      });
      setSupportTickets(res.data);
      setSupportCounts(res.counts);
    } catch (err) {
      console.warn('Error loading support tickets in admin:', err);
    } finally {
      setIsLoadingSupport(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeAdminSection === 'creators') {
        loadCreators();
      } else {
        loadSupportTickets();
      }
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, statusFilter, activeAdminSection, ticketStatusFilter, ticketCategoryFilter]);

  const handleOpenTicketModal = (ticket: SupportTicketItem) => {
    setSelectedTicket(ticket);
    setAdminReplyText(ticket.adminResponse || '');
    setNewTicketStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status);
  };

  const handleSaveTicketResolution = async () => {
    if (!selectedTicket || isUpdatingTicket) return;
    setIsUpdatingTicket(true);
    try {
      const res = await adminRespondSupportTicketApi(selectedTicket.id, {
        status: newTicketStatus,
        adminResponse: adminReplyText.trim() || undefined,
      });

      if (res.success && res.data) {
        setSupportTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? res.data : t))
        );
        showToast(`Ticket #${res.data.ticketNumber} updated to ${res.data.status}.`, 'success');
        setSelectedTicket(null);
        loadSupportTickets();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket.', 'error');
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  // Handle Quick Demo Admin Login
  const handleDemoAdminLogin = async () => {
    setIsLoggingInAdmin(true);
    try {
      const res = await loginUserApi('admin@ascend.io', 'admin123');
      if (res.success && res.user) {
        setCurrentUser(res.user);
        showToast('Authenticated as Administrator (admin@ascend.io)', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not authenticate admin.', 'error');
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

  // Approve Application
  const handleApprove = async (creator: AdminCreatorItem) => {
    setActionLoadingId(creator.id);
    try {
      const res = await verifyAdminCreatorApi(creator.id, 'VERIFIED');
      if (res.success) {
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creator.id
              ? { ...c, verificationStatus: 'VERIFIED', verifiedAt: new Date().toISOString() }
              : c
          )
        );
        showToast(`Approved ${creator.user.fullName} as a Verified Ascend Coach!`, 'success');
      } else {
        showToast(res.error || 'Failed to approve creator application.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Application Confirmation
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setActionLoadingId(rejectTarget.id);
    try {
      const res = await verifyAdminCreatorApi(rejectTarget.id, 'REJECTED', rejectReason);
      if (res.success) {
        setCreators((prev) =>
          prev.map((c) =>
            c.id === rejectTarget.id
              ? { ...c, verificationStatus: 'REJECTED', rejectionReason: rejectReason }
              : c
          )
        );
        showToast(`Application for ${rejectTarget.user.fullName} marked as Rejected.`, 'success');
        setRejectTarget(null);
      } else {
        showToast(res.error || 'Failed to reject creator application.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter list by search query
  const filteredCreators = creators.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.user.fullName.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      c.specialtyTags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const pendingCount = creators.filter((c) => c.verificationStatus === 'PENDING').length;
  const verifiedCount = creators.filter((c) => c.verificationStatus === 'VERIFIED').length;
  const rejectedCount = creators.filter((c) => c.verificationStatus === 'REJECTED').length;

  // Render Admin Role Gate screen if user is not ADMIN
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#121315] text-[#F7F4EF] flex flex-col justify-between font-sans">
        {/* Top Header */}
        <div className="border-b border-white/[0.08] bg-[#16171A] py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <button
              onClick={onBackHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white text-black font-display font-black text-sm flex items-center justify-center">
                A
              </div>
              <span className="font-display font-bold text-base text-white tracking-tight">Ascend Admin</span>
            </div>
            <div className="w-20" />
          </div>
        </div>

        {/* Gate Card */}
        <div className="max-w-md w-full mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-[#16171A] border border-white/[0.12] shadow-2xl space-y-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-[#B8703F]/20 text-[#B8703F] mx-auto flex items-center justify-center border border-[#B8703F]/30 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Admin Authorization Required</span>
              </div>
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">
                Restricted Admin Portal
              </h1>
              <p className="text-xs sm:text-sm text-[#F7F4EF]/60 leading-relaxed">
                The Coach Verification Audit portal (`/admin/creators`) is gated to users with the{' '}
                <span className="text-[#B8703F] font-mono font-bold">ADMIN</span> role.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-[#F7F4EF]/70">
                <span>Current Account:</span>
                <span className="font-mono text-white font-semibold">
                  {currentUser?.email || 'Guest / Not Signed In'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#F7F4EF]/70">
                <span>Current Role:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {currentUser?.role || 'NONE'}
                </span>
              </div>
            </div>

            <button
              onClick={handleDemoAdminLogin}
              disabled={isLoggingInAdmin}
              className="w-full py-3.5 rounded-full bg-[#B8703F] hover:bg-[#a56234] text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingInAdmin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Admin Session...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Demo Administrator (admin@ascend.io)</span>
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center text-xs text-[#F7F4EF]/40 font-mono border-t border-white/[0.06]">
          Ascend Administrator Gateway • RBAC Protected
        </div>
      </div>
    );
  }

  // Render Full Admin Portal
  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans flex flex-col justify-between selection:bg-[#B8703F] selection:text-white">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header */}
      <header className="border-b border-white/[0.08] bg-[#16171A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBackHome}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
              <span>Back to Home</span>
            </button>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#B8703F] to-[#7c441f] text-white font-display font-black text-lg flex items-center justify-center shadow-md">
                A
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-display font-bold text-white tracking-tight leading-none">
                    Admin Operations
                  </h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B8703F]/20 text-[#B8703F] font-bold border border-[#B8703F]/30 uppercase tracking-wider">
                    Portal
                  </span>
                </div>
                <p className="text-[11px] text-[#F7F4EF]/50 font-mono mt-0.5">
                  Audit & Support Console • Role: {currentUser?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="hidden md:flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveAdminSection('creators')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeAdminSection === 'creators'
                  ? 'bg-[#B8703F] text-black shadow-md'
                  : 'text-[#F7F4EF]/70 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Coach Applications</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeAdminSection === 'creators' ? 'bg-black/20 text-black font-bold' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveAdminSection('support')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeAdminSection === 'support'
                  ? 'bg-[#B8703F] text-black shadow-md'
                  : 'text-[#F7F4EF]/70 hover:text-white'
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Support Desk</span>
              {supportCounts.open > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeAdminSection === 'support' ? 'bg-black/20 text-black font-bold' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {supportCounts.open}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-[#F7F4EF]/70">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{currentUser?.email}</span>
            </div>
            <button
              onClick={activeAdminSection === 'creators' ? loadCreators : loadSupportTickets}
              disabled={isLoading || isLoadingSupport}
              className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F7F4EF] border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isLoadingSupport ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* =================================================================== */}
        {/* SECTION 1: COACH APPLICATIONS */}
        {/* =================================================================== */}
        {activeAdminSection === 'creators' && (
          <>
            {/* KPI Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Pending Review
                  </span>
                  <span className="text-2xl font-bold font-display text-amber-400 mt-1 block">
                    {pendingCount}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Verified Coaches
                  </span>
                  <span className="text-2xl font-bold font-display text-emerald-400 mt-1 block">
                    {verifiedCount}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Rejected
                  </span>
                  <span className="text-2xl font-bold font-display text-rose-400 mt-1 block">
                    {rejectedCount}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Audit SLA
                  </span>
                  <span className="text-2xl font-bold font-display text-[#B8703F] mt-1 block">
                    &lt; 24 hrs
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-[#B8703F]/10 text-[#B8703F] flex items-center justify-center border border-[#B8703F]/20">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-[#16171A] border border-white/[0.08]">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                {(
                  [
                    { id: 'pending', label: 'Pending', count: pendingCount },
                    { id: 'verified', label: 'Verified', count: verifiedCount },
                    { id: 'rejected', label: 'Rejected', count: rejectedCount },
                    { id: 'all', label: 'All Applications', count: creators.length },
                  ] as const
                ).map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#B8703F] text-black font-bold shadow-md'
                          : 'bg-white/[0.04] text-[#F7F4EF]/70 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/80'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search coach, handle or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121315] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#B8703F] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-3xl bg-[#16171A] border border-white/[0.08] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-bold text-[#F7F4EF]/50 uppercase tracking-wider">
                      <th className="py-4 px-6">Coach Candidate</th>
                      <th className="py-4 px-6">Disciplines & Accreditations</th>
                      <th className="py-4 px-6">Audit Dossier</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Audit Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-[#F7F4EF]/50">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#B8703F]" />
                            <span>Streaming Coach Dossiers...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCreators.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-[#F7F4EF]/50">
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="w-6 h-6 text-[#F7F4EF]/30" />
                            <span>No creator applications matching "{statusFilter}".</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCreators.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={c.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                                alt={c.user.fullName}
                                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-white/10"
                              />
                              <div>
                                <span className="font-bold text-white block">{c.user.fullName}</span>
                                <span className="font-mono text-[11px] text-[#B8703F]">@{c.handle}</span>
                                <span className="text-[10px] text-[#F7F4EF]/40 block">{c.user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 max-w-xs">
                            <p className="font-semibold text-white truncate">{c.headline}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.specialtyTags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[10px] text-[#F7F4EF]/80">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              {c.verificationDocs.map((docUrl, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setPreviewDocUrl(docUrl)}
                                  className="flex items-center gap-1.5 text-xs text-[#B8703F] hover:underline cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[140px]">
                                    {docUrl.split('#')[1] || `Doc #${idx + 1}`}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {c.verificationStatus === 'VERIFIED' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                                Verified ✓
                              </span>
                            ) : c.verificationStatus === 'REJECTED' ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[11px] font-bold">
                                Rejected ✕
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                                Pending Audit
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {c.verificationStatus === 'PENDING' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(c)}
                                  disabled={actionLoadingId === c.id}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => setRejectTarget(c)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* =================================================================== */}
        {/* SECTION 2: SUPPORT DESK */}
        {/* =================================================================== */}
        {activeAdminSection === 'support' && (
          <>
            {/* Support KPI Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Total Inquiries
                  </span>
                  <span className="text-2xl font-bold font-display text-white mt-1 block">
                    {supportCounts.total}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-white/[0.05] text-white flex items-center justify-center border border-white/10">
                  <LifeBuoy className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Open Issues
                  </span>
                  <span className="text-2xl font-bold font-display text-amber-400 mt-1 block">
                    {supportCounts.open}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    In Progress
                  </span>
                  <span className="text-2xl font-bold font-display text-sky-400 mt-1 block">
                    {supportCounts.inProgress}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#16171A] border border-white/[0.08] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7F4EF]/50 uppercase tracking-wider font-semibold block">
                    Resolved
                  </span>
                  <span className="text-2xl font-bold font-display text-emerald-400 mt-1 block">
                    {supportCounts.resolved}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Support Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-[#16171A] border border-white/[0.08]">
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketStatusFilter(st)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      ticketStatusFilter === st
                        ? 'bg-[#B8703F] text-black font-bold shadow-md'
                        : 'bg-white/[0.04] text-[#F7F4EF]/70 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Category Filter & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={ticketCategoryFilter}
                  onChange={(e) => setTicketCategoryFilter(e.target.value)}
                  className="bg-[#121315] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B8703F]"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PAYMENT_ISSUE">Payment Issues</option>
                  <option value="ACCESS_ISSUE">Access Issues</option>
                  <option value="OTHER">Other Inquiries</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ticket #, user, subject..."
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    className="w-full bg-[#121315] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#B8703F]"
                  />
                </div>
              </div>
            </div>

            {/* Support Tickets Table / List */}
            <div className="rounded-3xl bg-[#16171A] border border-white/[0.08] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-bold text-[#F7F4EF]/50 uppercase tracking-wider">
                      <th className="py-4 px-6">Ticket Details</th>
                      <th className="py-4 px-6">User / Role</th>
                      <th className="py-4 px-6">Subject & Description</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {isLoadingSupport ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-[#F7F4EF]/50">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#B8703F]" />
                            <span>Loading Support Inquiries...</span>
                          </div>
                        </td>
                      </tr>
                    ) : supportTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-[#F7F4EF]/50">
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-[#6E8B6F]" />
                            <span>No support tickets in this queue.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      supportTickets
                        .filter((t) => {
                          if (!ticketSearchQuery) return true;
                          const q = ticketSearchQuery.toLowerCase();
                          return (
                            t.ticketNumber.toLowerCase().includes(q) ||
                            t.subject.toLowerCase().includes(q) ||
                            t.description.toLowerCase().includes(q) ||
                            t.user?.fullName.toLowerCase().includes(q) ||
                            t.user?.email.toLowerCase().includes(q)
                          );
                        })
                        .map((tkt) => (
                          <tr key={tkt.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-mono text-xs font-bold text-[#B8703F] block">
                                {tkt.ticketNumber}
                              </span>
                              <span className="text-[11px] text-[#F7F4EF]/50 block mt-0.5">
                                {tkt.category === 'PAYMENT_ISSUE'
                                  ? '💳 Payment'
                                  : tkt.category === 'ACCESS_ISSUE'
                                  ? '🎥 Access'
                                  : '💬 General'}
                              </span>
                              <span className="text-[10px] text-[#F7F4EF]/40 font-mono">
                                {new Date(tkt.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <span className="font-bold text-white block">
                                {tkt.user?.fullName || 'Platform User'}
                              </span>
                              <span className="text-[11px] text-[#F7F4EF]/50 block">
                                {tkt.user?.email || 'user@ascend.io'}
                              </span>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.06] text-white/70">
                                {tkt.user?.role || 'BUYER'}
                              </span>
                            </td>

                            <td className="py-4 px-6 max-w-sm">
                              <p className="font-bold text-white">{tkt.subject}</p>
                              <p className="text-xs text-[#F7F4EF]/70 mt-1 line-clamp-2">
                                {tkt.description}
                              </p>
                              {tkt.enrollmentId && (
                                <span className="inline-block mt-1 text-[10px] text-[#B8703F] font-mono">
                                  Ref: {tkt.enrollmentId}
                                </span>
                              )}
                              {tkt.adminResponse && (
                                <div className="mt-2 p-2 rounded-xl bg-[#6E8B6F]/10 border border-[#6E8B6F]/30 text-[11px] text-[#6E8B6F]">
                                  <strong>Admin Resolution:</strong> {tkt.adminResponse}
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-6">
                              {tkt.status === 'RESOLVED' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                                  Resolved ✓
                                </span>
                              ) : tkt.status === 'IN_PROGRESS' ? (
                                <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold">
                                  In Progress
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold">
                                  Open
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleOpenTicketModal(tkt)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#B8703F] hover:bg-[#a56234] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ml-auto"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Respond / Resolve</span>
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Support Ticket Resolution Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#16171A] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-[#F7F4EF]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-[#B8703F]">
                  <LifeBuoy className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      Resolution Desk: {selectedTicket.ticketNumber}
                    </h3>
                    <span className="text-[11px] text-[#F7F4EF]/50">
                      Author: {selectedTicket.user?.fullName} ({selectedTicket.user?.email})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-white bg-white/[0.05] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inquiry Context */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7F4EF]/40">
                  Customer Inquiry
                </span>
                <p className="font-bold text-white">{selectedTicket.subject}</p>
                <p className="text-[#F7F4EF]/75 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
                {selectedTicket.enrollmentId && (
                  <span className="inline-block text-[10px] text-[#B8703F] font-mono">
                    Linked Reference: {selectedTicket.enrollmentId}
                  </span>
                )}
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold uppercase tracking-wider text-[#F7F4EF]/70 block">
                  Update Ticket Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewTicketStatus(st)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newTicketStatus === st
                          ? st === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                            : st === 'IN_PROGRESS'
                            ? 'bg-sky-500/20 text-sky-400 border-sky-500'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500'
                          : 'bg-white/[0.03] text-[#F7F4EF]/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Resolution Note */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold uppercase tracking-wider text-[#F7F4EF]/70 block">
                  Resolution Feedback (Visible to Customer)
                </label>
                <textarea
                  rows={3}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Explain resolution steps taken, refund status, or video link refresh..."
                  className="w-full bg-[#121315] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#B8703F] transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#F7F4EF]/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTicketResolution}
                  disabled={isUpdatingTicket}
                  className="px-4 py-2 rounded-xl bg-[#B8703F] hover:bg-[#a56234] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdatingTicket ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Resolution & Update Status</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#16171A] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-rose-400">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-white">
                    Reject Application: {rejectTarget.user.fullName}
                  </h3>
                </div>
                <button
                  onClick={() => setRejectTarget(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F7F4EF]/70 block">
                  Rejection Feedback (Sent to Coach)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what credentials or document updates are required..."
                  className="w-full bg-[#121315] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#F7F4EF]/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === rejectTarget.id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === rejectTarget.id ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewDocUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#16171A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B8703F]" />
                  <span className="font-bold text-xs text-white truncate max-w-md">
                    {previewDocUrl.split('#')[1] || 'Verification Document Preview'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDocUrl.split('#')[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open External</span>
                  </a>
                  <button
                    onClick={() => setPreviewDocUrl(null)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/50 min-h-[300px]">
                <img
                  src={previewDocUrl.split('#')[0]}
                  alt="Verification Document"
                  className="max-w-full max-h-[60vh] object-contain rounded-xl border border-white/10 shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#F7F4EF]/40 font-mono border-t border-white/[0.06]">
        Ascend Coaching Ecosystem • Administrator Audit Interface
      </footer>
    </div>
  );
};
