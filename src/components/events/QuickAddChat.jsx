import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Calendar, BookOpen, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { getAllCourses, addEvent } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { matchCourse } from '../../utils/courseMatcher';
import { parseNaturalLanguageEvent } from '../../utils/nlpParser';
import { format } from 'date-fns';
import Button from '../ui/Button';

export default function QuickAddChat({ onEventAdded }) {
  const { userProfile } = useAuth();
  const [inputStr, setInputStr] = useState('');
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

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!inputStr.trim() || !parsedData || !parsedData.courseMatch) return;

    setIsAdding(true);
    try {
      await addEvent({
        title: parsedData.title,
        date: parsedData.date,
        type: parsedData.type,
        course_id: parsedData.courseMatch.course.course_id,
        created_by: userProfile?.id || 'System',
      });
      
      // Success feedback
      setInputStr('');
      setParsedData(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      if (onEventAdded) onEventAdded();
    } catch (error) {
      console.error("Error adding event:", error);
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
        <div className="flex items-end gap-2 relative z-0">
          <textarea
            ref={inputRef}
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g., DSC 321 exam next friday at 2pm"
            className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] resize-none py-3 px-4 min-h-[44px] max-h-32 focus:outline-none"
            rows={1}
            style={{
               height: inputStr.length > 50 ? 'auto' : '44px'
            }}
          />
          <div className="pb-1 pr-1">
             <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSubmit} 
                className="rounded-full w-10 h-10 !p-0 flex items-center justify-center shrink-0 disabled:bg-[var(--color-surface-hover)] disabled:text-[var(--color-text-secondary)]"
                disabled={!parsedData || !parsedData.courseMatch || isAdding || !inputStr.trim()}
             >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             </Button>
          </div>
        </div>
      </div>
      <div className="text-center mt-2">
         <p className="text-xs text-[var(--color-text-secondary)]">
            Powered by QuickAdd. Use natural language to schedule your events.
         </p>
      </div>
    </div>
  );
}
