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
import { getEventTypeColor } from '../../utils/helpers';

export default function MonthView({ currentDate, events, onDayClick }) {
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
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="min-w-[600px] h-full flex flex-col gap-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 text-center font-semibold text-sm text-[var(--color-outline)] uppercase tracking-wider">
          {dayHeaders.map((day) => {
            let textColor = "text-[var(--color-outline)]";
            if (day === 'Sat') textColor = "text-[var(--color-error)] opacity-80";
            if (day === 'Sun') textColor = "text-[var(--color-error)] opacity-80";
            
            return (
              <div key={day} className={textColor}>
                {day}
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-4 auto-rows-[minmax(0,1fr)] flex-1 min-h-0">
          {days.map((day, idx) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[key] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const dayOfWeek = day.getDay();
            
            let dayTextColor = isCurrentMonth ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-outline-variant)]';
            if (!today) {
              if (dayOfWeek === 6) dayTextColor = isCurrentMonth ? 'text-[var(--color-error)] opacity-80' : 'text-[var(--color-error)] opacity-40';
              if (dayOfWeek === 0) dayTextColor = isCurrentMonth ? 'text-[var(--color-error)] opacity-80' : 'text-[var(--color-error)] opacity-40';
            }

            return (
              <div
                key={idx}
                className={`
                  rounded-[var(--radius-xl)] flex flex-col p-1 sm:p-2 border transition-all duration-200 overflow-hidden min-h-0
                  ${isCurrentMonth ? 'bg-[var(--color-surface-container-lowest)]' : 'bg-[var(--color-surface-container-low)]/50'}
                  ${today ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20 shadow-md' : 'border-[var(--color-surface-container)]'}
                  hover:border-[var(--color-outline)] cursor-pointer
                `}
                onClick={() => onDayClick && onDayClick(day, dayEvents)}
              >
                {/* Day Number */}
                <div className="flex justify-center items-center h-6 min-h-[24px] mb-1 shrink-0">
                  {today ? (
                    <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shadow-md">
                      {format(day, 'd')}
                    </span>
                  ) : (
                    <span className={`text-xs sm:text-sm font-medium leading-none ${dayTextColor}`}>
                      {format(day, 'd')}
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="flex-1 overflow-hidden flex flex-col gap-1 pr-0.5">
                  {dayEvents.slice(0, 2).map((event) => {
                    const colors = getEventTypeColor(event.type);
                    
                    return (
                      <div
                        key={event.id}
                        className="shrink-0 px-1.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold leading-tight truncate border"
                        style={{ 
                          backgroundColor: colors.bg, 
                          color: colors.text,
                          borderColor: colors.border
                        }}
                        title={`${event.title} - ${event.course_id}`}
                      >
                        <span className="hidden sm:inline font-bold mr-1">{event.course_id}</span>
                        <span className="capitalize">{event.type}</span>
                      </div>
                    );
                  })}
                  
                  {/* +X more indicator */}
                  {dayEvents.length > 2 && (
                    <div 
                      className="text-[10px] font-bold text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors mt-auto pt-0.5 pb-0.5 text-center bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] rounded-md cursor-pointer"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (onDayClick) onDayClick(day, dayEvents);
                      }}
                    >
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
