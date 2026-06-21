import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAllCourses, getEventsForCourses, addEvent as firestoreAddEvent, getSemesterSettings } from '../lib/firestore';
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

function expandRecurringEvents(allEvents, semesterSettings) {
  const expanded = [];
  
  const midStart = semesterSettings?.mid_sem_break_start?.toDate ? semesterSettings.mid_sem_break_start.toDate() : (semesterSettings?.mid_sem_break_start ? new Date(semesterSettings.mid_sem_break_start) : null);
  const midEnd = semesterSettings?.mid_sem_break_end?.toDate ? semesterSettings.mid_sem_break_end.toDate() : (semesterSettings?.mid_sem_break_end ? new Date(semesterSettings.mid_sem_break_end) : null);
  
  const studyStart = semesterSettings?.study_leave_start?.toDate ? semesterSettings.study_leave_start.toDate() : (semesterSettings?.study_leave_start ? new Date(semesterSettings.study_leave_start) : null);
  const studyEnd = semesterSettings?.study_leave_end?.toDate ? semesterSettings.study_leave_end.toDate() : (semesterSettings?.study_leave_end ? new Date(semesterSettings.study_leave_end) : null);
  
  const semEnd = semesterSettings?.end_date?.toDate ? semesterSettings.end_date.toDate() : (semesterSettings?.end_date ? new Date(semesterSettings.end_date) : null);

  for (const event of allEvents) {
    expanded.push(event);
    
    if (event.recurrenceRule) {
      const rule = event.recurrenceRule;
      const start = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      const end = event.end_date?.toDate ? event.end_date.toDate() : (event.end_date ? new Date(event.end_date) : null);
      
      const durationMs = end ? (end.getTime() - start.getTime()) : (60 * 60 * 1000);
      
      const untilDate = rule.until ? new Date(rule.until) : (semEnd || new Date(start.getTime() + 12 * 7 * 24 * 60 * 60 * 1000));
      
      let currentInstance = new Date(start);
      const stepDays = rule.freq === 'daily' ? 1 : 7;
      
      let count = 0;
      while (true) {
        currentInstance.setDate(currentInstance.getDate() + stepDays);
        if (currentInstance > untilDate || count > 150) {
          break;
        }
        
        if (midStart && midEnd && currentInstance >= midStart && currentInstance <= midEnd) {
          continue;
        }
        
        if (studyStart && studyEnd && currentInstance >= studyStart && currentInstance <= studyEnd) {
          continue;
        }

        const instanceStart = new Date(currentInstance);
        const instanceEnd = new Date(instanceStart.getTime() + durationMs);
        
        expanded.push({
          ...event,
          id: `${event.id}_rec_${instanceStart.getTime()}`,
          date: Timestamp.fromDate(instanceStart),
          end_date: Timestamp.fromDate(instanceEnd),
          parentEventId: event.id,
          isRecurringInstance: true
        });
        
        count++;
      }
    }
  }
  return expanded;
}

