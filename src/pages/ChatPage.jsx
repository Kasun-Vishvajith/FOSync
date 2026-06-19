import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QuickAddChat from '../components/events/QuickAddChat';
import { Calendar, PenLine, MessageSquare, Plus, Sparkles } from 'lucide-react';
import { getCoursesForDegree, getEventsForCourses } from '../lib/firestore';
import { format } from 'date-fns';

function QueryResult({ queryType, events }) {
  const sortedEvents = [...events].sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return da - db;
  });

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm">
        No {queryType === 'both' ? 'exams or deadlines' : queryType + 's'} found.
      </div>
    );
  }

  const titleMap = {
    timeline: 'Timeline (All Events)',
    exam: 'Upcoming Exams',
    deadline: 'Upcoming Deadlines',
    both: 'Exams & Deadlines'
  };

  return (
    <div className="space-y-4 my-2 min-w-[280px] sm:min-w-[450px]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
        <Sparkles className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {titleMap[queryType] || 'Events'} ({sortedEvents.length})
        </h3>
      </div>
      <div className="relative border-l-2 border-[var(--color-border)] pl-4 ml-2 space-y-4">
        {sortedEvents.map((event) => {
          const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
          const formattedDate = format(eventDate, 'EEEE, MMM d');
          const formattedTime = format(eventDate, 'h:mm a');
          
          return (
            <div key={event.id} className="relative group">
              {/* Dot on the timeline line */}
              <div className="absolute -left-[23px] mt-1.5 w-2.5 h-2.5 rounded-full border border-[var(--color-surface)] bg-[#0f62fe] group-hover:scale-125 transition-transform" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--color-surface-hover)] p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">{event.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide badge-${event.type}`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                    Course: <span className="font-semibold text-[var(--color-accent)]">{event.course_id}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] text-right shrink-0">
                  <div className="font-semibold text-[var(--color-text-primary)]">{formattedDate}</div>
                  <div>{formattedTime}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { currentUser, userProfile } = useAuth();
  const [initialInput, setInitialInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch degree courses & events
  const loadData = async () => {
    if (!userProfile?.degree) return;
    try {
      const degreeCourses = await getCoursesForDegree(userProfile.degree);
      setCourses(degreeCourses);

      const relevantCourseIds = degreeCourses
        .filter((c) => !c.is_elective || userProfile?.electives?.includes(c.course_id))
        .map((c) => c.course_id);

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
      console.error('Failed to load events in ChatPage:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [userProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text, meta = {}) => {
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text }]);

    // 1. If it was a natural language event added
    if (meta.addedEvent) {
      const { title, date, type, course_id } = meta.addedEvent;
      const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `Added event details:\n• Title: ${title}\n• Course: ${course_id}\n• Date: ${format(d, 'EEEE, MMMM d, yyyy')} at ${format(d, 'h:mm a')}\n• Type: ${type.toUpperCase()}`
        }]);
        loadData();
      }, 500);
      return;
    }

    // 2. Query command matching
    const cleanInput = text.trim().toLowerCase();
    const isBoth = cleanInput.includes('exams and deadlines') || 
                   cleanInput.includes('exams and deadlinesa') || 
                   (cleanInput.includes('exam') && cleanInput.includes('deadline'));
    const isTimeline = cleanInput.includes('timeline') || cleanInput.includes('timleine');
    const isExam = cleanInput.includes('exam');
    const isDeadline = cleanInput.includes('deadline') || cleanInput.includes('due');

    setTimeout(() => {
      let reply = { sender: 'assistant' };

      if (isBoth) {
        const filtered = events.filter(e => e.type === 'exam' || e.type === 'deadline');
        reply = {
          ...reply,
          type: 'query-result',
          queryType: 'both',
          events: filtered
        };
      } else if (isTimeline) {
        reply = {
          ...reply,
          type: 'query-result',
          queryType: 'timeline',
          events: events
        };
      } else if (isExam) {
        const filtered = events.filter(e => e.type === 'exam');
        reply = {
          ...reply,
          type: 'query-result',
          queryType: 'exam',
          events: filtered
        };
      } else if (isDeadline) {
        const filtered = events.filter(e => e.type === 'deadline');
        reply = {
          ...reply,
          type: 'query-result',
          queryType: 'deadline',
          events: filtered
        };
      } else {
        reply = {
          ...reply,
          text: `I didn't quite catch that request. Try typing:
• "timeline" - view all events
• "exam" - view all exams
• "deadline" - view all deadlines
• "exams and deadlines" - view both
• Or write: "CO321 exam tomorrow at 10 AM" to add an event.`
        };
      }
      setMessages(prev => [...prev, reply]);
    }, 600);
  };

  const promptTemplates = [
    {
      title: "View Timeline",
      description: "Show all events chronologically",
      icon: <MessageSquare className="w-4 h-4 text-gray-500" />,
      text: "timeline"
    },
    {
      title: "Show Exams",
      description: "Show all scheduled exams",
      icon: <PenLine className="w-4 h-4 text-gray-500" />,
      text: "exam"
    },
    {
      title: "Show Deadlines",
      description: "Show all upcoming deadlines",
      icon: <Calendar className="w-4 h-4 text-gray-500" />,
      text: "deadline"
    },
    {
      title: "Exams & Deadlines",
      description: "Show exams and deadlines together",
      icon: <Plus className="w-4 h-4 text-gray-500" />,
      text: "exams and deadlines"
    }
  ];

  const handleTemplateClick = (text) => {
    const cleanText = text.trim().toLowerCase();
    const isDirectQuery = ['timeline', 'timleine', 'exam', 'deadline', 'exams and deadlines', 'exams and deadlinesa'].includes(cleanText);
    if (isDirectQuery) {
      handleSendMessage(text);
    } else {
      setInitialInput(text);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Please sign in</h2>
        <p className="text-[var(--color-text-secondary)] mt-2">You need to be signed in to use the Assistant.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto relative px-2">
      
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-6 pr-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] py-8">
            {/* Noera-style Greeting */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4 leading-tight">
                Hi there, <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{userProfile?.name?.split(' ')[0] || 'Student'}</span><br/>
                What would you like to know?
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm md:text-base font-medium">
                Use one of the most common prompts below or use your own to begin
              </p>
            </div>

            {/* Prompt Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl mb-8">
              {promptTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTemplateClick(template.text)}
                  className="flex flex-col items-start text-left p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[#0f62fe] hover:shadow-md transition-all group"
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[#0f62fe] transition-colors">{template.title}</span>
                  <span className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4 flex-1">{template.description}</span>
                  <div className="mt-auto p-1.5 bg-[var(--color-bg-base)] rounded-md">
                    {template.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm border ${
                  msg.sender === 'user'
                    ? 'bg-[#0f62fe] text-white border-[#0f62fe] rounded-tr-none'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] rounded-tl-none'
                }`}>
                  {msg.type === 'query-result' ? (
                    <QueryResult queryType={msg.queryType} events={msg.events} />
                  ) : (
                    <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Chat Box at bottom */}
      <div className="sticky bottom-0 bg-[var(--color-bg-base)] pt-2 pb-4 z-20 shrink-0 border-t border-[var(--color-border)]/20">
        <QuickAddChat
          key={initialInput}
          initialInput={initialInput}
          onSendMessage={handleSendMessage}
          onEventAdded={loadData}
        />
      </div>

    </div>
  );
}
