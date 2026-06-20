import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventsContext';
import QuickAddChat from '../components/events/QuickAddChat';
import AddEventModal from '../components/events/AddEventModal';
import InlineAddEventForm from '../components/events/InlineAddEventForm';
import { matchCourse } from '../utils/courseMatcher';
import { parseNaturalLanguageEvent } from '../utils/nlpParser';
import { parseCustomTime } from '../utils/helpers';
import { normalizeText, matchKeywordGroup, detectCreateIntent, KEYWORD_GROUPS } from '../utils/chatMatcher';
import { Calendar, PenLine, MessageSquare, Plus, Sparkles, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

function QueryResult({ queryType, events }) {
  const sortedEvents = [...events].sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return da - db;
  });

  const titleMap = {
    timeline: 'Timeline — All Events',
    exam: 'Upcoming Exams',
    deadline: 'Upcoming Deadlines',
    both: 'Exams & Deadlines',
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--color-text-secondary)] text-sm">
        No {queryType === 'both' ? 'exams or deadlines' : queryType + 's'} found.
      </div>
    );
  }

  return (
    <div className="space-y-3 my-1 min-w-[260px] sm:min-w-[420px]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
        <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {titleMap[queryType] || 'Events'} <span className="text-[var(--color-text-secondary)] font-normal">({sortedEvents.length})</span>
        </h3>
      </div>
      <div className="relative border-l-2 border-[var(--color-border)] pl-4 ml-1 space-y-3">
        {sortedEvents.map((event) => {
          const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
          return (
            <div key={event.id} className="relative group">
              <div className="absolute -left-[21px] mt-1.5 w-2 h-2 rounded-full border-2 border-white bg-[var(--color-accent)] group-hover:scale-125 transition-transform" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--color-surface-hover)] p-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-all">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">{event.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide badge-${event.type}`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                    Course: <span className="font-semibold text-[var(--color-accent)]">{event.course_id}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] text-right shrink-0">
                  <div className="font-semibold text-[var(--color-text-primary)]">{format(eventDate, 'EEE, MMM d')}</div>
                  <div>{format(eventDate, 'h:mm a')}</div>
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
  const { events, courses } = useEvents(); // ← shared context, always in sync
  const [initialInput, setInitialInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text, meta = {}) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);

    // 1. NLP event was just added
    if (meta.addedEvent) {
      const { title, date, type, course_id } = meta.addedEvent;
      const d = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date));
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          sender: 'assistant',
          text: `✅ Added:\n• **${title}**\n• Course: ${course_id}\n• ${format(d, 'EEEE, MMMM d')} at ${format(d, 'h:mm a')}\n• Type: ${type.toUpperCase()}\n\nThe calendar has been updated.`,
        }]);
      }, 500);
      return;
    }

    // 2. Parse Natural Language and check intent
    const parsedData = parseNaturalLanguageEvent(text, courses, matchCourse);
    const normalized = normalizeText(text);

    // Check if it's a request to add/create an event
    const hasSpecificDetails = parsedData && parsedData.courseMatch && parsedData.date;
    const isCreateIntent = detectCreateIntent(normalized) || hasSpecificDetails;

    const isBoth = matchKeywordGroup(normalized, KEYWORD_GROUPS.exam, true) && matchKeywordGroup(normalized, KEYWORD_GROUPS.deadline, true);
    const isTimeline = matchKeywordGroup(normalized, KEYWORD_GROUPS.timeline, true);
    const isExam = matchKeywordGroup(normalized, KEYWORD_GROUPS.exam, true);
    const isDeadline = matchKeywordGroup(normalized, KEYWORD_GROUPS.deadline, true);

    setTimeout(() => {
      let reply;

      if (isCreateIntent) {
        reply = {
          sender: 'assistant',
          type: 'add-event-form',
          initialData: parsedData,
        };
      } else if (isBoth) {
        const filtered = events.filter((e) => e.type === 'exam' || e.type === 'deadline');
        reply = { sender: 'assistant', type: 'query-result', queryType: 'both', events: filtered };
      } else if (isTimeline) {
        reply = { sender: 'assistant', type: 'query-result', queryType: 'timeline', events };
      } else if (isExam) {
        reply = { sender: 'assistant', type: 'query-result', queryType: 'exam', events: events.filter((e) => e.type === 'exam') };
      } else if (isDeadline) {
        reply = { sender: 'assistant', type: 'query-result', queryType: 'deadline', events: events.filter((e) => e.type === 'deadline') };
      } else {
        reply = {
          sender: 'assistant',
          text: `I didn't quite catch that. Try:\n• "timeline" — all events\n• "exams" — all exams\n• "deadlines" — all deadlines\n• "exams and deadlines" — both\n• Or type an event like "CO321 exam Monday at 10 AM"`,
        };
      }

      setMessages((prev) => [...prev, reply]);
    }, 500);
  };

  const promptTemplates = [
    { title: 'View Timeline', description: 'Show all events chronologically', icon: Clock, text: 'timeline' },
    { title: 'Show Exams', description: 'All scheduled exams', icon: PenLine, text: 'exam' },
    { title: 'Show Deadlines', description: 'All upcoming deadlines', icon: Calendar, text: 'deadline' },
    { title: 'Exams & Deadlines', description: 'Both together', icon: MessageSquare, text: 'exams and deadlines' },
  ];

  const handleTemplateClick = (text) => {
    const isQuery = ['timeline', 'exam', 'deadline', 'exams and deadlines'].includes(text.trim().toLowerCase());
    if (isQuery) {
      handleSendMessage(text);
    } else {
      setInitialInput(text);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
        <Sparkles className="w-10 h-10 text-[var(--color-accent)]/40" />
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Please sign in</h2>
        <p className="text-[var(--color-text-secondary)]">You need to be signed in to use the Assistant.</p>
        <Link to="/login" className="px-5 py-2.5 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-sm">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto relative">

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto pb-4 space-y-5 pr-1 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[45vh] py-6">
              {/* Greeting */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3 leading-tight">
                  Hi, <span className="bg-gradient-to-r from-[#4f46e5] to-[#0f62fe] bg-clip-text text-transparent">{userProfile?.name?.split(' ')[0] || 'Student'}</span> 👋
                  <br />What would you like to know?
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Use a quick prompt below, type naturally, or add an event via the form.
                </p>
              </div>

              {/* Prompt Templates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full max-w-3xl mb-6">
                {promptTemplates.map((t, idx) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTemplateClick(t.text)}
                      className="flex flex-col items-start text-left p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)]/40 hover:shadow-md transition-all group"
                    >
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors mb-1">{t.title}</span>
                      <span className="text-xs text-[var(--color-text-secondary)] flex-1 mb-3">{t.description}</span>
                      <div className="p-1.5 bg-[var(--color-bg-base)] rounded-md">
                        <Icon className="w-3.5 h-3.5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add Event CTA card */}
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-3 px-5 py-3 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent-subtle)]/30 transition-all group max-w-sm w-full"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">Add Event via Form</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Use the structured form to add an event</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.sender === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
                    </div>
                  )}
                  <div className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm border ${
                    msg.sender === 'user'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] rounded-tr-sm'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] rounded-tl-sm'
                  }`}>
                    {msg.type === 'query-result' ? (
                      <QueryResult queryType={msg.queryType} events={msg.events} />
                    ) : msg.type === 'add-event-form' ? (
                      <InlineAddEventForm
                        initialData={msg.initialData}
                        onSuccess={(newEvent) => {
                          setMessages((prev) => {
                            const copy = [...prev];
                            const mIdx = copy.findIndex((m) => m === msg);
                            if (mIdx !== -1) {
                              const d = newEvent.date;
                              const parsedT = parseCustomTime(format(d, 'h:mm a'));
                              const timeString = parsedT ? parsedT.formatted12 : format(d, 'h:mm a');
                              copy[mIdx] = {
                                sender: 'assistant',
                                text: `✅ Added:\n• **${newEvent.title}**\n• Course: ${newEvent.course_id}\n• ${format(d, 'EEEE, MMMM d')} at ${timeString}\n• Type: ${newEvent.type.toUpperCase()}\n\nThe calendar has been updated.`,
                              };
                            }
                            return copy;
                          });
                        }}
                        onCancel={() => {
                          setMessages((prev) => prev.filter((m) => m !== msg));
                        }}
                      />
                    ) : (
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {/* Re-trigger add event from within chat */}
              {messages.length > 0 && (
                <div className="flex justify-start pl-8">
                  <button
                    onClick={() => {
                      setPreselectedType(null);
                      setAddModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors py-1 px-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add event via form
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Chat Input */}
        <div className="sticky bottom-0 bg-[var(--color-bg-base)] pt-2 pb-3 z-20 shrink-0 border-t border-[var(--color-border)]/20">
          <QuickAddChat
            key={initialInput}
            initialInput={initialInput}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Add Event Modal — from the "Add Event via Form" card */}
      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setPreselectedType(null);
        }}
        preselectedType={preselectedType}
      />
    </>
  );
}
