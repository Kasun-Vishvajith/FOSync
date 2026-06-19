import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import { getDegreeColor } from '../../utils/helpers';

export default function MonthView({ currentDate, events, courseMap, onEventClick, onDayClick }) {
  // Build calendar grid (weeks x 7 days)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = {};
  events.forEach((event) => {
    const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
    const key = format(d, 'yyyy-MM-dd');
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft)] overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
        {dayHeaders.map((day) => {
          let textColor = "text-[var(--color-text-secondary)]";
          if (day === 'Sat') textColor = "text-red-400";
          if (day === 'Sun') textColor = "text-red-600";
          
          return (
            <div
              key={day}
              className={`py-3 text-center text-xs font-semibold ${textColor} uppercase tracking-wider bg-[var(--color-bg-base)]`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[key] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const dayOfWeek = day.getDay();
          
          let dayTextColor = isCurrentMonth ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]';
          if (!today) {
            if (dayOfWeek === 6) dayTextColor = isCurrentMonth ? 'text-red-400' : 'text-red-400/50';
            if (dayOfWeek === 0) dayTextColor = isCurrentMonth ? 'text-red-600' : 'text-red-600/50';
          }

          return (
            <div
              key={idx}
              className={`
                min-h-[60px] sm:min-h-[75px] p-1.5 sm:p-2 border-b border-r border-[var(--color-border)]
                transition-colors duration-150
                ${isCurrentMonth ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-bg-base)]/50'}
                ${today ? 'bg-[var(--color-accent-subtle)]/50' : ''}
                hover:bg-[var(--color-surface-hover)] cursor-pointer
              `}
              onClick={() => onDayClick && onDayClick(day, dayEvents)}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-medium
                    ${today ? 'w-7 h-7 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs shadow-sm' : dayTextColor}
                  `}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {/* Desktop View: Full title buttons */}
                <div className="hidden sm:block space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const course = courseMap[event.course_id];
                    const colors = getDegreeColor(course?.degrees?.[0] || 'Default');
                    return (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className="w-full text-left px-1.5 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium truncate transition-all duration-150 hover:scale-[1.02] cursor-pointer border border-transparent hover:shadow-sm"
                        style={{
                          backgroundColor: colors.bg,
                          borderLeft: `2px solid ${colors.border}`,
                          color: colors.text,
                        }}
                        title={`${event.title} — ${course?.aliases?.[0] || event.course_id}`}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-[var(--color-text-secondary)] pl-1.5 font-medium">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>

                {/* Mobile View: Compact colored circles */}
                <div className="flex flex-wrap gap-1 justify-center mt-1 sm:hidden">
                  {dayEvents.slice(0, 4).map((event) => {
                    const course = courseMap[event.course_id];
                    const colors = getDegreeColor(course?.degrees?.[0] || 'Default');
                    return (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className="w-1.5 h-1.5 rounded-full hover:scale-125 transition-transform cursor-pointer shadow-sm"
                        style={{
                          backgroundColor: colors.border,
                        }}
                        title={event.title}
                      />
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <span className="text-[9px] font-bold text-surface-400">
                      +
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
