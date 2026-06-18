import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCoursesForDegree, getEventsForCourses } from '../lib/firestore';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import EventDetailModal from '../components/calendar/EventDetailModal';
import { CALENDAR_VIEWS } from '../utils/constants';
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
import { Loader2, CalendarDays } from 'lucide-react';

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [view, setView] = useState(CALENDAR_VIEWS.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load courses and events
  useEffect(() => {
    if (userProfile?.degree) {
      loadData();
    }
  }, [userProfile?.degree, userProfile?.electives]);

  async function loadData() {
    setLoading(true);
    try {
      // Get all courses for user's degree
      const degreeCourses = await getCoursesForDegree(userProfile.degree);
      setCourses(degreeCourses);

      // Filter: core courses + user's selected electives
      const relevantCourseIds = degreeCourses
        .filter((c) => !c.is_elective || userProfile.electives?.includes(c.course_id))
        .map((c) => c.course_id);

      if (relevantCourseIds.length > 0) {
        const allEvents = await getEventsForCourses(relevantCourseIds);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
        <p className="text-surface-400 text-sm">Loading your calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-600/20">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">My Calendar</h1>
            <p className="text-sm text-surface-400">
              {userProfile?.degree} • {events.length} event{events.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3">
          {['lecture', 'exam', 'deadline'].map((type) => {
            const count = visibleEvents.filter((e) => e.type === type).length;
            return (
              <div
                key={type}
                className={`badge-${type} px-3 py-1.5 rounded-lg text-xs font-medium`}
              >
                {count} {type}{count !== 1 ? 's' : ''}
              </div>
            );
          })}
        </div>
      </div>

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
      <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        {view === CALENDAR_VIEWS.MONTH ? (
          <MonthView
            currentDate={currentDate}
            events={visibleEvents}
            courseMap={courseMap}
            onEventClick={setSelectedEvent}
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            events={visibleEvents}
            courseMap={courseMap}
            onEventClick={setSelectedEvent}
          />
        )}
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        courseMap={courseMap}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
