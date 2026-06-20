import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventsContext';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import EventDetailModal from '../components/calendar/EventDetailModal';
import AddEventModal from '../components/events/AddEventModal';
import { CALENDAR_VIEWS, DEGREES } from '../utils/constants';
import Select from '../components/ui/Select';
import SlideOver from '../components/ui/SlideOver';
import Button from '../components/ui/Button';
import { getDegreeColor, getEventTypeColor, capitalize } from '../utils/helpers';
import DayViewDrawer from '../components/calendar/DayViewDrawer';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isWithinInterval,
  format,
} from 'date-fns';
import { Loader2, CalendarDays, Plus, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { events, courses, courseMap, loading, publicDegree, setPublicDegree } = useEvents();

  const [view, setView] = useState(CALENDAR_VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState(null);
  
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [dayDrawerData, setDayDrawerData] = useState({ date: null, events: [] });

  const navigate = useNavigate();

  function goToday() { setCurrentDate(new Date()); }
  function goPrev() {
    setCurrentDate((d) => view === CALENDAR_VIEWS.WEEK ? subWeeks(d, 1) : subMonths(d, 1));
  }
  function goNext() {
    setCurrentDate((d) => view === CALENDAR_VIEWS.WEEK ? addWeeks(d, 1) : addMonths(d, 1));
  }

  const visibleEvents = useMemo(() => {
    let start, end;
    if (view === CALENDAR_VIEWS.WEEK) {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    }

    return events.filter((event) => {
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      return isWithinInterval(eventDate, { start, end });
    });
  }, [events, currentDate, view]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return d >= now;
      })
      .sort((a, b) => {
        const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dA - dB;
      })
      .slice(0, 5);
  }, [events]);

  function openAddForDay(day) {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setDayDetails(null);
    setAddModalDate(day);
    setAddModalOpen(true);
  }

  function handleDayClick(day, dayEvents) {
    setDayDrawerData({ date: day, events: dayEvents || [] });
    setDayDrawerOpen(true);
  }

  function handleAddFromDrawer() {
    setDayDrawerOpen(false);
    openAddForDay(dayDrawerData.date);
  }

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col pb-24 md:pb-0">
      
      {/* Calendar Only View */}
      <div className="flex-1 flex flex-col gap-[var(--spacing-gutter)] h-full min-h-0">
        
        {/* Public Degree Selector (If Not Logged In) */}
        {!currentUser && (
          <div className="flex justify-end animate-fade-in">
            <div className="w-full sm:w-56">
              <Select
                value={publicDegree}
                onChange={(e) => setPublicDegree(e.target.value)}
                options={DEGREES.map((d) => ({ value: d, label: d }))}
                className="!py-2 bg-[var(--color-surface-container-lowest)] border-none shadow-[var(--shadow-soft)]"
              />
            </div>
          </div>
        )}



        {/* Calendar View Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 shadow-[var(--shadow-soft)] flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-4" />
              <p className="text-[var(--color-on-surface-variant)] text-sm">Loading calendar…</p>
            </div>
          ) : (
            <>
              {/* Calendar Controls */}
              <CalendarHeader
                currentDate={currentDate}
                view={view}
                onViewChange={setView}
                onPrev={goPrev}
                onNext={goNext}
                onToday={goToday}
                onSetDate={setCurrentDate}
              />

              {/* Calendar Grid */}
              <div className="animate-fade-in flex-1 min-h-0 flex flex-col h-full overflow-hidden" style={{ animationDelay: '0.1s' }}>
                {view === CALENDAR_VIEWS.MONTH ? (
                  <MonthView
                    currentDate={currentDate}
                    events={visibleEvents}
                    courseMap={courseMap}
                    onEventClick={setSelectedEvent}
                    onDayClick={handleDayClick}
                  />
                ) : (
                  <WeekView
                    currentDate={currentDate}
                    events={visibleEvents}
                    courseMap={courseMap}
                    onEventClick={setSelectedEvent}
                    onDayClick={handleDayClick}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>



      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        courseMap={courseMap}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAddModalDate(null); }}
        preselectedDate={addModalDate}
      />

      <DayViewDrawer
        isOpen={dayDrawerOpen}
        onClose={() => setDayDrawerOpen(false)}
        date={dayDrawerData.date}
        events={dayDrawerData.events}
        courseMap={courseMap}
        onEventClick={(event) => {
          setDayDrawerOpen(false);
          setSelectedEvent(event);
        }}
        onAddEvent={handleAddFromDrawer}
      />
    </div>
  );
}

function EventCard({ event, courseMap, onClick }) {
  const course = courseMap[event.course_id];
  const colors = getDegreeColor(course?.degrees?.[0] || 'Default');
  const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);

  return (
    <div 
      onClick={onClick}
      className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-surface-container)] hover:shadow-[var(--shadow-soft)] transition-shadow group cursor-pointer relative overflow-hidden flex flex-col gap-3"
    >
      <div 
        className="absolute left-0 top-0 w-1.5 h-full rounded-l-2xl"
        style={{ backgroundColor: colors.border }}
      />
      <div className="flex justify-between items-start ml-2">
        <h4 className="font-semibold text-[var(--color-on-surface)] group-hover:opacity-80 transition-opacity">
          {event.title}
        </h4>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-outline)] bg-[var(--color-surface-container)] px-2 py-0.5 rounded">
          {capitalize(event.type)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] text-sm ml-2">
        <CalendarDays className="w-4 h-4" />
        {format(eventDate, 'MMM d, h:mm a')}
      </div>
      {course && (
        <div className="flex items-center gap-3 ml-2 mt-auto">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-primary-container)] border-2 border-[var(--color-surface)] flex items-center justify-center text-[10px] font-bold text-[var(--color-on-primary-container)]">
              {course.course_id.slice(0, 2)}
            </div>
          </div>
          <span className="text-xs font-medium text-[var(--color-outline)]">{course.aliases?.[0] || course.course_id}</span>
        </div>
      )}
    </div>
  );
}
