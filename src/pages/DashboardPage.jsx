import { useState, useMemo, useEffect } from 'react';
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
import { getTimetable } from '../lib/firestore';
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
} from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const { events, courseMap, loading, publicDegree, setPublicDegree, semesterSettings } = useEvents();

  const [view, setView] = useState(CALENDAR_VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalDate, setAddModalDate] = useState(null);
  
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [dayDrawerData, setDayDrawerData] = useState({ date: null, events: [] });
  const [showShadow, setShowShadow] = useState(false);
  const [timetableSlots, setTimetableSlots] = useState([]);

  const navigate = useNavigate();

  // Fetch timetable slots for shadow overlay
  useEffect(() => {
    async function loadShadowTimetable() {
      if (!currentUser || !userProfile?.degree || !semesterSettings) return;
      
      // Compute year
      let computedYear = '3';
      if (userProfile.batch && semesterSettings.batch_year) {
        const studentStart = parseInt(userProfile.batch.split('/')[0], 10);
        const systemStart = parseInt(semesterSettings.batch_year.split('/')[0], 10);
        if (!isNaN(studentStart) && !isNaN(systemStart)) {
          computedYear = String(Math.max(3, Math.min(4, 4 - (studentStart - systemStart))));
        }
      }
      
      try {
        const data = await getTimetable(userProfile.degree, semesterSettings.current_semester, computedYear);
        setTimetableSlots(data);
      } catch (err) {
        console.error('Failed to load shadow timetable:', err);
      }
    }
    loadShadowTimetable();
  }, [currentUser, userProfile, semesterSettings]);

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

  function openAddForDay(day) {
    if (!currentUser) {
      navigate('/login');
      return;
    }
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
              {view === CALENDAR_VIEWS.WEEK && currentUser && (
                <div className="flex justify-end items-center gap-2 max-w-fit ml-auto border border-[var(--color-surface-container)] bg-[var(--color-surface-container-low)]/40 p-1.5 rounded-full animate-fade-in mb-2 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] px-2">Show Timetable Shadow</span>
                  <button
                    onClick={() => setShowShadow(!showShadow)}
                    className={`
                      w-10 h-6 rounded-full transition-colors relative cursor-pointer
                      ${showShadow ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-container-high)]'}
                    `}
                  >
                    <div 
                      className={`
                        w-4 h-4 rounded-full bg-white absolute top-1 transition-all
                        ${showShadow ? 'left-5' : 'left-1'}
                      `}
                    />
                  </button>
                </div>
              )}
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
                    showShadow={showShadow}
                    timetableSlots={timetableSlots}
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
