import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCoursesForDegree, getEventsForCourses, addEvent as firestoreAddEvent } from '../lib/firestore';
import { DEGREES } from '../utils/constants';
import { capitalize } from '../utils/helpers';
import { Timestamp } from 'firebase/firestore';

const EventsContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}

export function EventsProvider({ children }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();

  // Public-only degree picker (when not logged in)
  const [publicDegree, setPublicDegree] = useState(DEGREES[1]); // 'Data Science'

  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // The degree we're currently showing data for
  const activeDegree = currentUser ? userProfile?.degree : publicDegree;

  // ── Load courses + events ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (authLoading) {
        return; // Wait for AuthContext loading to complete
      }

      if (!activeDegree) {
        setEvents([]);
        setCourses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const degreeCourses = await getCoursesForDegree(activeDegree);
        if (cancelled) return;
        setCourses(degreeCourses);

        let relevantCourseIds;
        if (currentUser) {
          relevantCourseIds = degreeCourses
            .filter((c) => !c.is_elective || userProfile?.electives?.includes(c.course_id))
            .map((c) => c.course_id);
        } else {
          relevantCourseIds = degreeCourses.map((c) => c.course_id);
        }

        // Expand with linked courses
        const expandedIds = new Set(relevantCourseIds);
        degreeCourses.forEach((c) => {
          if (expandedIds.has(c.course_id) && c.linked_courses) {
            c.linked_courses.forEach((lc) => expandedIds.add(lc));
          }
        });

        const finalCourseIds = Array.from(expandedIds);
        if (finalCourseIds.length > 0) {
          const allEvents = await getEventsForCourses(finalCourseIds);
          if (!cancelled) setEvents(allEvents);
        } else {
          if (!cancelled) setEvents([]);
        }
      } catch (err) {
        console.error('EventsContext: failed to load data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [activeDegree, userProfile?.electives, currentUser, authLoading, refreshKey]);

  // ── Course lookup map ─────────────────────────────────────────────────────
  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((c) => { map[c.course_id] = c; });
    return map;
  }, [courses]);

  // ── Force refresh (call after external mutations) ─────────────────────────
  const refreshEvents = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // ── Add event: writes to Firestore + optimistically updates local state ───
  const addNewEvent = useCallback(async (data) => {
    if (!currentUser) throw new Error('Must be logged in to add events');

    const dateObj = data.date instanceof Date ? data.date : (
      data.date?.toDate ? data.date.toDate() : new Date(data.date)
    );

    const payload = {
      course_id: data.course_id,
      title: data.title || `${data.course_id} ${capitalize(data.type)}`,
      date: Timestamp.fromDate(dateObj),
      type: data.type,
      created_by: currentUser.uid,
    };

    const eventId = await firestoreAddEvent(payload);

    // Optimistic update — no full re-fetch needed
    setEvents((prev) => [...prev, { id: eventId, ...payload }]);

    return eventId;
  }, [currentUser]);

  const value = {
    events,
    courses,
    courseMap,
    loading,
    activeDegree,
    publicDegree,
    setPublicDegree,
    refreshEvents,
    addNewEvent,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}