export function EventsProvider({ children }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();

  // Public-only degree picker (when not logged in)
  const [publicDegree, setPublicDegree] = useState(DEGREES[1]); // 'Data Science'

  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesterSettings, setSemesterSettings] = useState(null);
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
        const semSettings = await getSemesterSettings();
        if (cancelled) return;
        setSemesterSettings(semSettings);

        const allDbCourses = await getAllCourses();
        if (cancelled) return;
        setCourses(allDbCourses);

        const degreeCourses = allDbCourses.filter((c) => c.degrees?.includes(activeDegree));

        let relevantCourseIds;
        if (currentUser) {
          relevantCourseIds = degreeCourses
            .filter((c) => !c.is_elective || userProfile?.electives?.includes(c.course_id))
            .map((c) => c.course_id);
        } else {
          relevantCourseIds = degreeCourses.map((c) => c.course_id);
        }

        // Expand with linked courses using allDbCourses to find linked courses details
        const expandedIds = new Set(relevantCourseIds);
        degreeCourses.forEach((c) => {
          if (expandedIds.has(c.course_id) && c.linked_courses) {
            c.linked_courses.forEach((lc) => expandedIds.add(lc));
          }
        });

        // Also fetch from allDbCourses to make sure links from the other side are fetched
        allDbCourses.forEach((c) => {
          if (c.linked_courses) {
            c.linked_courses.forEach((lc) => {
              if (expandedIds.has(lc)) {
                expandedIds.add(c.course_id);
              }
            });
          }
        });

        const finalCourseIds = Array.from(expandedIds);
        if (finalCourseIds.length > 0) {
          const allEvents = await getEventsForCourses(finalCourseIds);
          if (!cancelled) setEvents(expandRecurringEvents(allEvents, semSettings));
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

    const dateObjEnd = data.end_date ? (
      data.end_date instanceof Date ? data.end_date : (
        data.end_date?.toDate ? data.end_date.toDate() : new Date(data.end_date)
      )
    ) : null;

    const payload = {
      course_id: data.course_id,
      title: data.title || `${data.course_id} ${capitalize(data.type)}`,
      date: Timestamp.fromDate(dateObj),
      ...(dateObjEnd ? { end_date: Timestamp.fromDate(dateObjEnd) } : {}),
      type: data.type,
      note: data.note || '',
      created_by: currentUser.uid,
      subject: data.subject || data.course_id || 'General',
      location: data.location || null,
      recurrenceRule: data.recurrenceRule || null,
      status: data.status || 'confirmed',
      parentEventId: data.parentEventId || null
    };

    const eventId = await firestoreAddEvent(payload);

    // Optimistic update — no full re-fetch needed
    const newAddedEvent = { id: eventId, ...payload };
    setEvents((prev) => expandRecurringEvents([...prev.filter(e => !e.isRecurringInstance), newAddedEvent], semesterSettings));

    return eventId;
  }, [currentUser, semesterSettings]);

  const updateEventInContext = useCallback(async (eventId, updatedData) => {
    if (!currentUser) throw new Error('Must be logged in to update events');
    
    const { updateEvent: firestoreUpdateEvent } = await import('../lib/firestore');
    
    const toUpdate = { ...updatedData };
    if (toUpdate.date) {
      const dateObj = toUpdate.date instanceof Date ? toUpdate.date : (
        toUpdate.date.toDate ? toUpdate.date.toDate() : new Date(toUpdate.date)
      );
      toUpdate.date = Timestamp.fromDate(dateObj);
    }
    if (toUpdate.end_date) {
      const dateObjEnd = toUpdate.end_date instanceof Date ? toUpdate.end_date : (
        toUpdate.end_date.toDate ? toUpdate.end_date.toDate() : new Date(toUpdate.end_date)
      );
      toUpdate.end_date = Timestamp.fromDate(dateObjEnd);
    }
    
    await firestoreUpdateEvent(eventId, toUpdate);
    
    setEvents((prev) => {
      const updatedList = prev.filter(e => !e.isRecurringInstance).map(e => e.id === eventId ? { ...e, ...toUpdate } : e);
      return expandRecurringEvents(updatedList, semesterSettings);
    });
  }, [currentUser, semesterSettings]);

  const deleteEventInContext = useCallback(async (eventId) => {
    if (!currentUser) throw new Error('Must be logged in to delete events');
    
    const { deleteEvent: firestoreDeleteEvent } = await import('../lib/firestore');
    await firestoreDeleteEvent(eventId);
    
    setEvents((prev) => {
      const remainingList = prev.filter(e => !e.isRecurringInstance && e.id !== eventId);
      return expandRecurringEvents(remainingList, semesterSettings);
    });
  }, [currentUser, semesterSettings]);

  const value = {
    events,
    courses,
    courseMap,
    loading,
    activeDegree,
    publicDegree,
    semesterSettings,
    setPublicDegree,
    refreshEvents,
    addNewEvent,
    updateEvent: updateEventInContext,
    deleteEvent: deleteEventInContext
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

