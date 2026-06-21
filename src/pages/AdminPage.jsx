import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllEvents, addEvent, updateEvent, deleteEvent,
  getAllCourses, addCourse, updateCourse, deleteCourse, bulkAddCourses, linkCourses, unlinkCourses,
  getAllUsers, updateUserProfile, deleteUser as deleteUserDoc,
  getAllAllowedUsers, addAllowedUser, removeAllowedUser, bulkAddAllowedUsers,
  resetDatabase, seedDefaultData, exportDatabase, importDatabase,
  getActivityLogs, getSemesterSettings, updateSemesterSettings, progressStudentsToNextSemester,
} from '../lib/firestore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { DEGREES, EVENT_TYPES } from '../utils/constants';
import { capitalize, formatDate } from '../utils/helpers';
import {
  Shield, CalendarPlus, BookOpen, Users, UserCheck,
  Plus, Trash2, Edit3, Upload, Search, X, Link as LinkIcon, Link2,
  ShieldAlert, Download, History, Eye, EyeOff,
} from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';

// =============================================
// MAIN ADMIN PAGE
// =============================================
export default function AdminPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('events');

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Delete',
    isDanger: true,
  });

  const showConfirm = (title, message, onConfirm, confirmText = 'Delete', isDanger = true) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, confirmText, isDanger });
  };

  const tabs = [
    { id: 'events', label: 'Events', icon: CalendarPlus },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'links', label: 'Link Courses', icon: LinkIcon },
    ...(isAdmin
      ? [
          { id: 'users', label: 'Users', icon: Users },
          { id: 'semester', label: 'Semester Settings', icon: Shield },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          { id: 'allowed', label: 'Allowed Users', icon: UserCheck },
          { id: 'logs', label: 'Activity Log', icon: History },
          { id: 'system', label: 'System Settings', icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-primary-600/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-sans tracking-tight font-bold text-[var(--color-on-surface)]">Admin Panel</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            {isSuperAdmin ? 'Super Admin' : 'Admin'} — Manage courses, events & users
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-container)]/60 border border-[var(--color-surface-container-high)]/50 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap
              transition-all duration-200 cursor-pointer
              ${
                activeTab === id
                  ? 'bg-[var(--color-primary)] text-white shadow-md shadow-primary-600/25'
                  : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'events' && <EventsTab showConfirm={showConfirm} />}
        {activeTab === 'courses' && <CoursesTab showConfirm={showConfirm} />}
        {activeTab === 'links' && <CourseLinkerTab showConfirm={showConfirm} />}
        {activeTab === 'users' && isAdmin && <UsersTab showConfirm={showConfirm} />}
        {activeTab === 'semester' && isAdmin && <SemesterTab showConfirm={showConfirm} />}
        {activeTab === 'allowed' && isSuperAdmin && <AllowedUsersTab showConfirm={showConfirm} />}
        {activeTab === 'logs' && isSuperAdmin && <ActivityLogTab />}
        {activeTab === 'system' && isSuperAdmin && <SystemTab />}
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDanger={confirmConfig.isDanger}
      />
    </div>
  );
}

