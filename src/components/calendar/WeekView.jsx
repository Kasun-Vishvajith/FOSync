import {
  startOfWeek,
  addDays,
  format,
  isToday,
  isSameDay,
} from 'date-fns';
import { getEventTypeColor } from '../../utils/helpers';
import { TIME_SLOTS } from '../../utils/constants';

export default function WeekView({ currentDate, events, onEventClick, onDayClick }) {
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
        <div className="grid grid-cols-[60px_1fr] flex-1 min-h-0 overflow-y-auto custom-scrollbar relative">
          {/* Hour Labels Column */}
          <div className="flex flex-col select-none">
            {TIME_SLOTS.map((slot) => (
              <div key={slot.hour} className="h-20 flex items-start justify-end pr-3 pt-1 border-b border-[var(--color-surface-container)]">
                <span className="text-xs text-[var(--color-outline-variant)] font-medium">
                  {slot.label}
                </span>
              </div>
            ))}
          </div>

          {/* Days Grid overlay */}
          <div className="grid grid-cols-7 relative h-[1200px] border-r border-[var(--color-surface-container)]">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[key] || [];
              const today = isToday(day);
              
              // Slotted events are between 6 AM and 8 PM
              const slottedEvents = dayEvents.filter((e) => {
                const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
                const hour = d.getHours();
                return hour >= 6 && hour <= 20;
              });

              // Sort events by starting time
              const sortedSlotted = [...slottedEvents].sort((a, b) => {
                const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return da - db;
              });

              // Calculate columns for overlapping events
              const columns = [];
              sortedSlotted.forEach(event => {
                const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                const start = d.getHours() + d.getMinutes() / 60;
                const ed = event.end_date ? (event.end_date.toDate ? event.end_date.toDate() : new Date(event.end_date)) : null;
                const end = ed ? (ed.getHours() + ed.getMinutes() / 60) : (start + 1);
                
                let colIndex = 0;
                while (colIndex < columns.length) {
                  const hasOverlap = columns[colIndex].some(other => {
                    const od = other.date?.toDate ? other.date.toDate() : new Date(other.date);
                    const oStart = od.getHours() + od.getMinutes() / 60;
                    const oed = other.end_date ? (other.end_date.toDate ? other.end_date.toDate() : new Date(other.end_date)) : null;
                    const oEnd = oed ? (oed.getHours() + oed.getMinutes() / 60) : (oStart + 1);
                    return start < oEnd && end > oStart;
                  });
                  if (!hasOverlap) {
                    break;
                  }
                  colIndex++;
                }
                if (!columns[colIndex]) {
                  columns[colIndex] = [];
                }
                columns[colIndex].push(event);
                event.colIndex = colIndex;
              });

              // Set total overlap count for each event
              sortedSlotted.forEach(event => {
                const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                const start = d.getHours() + d.getMinutes() / 60;
                const ed = event.end_date ? (event.end_date.toDate ? event.end_date.toDate() : new Date(event.end_date)) : null;
                const end = ed ? (ed.getHours() + ed.getMinutes() / 60) : (start + 1);
                
                let maxColIndex = 0;
                sortedSlotted.forEach(other => {
                  const od = other.date?.toDate ? other.date.toDate() : new Date(other.date);
                  const oStart = od.getHours() + od.getMinutes() / 60;
                  const oed = other.end_date ? (other.end_date.toDate ? other.end_date.toDate() : new Date(other.end_date)) : null;
                  const oEnd = oed ? (oed.getHours() + oed.getMinutes() / 60) : (oStart + 1);
                  if (start < oEnd && end > oStart) {
                    if (other.colIndex > maxColIndex) {
                      maxColIndex = other.colIndex;
                    }
                  }
                });
                event.colCount = maxColIndex + 1;
              });

              return (
                <div
                  key={key}
                  className={`
                    relative h-full border-l border-[var(--color-surface-container)]
                    ${today ? 'bg-[var(--color-surface-container-low)]/40' : ''}
                  `}
                >
                  {/* Background slot cells */}
                  {TIME_SLOTS.map((slot) => (
                    <div
                      key={`${key}-${slot.hour}`}
                      className="h-20 border-b border-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-low)]/60 transition-colors cursor-pointer"
                      onClick={() => onDayClick && onDayClick(day, dayEvents)}
                    />
                  ))}

                  {/* Absolute Positioned Events */}
                  {sortedSlotted.map((event) => {
                    const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                    const start = d.getHours() + d.getMinutes() / 60;
                    const ed = event.end_date ? (event.end_date.toDate ? event.end_date.toDate() : new Date(event.end_date)) : null;
                    const end = ed ? (ed.getHours() + ed.getMinutes() / 60) : (start + 1);
                    
                    const top = (start - 6) * 80;
                    const height = Math.max(30, (end - start) * 80);
                    
                    const colCount = event.colCount || 1;
                    const colIndex = event.colIndex || 0;
                    const width = 100 / colCount;
                    const left = colIndex * width;
                    
                    const colors = getEventTypeColor(event.type);
                    
                    return (
                      <button
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className="absolute px-2 py-1.5 rounded-lg text-xs font-semibold overflow-hidden transition-all duration-150 hover:scale-[1.01] hover:shadow-md cursor-pointer border flex flex-col justify-start items-start text-left"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${left}% + 3px)`,
                          width: `calc(${width}% - 6px)`,
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                          color: colors.text,
                          zIndex: 5,
                        }}
                      >
                        <span className="font-bold block truncate w-full">{event.title}</span>
                        {height >= 55 && (
                          <span className="text-[10px] opacity-75 block truncate mt-0.5 w-full">
                            {format(d, 'h:mm a')} - {ed ? format(ed?.toDate ? ed.toDate() : new Date(ed), 'h:mm a') : format(new Date(d.getTime() + 60*60*1000), 'h:mm a')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
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
