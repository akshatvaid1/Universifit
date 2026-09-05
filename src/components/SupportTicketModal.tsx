import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  X,
  CreditCard,
  Video,
  HelpCircle,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button, Input } from './ui';
import {
  createSupportTicketApi,
  fetchUserSupportTicketsApi,
  type SupportTicketItem,
  type TicketCategory,
} from '../services/api';

export interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: TicketCategory;
  defaultProgramTitle?: string;
  defaultEnrollmentId?: string;
  initialCategory?: TicketCategory;
  initialEnrollmentId?: string;
  initialBookingId?: string;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  defaultProgramTitle,
  defaultEnrollmentId,
  initialCategory,
  initialEnrollmentId,
  initialBookingId,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [category, setCategory] = useState<TicketCategory>(initialCategory || defaultCategory || 'ACCESS_ISSUE');
  const [subject, setSubject] = useState(defaultProgramTitle ? `Access issue with ${defaultProgramTitle}` : '');
  const [description, setDescription] = useState('');
  const [enrollmentId, setEnrollmentId] = useState<string>(initialEnrollmentId || defaultEnrollmentId || '');
  const [bookingId, setBookingId] = useState<string>(initialBookingId || '');

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) setCategory(initialCategory);
      if (initialEnrollmentId) setEnrollmentId(initialEnrollmentId);
      if (initialBookingId) setBookingId(initialBookingId);
    }
  }, [isOpen, initialCategory, initialEnrollmentId, initialBookingId]);

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen]);

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const data = await fetchUserSupportTicketsApi();
      setTickets(data);
    } catch (err) {
      console.warn('Error loading support tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await createSupportTicketApi({
        category,
        subject: subject.trim(),
        description: description.trim(),
        enrollmentId: enrollmentId.trim() || undefined,
        bookingId: bookingId.trim() || undefined,
      });

      if (res.success && res.data) {
        setTickets((prev) => [res.data, ...prev]);
        setSubject('');
        setDescription('');
        setSuccessToast(`Ticket #${res.data.ticketNumber} created successfully.`);
        setTimeout(() => setSuccessToast(null), 4000);
        setActiveTab('list');
      }
    } catch (err) {
      console.warn('Error creating ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: TicketCategory) => {
    switch (cat) {
      case 'PAYMENT_ISSUE':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'ACCESS_ISSUE':
        return <Video className="w-4 h-4 text-amber-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-[#B8703F]" />;
    }
  };

  const getCategoryLabel = (cat: TicketCategory) => {
    switch (cat) {
      case 'PAYMENT_ISSUE':
        return 'Payment & Billing';
      case 'ACCESS_ISSUE':
        return 'Course / Video Access';
      default:
        return 'General / Booking Query';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Open
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#16171A] border border-white/[0.08] rounded-3xl shadow-2xl text-[#F7F4EF] overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B8703F]/20 text-[#B8703F] flex items-center justify-center border border-[#B8703F]/30 shadow-inner">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  Support & Help Desk
                </h2>
                <p className="text-xs text-[#F7F4EF]/60">
                  Raise an issue for billing, curriculum access, or coaching inquiries.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#F7F4EF]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast */}
          {successToast && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="px-6 pt-4 flex items-center gap-2 border-b border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? 'text-[#B8703F] border-[#B8703F]'
                  : 'text-[#F7F4EF]/60 border-transparent hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise a Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                loadTickets();
              }}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'list'
                  ? 'text-[#B8703F] border-[#B8703F]'
                  : 'text-[#F7F4EF]/60 border-transparent hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>My Tickets</span>
              {tickets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/[0.1] text-[10px] font-mono text-white">
                  {tickets.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Raise a Ticket */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#F7F4EF]/70 block">
                  Select Issue Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'PAYMENT_ISSUE', label: 'Payment & Billing', icon: CreditCard },
                      { id: 'ACCESS_ISSUE', label: 'Course / Video Access', icon: Video },
                      { id: 'OTHER', label: 'General Inquiry', icon: HelpCircle },
                    ] as const
                  ).map((cat) => {
                    const isSelected = category === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#B8703F]/20 text-[#B8703F] border-[#B8703F] ring-1 ring-[#B8703F]'
                            : 'bg-white/[0.03] text-[#F7F4EF]/70 border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <IconComp className="w-4 h-4 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <Input
                label="Subject Summary"
                placeholder="e.g. Video player stuttering in Module 3 / Invoice GST credit request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#F7F4EF]/80">
                  Detailed Description & Error Context
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe exactly what happened, transaction ID or booking slot time if applicable..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-[#121315] text-xs text-[#F7F4EF] placeholder-white/30 border border-white/15 focus:border-[#B8703F] focus:ring-2 focus:ring-[#B8703F] rounded-2xl p-3.5 focus:outline-none transition-all"
                />
              </div>

              {/* Optional Program Link */}
              <Input
                label="Linked Program / Order Identifier (Optional)"
                placeholder="e.g. enr-1 or Biomechanics Cohort"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                helperText="Helps the support engineer prioritize your specific enrollment."
              />

              {/* Submit Row */}
              <div className="pt-3 flex items-center justify-between border-t border-white/[0.08]">
                <span className="text-[11px] text-[#F7F4EF]/50 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6E8B6F]" />
                  Average resolution time: under 4 hours
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Submit Support Ticket
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: My Tickets */}
          {activeTab === 'list' && (
            <div className="p-6 space-y-4">
              {/* Filter Row */}
              <div className="flex items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'bg-[#B8703F] text-black font-bold'
                          : 'bg-white/[0.04] text-[#F7F4EF]/60 hover:text-white'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={loadTickets}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[#F7F4EF]/60 hover:text-white transition-colors cursor-pointer"
                  title="Refresh tickets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Tickets List */}
              {isLoadingTickets ? (
                <div className="py-12 text-center text-xs text-[#F7F4EF]/50 space-y-2">
                  <div className="w-6 h-6 border-2 border-[#B8703F] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Fetching your ticket history...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                  <HelpCircle className="w-8 h-8 text-[#F7F4EF]/30 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-white">No tickets found</p>
                    <p className="text-xs text-[#F7F4EF]/50">
                      {statusFilter !== 'ALL'
                        ? `You have no ${statusFilter.toLowerCase()} support tickets.`
                        : 'You haven’t submitted any support requests yet.'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('create')}
                    leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                  >
                    Raise New Ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredTickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/15 transition-all space-y-3"
                    >
                      {/* Top Row: Ticket Number & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#B8703F]">
                            {tkt.ticketNumber}
                          </span>
                          <span className="text-xs text-[#F7F4EF]/40">•</span>
                          <span className="text-[11px] text-[#F7F4EF]/60 flex items-center gap-1">
                            {getCategoryIcon(tkt.category)}
                            {getCategoryLabel(tkt.category)}
                          </span>
                        </div>

                        {getStatusBadge(tkt.status)}
                      </div>

                      {/* Subject & Description */}
                      <div>
                        <h4 className="font-semibold text-sm text-white">{tkt.subject}</h4>
                        <p className="text-xs text-[#F7F4EF]/70 mt-1 leading-relaxed whitespace-pre-wrap">
                          {tkt.description}
                        </p>
                      </div>

                      {/* Admin Response Note */}
                      {tkt.adminResponse && (
                        <div className="p-3 rounded-xl bg-[#6E8B6F]/10 border border-[#6E8B6F]/30 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#6E8B6F] font-bold">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Official Support Resolution:
                            </span>
                            {tkt.respondedAt && (
                              <span className="text-[10px] font-normal text-[#F7F4EF]/50">
                                {new Date(tkt.respondedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#F7F4EF]/90">{tkt.adminResponse}</p>
                        </div>
                      )}

                      {/* Footer: Timestamp */}
                      <div className="text-[10px] text-[#F7F4EF]/40 flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <span>
                          Raised on{' '}
                          {new Date(tkt.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {tkt.enrollmentId && (
                          <span className="font-mono text-[#B8703F]">Ref: {tkt.enrollmentId}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
