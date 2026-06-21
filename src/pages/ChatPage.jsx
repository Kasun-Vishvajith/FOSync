import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventsContext';
import QuickAddChat from '../components/events/QuickAddChat';
import AddEventModal from '../components/events/AddEventModal';
import InlineAddEventForm from '../components/events/InlineAddEventForm';
import { matchCourse } from '../utils/courseMatcher';
import { parseNaturalLanguageEvent } from '../utils/nlpParser';
import { normalizeText, matchKeywordGroup, KEYWORD_GROUPS, detectUpdateIntent, detectDeleteIntent, detectConversationalControl } from '../utils/chatMatcher';
import { Calendar, PenLine, MessageSquare, Plus, Sparkles, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import * as chrono from 'chrono-node';

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

function formatMessageText(text) {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function ChatPage() {
  const { currentUser, userProfile } = useAuth();
  const { events, courses, addNewEvent, updateEvent, deleteEvent } = useEvents();
  const [initialInput, setInitialInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkCollision = (newEvent, excludeEventId = null) => {
    const newStart = newEvent.date instanceof Date ? newEvent.date : (newEvent.date?.toDate ? newEvent.date.toDate() : new Date(newEvent.date));
    const newEnd = newEvent.end_date 
      ? (newEvent.end_date instanceof Date ? newEvent.end_date : (newEvent.end_date?.toDate ? newEvent.end_date.toDate() : new Date(newEvent.end_date)))
      : new Date(newStart.getTime() + 60 * 60 * 1000);

    for (const existing of events) {
      if (excludeEventId && existing.id === excludeEventId) continue;
      
      const extStart = existing.date?.toDate ? existing.date.toDate() : new Date(existing.date);
      const extEnd = existing.end_date 
        ? (existing.end_date?.toDate ? existing.end_date.toDate() : new Date(existing.end_date))
        : new Date(extStart.getTime() + 60 * 60 * 1000);

      const overlaps = newStart < extEnd && newEnd > extStart;
      if (overlaps) {
        return existing;
      }
    }
    return null;
  };

  const findTargetEvents = (normalizedText, parsedData) => {
    let candidates = [...events];
    
    if (/\blast\b/i.test(normalizedText)) {
      const lastAddedId = localStorage.getItem('lastAddedEventId');
      if (lastAddedId) {
        const found = events.find(e => e.id === lastAddedId);
        if (found) return [found];
      }
    }
    
    if (parsedData && parsedData.courseMatch) {
      candidates = candidates.filter(e => e.course_id.toLowerCase() === parsedData.courseMatch.course.course_id.toLowerCase());
    }
    
    let selectedCategory = null;
    if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.exam, true)) selectedCategory = 'exam';
    else if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.deadline, true)) selectedCategory = 'deadline';
    else if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.lecture, true)) selectedCategory = 'lecture';
    else if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.practical, true)) selectedCategory = 'practical';
    else if (matchKeywordGroup(normalizedText, KEYWORD_GROUPS.tutorial, true)) selectedCategory = 'tutorial';
    
    if (selectedCategory) {
      candidates = candidates.filter(e => e.type === selectedCategory);
    }
    
    const dateResults = chrono.parse(normalizedText, new Date());
    if (dateResults && dateResults.length > 0) {
      const refDate = dateResults[0].start.date();
      candidates = candidates.filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return d.getFullYear() === refDate.getFullYear() &&
               d.getMonth() === refDate.getMonth() &&
               d.getDate() === refDate.getDate();
      });
    }
    
    if (parsedData && parsedData.title && parsedData.title !== 'New Event') {
      candidates = candidates.filter(e => {
        const tLower = e.title.toLowerCase();
        const pLower = parsedData.title.toLowerCase();
        return tLower.includes(pLower) || pLower.includes(tLower);
      });
    }
    
    return candidates;
  };

  const handleSelectEventType = async (pendingEvent, selectedType, msgIndex) => {
    const eventData = {
      course_id: pendingEvent.courseMatch.course.course_id,
      title: pendingEvent.title || `${pendingEvent.courseMatch.course.course_id} ${selectedType.toUpperCase()}`,
      date: pendingEvent.date,
      end_date: pendingEvent.end_date,
      type: selectedType,
      note: pendingEvent.note || '',
      location: pendingEvent.location,
      recurrenceRule: pendingEvent.recurrenceRule
    };

    const collisionResult = checkCollision(eventData);
    if (collisionResult) {
      setPendingAction({ type: 'create', data: eventData });
      setMessages((prev) => {
        const copy = [...prev];
        copy[msgIndex] = {
          sender: 'assistant',
          text: `⚠️ **Collision Warning**: This overlaps with core course **${collisionResult.title}** (${collisionResult.course_id}) from ${format(collisionResult.date?.toDate ? collisionResult.date.toDate() : new Date(collisionResult.date), 'h:mm a')}. Add anyway? (Yes/No)`
        };
        return copy;
      });
      return;
    }

    try {
      const eventId = await addNewEvent(eventData);
      localStorage.setItem('lastAddedEventId', eventId);
      setMessages((prev) => {
        const copy = [...prev];
        copy[msgIndex] = {
          sender: 'assistant',
          text: `✅ Successfully added the event:\n• **${eventData.title}**\n• Course: ${eventData.course_id}\n• Type: ${selectedType.toUpperCase()}\n• Date: ${format(eventData.date, 'EEEE, MMMM d')} at ${format(eventData.date, 'h:mm a')}`
        };
        return copy;
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        copy[msgIndex] = {
          sender: 'assistant',
          text: `❌ Failed to add event.`
        };
        return copy;
      });
    }
  };

  const handleSendMessage = async (text) => {
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    const normalized = normalizeText(text);

    const controlIntent = detectConversationalControl(normalized);
    if (controlIntent) {
      if (pendingAction) {
        if (controlIntent === 'yes') {
          try {
            if (pendingAction.type === 'create') {
              const eventId = await addNewEvent(pendingAction.data);
              localStorage.setItem('lastAddedEventId', eventId);
              setMessages((prev) => [...prev, {
                sender: 'assistant',
                text: `✅ Successfully added the event:\n• **${pendingAction.data.title}**\n• Course: ${pendingAction.data.course_id}`
              }]);
            } else if (pendingAction.type === 'update') {
              await updateEvent(pendingAction.eventId, pendingAction.data);
              setMessages((prev) => [...prev, {
                sender: 'assistant',
                text: `✅ Event updated successfully.`
              }]);
            } else if (pendingAction.type === 'delete') {
              if (pendingAction.isBulk) {
                for (const ev of pendingAction.events) {
                  await deleteEvent(ev.id);
                }
                setMessages((prev) => [...prev, {
                  sender: 'assistant',
                  text: `✅ Successfully deleted/cancelled ${pendingAction.events.length} events.`
                }]);
              } else {
                await deleteEvent(pendingAction.eventId);
                setMessages((prev) => [...prev, {
                  sender: 'assistant',
                  text: `✅ Event deleted/cancelled successfully.`
                }]);
              }
            }
          } catch (err) {
            console.error(err);
            setMessages((prev) => [...prev, {
              sender: 'assistant',
              text: `❌ Operation failed.`
            }]);
          }
          setPendingAction(null);
        } else if (controlIntent === 'no') {
          setMessages((prev) => [...prev, {
            sender: 'assistant',
            text: `❌ Action cancelled.`
          }]);
          setPendingAction(null);
        }
        return;
      } else if (controlIntent === 'help') {
        setMessages((prev) => [...prev, {
          sender: 'assistant',
          text: `Here are some commands you can try:\n\n` +
                `**Add / Create Event:**\n` +
                `• "Add DBMS lecture tomorrow at 9am in Room 204"\n` +
                `• "Schedule OOP lab Friday 2pm for 2 hours"\n\n` +
                `**View Schedule:**\n` +
                `• "Show all exams"\n` +
                `• "What's due this week"\n` +
                `• "List my labs tomorrow"\n\n` +
                `**Edit / Reschedule:**\n` +
                `• "Reschedule tomorrow's lecture to 3pm"\n` +
                `• "Move DBMS exam to next Monday"\n` +
                `• "Change the lab duration to 2 hours"\n\n` +
                `**Delete / Cancel:**\n` +
                `• "Cancel Friday's exam"\n` +
                `• "Delete my 9am lecture"\n` +
                `• "Remove all deadlines this week"\n\n` +
                `**Recurring Events:**\n` +
                `• "Add DBMS lecture every Monday 9am for 12 weeks"`
        }]);
        return;
      }
    }

    if (pendingAction) setPendingAction(null);

    const parsedData = parseNaturalLanguageEvent(text, courses, matchCourse);
    
    if (parsedData && parsedData.isMultiEvent) {
      let successCount = 0;
      for (const ev of parsedData.events) {
        if (ev.courseMatch && ev.date) {
          const col = checkCollision(ev);
          if (!col) {
            const eventId = await addNewEvent({
              course_id: ev.courseMatch.course.course_id,
              title: ev.title,
              date: ev.date,
              end_date: ev.end_date,
              type: ev.type,
              location: ev.location,
              recurrenceRule: ev.recurrenceRule
            });
            localStorage.setItem('lastAddedEventId', eventId);
            successCount++;
          }
        }
      }
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          sender: 'assistant',
          text: `✅ Added ${successCount} events from multi-event phrase.`
        }]);
      }, 500);
      return;
    }

    const isUpdateIntent = detectUpdateIntent(normalized);
    const isDeleteIntent = detectDeleteIntent(normalized);
    const isViewIntent = matchKeywordGroup(normalized, KEYWORD_GROUPS.viewAction, true) ||
                         matchKeywordGroup(normalized, KEYWORD_GROUPS.timeline, true) ||
                         matchKeywordGroup(normalized, KEYWORD_GROUPS.exam, true) ||
                         matchKeywordGroup(normalized, KEYWORD_GROUPS.deadline, true);

    setTimeout(async () => {
      let reply;

      if (isUpdateIntent) {
        const candidates = findTargetEvents(normalized, parsedData);
        if (candidates.length === 0) {
          reply = {
            sender: 'assistant',
            text: `❌ I couldn't find any matching event to update. Please specify the course, date, or title.`
          };
        } else if (candidates.length > 1) {
          reply = {
            sender: 'assistant',
            text: `⚠️ Multiple matches found for update. Please be more specific:\n` +
                  candidates.map((c, i) => `${i+1}. **${c.title}** (${format(c.date?.toDate ? c.date.toDate() : new Date(c.date), 'MMM d')})`).join('\n')
          };
        } else {
          const target = candidates[0];
          const updated = {
            title: (parsedData.title && parsedData.title !== 'New Event') ? parsedData.title : target.title,
            date: parsedData.date || target.date,
            end_date: parsedData.end_date || target.end_date,
            location: parsedData.location || target.location,
            recurrenceRule: parsedData.recurrenceRule || target.recurrenceRule,
            type: parsedData.hasType ? parsedData.type : target.type
          };
          setPendingAction({ type: 'update', eventId: target.id, data: updated });
          reply = {
            sender: 'assistant',
            text: `Do you want to update **${target.title}** to happen on **${format(updated.date, 'EEEE, MMMM d')} at ${format(updated.date, 'h:mm a')}**? (Yes/No)`
          };
        }
      } else if (isDeleteIntent) {
        const candidates = findTargetEvents(normalized, parsedData);
        if (candidates.length === 0) {
          reply = {
            sender: 'assistant',
            text: `❌ I couldn't find any matching event to delete.`
          };
        } else if (candidates.length > 1) {
          const isBulk = /\ball\b/i.test(normalized);
          if (isBulk) {
            setPendingAction({ type: 'delete', isBulk: true, events: candidates });
            reply = {
              sender: 'assistant',
              text: `Are you sure you want to delete all ${candidates.length} matching events?\n` +
                    candidates.map(c => `• **${c.title}** (${format(c.date?.toDate ? c.date.toDate() : new Date(c.date), 'MMM d')})`).join('\n') + `\nConfirm Yes/No.`
            };
          } else {
            reply = {
              sender: 'assistant',
              text: `⚠️ Multiple matches found. Please specify which one to delete:\n` +
                    candidates.map((c, i) => `${i+1}. **${c.title}** (${format(c.date?.toDate ? c.date.toDate() : new Date(c.date), 'MMM d')})`).join('\n')
            };
          }
        } else {
          const target = candidates[0];
          setPendingAction({ type: 'delete', eventId: target.id, data: target });
          reply = {
            sender: 'assistant',
            text: `Delete event **${target.title}** on **${format(target.date?.toDate ? target.date.toDate() : new Date(target.date), 'MMMM d')}**? Confirm Yes/No.`
          };
        }
      } else if (isViewIntent) {
        let filtered = [...events];
        let selectedCategory = null;
        if (matchKeywordGroup(normalized, KEYWORD_GROUPS.exam, true)) selectedCategory = 'exam';
        else if (matchKeywordGroup(normalized, KEYWORD_GROUPS.deadline, true)) selectedCategory = 'deadline';
        else if (matchKeywordGroup(normalized, KEYWORD_GROUPS.lecture, true)) selectedCategory = 'lecture';
        else if (matchKeywordGroup(normalized, KEYWORD_GROUPS.practical, true)) selectedCategory = 'practical';
        else if (matchKeywordGroup(normalized, KEYWORD_GROUPS.tutorial, true)) selectedCategory = 'tutorial';
        
        if (selectedCategory) {
          filtered = filtered.filter(e => e.type === selectedCategory);
        }

        let dateStart = null, dateEnd = null;
        if (matchKeywordGroup(normalized, ['today', 'todey'], true)) {
          dateStart = new Date(); dateStart.setHours(0,0,0,0);
          dateEnd = new Date(); dateEnd.setHours(23,59,59,999);
        } else if (matchKeywordGroup(normalized, ['tomorrow', 'tomorow', 'tommorow'], true)) {
          dateStart = new Date(); dateStart.setDate(dateStart.getDate() + 1); dateStart.setHours(0,0,0,0);
          dateEnd = new Date(dateStart); dateEnd.setHours(23,59,59,999);
        } else if (matchKeywordGroup(normalized, ['this week'], true)) {
          dateStart = new Date(); dateStart.setHours(0,0,0,0);
          dateEnd = new Date(); dateEnd.setDate(dateEnd.getDate() + (7 - dateEnd.getDay())); dateEnd.setHours(23,59,59,999);
        } else if (matchKeywordGroup(normalized, ['next week'], true)) {
          dateStart = new Date(); dateStart.setDate(dateStart.getDate() + (7 - dateStart.getDay()) + 1); dateStart.setHours(0,0,0,0);
          dateEnd = new Date(dateStart); dateEnd.setDate(dateEnd.getDate() + 6); dateEnd.setHours(23,59,59,999);
        } else if (matchKeywordGroup(normalized, ['upcoming', 'upcomming', 'upcoing'], true)) {
          dateStart = new Date(); dateStart.setHours(0,0,0,0);
        }

        if (dateStart || dateEnd) {
          filtered = filtered.filter(e => {
            const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
            if (dateStart && d < dateStart) return false;
            if (dateEnd && d > dateEnd) return false;
            return true;
          });
        }

        reply = {
          sender: 'assistant',
          type: 'query-result',
          queryType: selectedCategory || 'timeline',
          events: filtered
        };
      } else {
        const hasSpecificDetails = parsedData && parsedData.courseMatch && parsedData.date;
        if (hasSpecificDetails) {
          if (!parsedData.hasType) {
            reply = { sender: 'assistant', type: 'event-type-picker', pendingEvent: parsedData };
          } else {
            const collisionResult = checkCollision(parsedData);
            if (collisionResult) {
              setPendingAction({ type: 'create', data: parsedData });
              reply = { sender: 'assistant', text: `⚠️ **Collision Warning**: This overlaps with core course **${collisionResult.title}** (${collisionResult.course_id}). Add anyway? (Yes/No)` };
            } else {
              const eventId = await addNewEvent({
                course_id: parsedData.courseMatch.course.course_id,
                title: parsedData.title,
                date: parsedData.date,
                end_date: parsedData.end_date,
                type: parsedData.type,
                location: parsedData.location,
                recurrenceRule: parsedData.recurrenceRule
              });
              localStorage.setItem('lastAddedEventId', eventId);
              reply = { sender: 'assistant', text: `✅ Added:\n• **${parsedData.title}**\n• Course: ${parsedData.courseMatch.course.course_id}\n• Date: ${format(parsedData.date, 'EEEE, MMMM d')} at ${format(parsedData.date, 'h:mm a')}` };
            }
          }
        } else {
          reply = {
            sender: 'assistant',
            text: `I didn't quite catch that. Try:\n• "timeline" — all events\n• "exams" — all exams\n• "deadlines" — all deadlines\n• "exams and deadlines" — both\n• Or type an event like "CO321 exam Monday at 10 AM"`,
          };
        }
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
    if (isQuery) handleSendMessage(text);
    else setInitialInput(text);
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
      <div className="flex flex-col h-[calc(100vh-110px)] w-full relative">
        <div className="flex-1 overflow-y-auto pb-4 space-y-5 pr-1 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[45vh] py-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3 leading-tight">
                  Hi, <span className="bg-gradient-to-r from-[#4f46e5] to-[#0f62fe] bg-clip-text text-transparent">{userProfile?.name?.split(' ')[0] || 'Student'}</span> 👋
                </h1>
                <p className="text-[var(--color-text-secondary)] text-sm">Use a quick prompt, type naturally, or add via form.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full max-w-3xl mb-6">
                {promptTemplates.map((t, idx) => {
                  const Icon = t.icon;
                  return (
                    <button key={idx} onClick={() => handleTemplateClick(t.text)} className="flex flex-col items-start text-left p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)]/40 hover:shadow-md transition-all group">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors mb-1">{t.title}</span>
                      <span className="text-xs text-[var(--color-text-secondary)] flex-1 mb-3">{t.description}</span>
                      <div className="p-1.5 bg-[var(--color-bg-base)] rounded-md">
                        <Icon className="w-3.5 h-3.5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-3 px-5 py-3 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent-subtle)]/30 transition-all group max-w-sm w-full">
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
                  <div className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm border ${msg.sender === 'user' ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] rounded-tr-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] rounded-tl-sm'}`}>
                    {msg.type === 'query-result' ? <QueryResult queryType={msg.queryType} events={msg.events} /> : msg.type === 'add-event-form' ? (
                      <InlineAddEventForm initialData={msg.initialData} onSuccess={(newEvent) => {
                        setMessages((prev) => {
                          const copy = [...prev];
                          const mIdx = copy.findIndex((m) => m === msg);
                          if (mIdx !== -1) {
                            const d = newEvent.date;
                            copy[mIdx] = { sender: 'assistant', text: `✅ Added: **${newEvent.title}** on ${format(d, 'EEEE, MMMM d')}` };
                          }
                          return copy;
                        });
                      }} onCancel={() => setMessages((prev) => prev.filter((m) => m !== msg))} />
                    ) : msg.type === 'event-type-picker' ? (
                      <div className="space-y-3 min-w-[280px]">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Select event type for {msg.pendingEvent.courseMatch.course.course_id}:</p>
                        <div className="flex flex-wrap gap-2">
                          {['exam', 'lecture', 'deadline', 'practical', 'quiz'].map((t) => (
                            <button key={t} onClick={() => handleSelectEventType(msg.pendingEvent, t, idx)} className="px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-xs font-semibold hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all capitalize">{t}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{formatMessageText(msg.text)}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-[var(--color-bg-base)] pt-2 pb-3 z-20 shrink-0 border-t border-[var(--color-border)]/20">
          <QuickAddChat key={initialInput} initialInput={initialInput} onSendMessage={handleSendMessage} />
        </div>
      </div>
      <AddEventModal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setPreselectedType(null); }} preselectedType={preselectedType} />
    </>
  );
}
