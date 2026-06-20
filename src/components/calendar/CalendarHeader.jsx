import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { CALENDAR_VIEWS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import AddEventModal from '../events/AddEventModal';
import { useState } from 'react';

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onSetDate,
}) {
  const { currentUser } = useAuth();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = format(currentDate, 'MMMM');
  const weekLabel = `Week of ${format(currentDate, 'MMM d')}`;

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newYear);
    if (onSetDate) onSetDate(newDate);
  };



  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        {/* Left: Title & Nav */}
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
            <span>{view === CALENDAR_VIEWS.MONTH ? currentMonth : weekLabel}</span>
            <div className="relative inline-flex items-center">
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="appearance-none bg-transparent hover:bg-[var(--color-surface-container-low)] px-2 py-1 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onPrev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={onNext}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: View Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onToday}
            className="hidden sm:flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium border border-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Today
          </button>
          
          <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] p-1 rounded-xl">
            <button
              onClick={() => onViewChange(CALENDAR_VIEWS.MONTH)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                view === CALENDAR_VIEWS.MONTH
                  ? 'bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-soft)] text-[var(--color-on-surface)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onViewChange(CALENDAR_VIEWS.WEEK)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                view === CALENDAR_VIEWS.WEEK
                  ? 'bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-soft)] text-[var(--color-on-surface)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </>
  );
}
