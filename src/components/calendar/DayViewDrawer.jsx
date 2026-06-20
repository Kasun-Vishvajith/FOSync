import { X, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getEventTypeColor } from '../../utils/helpers';

export default function DayViewDrawer({ isOpen, onClose, date, events, courseMap, onEventClick, onAddEvent }) {
  if (!date) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[var(--color-surface)] shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-[var(--color-surface-container-high)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-surface-container-high)] bg-[var(--color-surface-container-lowest)] shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">
              {format(date, 'EEEE')}
            </h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm mt-1 font-medium">
              {format(date, 'MMMM d, yyyy')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <CalendarIcon className="w-12 h-12 text-[var(--color-outline-variant)] mb-4 opacity-50" />
              <p className="text-[var(--color-on-surface)] font-semibold text-lg">No events</p>
              <p className="text-[var(--color-outline)] text-sm mt-1">Enjoy your free time!</p>
            </div>
          ) : (
            events
              .sort((a, b) => {
                const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return da.getTime() - db.getTime();
              })
              .map(event => {
                const course = courseMap[event.course_id];
                const colors = getEventTypeColor(event.type);
                
                const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                const timeString = format(d, 'h:mm a');

                return (
                  <div 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="shrink-0 bg-[var(--color-surface-container-lowest)] border rounded-2xl p-4 cursor-pointer hover:shadow-[var(--shadow-soft)] hover:-translate-y-0.5 transition-all relative overflow-hidden flex flex-col gap-2"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="absolute left-0 top-0 w-1.5 h-full" style={{ backgroundColor: colors.border }} />
                    <div className="ml-2">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm" style={{ color: colors.text }}>
                          {event.course_id}
                        </span>
                        <span 
                          className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {event.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-[var(--color-on-surface)] text-base leading-tight mb-3">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-low)] w-fit px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" style={{ color: colors.border }} />
                        {timeString}
                      </div>
                    </div>
                  </div>
                );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-surface-container-high)] bg-[var(--color-surface-container-lowest)] shrink-0">
          <button 
            onClick={onAddEvent}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>
      </div>
    </>
  );
}
