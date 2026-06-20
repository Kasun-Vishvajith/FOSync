import {
  startOfWeek,
  addDays,
  format,
  isToday,
  isSameDay,
} from 'date-fns';
import { getDegreeColor, getEventTypeColor } from '../../utils/helpers';
import { TIME_SLOTS } from '../../utils/constants';

export default function WeekView({ currentDate, events, courseMap, onEventClick, onDayClick }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group events by day
  const eventsByDay = {};
  weekDays.forEach((day) => {
    const key = format(day, 'yyyy-MM-dd');
    eventsByDay[key] = events.filter((e) => {
      const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      return isSameDay(d, day);
    });
  });

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col overflow-x-auto custom-scrollbar">
      <div className="min-w-[700px] flex-1 min-h-0 flex flex-col">
        {/* Day Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--color-surface-container)]">
          <div className="py-3" /> {/* Time column spacer */}
          {weekDays.map((day) => {
            const today = isToday(day);
            const dayOfWeek = day.getDay();
            
            let dayTextColor = "text-[var(--color-outline)]";
            let numTextColor = "text-[var(--color-on-surface-variant)]";
            
            if (dayOfWeek === 6) {
              dayTextColor = "text-[var(--color-error)] opacity-80";
              numTextColor = "text-[var(--color-error)] opacity-80";
            }
            if (dayOfWeek === 0) {
              dayTextColor = "text-[var(--color-error)] opacity-80";
              numTextColor = "text-[var(--color-error)] opacity-80";
            }

            return (
              <div
                key={day.toISOString()}
                className={`
                  py-3 text-center border-l border-[var(--color-surface-container)]
                  ${today ? 'bg-[var(--color-surface-container-low)]' : ''}
                `}
              >
                <p className={`text-xs font-semibold ${dayTextColor} uppercase tracking-wider`}>
                  {format(day, 'EEE')}
                </p>
                <p
                  className={`
                    text-lg font-bold mt-0.5
                    ${
                      today
                        ? 'w-8 h-8 mx-auto rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm shadow-md'
                        : numTextColor
                    }
                  `}
                >
                  {format(day, 'd')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          {TIME_SLOTS.map((slot) => (
            <div key={slot.hour} className="contents">
              {/* Time Label */}
              <div className="h-20 flex items-start justify-end pr-3 pt-1 border-b border-[var(--color-surface-container)]">
                <span className="text-xs text-[var(--color-outline-variant)] font-medium">
                  {slot.label}
                </span>
              </div>
              {/* Day Cells */}
              {weekDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDay[key] || [];
                const today = isToday(day);
                // Show events that roughly match this time slot
                const slotEvents = dayEvents.filter((e) => {
                  const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
                  return d.getHours() === slot.hour;
                });

                return (
                  <div
                    key={`${key}-${slot.hour}`}
                    className={`
                      h-20 border-l border-b border-[var(--color-surface-container)] p-1 relative hover:bg-[var(--color-surface-container-low)] cursor-pointer transition-colors
                      ${today ? 'bg-[var(--color-surface-container-low)]/50' : ''}
                    `}
                    onClick={() => onDayClick && onDayClick(day, dayEvents)}
                  >
                    {slotEvents.map((event) => {
                      const course = courseMap[event.course_id];
                      const colors = getEventTypeColor(event.type);
                      return (
                        <button
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold truncate transition-all duration-150 hover:scale-[1.02] mb-1 cursor-pointer border shadow-sm"
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            color: colors.text,
                          }}
                        >
                          {event.title}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* All-day / unslotted events */}
        {(() => {
          const unslottedEvents = events.filter((e) => {
            const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
            const hour = d.getHours();
            return hour < 6 || hour > 20;
          });
          if (unslottedEvents.length === 0) return null;
          return (
            <div className="border-t border-[var(--color-surface-container-high)] p-4 bg-[var(--color-surface-container-lowest)]">
              <p className="text-xs text-[var(--color-outline)] font-semibold mb-3 uppercase tracking-wider">All Day</p>
              <div className="flex flex-wrap gap-2">
                {unslottedEvents.map((event) => {
                  const course = courseMap[event.course_id];
                  const colors = getEventTypeColor(event.type);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 cursor-pointer shadow-[var(--shadow-soft)]"
                      style={{
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      {event.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
