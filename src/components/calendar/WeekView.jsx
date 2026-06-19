import {
  startOfWeek,
  addDays,
  format,
  isToday,
  isSameDay,
} from 'date-fns';
import { getEventTypeColor } from '../../utils/helpers';
import { TIME_SLOTS } from '../../utils/constants';

export default function WeekView({ currentDate, events, courseMap, onEventClick }) {
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
    <div className="glass rounded-xl overflow-hidden overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-700/50">
          <div className="py-3" /> {/* Time column spacer */}
          {weekDays.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`
                  py-3 text-center border-l border-surface-700/30
                  ${today ? 'bg-primary-600/5' : ''}
                `}
              >
                <p className="text-xs font-semibold text-surface-400 uppercase">
                  {format(day, 'EEE')}
                </p>
                <p
                  className={`
                    text-lg font-bold mt-0.5
                    ${
                      today
                        ? 'w-8 h-8 mx-auto rounded-full bg-primary-600 text-white flex items-center justify-center text-sm'
                        : 'text-surface-200'
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
        <div className="grid grid-cols-[60px_repeat(7,1fr)] max-h-[600px] overflow-y-auto">
          {TIME_SLOTS.map((slot) => (
            <div key={slot.hour} className="contents">
              {/* Time Label */}
              <div className="h-16 flex items-start justify-end pr-2 pt-0.5 border-b border-surface-700/20">
                <span className="text-xs text-surface-500 font-medium">
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
                      h-16 border-l border-b border-surface-700/20 p-0.5 relative
                      ${today ? 'bg-primary-600/3' : ''}
                    `}
                  >
                    {slotEvents.map((event) => {
                      const colors = getEventTypeColor(event.type);
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className="w-full text-left px-1.5 py-1 rounded text-xs font-medium truncate transition-all duration-150 hover:scale-[1.02] mb-0.5 cursor-pointer"
                          style={{
                            backgroundColor: colors.bg,
                            borderLeft: `2px solid ${colors.border}`,
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
            <div className="border-t border-surface-700/30 p-3">
              <p className="text-xs text-surface-400 font-semibold mb-2">All Day</p>
              <div className="flex flex-wrap gap-2">
                {unslottedEvents.map((event) => {
                  const colors = getEventTypeColor(event.type);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105 cursor-pointer"
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
