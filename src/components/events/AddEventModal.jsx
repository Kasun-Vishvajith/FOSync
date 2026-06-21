import { useState, useEffect } from 'react';
import { X, BookOpen, Clock, Calendar, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { useEvents } from '../../contexts/EventsContext';
import { useAuth } from '../../contexts/AuthContext';
import { capitalize, parseCustomTime, parseDurationOrEndTime } from '../../utils/helpers';
import { format, addDays, nextMonday, nextFriday } from 'date-fns';

// Quick date pill helpers
function getDateSuggestions() {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const monday = nextMonday(today);
  const friday = nextFriday(today);
  return [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: tomorrow },
    { label: 'Next Mon', date: monday },
    { label: 'Next Fri', date: friday },
  ];
}

const TIME_PRESETS = [
  { label: '9:00 AM', value: '9:00 AM' },
  { label: '11:00 AM', value: '11:00 AM' },
  { label: '1:00 PM', value: '1:00 PM' },
  { label: '3:00 PM', value: '3:00 PM' },
  { label: '5:00 PM', value: '5:00 PM' },
];

const TYPE_OPTIONS = [
  { value: 'lecture', label: 'Lecture', color: 'bg-[#e5f0ff] text-[#0f62fe] border-[#0f62fe]/20' },
  { value: 'exam', label: 'Exam', color: 'bg-[#ffe6e8] text-[#da1e28] border-[#da1e28]/20' },
  { value: 'deadline', label: 'Deadline', color: 'bg-[#fff8e1] text-[#b45309] border-[#f59e0b]/20' },
  { value: 'practical', label: 'Practical', color: 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]/20' },
  { value: 'tutorial', label: 'Tutorial', color: 'bg-[#fdf4ff] text-[#9333ea] border-[#9333ea]/20' },
];

