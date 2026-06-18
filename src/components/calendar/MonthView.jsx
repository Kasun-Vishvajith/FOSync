import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { getEventTypeColor } from '../../utils/helpers';

export default function MonthView({ currentDate, events, courseMap, onEventClick }) {
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
    <div className="glass rounded-xl overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-surface-700/50">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[key] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={`
                min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r border-surface-700/30
                transition-colors duration-150
                ${isCurrentMonth ? 'bg-transparent' : 'bg-surface-900/40'}
                ${today ? 'bg-primary-600/5' : ''}
                hover:bg-surface-800/40
              `}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-medium
                    ${today ? 'w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs' : ''}
                    ${isCurrentMonth ? (today ? '' : 'text-surface-200') : 'text-surface-600'}
                  `}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => {
                  const colors = getEventTypeColor(event.type);
                  const course = courseMap[event.course_id];
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-all duration-150 hover:scale-[1.02] cursor-pointer"
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
                  <p className="text-xs text-surface-500 pl-1.5">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
