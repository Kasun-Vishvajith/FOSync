import Modal from '../ui/Modal';
import { formatDate, formatTime, getEventTypeClass, capitalize } from '../../utils/helpers';
import { Clock, BookOpen, Tag, FileText } from 'lucide-react';

export default function EventDetailModal({ event, courseMap, onClose }) {
  if (!event) return null;

  const course = courseMap?.[event.course_id];

  return (
    <Modal isOpen={!!event} onClose={onClose} title="Event Details" size="sm">
      <div className="space-y-4">
        {/* Event Type Badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeClass(event.type)}`}>
          {capitalize(event.type)}
        </span>

        {/* Title */}
        <h3 className="text-xl font-bold text-surface-100">{event.title}</h3>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-surface-400 shrink-0" />
            <div>
              <p className="text-surface-200">{formatDate(event.date)}</p>
              <p className="text-surface-400">
                {formatTime(event.date)}
                {event.end_date && (
                  <>
                    {' - '}
                    {formatTime(event.end_date)}
                    {formatDate(event.date) !== formatDate(event.end_date) && (
                      <span className="text-xs text-surface-500 ml-1">
                        ({formatDate(event.end_date)})
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <BookOpen className="w-4 h-4 text-surface-400 shrink-0" />
            <div>
              <p className="text-surface-200">
                {course?.aliases?.[0] || event.course_id}
              </p>
              <p className="text-surface-400">{event.course_id}</p>
            </div>
          </div>

          {course?.aliases?.length > 1 && (
            <div className="flex items-start gap-3 text-sm">
              <Tag className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-surface-400 text-xs mb-1">Also known as:</p>
                <div className="flex flex-wrap gap-1.5">
                  {course.aliases.slice(1).map((alias, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-surface-700 text-surface-300 text-xs"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {event.note && (
            <div className="flex items-start gap-3 text-sm border-t border-surface-700/50 pt-3 mt-3">
              <FileText className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-1">Note</p>
                <p className="text-surface-200 bg-surface-800/40 p-2.5 rounded-lg border border-surface-700/30 whitespace-pre-wrap text-xs leading-relaxed break-words">
                  {event.note}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