export default function AddEventModal({ isOpen, onClose, preselectedDate = null, preselectedType = null }) {
  const { courses, addNewEvent } = useEvents();
  useAuth();

  const [form, setForm] = useState({
    course_id: '',
    type: preselectedType || 'lecture',
    time: '9:00 AM',
    date: preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    customTitle: '',
    durationOrEnd: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync preselected when modal opens
  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => {
        setForm({
          course_id: '',
          type: preselectedType || 'lecture',
          time: '9:00 AM',
          date: preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          customTitle: '',
          durationOrEnd: '',
          note: '',
        });
        setSuccess(false);
        setError('');
      });
    }
  }, [isOpen, preselectedDate, preselectedType]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  function setDateFromSuggestion(date) {
    setForm((f) => ({ ...f, date: format(date, 'yyyy-MM-dd') }));
  }

  const selectedType = TYPE_OPTIONS.find((t) => t.value === form.type) || TYPE_OPTIONS[0];
  const autoTitle = form.course_id
    ? `${form.course_id} ${capitalize(form.type)}`
    : '';
  const displayTitle = form.customTitle || autoTitle;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.course_id) { setError('Please select a course.'); return; }
    if (!form.date) { setError('Please pick a date.'); return; }

    const parsedTime = parseCustomTime(form.time);
    if (!parsedTime) {
      setError('Please enter a valid time (e.g. 10:30 AM or 15:00).');
      return;
    }

    let endDateObj = null;
    if (form.type !== 'deadline' && form.durationOrEnd.trim()) {
      const parsedEnd = parseDurationOrEndTime(form.durationOrEnd, parsedTime.hours, parsedTime.minutes);
      if (!parsedEnd) {
        setError('Please enter a valid duration or end time (e.g. 1.5h, 90m, 11:30 AM).');
        return;
      }
      endDateObj = new Date(form.date + 'T00:00:00');
      endDateObj.setHours(parsedEnd.hours, parsedEnd.minutes, 0, 0);
      if (endDateObj.getTime() < (new Date(form.date + 'T00:00:00').setHours(parsedTime.hours, parsedTime.minutes))) {
        endDateObj.setDate(endDateObj.getDate() + 1);
      }
    }

    setError('');
    setSubmitting(true);
    try {
      const dateObj = new Date(form.date + 'T00:00:00');
      dateObj.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

      await addNewEvent({
        course_id: form.course_id,
        title: displayTitle || `${form.course_id} ${capitalize(form.type)}`,
        date: dateObj,
        end_date: endDateObj,
        type: form.type,
        note: form.note,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ course_id: '', type: 'lecture', time: '10:00 AM', date: format(new Date(), 'yyyy-MM-dd'), customTitle: '', durationOrEnd: '', note: '' });
        onClose();
      }, 1200);
    } catch (err) {
      console.error('AddEventModal error:', err);
      setError('Failed to add event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const dateSuggestions = getDateSuggestions();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full sm:max-w-2xl bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] shadow-[var(--shadow-elevated)] border border-[var(--color-border)] animate-slide-up overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-surface)] animate-fade-in rounded-[var(--radius-xl)]">
            <CheckCircle2 className="w-12 h-12 text-[#16a34a] mb-3" />
            <p className="text-lg font-bold text-[var(--color-text-primary)]">Event Added!</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Calendar has been updated.</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">Add Event</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Course selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  Course
                </label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]"
                >
                  <option value="">Select a course…</option>
                  {courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_id}{c.aliases?.[0] ? ` — ${c.aliases[0]}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-primary)]">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t.value, durationOrEnd: t.value === 'deadline' ? '' : f.durationOrEnd }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.type === t.value ? t.color + ' ring-2 ring-offset-1 ring-current/20 shadow-sm' : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  Date
                </label>
                <div className="flex flex-wrap gap-2 mb-1">
                  {dateSuggestions.map(({ label, date }) => {
                    const val = format(date, 'yyyy-MM-dd');
                    const active = form.date === val;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDateFromSuggestion(date)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-[var(--color-accent)] text-white border-transparent shadow-sm' : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Time */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  Time
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {TIME_PRESETS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, time: value }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${form.time === value ? 'bg-[var(--color-accent)] text-white border-transparent shadow-sm' : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM, 15:00, 3 PM"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]"
                />
                {form.time.trim() && (
                  <div className="mt-1 flex items-center text-xs">
                    {parseCustomTime(form.time) ? (
                      <span className="text-[#16a34a] font-medium">
                        ✓ Parsed as {parseCustomTime(form.time).formatted12}
                      </span>
                    ) : (
                      <span className="text-[#da1e28] font-medium">
                        ✗ Invalid time format (e.g. 10:30 AM or 15:00)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Duration or End Time */}
              {form.type !== 'deadline' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    Duration or End Time <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.5h, 90m, or 11:30 AM"
                    value={form.durationOrEnd}
                    onChange={(e) => setForm((f) => ({ ...f, durationOrEnd: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]"
                  />
                  {form.durationOrEnd.trim() && parseCustomTime(form.time) && (
                    <div className="mt-1 flex items-center text-xs">
                      {(() => {
                        const startTime = parseCustomTime(form.time);
                        const parsed = parseDurationOrEndTime(form.durationOrEnd, startTime.hours, startTime.minutes);
                        if (parsed) {
                          return (
                            <span className="text-[#16a34a] font-medium">
                              ✓ Parsed end: {parsed.formatted12} {parsed.isDuration ? `(${parsed.durationMinutes}m)` : ''}
                            </span>
                          );
                        }
                        return (
                          <span className="text-[#da1e28] font-medium">
                            ✗ Invalid format (e.g. 2h, 90m, 11:30 AM)
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Custom title (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Title <span className="text-[var(--color-text-secondary)] font-normal">(optional — auto-generated)</span>
                </label>
                <input
                  type="text"
                  value={form.customTitle}
                  onChange={(e) => setForm((f) => ({ ...f, customTitle: e.target.value }))}
                  placeholder={autoTitle || 'e.g. CO321 Midterm Exam'}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)] transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]"
                />
              </div>

              {/* Note (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Note <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Bring calculators, room 204"
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-secondary)] transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Preview strip */}
          {form.course_id && form.date && (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs animate-fade-in flex-wrap">
              <span className={`px-2 py-0.5 rounded-full font-semibold border ${selectedType.color}`}>
                {selectedType.label}
              </span>
              <span className="font-semibold text-[var(--color-text-primary)]">{displayTitle}</span>
              <span className="text-[var(--color-text-secondary)]">·</span>
              <span className="text-[var(--color-text-secondary)]">
                {format(new Date(form.date + 'T00:00:00'), 'EEE, MMM d')} at {parseCustomTime(form.time) ? parseCustomTime(form.time).formatted12 : form.time}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-[#da1e28] font-medium animate-slide-down">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-[var(--color-border)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.course_id || submitting}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Adding…' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
