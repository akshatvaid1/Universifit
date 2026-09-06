import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Button } from './ui';
import {
  getAvailabilityScheduleApi,
  updateAvailabilityScheduleApi,
  type AvailabilityScheduleConfig,
  SAMPLE_SCHEDULE_CONFIG,
} from '../services/api';

interface AvailabilityEditorProps {
  onScheduleSaved?: (config: AvailabilityScheduleConfig) => void;
}

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  onScheduleSaved,
}) => {
  const [schedule, setSchedule] = useState<AvailabilityScheduleConfig>(SAMPLE_SCHEDULE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getAvailabilityScheduleApi()
      .then((res) => {
        if (res.data) setSchedule(res.data);
      })
      .catch((err) => {
        console.debug('getAvailabilityScheduleApi error', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleToggleDay = (dayIndex: number) => {
    const updatedWeekly = schedule.weeklySlots.map((d, i) =>
      i === dayIndex ? { ...d, isActive: !d.isActive } : d
    );
    setSchedule({ ...schedule, weeklySlots: updatedWeekly });
  };

  const handleUpdateDayTime = (
    dayIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updatedWeekly = schedule.weeklySlots.map((d, i) =>
      i === dayIndex ? { ...d, [field]: value } : d
    );
    setSchedule({ ...schedule, weeklySlots: updatedWeekly });
  };

  const handleAddBlackoutDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate) return;

    if (schedule.blackoutDates.includes(newBlackoutDate)) {
      setErrorMessage('This blackout date is already in your blocked list.');
      return;
    }

    setSchedule({
      ...schedule,
      blackoutDates: [...schedule.blackoutDates, newBlackoutDate].sort(),
    });
    setNewBlackoutDate('');
    setErrorMessage(null);
  };

  const handleRemoveBlackoutDate = (dateToRemove: string) => {
    setSchedule({
      ...schedule,
      blackoutDates: schedule.blackoutDates.filter((d) => d !== dateToRemove),
    });
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateAvailabilityScheduleApi(schedule);
      if (res.success && res.data) {
        setSuccessMessage('Availability schedule & blackout dates synchronized to booking engine! 🗓️');
        if (onScheduleSaved) onScheduleSaved(res.data);
        setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setErrorMessage(res.error || 'Failed to update schedule.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving availability schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDaysCount = schedule.weeklySlots.filter((d) => d.isActive).length;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-96 bg-white/5 rounded-3xl" />
          <div className="lg:col-span-4 h-96 bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-[#F7F4EF] flex items-center gap-2">
            <span>Weekly Availability & Blackout Dates</span>
            <Badge variant="verified" size="sm">
              LIVE ENGINE SYNC
            </Badge>
          </h2>
          <p className="text-xs text-[#F7F4EF]/60 leading-relaxed mt-0.5">
            Configure weekly recurring coaching windows and blackout dates. Powers client 1-on-1 scheduling on your public storefront.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveSchedule}
          isLoading={isSaving}
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
        >
          Save & Sync Schedule
        </Button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Weekly Recurring Slots (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <Card
            variant="charcoal"
            className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#B8703F]" />
                  <span>Weekly Recurring Windows</span>
                </h3>
                <p className="text-xs text-[#F7F4EF]/50">
                  {activeDaysCount} of 7 days active for client session booking
                </p>
              </div>

              {/* Slot duration config */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#F7F4EF]/60 font-medium">Session:</span>
                <select
                  value={schedule.slotDurationMinutes}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      slotDurationMinutes: Number(e.target.value),
                    })
                  }
                  className="bg-[#121315] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#B8703F]"
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
            </div>

            {/* Days Rows */}
            <div className="space-y-3">
              {schedule.weeklySlots.map((day, idx) => (
                <div
                  key={day.dayOfWeek}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    day.isActive
                      ? 'bg-white/[0.03] border-white/10 text-white'
                      : 'bg-white/[0.01] border-white/[0.04] text-neutral-500 opacity-60'
                  }`}
                >
                  {/* Day Toggle & Name */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(idx)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        day.isActive ? 'bg-[#6E8B6F]' : 'bg-neutral-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          day.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <span className="text-sm font-bold w-24">
                      {day.dayName}
                    </span>
                  </div>

                  {/* Hours Inputs */}
                  {day.isActive ? (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) =>
                          handleUpdateDayTime(idx, 'startTime', e.target.value)
                        }
                        className="bg-[#121315] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#B8703F]"
                      />
                      <span className="text-neutral-500 font-bold">to</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) =>
                          handleUpdateDayTime(idx, 'endTime', e.target.value)
                        }
                        className="bg-[#121315] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#B8703F]"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-neutral-500 italic">
                      Unavailable (Off Day)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Blackout Dates Manager (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card
            variant="charcoal"
            className="p-6 bg-[#16171A] border-white/[0.08] shadow-xl space-y-5"
          >
            <div className="space-y-1 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#B8703F]" />
                <h3 className="font-display font-bold text-base text-[#F7F4EF]">
                  Blackout Dates
                </h3>
              </div>
              <p className="text-xs text-[#F7F4EF]/60 leading-relaxed">
                Block out specific holidays, travel days, or personal breaks.
              </p>
            </div>

            {/* Add Date Form */}
            <form onSubmit={handleAddBlackoutDate} className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#F7F4EF]/70 block">
                Add Blocked Calendar Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newBlackoutDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="flex-1 bg-[#121315] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#B8703F]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>
            </form>

            {/* Blackout Dates List */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Active Blocked Dates ({schedule.blackoutDates.length})
              </span>

              {schedule.blackoutDates.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {schedule.blackoutDates.map((dateStr) => (
                    <div
                      key={dateStr}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono text-[#F7F4EF]">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>{dateStr}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlackoutDate(dateStr)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 cursor-pointer transition-colors"
                        title="Remove blackout date"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic py-2">
                  No blackout dates set. All active weekly hours are open for booking.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
