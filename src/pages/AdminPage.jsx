import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllEvents, addEvent, updateEvent, deleteEvent,
  getAllCourses, addCourse, updateCourse, deleteCourse, bulkAddCourses, linkCourses, unlinkCourses,
  getAllUsers, updateUserProfile, deleteUser as deleteUserDoc,
  getAllAllowedUsers, addAllowedUser, removeAllowedUser, bulkAddAllowedUsers,
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
} from 'lucide-react';

// =============================================
// MAIN ADMIN PAGE
// =============================================
export default function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('events');

  const tabs = [
    { id: 'events', label: 'Events', icon: CalendarPlus },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'links', label: 'Link Courses', icon: LinkIcon },
    ...(isSuperAdmin
      ? [
          { id: 'users', label: 'Users', icon: Users },
          { id: 'allowed', label: 'Allowed Users', icon: UserCheck },
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
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'courses' && <CoursesTab />}
        {activeTab === 'links' && <CourseLinkerTab />}
        {activeTab === 'users' && isSuperAdmin && <UsersTab />}
        {activeTab === 'allowed' && isSuperAdmin && <AllowedUsersTab />}
      </div>
    </div>
  );
}

// =============================================
// EVENTS TAB
// =============================================
function EventsTab() {
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
    setForm({ course_id: '', title: '', date: '', type: 'lecture' });
    setShowModal(true);
  }

  function openEdit(event) {
    setEditing(event);
    const d = event.date?.toDate ? event.date.toDate() : new Date(event.date);
    setForm({
      course_id: event.course_id,
      title: event.title,
      date: d.toISOString().slice(0, 16),
      type: event.type,
    });
    setShowModal(true);
  }

  async function handleSave() {
    const data = {
      course_id: form.course_id,
      title: form.title,
      date: new Date(form.date),
      type: form.type,
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
    if (!confirm('Delete this event?')) return;
    try {
      await deleteEvent(eventId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
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
          <Select
            id="event-type"
            label="Event Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={EVENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
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
function CoursesTab() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [courseCsvData, setCourseCsvData] = useState('');

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
    if (!confirm('Delete this course? Events linked to it will remain.')) return;
    try {
      await deleteCourse(courseId);
      await loadCourses();
    } catch (err) {
      console.error(err);
    }
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
        
        // Simple CSV split (not handling quoted commas perfectly, but sufficient for simple data)
        const parts = line.split(',').map((s) => s.trim());
        if (parts.length < 9) continue; // Need at least up to credits

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setShowCsvModal(true)}>
          <Upload className="w-4 h-4" />
          CSV Upload
        </Button>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--color-surface-container)]/50 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-outline)]">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No courses yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
          {courses.map((course) => (
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
// USERS TAB (Super Admin only)
// =============================================
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    const newRole =
      user.role === 'admin' ? 'student' : 'admin';
    try {
      await updateUserProfile(user.id, { role: newRole });
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteUser(user) {
    if (user.role === 'super_admin') return;
    if (!confirm(`Remove ${user.name} (${user.reg_no})? This removes their Firestore profile only.`))
      return;
    try {
      await deleteUserDoc(user.id);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  }

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
                  <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--color-outline)]">{user.reg_no} • {user.degree}</p>
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
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAdmin(user)}
                    >
                      {user.role === 'admin' ? 'Demote' : 'Promote'}
                    </Button>
                    <button
                      onClick={() => handleDeleteUser(user)}
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
    </div>
  );
}

// =============================================
// ALLOWED USERS TAB (Super Admin only)
// =============================================
function AllowedUsersTab() {
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

  async function handleRemove(regNo) {
    if (!confirm(`Remove ${regNo} from allowed list?`)) return;
    try {
      await removeAllowedUser(regNo);
      await loadAllowed();
    } catch (err) {
      console.error(err);
    }
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
                onClick={() => handleRemove(user.reg_no)}
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
function CourseLinkerTab() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCourseId, setDraggedCourseId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [dragCurrentPos, setDragCurrentPos] = useState(null);
  const [newlyLinkedIds, setNewlyLinkedIds] = useState([]);

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
    setDraggedCourseId(courseId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }

  function handleDrag(e) {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore drag end artifact
    setDragCurrentPos({ x: e.clientX, y: e.clientY });
  }

  async function handleUnlink(courseIdA, courseIdB) {
    if (!confirm('Are you sure you want to unlink these courses?')) return;
    try {
      await unlinkCourses(courseIdA, courseIdB);
      await loadCourses();
    } catch (err) {
      console.error(err);
    }
  }

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
    <div className="space-y-4 relative">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {DEGREES.map((degree) => {
          let degreeCourses = courses.filter((c) => c.degrees?.includes(degree));
          
          // Sort linked courses to the top
          degreeCourses.sort((a, b) => {
            const aHasLinks = (a.linked_courses?.length || 0) > 0;
            const bHasLinks = (b.linked_courses?.length || 0) > 0;
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
                  const hasLinks = course.linked_courses?.length > 0;
                  return (
                    <div
                      key={course.course_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, course.course_id)}
                      onDrag={(e) => handleDrag(e)}
                      onDragEnd={clearDragState}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, course.course_id)}
                      className={`
                        relative bg-[var(--color-surface-container-lowest)] 
                        shadow-[var(--shadow-soft)] rounded-xl p-3 
                        transition-colors cursor-grab active:cursor-grabbing
                        ${hasLinks 
                          ? 'border-2 border-green-500/80 shadow-[0_0_12px_rgba(34,197,94,0.3)]' 
                          : 'border border-[var(--color-surface-container-high)]/50 hover:border-[var(--color-primary)]/50'
                        }
                      `}
                    >
                      {/* Ripple Effect Background - ONLY on active link creation */}
                      {newlyLinkedIds.includes(course.course_id) && (
                        <div className="absolute inset-0 rounded-xl border-4 border-green-400 animate-[ping_1s_cubic-bezier(0,0,0.2,1)_1] pointer-events-none" />
                      )}
                      {/* Wire / Green Line indicator */}
                      {hasLinks && (
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-green-500 rounded-l-md pointer-events-none" />
                      )}
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-sm font-bold text-[var(--color-primary)]">
                        {course.course_id}
                      </div>
                    </div>
                    <div className="text-sm text-[var(--color-on-surface)] font-medium line-clamp-2 mb-2">
                      {course.aliases?.[0] || 'Unnamed Course'}
                    </div>

                    {/* Show existing links */}
                    {course.linked_courses?.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-[var(--color-surface-container-high)]/50 flex flex-wrap gap-1.5">
                        {course.linked_courses.map(linkedId => (
                          <div 
                            key={linkedId}
                            className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-[var(--color-surface-container-high)] text-xs text-[var(--color-on-surface-variant)]"
                          >
                            <Link2 className="w-3 h-3 text-[var(--color-on-surface-variant)]" />
                            {linkedId}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUnlink(course.course_id, linkedId); }}
                              className="ml-1 p-0.5 rounded-sm hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              title="Unlink"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
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
