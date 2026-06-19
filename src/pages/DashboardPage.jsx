import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCoursesForDegree, getEventsForCourses, addEvent } from '../lib/firestore';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import EventDetailModal from '../components/calendar/EventDetailModal';
import QuickAddChat from '../components/events/QuickAddChat';
import { CALENDAR_VIEWS, DEGREES, EVENT_TYPES } from '../utils/constants';
import Select from '../components/ui/Select';
import SlideOver from '../components/ui/SlideOver';
import Button from '../components/ui/Button';
import { getDegreeColor, capitalize } from '../utils/helpers';
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
import { Loader2, CalendarDays, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const [view, setView] = useState(CALENDAR_VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [addForm, setAddForm] = useState({
    course_id: '',
    time: '08:00',
    type: 'lecture',
  });
  const [submitting, setSubmitting] = useState(false);
  const [publicDegree, setPublicDegree] = useState('Data Science');

  const navigate = useNavigate();

  const activeDegree = currentUser ? userProfile?.degree : publicDegree;

  // Load courses and events
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (!activeDegree) {
          setEvents([]);
          setCourses([]);
          return;
        }

        const degreeCourses = await getCoursesForDegree(activeDegree);
        setCourses(degreeCourses);

        let relevantCourseIds;
        
        if (currentUser) {
          // Filter: core courses + user's selected electives
          relevantCourseIds = degreeCourses
            .filter((c) => !c.is_elective || userProfile?.electives?.includes(c.course_id))
            .map((c) => c.course_id);
        } else {
          // Public user: show all courses for that degree
          relevantCourseIds = degreeCourses.map(c => c.course_id);
        }

        // Expand relevant course IDs to include any linked courses
        const expandedIds = new Set(relevantCourseIds);
        degreeCourses.forEach((c) => {
          if (expandedIds.has(c.course_id) && c.linked_courses) {
            c.linked_courses.forEach((lc) => expandedIds.add(lc));
          }
        });
        const finalCourseIds = Array.from(expandedIds);

        if (finalCourseIds.length > 0) {
          const allEvents = await getEventsForCourses(finalCourseIds);
          setEvents(allEvents);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeDegree, userProfile?.electives, currentUser]);

  // Navigation
  function goToday() {
    setCurrentDate(new Date());
  }

  function goPrev() {
    setCurrentDate((d) =>
      view === CALENDAR_VIEWS.WEEK ? subWeeks(d, 1) : subMonths(d, 1)
    );
  }

  function goNext() {
    setCurrentDate((d) =>
      view === CALENDAR_VIEWS.WEEK ? addWeeks(d, 1) : addMonths(d, 1)
    );
  }

  // Filter events for current view range
  const visibleEvents = useMemo(() => {
    const start =
      view === CALENDAR_VIEWS.WEEK
        ? startOfWeek(currentDate, { weekStartsOn: 1 })
        : startOfMonth(currentDate);
    const end =
      view === CALENDAR_VIEWS.WEEK
        ? endOfWeek(currentDate, { weekStartsOn: 1 })
        : endOfMonth(currentDate);

    return events.filter((event) => {
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      return isWithinInterval(eventDate, { start, end });
    });
  }, [events, currentDate, view]);

  // Build course lookup for event display
  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      map[c.course_id] = c;
    });
    return map;
  }, [courses]);

  return (
    <div className="space-y-3 pb-4">
      {/* Header with stats */}
      <div className={`flex flex-col sm:flex-row justify-end animate-fade-in ${!currentUser ? 'mb-2' : ''}`}>
        {/* Public Degree Selector (Only if not logged in) */}
        {!currentUser && (
          <div className="w-full sm:w-64">
            <Select
              value={publicDegree}
              onChange={(e) => setPublicDegree(e.target.value)}
              options={DEGREES.map(d => ({ value: d, label: d }))}
              className="!py-2"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-4" />
          <p className="text-[var(--color-text-secondary)] text-sm">Loading calendar...</p>
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
          />

          {/* Calendar Grid */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {view === CALENDAR_VIEWS.MONTH ? (
              <MonthView
                currentDate={currentDate}
                events={visibleEvents}
                courseMap={courseMap}
                onEventClick={setSelectedEvent}
                onDayClick={(day, dayEvents) => setDayDetails({ day, events: dayEvents })}
              />
            ) : (
              <WeekView
                currentDate={currentDate}
                events={visibleEvents}
                courseMap={courseMap}
                onEventClick={setSelectedEvent}
                onDayClick={(day, dayEvents) => setDayDetails({ day, events: dayEvents })}
              />
            )}
          </div>

          {/* Quick Add Chat Widget (Only if logged in) */}
          {currentUser && (
             <QuickAddChat onEventAdded={() => {
                // To force reload, we can just trigger a state update, or if we use realtime listeners it auto-updates.
                // For now, relying on user refresh or we can pass a refresh trigger.
             }} />
          )}

          {/* Event Detail Modal */}
          <EventDetailModal
            event={selectedEvent}
            courseMap={courseMap}
            onClose={() => setSelectedEvent(null)}
          />

          {/* Day Details Modal */}
          {/* Day Details SlideOver */}
          <SlideOver
            isOpen={!!dayDetails}
            onClose={() => { setDayDetails(null); setIsAddingEvent(false); }}
            title={dayDetails && !isAddingEvent ? format(dayDetails.day, 'EEEE, MMMM d, yyyy') : 'Easy Add'}
          >
            {isAddingEvent ? (
              <div className="space-y-6 sm:p-2">
                <div className="space-y-4">
                  <Select
                    label="Course"
                    value={addForm.course_id}
                    onChange={(e) => setAddForm({ ...addForm, course_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select a course' },
                      ...courses.map(c => ({ value: c.course_id, label: `${c.course_id} - ${c.aliases?.[0] || 'Course'}` }))
                    ]}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['08:00', '10:00', '13:00', '15:00', '17:00'].map(t => (
                        <button
                          key={t}
                          onClick={() => setAddForm({ ...addForm, time: t })}
                          className={`py-2 px-3 rounded-[var(--radius-sm)] text-sm transition-colors ${addForm.time === t ? 'bg-[var(--color-accent)] text-white font-medium border border-transparent shadow-[var(--shadow-soft)]' : 'bg-[var(--color-bg-base)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'}`}
                        >
                          {t}
                        </button>
                      ))}
                      <input 
                        type="time" 
                        value={addForm.time}
                        onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                        className="bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-[3px] focus:ring-[var(--color-accent-subtle)]"
                      />
                    </div>
                  </div>

                  <Select
                    label="Event Type"
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    options={EVENT_TYPES}
                  />

                  <div className="pt-6 flex flex-col gap-3">
                    <Button 
                      className="w-full" 
                      loading={submitting}
                      disabled={!addForm.course_id}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          const dateObj = new Date(dayDetails.day);
                          const [hours, mins] = addForm.time.split(':');
                          dateObj.setHours(parseInt(hours), parseInt(mins));
                          
                          const newEvent = {
                            course_id: addForm.course_id,
                            title: `${addForm.course_id} ${capitalize(addForm.type)}`,
                            date: dateObj, // use Date object instead of ISO string for better internal consistency
                            type: addForm.type,
                            created_by: currentUser.uid
                          };
                          
                          const eventId = await addEvent(newEvent);
                          
                          setIsAddingEvent(false);
                          setDayDetails(null);
                          
                          // Locally append the new event to avoid fetching again
                          setEvents(prev => [...prev, { id: eventId, ...newEvent }]);
                        } catch (err) {
                          console.error('Failed to add event', err);
                          alert('Failed to add event');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      Save Event
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setIsAddingEvent(false)}>
                      Back to Events
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:p-2">
                {dayDetails?.events?.length > 0 ? (
                  <div className="space-y-3">
                    {dayDetails.events.map((event) => {
                      const course = courseMap[event.course_id];
                      const colors = getDegreeColor(course?.degrees?.[0] || 'Default');
                      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
                      
                      return (
                        <div
                          key={event.id}
                          className="bg-[var(--color-surface)] p-3 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm flex items-start gap-3 transition-colors hover:border-[var(--color-accent)]/30"
                        >
                          <div 
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: colors.border }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-[var(--color-text-secondary)]">
                              <span className="font-medium text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                                {course?.course_id || event.course_id}
                              </span>
                              <span>•</span>
                              <span className="font-medium bg-[var(--color-bg-base)] border border-[var(--color-border)] px-1.5 py-0.5 rounded-[var(--radius-sm)]">
                                {format(eventDate, 'h:mm a')}
                              </span>
                              <span>•</span>
                              <span className={`badge-${event.type} px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[10px] uppercase font-bold tracking-wide`}>
                                {capitalize(event.type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[var(--color-bg-base)] border border-[var(--color-border)] border-dashed rounded-[var(--radius-xl)]">
                    <CalendarDays className="w-8 h-8 text-[var(--color-text-secondary)]/50 mx-auto mb-3" />
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium">No events scheduled for this day.</p>
                  </div>
                )}

                <div className="pt-6 border-t border-[var(--color-border)] flex flex-col gap-3">
                  {!currentUser ? (
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setDayDetails(null);
                        navigate('/login');
                      }}
                    >
                      Sign in to Add Event
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => setIsAddingEvent(true)}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Event
                    </Button>
                  )}
                  <Button variant="secondary" className="w-full bg-[var(--color-bg-base)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]" onClick={() => { setDayDetails(null); setIsAddingEvent(false); }}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </SlideOver>
        </>
      )}
    </div>
  );
}