// =============================================
// EVENTS TAB
// =============================================
function EventsTab({ showConfirm }) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  // Form state
  const [form, setForm] = useState({ course_id: '', title: '', date: '', type: 'lecture' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [evts, crses] = await Promise.all([getAllEvents(), getAllCourses()]);
      setEvents(evts);
      setCourses(crses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ course_id: '', title: '', date: '', end_date: '', type: 'lecture', note: '' });
    setShowModal(true);
  }

  function openEdit(event) {
    setEditing(event);
    const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
    const ed = event.end_date ? (event.end_date.toDate ? event.end_date.toDate() : new Date(event.end_date)) : null;
    setForm({
      course_id: event.course_id,
      title: event.title,
      date: d.toISOString().slice(0, 16),
      end_date: ed ? ed.toISOString().slice(0, 16) : '',
      type: event.type,
      note: event.note || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    const data = {
      course_id: form.course_id,
      title: form.title,
      date: new Date(form.date),
      end_date: form.type === 'deadline' ? null : (form.end_date ? new Date(form.end_date) : null),
      type: form.type,
      note: form.note || '',
      created_by: currentUser?.uid || '',
    };

    try {
      if (editing) {
        await updateEvent(editing.id, data);
      } else {
        await addEvent(data);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(eventId) {
    showConfirm(
      'Delete Event',
      'Are you sure you want to permanently delete this event?',
      async () => {
        try {
          await deleteEvent(eventId);
          await loadData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  }

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.course_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-container)]/80 border border-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-surface-container)]/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-outline)]">
          <CalendarPlus className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No events found</p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.map((event) => {
            const course = courses.find((c) => c.course_id === event.course_id);
            return (
              <div
                key={event.id}
                className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`badge-${event.type} px-2.5 py-1 rounded-md text-xs font-semibold shrink-0`}>
                    {capitalize(event.type)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{event.title}</p>
                    <p className="text-xs text-[var(--color-outline)]">
                      {course?.aliases?.[0] || event.course_id} • {formatDate(event.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(event)}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-on-surface-variant)] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Event' : 'New Event'}
      >
        <div className="space-y-4">
          <Select
            id="event-course"
            label="Course"
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            placeholder="Select a course"
            options={courses.map((c) => ({
              value: c.course_id,
              label: `${c.course_id} — ${c.aliases?.[0] || c.course_id}`,
            }))}
          />
          <Input
            id="event-title"
            label="Event Title"
            placeholder="e.g., Midterm Exam"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            id="event-date"
            label="Date & Time"
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
           {form.type !== 'deadline' && (
             <Input
               id="event-end-date"
               label="End Date & Time (Optional)"
               type="datetime-local"
               value={form.end_date || ''}
               onChange={(e) => setForm({ ...form, end_date: e.target.value })}
             />
           )}
          <Select
            id="event-type"
            label="Event Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, end_date: e.target.value === 'deadline' ? '' : form.end_date })}
            options={EVENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
          <Input
            id="event-note"
            label="Note (Optional)"
            placeholder="e.g., Bring calculators, room 204"
            value={form.note || ''}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.course_id || !form.title || !form.date}
            >
              {editing ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =============================================
// COURSES TAB
// =============================================
function CoursesTab({ showConfirm }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [courseCsvData, setCourseCsvData] = useState('');

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterDegree, setFilterDegree] = useState('all');

  // Form
  const [form, setForm] = useState({
    course_id: '',
    aliases: '',
    degrees: [],
    is_elective: false,
    semester: '',
    credits: 0,
    year: '',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const c = await getAllCourses();
      setCourses(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ course_id: '', aliases: '', degrees: [], is_elective: false, semester: '', credits: 0, year: '' });
    setShowModal(true);
  }

  function openEdit(course) {
    setEditing(course);
    setForm({
      course_id: course.course_id,
      aliases: (course.aliases || []).join(', '),
      degrees: course.degrees || [],
      is_elective: course.is_elective || false,
      semester: course.semester || '',
      credits: course.credits || 0,
      year: course.year || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    const data = {
      aliases: form.aliases.split(',').map((a) => a.trim()).filter(Boolean),
      degrees: form.degrees,
      is_elective: form.is_elective,
      semester: form.semester,
      credits: Number(form.credits),
      year: form.year,
    };

    try {
      if (editing) {
        await updateCourse(editing.course_id, data);
      } else {
        await addCourse(form.course_id.trim().toUpperCase(), data);
      }
      setShowModal(false);
      await loadCourses();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(courseId) {
    showConfirm(
      'Delete Course',
      'Are you sure you want to delete this course? Events linked to it will remain but may lose their metadata.',
      async () => {
        try {
          await deleteCourse(courseId);
          await loadCourses();
        } catch (err) {
          console.error(err);
        }
      }
    );
  }

  async function handleDeleteAll() {
    showConfirm(
      'Delete All Courses',
      'WARNING: Are you sure you want to delete ALL courses? This action cannot be undone and will permanently delete all courses from the database.',
      async () => {
        try {
          setLoading(true);
          const promises = courses.map((c) => deleteCourse(c.course_id));
          await Promise.all(promises);
          await loadCourses();
        } catch (err) {
          console.error('Failed to delete all courses:', err);
        } finally {
          setLoading(false);
        }
      },
      'Delete All',
      true
    );
  }

  async function handleCSVUpload() {
    try {
      const lines = courseCsvData.trim().split('\n');
      if (lines.length <= 1) return; // Need at least header + 1 row

      const entries = [];
      // Skip header, parse rows
      for (let i = 1; i < lines.length; i++) {
         const line = lines[i];
         if (!line.trim()) continue;
         
         const parts = line.split(',').map((s) => s.trim());
         if (parts.length < 9) continue;

         const [
           code, name, isDs, isStat, isAppliedStat, isIndStat, isElectiveStr, semesterStr, creditsStr, yearStr
         ] = parts;

         if (!code) continue;

         const degrees = [];
         const isTrue = (val) => val === '1' || val.toLowerCase() === 'true';

         if (isDs && isTrue(isDs)) degrees.push('Data Science');
         if (isStat && isTrue(isStat)) degrees.push('Statistics');
         if (isAppliedStat && isTrue(isAppliedStat)) degrees.push('Applied Statistics');
         if (isIndStat && isTrue(isIndStat)) degrees.push('Industrial Statistics');

         entries.push({
           course_id: code.toUpperCase(),
           aliases: name ? [name] : [],
           degrees,
           is_elective: isElectiveStr && isTrue(isElectiveStr),
           semester: semesterStr || '',
           credits: creditsStr ? Number(creditsStr) : 0,
           year: yearStr || '',
         });
      }

      if (entries.length > 0) {
        await bulkAddCourses(entries);
        setCourseCsvData('');
        setShowCsvModal(false);
        await loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function toggleDegree(deg) {
    setForm((f) => ({
      ...f,
      degrees: f.degrees.includes(deg)
        ? f.degrees.filter((d) => d !== deg)
        : [...f.degrees, deg],
    }));
  }

  const filteredCourses = courses.filter((c) => {
    if (filterType === 'core' && c.is_elective) return false;
    if (filterType === 'elective' && !c.is_elective) return false;
    if (filterYear !== 'all' && c.year !== filterYear) return false;
    if (filterDegree !== 'all' && (!c.degrees || !c.degrees.includes(filterDegree))) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface-container-low)] p-3 rounded-2xl border border-[var(--color-surface-container)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-[var(--color-surface-container-lowest)] rounded-lg text-[var(--color-on-surface)] border border-[var(--color-surface-container)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="core">Core</option>
              <option value="elective">Elective</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">Year:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-[var(--color-surface-container-lowest)] rounded-lg text-[var(--color-on-surface)] border border-[var(--color-surface-container)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
            >
              <option value="all">All Years</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">Degree:</span>
            <select
              value={filterDegree}
              onChange={(e) => setFilterDegree(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-[var(--color-surface-container-lowest)] rounded-lg text-[var(--color-on-surface)] border border-[var(--color-surface-container)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
            >
              <option value="all">All Degrees</option>
              <option value="Data Science">Data Science</option>
              <option value="Statistics">Statistics</option>
              <option value="Applied Statistics">Applied Statistics</option>
              <option value="Industrial Statistics">Industrial Statistics</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={handleDeleteAll} disabled={courses.length === 0}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete All
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowCsvModal(true)}>
            <Upload className="w-3.5 h-3.5" />
            CSV Upload
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" />
            Add Course
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--color-surface-container)]/50 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-outline)] animate-fade-in">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No courses match the active filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-base font-semibold text-[var(--color-on-surface)]">{course.course_id}</p>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">
                    {course.aliases?.join(' / ') || 'No aliases'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(course)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.course_id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-on-surface-variant)] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {course.degrees?.map((d) => (
                  <span key={d} className="px-2 py-0.5 rounded-md bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-xs">
                    {d}
                  </span>
                ))}
                {course.year && (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-xs">
                    Year {course.year}
                  </span>
                )}
                {course.semester && (
                  <span className="px-2 py-0.5 rounded-md bg-primary-500/15 text-[var(--color-primary)] text-xs border border-[var(--color-primary)]/20">
                    Sem {course.semester}
                  </span>
                )}
                {course.credits > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-xs border border-purple-500/20">
                    {course.credits} Credits
                  </span>
                )}
                {course.is_elective && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-xs border border-amber-500/20">
                    Elective
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Course' : 'New Course'}
      >
        <div className="space-y-4">
          <Input
            id="course-id"
            label="Course ID"
            placeholder="e.g., STAT201"
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            disabled={!!editing}
          />
          <Input
            id="course-aliases"
            label="Aliases (comma separated)"
            placeholder="e.g., Statistical Inference, Inference for DS"
            value={form.aliases}
            onChange={(e) => setForm({ ...form, aliases: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3">
             <Input
               id="course-year"
               label="Year"
               placeholder="e.g., 3"
               value={form.year}
               onChange={(e) => setForm({ ...form, year: e.target.value })}
             />
             <Input
               id="course-semester"
               label="Semester"
               placeholder="e.g., 5"
               value={form.semester}
               onChange={(e) => setForm({ ...form, semester: e.target.value })}
             />
             <Input
               id="course-credits"
               label="Credits"
               type="number"
               placeholder="e.g., 3"
               value={form.credits}
               onChange={(e) => setForm({ ...form, credits: e.target.value })}
             />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-on-surface-variant)]">Degrees</label>
            <div className="flex flex-wrap gap-2">
              {DEGREES.map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => toggleDegree(deg)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                    ${
                      form.degrees.includes(deg)
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                        : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] hover:border-surface-500'
                    }
                  `}
                >
                  {deg}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_elective}
              onChange={(e) => setForm({ ...form, is_elective: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-[var(--color-on-surface-variant)]">This is an elective course</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.course_id || form.degrees.length === 0}
            >
              {editing ? 'Update' : 'Create'} Course
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        title="Bulk Upload Courses (CSV)"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)]">
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">
              Expected CSV columns:
            </p>
            <code className="text-xs text-[var(--color-primary)] block break-all mb-2">
              code,name,is data sceince,is stat,is applied stat,isisdustrial stat,is elective,semester,credits,year
            </code>
            <p className="text-xs text-[var(--color-outline)]">
              Example: <br/>
              DSC321,Data Mining,1,0,1,0,0,5,3,3
            </p>
          </div>
          <textarea
            rows={8}
            value={courseCsvData}
            onChange={(e) => setCourseCsvData(e.target.value)}
            placeholder={`code,name,is data sceince,is stat,is applied stat,isisdustrial stat,is elective,semester,credits,year\nDSC321,Data Mining,1,0,1,0,0,5,3,3`}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-surface-container)]/80 border border-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm font-mono placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCsvModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCSVUpload} disabled={!courseCsvData.trim()}>
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =============================================
// PASSWORD VIEWER COMPONENT (click to toggle view)
// =============================================
function PasswordViewer({ password, isSuperAdmin }) {
  const [show, setShow] = useState(false);
  
  if (!isSuperAdmin) {
    return <span> • Password: ••••••••</span>;
  }

  const pwdText = password || 'N/A';

  return (
    <span className="inline-flex items-center">
      <span> • Password: {show ? pwdText : '••••••••'}</span>
      {password && password !== 'N/A' && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="p-0.5 rounded hover:bg-[var(--color-surface-container-high)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer select-none ml-1 inline-flex items-center justify-center align-middle"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          title={show ? "Click to hide password" : "Click to view password"}
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );
}

// =============================================
// USERS TAB
// =============================================
function UsersTab({ showConfirm }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isSuperAdmin } = useAuth();
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [newName, setNewName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const u = await getAllUsers();
      setUsers(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(user) {
    if (!isSuperAdmin) return;
    const newRole =
      user.role === 'admin' ? 'student' : 'admin';
    try {
      await updateUserProfile(user.id, { role: newRole });
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(user) {
    if (!isSuperAdmin) return;
    if (user.role === 'super_admin') return;
    showConfirm(
      'Remove User',
      `Are you sure you want to remove ${user.name || user.email} (${user.reg_no})? This will permanently delete their FOSync profile.`,
      async () => {
        try {
          await deleteUserDoc(user.id);
          await loadUsers();
        } catch (err) {
          console.error(err);
        }
      }
    );
  }

  async function handleResetPassword(user) {
    showConfirm(
      'Reset Password',
      `Are you sure you want to reset the password for ${user.name || user.email} (${user.reg_no})? The new password will be "FOS123".`,
      async () => {
        try {
          await updateUserProfile(user.id, {
            password: 'FOS123',
            oldPassword: user.password || '',
            authPasswordNeedsReset: true
          });
          await loadUsers();
        } catch (err) {
          console.error(err);
        }
      },
      'Reset',
      false
    );
  }

  const startRename = (user) => {
    if (!isSuperAdmin) return;
    setSelectedUser(user);
    setNewName(user.name || '');
    setShowRenameModal(true);
  };

  const handleRename = async () => {
    if (!isSuperAdmin || !selectedUser || !newName.trim()) return;
    try {
      await updateUserProfile(selectedUser.id, { name: newName.trim() });
      setShowRenameModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.reg_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-outline)]" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-container)]/80 border border-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-surface-container)]/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] rounded-xl px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{user.name}</p>
                    {isSuperAdmin && (
                      <button
                        onClick={() => startRename(user)}
                        className="p-1 rounded hover:bg-[var(--color-surface-container-high)] text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors cursor-pointer"
                        title="Rename User"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-outline)]">
                    {user.reg_no} • {user.degree}
                    <PasswordViewer password={user.password} isSuperAdmin={isSuperAdmin} />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`
                    px-2.5 py-1 rounded-md text-xs font-semibold
                    ${user.role === 'super_admin' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' :
                      user.role === 'admin' ? 'bg-primary-500/15 text-[var(--color-primary)] border border-[var(--color-primary)]/20' :
                      'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}
                  `}
                >
                  {capitalize(user.role)}
                </span>
                
                {user.role !== 'super_admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPassword(user)}
                  >
                    Reset Password
                  </Button>
                )}

                {isSuperAdmin && user.role !== 'super_admin' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAdmin(user)}
                    >
                      {user.role === 'admin' ? 'Demote' : 'Promote'}
                    </Button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-on-surface-variant)] hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title="Rename User"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="rename-user-name"
            label={`New name for ${selectedUser?.reg_no}`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter real name"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRenameModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || newName.trim() === selectedUser?.name}>
              Save Change
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =============================================
// ALLOWED USERS TAB (Super Admin only)
// =============================================
function AllowedUsersTab({ showConfirm }) {
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newRegNo, setNewRegNo] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [csvData, setCsvData] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAllowed();
  }, []);

  async function loadAllowed() {
    setLoading(true);
    try {
      const a = await getAllAllowedUsers();
      setAllowedUsers(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newRegNo || !newDegree) return;
    try {
      await addAllowedUser(newRegNo.trim().toLowerCase(), newDegree);
      setNewRegNo('');
      setNewDegree('');
      setShowAddModal(false);
      await loadAllowed();
    } catch (err) {
      console.error(err);
    }
  }

  async function removeAllowed(regNo) {
    showConfirm(
      'Remove Access',
      `Are you sure you want to revoke system access for ${regNo}? They will no longer be able to log in.`,
      async () => {
        try {
          await removeAllowedUser(regNo);
          await loadAllowed();
        } catch (err) {
          console.error(err);
        }
      }
    );
  }

  async function handleCSVUpload() {
    try {
      const lines = csvData.trim().split('\n');
      const entries = [];
      for (const line of lines) {
        const [reg_no, degree] = line.split(',').map((s) => s.trim());
        if (reg_no && degree) {
          entries.push({ reg_no: reg_no.toLowerCase(), degree });
        }
      }
      if (entries.length === 0) return;
      await bulkAddAllowedUsers(entries);
      setCsvData('');
      setShowUploadModal(false);
      await loadAllowed();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = allowedUsers.filter(
    (u) =>
      u.reg_no?.toLowerCase().includes(search.toLowerCase()) ||
      u.degree?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Search allowed users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-container)]/80 border border-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4" />
            CSV Upload
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-[var(--color-on-surface-variant)]">
        {filtered.length} allowed user{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-[var(--color-surface-container)]/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 stagger-children">
          {filtered.map((user) => (
            <div
              key={user.id}
              className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] rounded-lg px-4 py-2.5 flex items-center justify-between"
            >
              <div>
                <span className="text-sm font-medium text-[var(--color-on-surface)]">{user.reg_no}</span>
                <span className="mx-2 text-[var(--color-outline)]">•</span>
                <span className="text-sm text-[var(--color-on-surface-variant)]">{user.degree}</span>
              </div>
              <button
                onClick={() => removeAllowed(user.reg_no)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-outline)] hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Single Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Allowed User"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="allowed-reg"
            label="Registration Number"
            placeholder="e.g., 2022s19001"
            value={newRegNo}
            onChange={(e) => setNewRegNo(e.target.value)}
          />
          <Select
            id="allowed-degree"
            label="Degree"
            value={newDegree}
            onChange={(e) => setNewDegree(e.target.value)}
            placeholder="Select degree"
            options={DEGREES.map((d) => ({ value: d, label: d }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newRegNo || !newDegree}>
              Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Bulk Upload (CSV)"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)]">
            <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">
              Format: <code className="text-[var(--color-primary)]">reg_no, degree</code> — one per line
            </p>
            <p className="text-xs text-[var(--color-outline)]">
              Example: 2022s19001, Statistics
            </p>
          </div>
          <textarea
            rows={8}
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder={`2022s19001, Statistics\n2022s19002, Data Science\n2022s19003, Statistics`}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-surface-container)]/80 border border-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm font-mono placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCSVUpload} disabled={!csvData.trim()}>
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// =============================================
// COURSE LINKER TAB
// =============================================
function CourseLinkerTab({ showConfirm }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCourseId, setDraggedCourseId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [dragCurrentPos, setDragCurrentPos] = useState(null);
  const [newlyLinkedIds, setNewlyLinkedIds] = useState([]);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterDegree, setFilterDegree] = useState('all');

  const [activeHighlight, setActiveHighlight] = useState(null);
  const [justDragged, setJustDragged] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const crses = await getAllCourses();
      setCourses(crses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function clearDragState() {
    setDraggedCourseId(null);
    setDragStartPos(null);
    setDragCurrentPos(null);
    // Suppress trailing click event after drag ends
    setTimeout(() => {
      setJustDragged(false);
    }, 150);
  }

  async function handleDrop(e, targetCourseId) {
    e.preventDefault();
    if (!draggedCourseId || draggedCourseId === targetCourseId) {
      clearDragState();
      return;
    }
    
    const targetCourse = courses.find(c => c.course_id === targetCourseId);
    if (targetCourse?.linked_courses?.includes(draggedCourseId)) {
      clearDragState();
      return;
    }

    try {
      const draggedId = draggedCourseId;
      await linkCourses(draggedId, targetCourseId);
      
      // Trigger ripple effect
      setNewlyLinkedIds([draggedId, targetCourseId]);
      setTimeout(() => setNewlyLinkedIds([]), 1500);

      await loadCourses();
    } catch (err) {
      console.error(err);
    }
    clearDragState();
  }

  function handleDragStart(e, courseId) {
    setJustDragged(true);
    setDraggedCourseId(courseId);
    e.dataTransfer.setData('text/plain', courseId);
    e.dataTransfer.effectAllowed = 'link';
    
    // Hide default drag ghost element
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);

    const rect = e.currentTarget.getBoundingClientRect();
    setDragStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }

  function handleDrag(e) {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore drag end artifact
    setDragCurrentPos({ x: e.clientX, y: e.clientY });
  }

  async function handleUnlink(courseIdA, courseIdB) {
    showConfirm(
      'Unlink Course',
      'Are you sure you want to unlink these courses? They will no longer share the same event stream.',
      async () => {
        try {
          await unlinkCourses(courseIdA, courseIdB);
          await loadCourses();
        } catch (err) {
          console.error('Failed to unlink:', err);
        }
      }
    );
  }

  const filteredCourses = courses.filter((c) => {
    if (filterType === 'core' && c.is_elective) return false;
    if (filterType === 'elective' && !c.is_elective) return false;
    if (filterYear !== 'all' && c.year !== filterYear) return false;
    if (filterDegree !== 'all' && (!c.degrees || !c.degrees.includes(filterDegree))) return false;
    return true;
  });

  // Connected components algorithm to identify link groups
  const linkGroups = [];
  const visited = new Set();
  courses.forEach((course) => {
    if (visited.has(course.course_id)) return;
    if (!course.linked_courses || course.linked_courses.length === 0) return;

    const group = [];
    const queue = [course.course_id];
    visited.add(course.course_id);

    while (queue.length > 0) {
      const currentId = queue.shift();
      group.push(currentId);

      const currCourse = courses.find((c) => c.course_id === currentId);
      if (currCourse && currCourse.linked_courses) {
        currCourse.linked_courses.forEach((linkedId) => {
          if (!visited.has(linkedId)) {
            visited.add(linkedId);
            queue.push(linkedId);
          }
        });
      }
    }
    if (group.length > 1) {
      group.sort();
      linkGroups.push(group);
    }
  });

  // For courses that are shared across multiple degrees but not manually linked,
  // we add them as their own link group so they receive a distinct group color.
  courses.forEach((course) => {
    if (course.degrees?.length > 1) {
      const inGroup = linkGroups.some(g => g.includes(course.course_id));
      if (!inGroup) {
        linkGroups.push([course.course_id]);
      }
    }
  });

  linkGroups.sort((a, b) => a[0].localeCompare(b[0]));

  const groupColors = [
    {
      border: 'border-2 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      indicator: 'bg-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      ping: 'border-emerald-500',
    },
    {
      border: 'border-2 border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
      indicator: 'bg-purple-500',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      ping: 'border-purple-500',
    },
    {
      border: 'border-2 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.35)]',
      indicator: 'bg-red-500',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
      ping: 'border-red-500',
    },
    {
      border: 'border-2 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
      indicator: 'bg-blue-500',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ping: 'border-blue-500',
    },
    {
      border: 'border-2 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      indicator: 'bg-amber-500',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      ping: 'border-amber-500',
    },
    {
      border: 'border-2 border-pink-500/80 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
      indicator: 'bg-pink-500',
      badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      ping: 'border-pink-500',
    },
    {
      border: 'border-2 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
      indicator: 'bg-cyan-500',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      ping: 'border-cyan-500',
    },
  ];

  const getCourseGroupColor = (courseId) => {
    const idx = linkGroups.findIndex((g) => g.includes(courseId));
    if (idx === -1) return null;
    return groupColors[idx % groupColors.length];
  };

  const handleCardClick = (courseId, degree) => {
    if (justDragged) return;
    const group = linkGroups.find((g) => g.includes(courseId));
    if (group) {
      setActiveHighlight({ courseId, group, degree });
      setTimeout(() => {
        setActiveHighlight(null);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 bg-[var(--color-surface-container)]/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="space-y-4 relative"
      onDragOver={(e) => {
        e.preventDefault();
        handleDrag(e);
      }}
    >
      {/* Live Wire Thread */}
      {dragStartPos && dragCurrentPos && (
        <svg className="fixed inset-0 pointer-events-none z-[100] w-full h-full">
          <line
            x1={dragStartPos.x}
            y1={dragStartPos.y}
            x2={dragCurrentPos.x}
            y2={dragCurrentPos.y}
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray="6,6"
            className="animate-pulse"
          />
        </svg>
      )}

      <div className="p-4 rounded-xl bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)]">
        <h2 className="text-lg font-semibold text-[var(--color-on-surface)] flex items-center gap-2 mb-2">
          <LinkIcon className="w-5 h-5 text-[var(--color-primary)]" />
          Course Linker
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          Drag and drop a course onto another course to link them together. Linked courses will share the same events on the dashboard calendar.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-[var(--color-surface-container-low)] p-3 rounded-2xl border border-[var(--color-surface-container)]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-[var(--color-surface-container-lowest)] rounded-lg text-[var(--color-on-surface)] border border-[var(--color-surface-container)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="core">Core</option>
            <option value="elective">Elective</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">Year:</span>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-[var(--color-surface-container-lowest)] rounded-lg text-[var(--color-on-surface)] border border-[var(--color-surface-container)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Years</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">Degree:</span>
          <select
            value={filterDegree}
            onChange={(e) => setFilterDegree(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-[var(--color-surface-container-lowest)] rounded-lg text-[var(--color-on-surface)] border border-[var(--color-surface-container)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Degrees</option>
            <option value="Data Science">Data Science</option>
            <option value="Statistics">Statistics</option>
            <option value="Applied Statistics">Applied Statistics</option>
            <option value="Industrial Statistics">Industrial Statistics</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {DEGREES.map((degree) => {
          if (filterDegree !== 'all' && degree !== filterDegree) return null;
          let degreeCourses = filteredCourses.filter((c) => c.degrees?.includes(degree));
          
          // Sort linked courses to the top
          degreeCourses.sort((a, b) => {
            const aHasLinks = (a.linked_courses?.length || 0) > 0 || (a.degrees?.length || 0) > 1;
            const bHasLinks = (b.linked_courses?.length || 0) > 0 || (b.degrees?.length || 0) > 1;
            if (aHasLinks && !bHasLinks) return -1;
            if (!aHasLinks && bHasLinks) return 1;
            return a.course_id.localeCompare(b.course_id);
          });
          
          return (
            <div key={degree} className="flex flex-col gap-3 min-w-[280px]">
              <div className="px-3 py-2 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)]">
                <h3 className="font-medium text-[var(--color-on-surface)] text-sm">{degree}</h3>
                <p className="text-xs text-[var(--color-outline)]">{degreeCourses.length} courses</p>
              </div>
              <div className="flex flex-col gap-2">
                {degreeCourses.map((course) => {
                  const hasLinks = (course.linked_courses?.length > 0) || (course.degrees?.length > 1);
                  const isPulsing = activeHighlight && 
                    activeHighlight.group.includes(course.course_id) && 
                    !(activeHighlight.course_id === course.course_id && activeHighlight.degree === degree);

                  return (
                    <div
                      key={course.course_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, course.course_id)}
                      onDrag={(e) => handleDrag(e)}
                      onDragEnd={clearDragState}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'link';
                        handleDrag(e);
                      }}
                      onDrop={(e) => handleDrop(e, course.course_id)}
                      onClick={() => handleCardClick(course.course_id, degree)}
                      className={`
                        relative bg-[var(--color-surface-container-lowest)] 
                        shadow-[var(--shadow-soft)] rounded-xl p-3 
                        transition-all duration-300 cursor-pointer active:cursor-grabbing
                        ${isPulsing ? 'scale-[1.03] z-10' : ''}
                        ${hasLinks 
                          ? (getCourseGroupColor(course.course_id)?.border || 'border-2 border-green-500/80 shadow-[0_0_12px_rgba(34,197,94,0.3)]')
                          : 'border border-[var(--color-surface-container-high)]/50 hover:border-[var(--color-primary)]/50'
                        }
                      `}
                    >
                      {/* Ripple Effect Background - ONLY on active link creation */}
                      {newlyLinkedIds.includes(course.course_id) && (
                        <div className="absolute inset-0 rounded-xl border-4 border-green-400 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_1] pointer-events-none" />
                      )}
                      {/* Smooth double ripple animation (2 waves together) for counterparts on click highlight */}
                      {isPulsing && (
                        <>
                          <div className={`absolute inset-0 rounded-xl border-4 animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] opacity-60 pointer-events-none ${getCourseGroupColor(course.course_id)?.ping || 'border-green-500'}`} />
                          <div className={`absolute inset-0 rounded-xl border-4 animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.2s] opacity-30 pointer-events-none ${getCourseGroupColor(course.course_id)?.ping || 'border-green-500'}`} />
                        </>
                      )}
                      {/* Wire / Link Line indicator */}
                      {hasLinks && (
                        <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-l-md pointer-events-none ${getCourseGroupColor(course.course_id)?.indicator || 'bg-green-500'}`} />
                      )}
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-mono text-sm font-bold text-[var(--color-primary)]">
                        {course.course_id}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${course.is_elective ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {course.is_elective ? 'Elective' : 'Core'}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-on-surface)] font-medium line-clamp-2 mb-2">
                      {course.aliases?.[0] || 'Unnamed Course'}
                    </div>

                    {/* Show existing links and shared degrees */}
                    {hasLinks && (
                      <div className="pt-2 mt-2 border-t border-[var(--color-surface-container-high)]/50 flex flex-wrap gap-1.5">
                        {/* Auto-linked degrees */}
                        {course.degrees?.length > 1 && course.degrees.map(deg => {
                          if (deg === degree) return null;
                          const linkedColor = getCourseGroupColor(course.course_id);
                          return (
                            <div 
                              key={deg}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${linkedColor?.badge || 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent'}`}
                              title={`Auto-linked across: ${deg}`}
                            >
                              <BookOpen className="w-3 h-3" />
                              {deg}
                            </div>
                          );
                        })}

                        {/* Explicit manually linked courses */}
                        {course.linked_courses?.map(linkedId => {
                          const linkedColor = getCourseGroupColor(linkedId);
                          return (
                            <div 
                              key={linkedId}
                              className={`flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs border ${linkedColor?.badge || 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent'}`}
                            >
                              <Link2 className="w-3 h-3" />
                              {linkedId}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUnlink(course.course_id, linkedId); }}
                                className="ml-1 p-0.5 rounded-sm hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Unlink"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// SYSTEM TAB
// =============================================
function SystemTab() {
  const { currentUser, userProfile } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);
  const [securityLevel, setSecurityLevel] = useState('');
  const [protocol, setProtocol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (securityLevel !== 'Omega' || protocol !== 'Agamemnon Contingency') {
      setError('Invalid authorization credentials.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetDatabase(currentUser?.uid, userProfile);
      setSuccess('Database successfully reset to clean slate!');
      setSecurityLevel('');
      setProtocol('');
      setTimeout(() => {
        setShowResetModal(false);
        setSuccess('');
        window.location.reload(); // Refresh the page to clear local states
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to reset database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await seedDefaultData();
      setSuccess('Core curriculum courses and default allowed users successfully seeded!');
      setTimeout(() => {
        setSuccess('');
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to seed default data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await exportDatabase();
      const fileData = JSON.stringify(data, null, 2);
      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.download = `fosync_db_backup_${dateStr}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);
      
      setSuccess('Database successfully exported to JSON!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to export database.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          
          if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Invalid JSON file format.');
          }

          await importDatabase(parsedData);
          setSuccess('Database successfully imported and restored from backup!');
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to parse JSON file.');
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read backup file.');
        setLoading(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to import database.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container-high)]/60 rounded-3xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto shadow-sm animate-fade-in">
      <div className="flex items-center gap-4 text-red-600 mb-2 border-b border-[var(--color-surface-container-high)]/65 pb-5">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
          <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Danger Zone & Backup Tools</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Sensitive system operations and database management</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-500">
          {success}
        </div>
      )}

      {/* 2-Column Reset & Restore Seed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Reset Database */}
        <div className="flex flex-col justify-between p-5 rounded-2xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface-container)]/30">
          <div className="space-y-3 mb-6">
            <h3 className="text-base font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Master Database Reset
            </h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
              This operation is <strong>irreversible</strong>. It will wipe out all events, non-admin users, and allowed user configuration lists. Core courses will be preserved.
            </p>
          </div>
          <button
            onClick={() => {
              setError('');
              setSecurityLevel('');
              setProtocol('');
              setShowResetModal(true);
            }}
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Reset All Database
          </button>
        </div>

        {/* Restore / Seed Default Data */}
        <div className="flex flex-col justify-between p-5 rounded-2xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface-container)]/30">
          <div className="space-y-3 mb-6">
            <h3 className="text-base font-bold text-[var(--color-on-surface)] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[var(--color-primary)]" />
              Restore / Seed Default Data
            </h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
              If your database has been reset or is empty, use this tool to seed the core courses catalog for all 4 degrees and default registration keys (<code className="text-xs">2022s19535</code> and <code className="text-xs">2022s19354</code>).
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-container)] text-white text-sm font-semibold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Seed Default Courses & allowed users
          </button>
        </div>
      </div>

      {/* 2-Column Backup and Restore (Export/Import JSON) */}
      <div className="border-t border-[var(--color-surface-container-high)]/60 pt-6 space-y-4">
        <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Database Import & Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export Database */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface-container)]/30">
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                Export Database backup
              </h4>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                Export the entire database structure, configuration lists, profiles, courses, and events into a single JSON file.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to JSON
            </button>
          </div>

          {/* Import Database */}
          <div className="flex flex-col justify-between p-5 rounded-2xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface-container)]/30">
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                Import Database backup
              </h4>
              <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                Import and restore the database structure and records from a previously exported JSON backup file.
              </p>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={loading}
                className="hidden"
                id="database-import-file"
              />
              <label
                htmlFor="database-import-file"
                className="w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Select File & Import JSON
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal 
        isOpen={showResetModal} 
        onClose={() => {
          if (!loading) setShowResetModal(false);
        }} 
        title="Confirm Master Database Reset"
        size="sm"
      >
        <form onSubmit={handleReset} className="space-y-5">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 leading-relaxed font-semibold">
            ⚠️ WARNING: This will permanently destroy all records in the Firestore database (events, courses, user profiles, allowed registration lists). This cannot be undone.
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                Security Level
              </label>
              <input
                type="text"
                placeholder='Type "Omega"'
                value={securityLevel}
                onChange={(e) => setSecurityLevel(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface-container-lowest)] text-sm text-[var(--color-on-surface)] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-[var(--color-outline-variant)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                Protocol Name
              </label>
              <input
                type="password"
                placeholder='Type "Agamemnon Contingency"'
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-surface-container-high)] bg-[var(--color-surface-container-lowest)] text-sm text-[var(--color-on-surface)] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-[var(--color-outline-variant)]"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-500">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-500">
              {success}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 border-t border-[var(--color-surface-container-high)]">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-[var(--color-surface-container-high)] bg-transparent hover:bg-[var(--color-surface-container-low)] text-xs font-semibold text-[var(--color-on-surface-variant)] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || securityLevel !== 'Omega' || protocol !== 'Agamemnon Contingency'}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// =============================================
// ACTIVITY LOG TAB (Super Admin only)
// =============================================
function ActivityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const activityLogs = await getActivityLogs();
      setLogs(activityLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => 
    (log.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.user_reg_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.event_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Search activity logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-container)]/80 border border-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-sm placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
        <Button variant="secondary" onClick={loadLogs} className="shrink-0">
          Refresh Logs
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-surface-container)]/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-sm text-[var(--color-outline)] bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container)] rounded-2xl">
              No activity logs found.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
              const actionColors = {
                add: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
                edit: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
                delete: 'bg-red-500/15 text-red-500 border-red-500/20',
              };

              return (
                <div
                  key={log.id}
                  className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${actionColors[log.action] || 'bg-blue-500/15 text-blue-500'}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                        {log.event_title || 'Unnamed Event'}
                      </span>
                      <span className="text-xs text-[var(--color-outline)]">
                        by {log.user_name} ({log.user_reg_no})
                      </span>
                    </div>
                    {log.details && (
                      <pre className="text-xs text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)]/50 p-3 rounded-lg border border-[var(--color-surface-container-high)]/60 font-mono whitespace-pre-wrap leading-relaxed max-w-full">
                        {log.details}
                      </pre>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--color-outline)] font-bold shrink-0 self-end md:self-start">
                    {date.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// SEMESTER TAB (Admin only)
// =============================================
function SemesterTab({ showConfirm }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    current_semester: '7',
    batch_year: '2022/2023',
    start_date: '',
    end_date: '',
    mid_sem_break_start: '',
    mid_sem_break_end: '',
    study_leave_start: '',
    study_leave_end: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const settings = await getSemesterSettings();
      if (settings) {
        const toDateString = (ts) => {
          if (!ts) return '';
          const d = ts.toDate ? ts.toDate() : new Date(ts);
          return d.toISOString().split('T')[0];
        };
        setForm({
          current_semester: settings.current_semester || '7',
          batch_year: settings.batch_year || '2022/2023',
          start_date: toDateString(settings.start_date),
          end_date: toDateString(settings.end_date),
          mid_sem_break_start: toDateString(settings.mid_sem_break_start),
          mid_sem_break_end: toDateString(settings.mid_sem_break_end),
          study_leave_start: toDateString(settings.study_leave_start),
          study_leave_end: toDateString(settings.study_leave_end),
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load semester settings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    const toDateObject = (str) => {
      if (!str) return null;
      return new Date(str);
    };

    try {
      const payload = {
        current_semester: form.current_semester,
        batch_year: form.batch_year,
        start_date: toDateObject(form.start_date),
        end_date: toDateObject(form.end_date),
        mid_sem_break_start: toDateObject(form.mid_sem_break_start),
        mid_sem_break_end: toDateObject(form.mid_sem_break_end),
        study_leave_start: toDateObject(form.study_leave_start),
        study_leave_end: toDateObject(form.study_leave_end),
      };

      await updateSemesterSettings(payload);
      setSuccess('Semester configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition() {
    // Determine the next semester
    const currentSemNum = parseInt(form.current_semester, 10);
    if (isNaN(currentSemNum)) return;
    
    let nextSemNum = currentSemNum + 1;
    if (nextSemNum > 8) {
      nextSemNum = 1;
    }
    const nextSem = String(nextSemNum);

    // If odd semester, we also increment the senior batch year
    const isOdd = nextSemNum === 1 || nextSemNum === 3 || nextSemNum === 5 || nextSemNum === 7;
    let nextBatchYear = form.batch_year;
    if (isOdd) {
      const parts = form.batch_year.split('/');
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        nextBatchYear = `${start + 1}/${end + 1}`;
      }
    }

    const message = isOdd 
      ? `This will transition the system to Semester ${nextSem} and increment the active senior batch to ${nextBatchYear}. All students will automatically progress to their next academic year, resetting their elective courses. Do you want to proceed?`
      : `This will transition the system to Semester ${nextSem}. Student academic years will remain the same. Do you want to proceed?`;

    showConfirm(
      'Start Next Semester',
      message,
      async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
          // Progress students in Firestore
          await progressStudentsToNextSemester(nextSem);

          // Update semester settings
          const toDateObject = (str) => str ? new Date(str) : null;
          const payload = {
            current_semester: nextSem,
            batch_year: nextBatchYear,
            start_date: toDateObject(form.start_date),
            end_date: toDateObject(form.end_date),
            mid_sem_break_start: toDateObject(form.mid_sem_break_start),
            mid_sem_break_end: toDateObject(form.mid_sem_break_end),
            study_leave_start: toDateObject(form.study_leave_start),
            study_leave_end: toDateObject(form.study_leave_end),
          };
          await updateSemesterSettings(payload);
          await loadSettings();
          setSuccess(`Successfully transitioned to Semester ${nextSem}!`);
          setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
          console.error(err);
          setError(err.message || 'Transition failed.');
        } finally {
          setSaving(false);
        }
      },
      'Proceed',
      false
    );
  }

  // Display computed next semester
  const currentSemNum = parseInt(form.current_semester, 10);
  const nextSem = isNaN(currentSemNum) ? '' : String(currentSemNum === 8 ? 1 : currentSemNum + 1);

  return (
    <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-surface-container-high)]/60 rounded-3xl p-6 md:p-8 space-y-8 max-w-4xl mx-auto shadow-sm">
      <div className="flex items-center gap-4 text-[var(--color-primary)] mb-2 border-b border-[var(--color-surface-container-high)]/65 pb-5">
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-fixed)]/25 flex items-center justify-center border border-[var(--color-primary)]/20 shrink-0">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Semester & Recurrence Settings</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Configure active semesters, holiday exclusions, and student progression</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-500">
          {success}
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-[var(--color-surface-container-high)] rounded-lg" />
          <div className="h-10 bg-[var(--color-surface-container-high)] rounded-lg" />
          <div className="h-10 bg-[var(--color-surface-container-high)] rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              id="sem-select"
              label="Current Semester"
              value={form.current_semester}
              onChange={(e) => setForm({ ...form, current_semester: e.target.value })}
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' },
              ]}
            />

            <Input
              id="sem-batch"
              label="Active Senior Batch (Year 4)"
              placeholder="e.g. 2022/2023"
              value={form.batch_year}
              onChange={(e) => setForm({ ...form, batch_year: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="sem-start"
              label="Semester Start Date"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
            <Input
              id="sem-end"
              label="Semester End Date"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>

          <div className="border-t border-[var(--color-surface-container-high)]/60 pt-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--color-on-surface)]">Holiday & Break Exclusions</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Recurring calendar events will automatically exclude and skip these date ranges.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="break-start"
                label="Mid-Semester Break Start"
                type="date"
                value={form.mid_sem_break_start}
                onChange={(e) => setForm({ ...form, mid_sem_break_start: e.target.value })}
              />
              <Input
                id="break-end"
                label="Mid-Semester Break End"
                type="date"
                value={form.mid_sem_break_end}
                onChange={(e) => setForm({ ...form, mid_sem_break_end: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="leave-start"
                label="Exam Study Leave Start"
                type="date"
                value={form.study_leave_start}
                onChange={(e) => setForm({ ...form, study_leave_start: e.target.value })}
              />
              <Input
                id="leave-end"
                label="Exam Study Leave End"
                type="date"
                value={form.study_leave_end}
                onChange={(e) => setForm({ ...form, study_leave_end: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-[var(--color-surface-container-high)]/60">
            <Button
              onClick={handleTransition}
              disabled={saving}
              variant="secondary"
            >
              Start Semester {nextSem}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
