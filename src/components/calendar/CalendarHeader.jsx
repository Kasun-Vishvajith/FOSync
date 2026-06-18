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
    <div className="glass rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
        <h2 className="text-lg font-semibold text-surface-100 ml-2">
          {title}
        </h2>
      </div>

      {/* Right: View Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-800 border border-surface-700">
        <button
          onClick={() => onViewChange(CALENDAR_VIEWS.WEEK)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
            ${
              view === CALENDAR_VIEWS.WEEK
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-surface-400 hover:text-surface-200'
            }
          `}
        >
          Week
        </button>
        <button
          onClick={() => onViewChange(CALENDAR_VIEWS.MONTH)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer
            ${
              view === CALENDAR_VIEWS.MONTH
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-surface-400 hover:text-surface-200'
            }
          `}
        >
          Month
        </button>
      </div>
    </div>
  );
}
