import { useState, useEffect } from 'react';
import { BookOpen, Clock, Calendar, CheckCircle2, Loader2, Plus, Sparkles } from 'lucide-react';
import { useEvents } from '../../contexts/EventsContext';
import { capitalize, parseCustomTime } from '../../utils/helpers';
import { format } from 'date-fns';

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

export default function InlineAddEventForm({ initialData = {}, onSuccess, onCancel }) {
  const { courses, addNewEvent } = useEvents();

  // Pre-process date
  let initialDateStr = format(new Date(), 'yyyy-MM-dd');
  if (initialData.date) {
    try {
      const d = initialData.date instanceof Date ? initialData.date : new Date(initialData.date);
      if (!isNaN(d.getTime())) {
        initialDateStr = format(d, 'yyyy-MM-dd');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Pre-process time
  let initialTimeStr = '9:00 AM';
  if (initialData.date) {
    try {
      const d = initialData.date instanceof Date ? initialData.date : new Date(initialData.date);
      if (!isNaN(d.getTime()) && initialData.hasTime) {
        initialTimeStr = format(d, 'h:mm a');
      }
    } catch (e) {
      console.error(e);
    }
  }

  const [form, setForm] = useState({
    course_id: initialData.courseMatch?.course?.course_id || '',
    type: initialData.type || 'lecture',
    time: initialTimeStr,
    date: initialDateStr,
    customTitle: initialData.title && initialData.title !== 'New Event' ? initialData.title : '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const selectedType = TYPE_OPTIONS.find((t) => t.value === form.type) || TYPE_OPTIONS[0];
  const autoTitle = form.course_id
    ? `${form.course_id} ${capitalize(form.type)}`
    : '';
  const displayTitle = form.customTitle || autoTitle;

  const parsedTimeResult = parseCustomTime(form.time);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.course_id) { setError('Please select a course.'); return; }
    if (!form.date) { setError('Please pick a date.'); return; }

    const parsedTime = parseCustomTime(form.time);
    if (!parsedTime) {
      setError('Please enter a valid time (e.g. 10:30 AM or 15:00).');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const dateObj = new Date(form.date + 'T00:00:00');
      dateObj.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);

      const newEventObj = {
        course_id: form.course_id,
        title: displayTitle || `${form.course_id} ${capitalize(form.type)}`,
        date: dateObj,
        type: form.type,
      };

      await addNewEvent(newEventObj);
      setSuccess(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(newEventObj);
        }, 1200);
      }
    } catch (err) {
      console.error('InlineAddEventForm error:', err);
      setError('Failed to add event.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 animate-fade-in text-center">
        <CheckCircle2 className="w-10 h-10 text-[#16a34a] mb-2 animate-bounce" />
        <p className="text-sm font-bold text-[var(--color-text-primary)]">Event Added Successfully!</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          {displayTitle} on {format(new Date(form.date + 'T00:00:00'), 'MMM d')} at {parsedTimeResult?.formatted12 || form.time}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--color-bg-base)]/50 backdrop-blur-md rounded-xl border border-[var(--color-border)] p-4 space-y-4 my-2 max-w-lg transition-all">
      <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pb-2 mb-1">
        <Sparkles className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)] tracking-wide uppercase">
          Quick Add {capitalize(form.type)}
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        {/* Type Selector (Pills) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Type</label>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  form.type === t.value
                    ? `${t.color} border-current ring-1 ring-current/10`
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/30'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Course dropdown & Title input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <BookOpen className="w-3 h-3 text-[var(--color-accent)]" />
              Course
            </label>
            <select
              value={form.course_id}
              onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
              className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-accent)]"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Title <span className="text-[9px] font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={form.customTitle}
              onChange={(e) => setForm((f) => ({ ...f, customTitle: e.target.value }))}
              placeholder={autoTitle || 'e.g. Midterm Exam'}
              className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs placeholder-[var(--color-text-secondary)]/60 focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Date & Time inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <Calendar className="w-3 h-3 text-[var(--color-accent)]" />
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <Clock className="w-3 h-3 text-[var(--color-accent)]" />
              Time
            </label>
            <input
              type="text"
              placeholder="e.g. 10:30 AM, 3 PM"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full px-2.5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs focus:outline-none focus:border-[var(--color-accent)]"
            />
            {form.time.trim() && (
              <div className="text-[10px] mt-0.5">
                {parsedTimeResult ? (
                  <span className="text-[#16a34a] font-medium">✓ Parsed: {parsedTimeResult.formatted12}</span>
                ) : (
                  <span className="text-[#da1e28] font-medium">✗ Invalid time format</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Time Presets */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, time: p.value }))}
              className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
                form.time === p.value
                  ? 'bg-[var(--color-accent)] text-white border-transparent'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-[11px] text-[#da1e28] font-medium">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]/50">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!form.course_id || submitting}
            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {submitting ? 'Adding…' : 'Add Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
