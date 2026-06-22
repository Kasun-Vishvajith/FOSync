import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventsContext';
import { getTimetable } from '../lib/firestore';
import { Clock, MapPin, AlertCircle, Link2 } from 'lucide-react';
import { parseCustomTime, getCourseColor, capitalize } from '../utils/helpers';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const TIMETABLE_HOURS = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 8;
  return {
    hour,
    label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
  };
});

export default function TimetablePage() {
  const { userProfile } = useAuth();
  const { semesterSettings, courseMap } = useEvents();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentDecimal = currentHour + currentMinute / 60;
  const currentDayIndex = currentTime.getDay();
  const isWeekday = currentDayIndex >= 1 && currentDayIndex <= 5;
  const showTimeLine = isWeekday && currentDecimal >= 8 && currentDecimal <= 19;
  const timeLineTop = (currentDecimal - 8) * 80;

  const getWeekDayDate = (dayName) => {
    const dayIndices = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
    const targetIndex = dayIndices[dayName];
    const todayIndex = currentTime.getDay();
    const diff = targetIndex - todayIndex;
    const date = new Date(currentTime);
    date.setDate(currentTime.getDate() + diff);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isToday = (dayName) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[currentTime.getDay()] === dayName;
  };

  // Compute student year
  let computedYear = '3';
  if (userProfile?.batch && semesterSettings?.batch_year) {
    const studentStart = parseInt(userProfile.batch.split('/')[0], 10);
    const systemStart = parseInt(semesterSettings.batch_year.split('/')[0], 10);
    if (!isNaN(studentStart) && !isNaN(systemStart)) {
      computedYear = String(Math.max(3, Math.min(4, 4 - (studentStart - systemStart))));
    }
  }

  const currentSem = semesterSettings?.current_semester || '1';

  useEffect(() => {
    async function loadTimetable() {
      if (!userProfile?.degree || !currentSem || !computedYear) {
        setLoading(false);
        return;
      }
      try {
        const data = await getTimetable(userProfile.degree, currentSem, computedYear);
        setSlots(data);
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, [userProfile?.degree, currentSem, computedYear]);

  // Group and sort slots by day
  const slotsByDay = {};
  DAYS.forEach(day => {
    const daySlots = slots.filter(s => s.day === day);
    
    // Sort and calculate columns for overlapping classes in the timetable
    const sorted = [...daySlots].sort((a, b) => {
      const pa = parseCustomTime(a.start_time);
      const pb = parseCustomTime(b.start_time);
      if (!pa || !pb) return 0;
      return (pa.hours + pa.minutes / 60) - (pb.hours + pb.minutes / 60);
    });

    const columns = [];
    sorted.forEach(slot => {
      const pa = parseCustomTime(slot.start_time);
      const pb = parseCustomTime(slot.end_time);
      if (!pa || !pb) return;
      const start = pa.hours + pa.minutes / 60;
      const end = pb.hours + pb.minutes / 60;

      let colIndex = 0;
      while (colIndex < columns.length) {
        const hasOverlap = columns[colIndex].some(other => {
          const opa = parseCustomTime(other.start_time);
          const opb = parseCustomTime(other.end_time);
          if (!opa || !opb) return false;
          const oStart = opa.hours + opa.minutes / 60;
          const oEnd = opb.hours + opb.minutes / 60;
          return start < oEnd && end > oStart;
        });
        if (!hasOverlap) break;
        colIndex++;
      }
      if (!columns[colIndex]) {
        columns[colIndex] = [];
      }
      columns[colIndex].push(slot);
      slot.colIndex = colIndex;
    });

    sorted.forEach(slot => {
      const pa = parseCustomTime(slot.start_time);
      const pb = parseCustomTime(slot.end_time);
      if (!pa || !pb) return;
      const start = pa.hours + pa.minutes / 60;
      const end = pb.hours + pb.minutes / 60;

      let maxColIndex = 0;
      sorted.forEach(other => {
        const opa = parseCustomTime(other.start_time);
        const opb = parseCustomTime(other.end_time);
        if (!opa || !opb) return;
        const oStart = opa.hours + opa.minutes / 60;
        const oEnd = opb.hours + opb.minutes / 60;
        if (start < oEnd && end > oStart) {
          if (other.colIndex > maxColIndex) {
            maxColIndex = other.colIndex;
          }
        }
      });
      slot.colCount = maxColIndex + 1;
    });

    slotsByDay[day] = sorted;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight mb-2 flex items-center gap-2">
            <Clock className="w-8 h-8 text-[var(--color-primary)]" />
            Weekly Class Timetable
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-lg">
            {userProfile?.degree} — Year {computedYear} (Semester {currentSem})
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 h-[600px] animate-pulse border border-[var(--color-surface-container)]" />
      ) : (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-[var(--color-surface-container)] flex flex-col overflow-hidden">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[800px] flex flex-col">
              
              {/* Grid Header */}
              <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-[var(--color-surface-container)]">
                <div className="py-3" /> {/* Time column spacer */}
                {DAYS.map((day) => {
                  const today = isToday(day);
                  return (
                    <div 
                      key={day} 
                      className={`py-3 text-center border-l border-[var(--color-surface-container)] transition-all ${
                        today ? 'bg-[var(--color-primary)]/[0.04] border-b-2 border-b-[var(--color-primary)]' : ''
                      }`}
                    >
                      <p className={`text-sm font-bold ${today ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}`}>
                        {day}
                      </p>
                      <p className="text-[10px] text-[var(--color-outline)] font-semibold mt-0.5">
                        {getWeekDayDate(day)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="grid grid-cols-[80px_1fr] relative h-[880px]">
                {/* Hour Labels Column */}
                <div className="flex flex-col select-none">
                  {TIMETABLE_HOURS.map((slot) => (
                    <div key={slot.hour} className="h-20 flex items-start justify-end pr-4 pt-1 border-b border-[var(--color-surface-container)]">
                      <span className="text-xs text-[var(--color-outline-variant)] font-semibold">
                        {slot.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                <div className="grid grid-cols-5 relative h-full border-r border-[var(--color-surface-container)]">
                  {showTimeLine && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-[var(--color-primary)] z-20 flex items-center pointer-events-none"
                      style={{ top: `${timeLineTop}px` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] -ml-1.25 shadow-[0_0_8px_var(--color-primary)]" />
                      <div className="bg-[var(--color-primary)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md -mt-4.5 ml-1">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                  {DAYS.map((day) => {
                    const daySlots = slotsByDay[day] || [];
                    const today = isToday(day);
                    return (
                      <div
                        key={day}
                        className={`relative h-full border-l border-[var(--color-surface-container)] transition-all ${
                          today ? 'bg-[var(--color-primary)]/[0.015]' : ''
                        }`}
                      >
                        {/* Background cell grids */}
                        {TIMETABLE_HOURS.map((slot) => (
                          <div
                            key={`${day}-${slot.hour}`}
                            className="h-20 border-b border-[var(--color-surface-container)]"
                          />
                        ))}

                        {/* Absolute positioned slots */}
                        {daySlots.map((slot) => {
                          const parsedStart = parseCustomTime(slot.start_time);
                          const parsedEnd = parseCustomTime(slot.end_time);
                          if (!parsedStart || !parsedEnd) return null;

                          const startDecimal = parsedStart.hours + parsedStart.minutes / 60;
                          const endDecimal = parsedEnd.hours + parsedEnd.minutes / 60;

                          // Only render slots within 8 AM to 7 PM
                          if (startDecimal < 8 || endDecimal > 19) return null;

                          const top = (startDecimal - 8) * 80;
                          const height = Math.max(30, (endDecimal - startDecimal) * 80);

                          const colCount = slot.colCount || 1;
                          const colIndex = slot.colIndex || 0;
                          const width = 100 / colCount;
                          const left = colIndex * width;

                          const courseInfo = courseMap?.[slot.course_id];
                          const courseName = courseInfo?.aliases?.[0] || '';
                          const colors = getCourseColor(slot.course_id);

                          return (
                            <div
                              key={slot.id}
                              className="absolute px-3 py-2 rounded-2xl text-xs font-semibold overflow-hidden transition-all duration-150 border flex flex-col justify-start items-start text-left hover:scale-[1.01] hover:shadow-md cursor-pointer group"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `calc(${left}% + 4px)`,
                                width: `calc(${width}% - 8px)`,
                                zIndex: 5,
                                backgroundColor: colors.bg,
                                borderColor: colors.border,
                                color: colors.text,
                              }}
                            >
                              <div className="absolute left-0 top-0 w-1 h-full" style={{ backgroundColor: colors.bar }} />
                              <span className="font-bold block truncate w-full pl-1 transition-colors">
                                {slot.course_id}
                                {slot.class_type && ` (${capitalize(slot.class_type)})`}
                              </span>
                              {courseName && (
                                <span className="text-[10px] opacity-90 block truncate w-full pl-1 font-semibold">
                                  {courseName}
                                </span>
                              )}
                              
                              {height >= 50 && (
                                <span className="text-[10px] opacity-80 block truncate mt-0.5 w-full pl-1 flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              )}
                              
                              {height >= 48 && (
                                 <>
                                   {slot.delivery_mode === 'online' && slot.link ? (
                                     <a
                                       href={slot.link.startsWith('http') ? slot.link : `https://${slot.link}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="mt-auto w-full py-1.5 rounded-lg text-white text-[10px] font-bold text-center flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                                       style={{ backgroundColor: colors.bar }}
                                       onClick={(e) => e.stopPropagation()}
                                     >
                                       <Link2 className="w-3.5 h-3.5 shrink-0 text-white" />
                                       Join Class
                                     </a>
                                   ) : slot.location ? (
                                     <span className="text-[11px] opacity-90 block truncate mt-1 w-full pl-1 flex items-center gap-1 font-bold">
                                       <MapPin className="w-3.5 h-3.5 shrink-0" />
                                       {slot.location}
                                     </span>
                                   ) : null}
                                 </>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
          
          {slots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--color-outline)] opacity-60">
              <AlertCircle className="w-10 h-10 mb-2 text-[var(--color-primary)]" />
              <p className="text-sm font-semibold">No classes scheduled for your degree and semester settings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
