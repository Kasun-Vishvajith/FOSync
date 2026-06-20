import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Calendar, BookOpen, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { getAllCourses } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventsContext';
import { matchCourse } from '../../utils/courseMatcher';
import { parseNaturalLanguageEvent } from '../../utils/nlpParser';
import { normalizeText, matchKeywordGroup, KEYWORD_GROUPS } from '../../utils/chatMatcher';
import { format } from 'date-fns';
import Button from '../ui/Button';

export default function QuickAddChat({ onSendMessage, initialInput = '' }) {
  const { userProfile } = useAuth();
  const { addNewEvent } = useEvents();
  const [inputStr, setInputStr] = useState(initialInput);
  const [courses, setCourses] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef(null);

  // Load all courses for matching
  useEffect(() => {
    async function fetchCourses() {
      const all = await getAllCourses();
      setCourses(all);
    }
    fetchCourses();
  }, []);

  // Debounced parsing
  useEffect(() => {
    if (!inputStr.trim() || courses.length === 0) {
      setParsedData(null);
      return;
    }

    const timer = setTimeout(() => {
      const data = parseNaturalLanguageEvent(inputStr, courses, matchCourse);
      setParsedData(data);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [inputStr, courses]);

  const checkIsQuery = (str) => {
    const normalized = normalizeText(str);
    return matchKeywordGroup(normalized, KEYWORD_GROUPS.timeline, true) ||
           matchKeywordGroup(normalized, KEYWORD_GROUPS.exam, true) ||
           matchKeywordGroup(normalized, KEYWORD_GROUPS.deadline, true);
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!inputStr.trim()) return;

    const trimmedInput = inputStr.trim();
    if (checkIsQuery(trimmedInput)) {
      if (onSendMessage) {
        onSendMessage(trimmedInput);
      }
      setInputStr('');
      setParsedData(null);
      return;
    }

    if (!parsedData || !parsedData.courseMatch || !parsedData.date) return;

    setIsAdding(true);
    try {
      await addNewEvent({
        title: parsedData.title,
        date: parsedData.date,
        type: parsedData.type,
        course_id: parsedData.courseMatch.course.course_id,
      });
      
      if (onSendMessage) {
        onSendMessage(trimmedInput, {
          addedEvent: {
            title: parsedData.title,
            date: parsedData.date,
            type: parsedData.type,
            course_id: parsedData.courseMatch.course.course_id,
          }
        });
      }
      
      // Success feedback
      setInputStr('');
      setParsedData(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsAdding(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleAppend(text) {
    setInputStr(prev => {
      // 1. If it's a course suggestion
      const isCourse = courses.some(c => c.course_id === text);
      if (isCourse) {
        const courseRegex = new RegExp(courses.map(c => c.course_id).join('|'), 'i');
        if (courseRegex.test(prev)) {
          return prev.replace(courseRegex, text);
        }
        return `${text} ${prev}`.trim();
      }

      // 2. If it's a date suggestion
      const datePills = ['Today', 'Tomorrow', 'Next Monday', 'Next Friday'];
      if (datePills.includes(text)) {
        const dateRegex = new RegExp(datePills.join('|'), 'i');
        if (dateRegex.test(prev)) {
          return prev.replace(dateRegex, text);
        }
        return `${prev} ${text}`.trim();
      }

      // 3. If it's a time suggestion
      const timePills = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'];
      if (timePills.includes(text)) {
        const timeRegex = new RegExp(timePills.map(t => t.replace(' ', '\\s*')).join('|'), 'i');
        if (timeRegex.test(prev)) {
          return prev.replace(timeRegex, text);
        }
        return `${prev} at ${text}`.trim();
      }

      return `${prev} ${text}`.trim();
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  // Helper to render type pill
  const renderTypePill = (type) => {
    const colors = {
      lecture: 'bg-[#e5f0ff] text-[#0f62fe]',
      exam: 'bg-[#ffe6e8] text-[#da1e28]',
      deadline: 'bg-[#fff8e1] text-[#f1c21b]'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-[var(--radius-sm)] font-medium ${colors[type] || colors.lecture}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const isQuery = checkIsQuery(inputStr);
  const canSubmit = inputStr.trim().length > 0 && (isQuery || (parsedData && parsedData.courseMatch && parsedData.date));

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 mb-4 animate-slide-up relative">
      {/* Absolute Success Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm rounded-[var(--radius-xl)] animate-fade-in border border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-[#059669] font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Event Added Successfully!
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft)] p-2 transition-all duration-300 focus-within:shadow-[var(--shadow-hover)] focus-within:border-[var(--color-accent)]">
        
        {/* AI Assistant Area (Suggestions) Rendered ON TOP of input */}
        {inputStr.trim().length > 0 && parsedData && (!parsedData.courseMatch || !parsedData.date || !parsedData.hasTime) && (
          <div className="px-4 py-3 bg-[var(--color-bg-base)]/50 border-b border-[var(--color-border)] rounded-t-[var(--radius-xl)] mb-2">
            {!parsedData.courseMatch ? (
              <div className="animate-fade-in space-y-2.5">
                <p className="text-xs font-semibold text-[#0f62fe]">Which course is this for?</p>
                <div className="flex flex-wrap gap-2">
                  {courses.slice(0, 6).map(c => (
                    <button 
                      key={c.course_id}
                      onClick={() => handleAppend(c.course_id)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[#0f62fe] hover:text-[#0f62fe] transition-colors shadow-sm"
                    >
                      {c.course_id}
                    </button>
                  ))}
                </div>
              </div>
            ) : !parsedData.date ? (
              <div className="animate-fade-in space-y-2.5">
                <p className="text-xs font-semibold text-[#0f62fe]">When is this happening?</p>
                <div className="flex flex-wrap gap-2">
                  {['Today', 'Tomorrow', 'Next Monday', 'Next Friday'].map(d => (
                    <button 
                      key={d}
                      onClick={() => handleAppend(d)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[#0f62fe] hover:text-[#0f62fe] transition-colors shadow-sm"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : !parsedData.hasTime ? (
              <div className="animate-fade-in space-y-2.5">
                <p className="text-xs font-semibold text-[#0f62fe]">What time?</p>
                <div className="flex flex-wrap gap-2">
                  {['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'].map(t => (
                    <button 
                      key={t}
                      onClick={() => handleAppend(t)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[#0f62fe] hover:text-[#0f62fe] transition-colors shadow-sm"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Preview Area */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${parsedData ? 'max-h-32 opacity-100 p-3 pb-1' : 'max-h-0 opacity-0 p-0'}
        `}>
          {parsedData && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-[var(--color-text-primary)] font-medium bg-[var(--color-surface-hover)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                {parsedData.title}
              </div>

              {parsedData.courseMatch ? (
                 <div className="flex items-center gap-1.5 bg-[#e5f0ff] text-[#0f62fe] px-2.5 py-1 rounded-[var(--radius-md)]">
                    <BookOpen className="w-3.5 h-3.5" />
                    {parsedData.courseMatch.course.course_id}
                 </div>
              ) : (
                 <div className="flex items-center gap-1.5 bg-[#ffe6e8] text-[#da1e28] px-2.5 py-1 rounded-[var(--radius-md)]">
                    <BookOpen className="w-3.5 h-3.5" />
                    Course Required
                 </div>
              )}

              <div className="flex items-center gap-1.5 bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                <Calendar className="w-3.5 h-3.5" />
                {parsedData.date ? format(parsedData.date, 'MMM d') : 'No Date'}
              </div>

               <div className="flex items-center gap-1.5 bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                <Clock className="w-3.5 h-3.5" />
                {parsedData.date ? format(parsedData.date, 'h:mm a') : 'All Day'}
              </div>

              {renderTypePill(parsedData.type)}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex flex-col relative z-0 p-1">
          <div className="flex items-start">
            <textarea
              ref={inputRef}
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask whatever you want...."
              className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] resize-none py-2 px-3 min-h-[44px] max-h-32 focus:outline-none"
              rows={1}
              style={{
                 height: inputStr.length > 50 ? 'auto' : '44px'
              }}
            />
            <div className="shrink-0 pt-2 pr-2">
               <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-border)]">
                 <span className="w-3.5 h-3.5 rounded-full border border-current opacity-70 grid place-items-center">
                   <div className="w-1 h-1 bg-current rounded-full" />
                 </span>
                 Smart Add
               </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 px-3 pb-1">
             <div className="flex items-center gap-5 text-xs font-semibold text-[var(--color-text-secondary)]">
                <button className="flex items-center gap-1.5 hover:text-[var(--color-text-primary)] transition-colors">
                  <span className="text-base leading-none mb-0.5">+</span> Add Details
                </button>
                <button className="flex items-center gap-1.5 hover:text-[var(--color-text-primary)] transition-colors">
                  <Calendar className="w-3.5 h-3.5" /> Pick Date
                </button>
             </div>
             
             <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {inputStr.length}/100
                </span>
                <button 
                  onClick={handleSubmit} 
                  className="rounded-full w-8 h-8 flex items-center justify-center shrink-0 bg-[#0f62fe] text-white hover:bg-[#0353e9] transition-all disabled:opacity-50 disabled:bg-[var(--color-surface-hover)] disabled:text-[var(--color-text-secondary)] shadow-sm"
                  disabled={!canSubmit || isAdding}
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-lg leading-none transform translate-y-[0px] font-medium">&rarr;</span>}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
