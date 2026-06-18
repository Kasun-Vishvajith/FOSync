import Modal from '../ui/Modal';
import { formatDate, formatTime, getEventTypeClass, capitalize } from '../../utils/helpers';
import { Clock, BookOpen, Tag } from 'lucide-react';

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
              <p className="text-surface-400">{formatTime(event.date)}</p>
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
        </div>
      </div>
    </Modal>
  );
}
