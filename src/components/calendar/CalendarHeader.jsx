import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { CALENDAR_VIEWS } from '../../utils/constants';
import Button from '../ui/Button';

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}) {
  const title =
    view === CALENDAR_VIEWS.MONTH
      ? format(currentDate, 'MMMM yyyy')
      : `Week of ${format(currentDate, 'MMM d, yyyy')}`;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToday}>
          <Calendar className="w-3.5 h-3.5" />
          Today
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] ml-2">
          {title}
        </h2>
      </div>

      {/* Right: View Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)]">
        <button
          onClick={() => onViewChange(CALENDAR_VIEWS.MONTH)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            view === CALENDAR_VIEWS.MONTH
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onViewChange(CALENDAR_VIEWS.WEEK)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            view === CALENDAR_VIEWS.WEEK
              ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Week
        </button>
      </div>
    </div>
  );
}
