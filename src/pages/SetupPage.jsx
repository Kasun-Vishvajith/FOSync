import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCoursesForDegree, updateUserProfile } from '../lib/firestore';
import Button from '../components/ui/Button';
import { BookOpen, Check, ArrowRight, Sparkles, ShieldAlert, LogOut } from 'lucide-react';

export default function SetupPage() {
  const { userProfile, currentUser, refreshProfile, logOutAllDevices } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedElectives, setSelectedElectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const degreeCourses = await getCoursesForDegree(userProfile.degree);
        setCourses(degreeCourses);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userProfile?.degree) {
      loadCourses();
    }
  }, [userProfile?.degree]);

  useEffect(() => {
    if (userProfile?.electives) {
      setSelectedElectives(userProfile.electives);
    }
  }, [userProfile?.electives]);

  function toggleElective(courseId) {
    setSelectedElectives((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        electives: selectedElectives,
      });
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save electives:', err);
    } finally {
      setSaving(false);
    }
  }

  const coreCourses = courses.filter((c) => !c.is_elective);
  const electiveCourses = courses.filter((c) => c.is_elective);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header Area */}
      <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight mb-2">
            Configure Your Semester
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-lg">
            {userProfile?.degree} — {userProfile?.reg_no}
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} size="lg" className="shrink-0">
          Complete Setup
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Courses Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Core Courses</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">Automatically assigned to you.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface-container-high)] animate-pulse" />
              ))}
            </div>
          ) : coreCourses.length > 0 ? (
            <div className="space-y-4">
              {coreCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] flex items-center gap-4 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-[var(--color-outline-variant)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-on-surface)]">
                      {course.aliases?.[0] || course.course_id}
                    </h3>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">{course.course_id}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 text-center text-[var(--color-on-surface-variant)]">
              No core courses defined yet.
            </div>
          )}
        </section>

        {/* Elective Courses Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Elective Courses</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">Select your preferences.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-container-high)] animate-pulse" />
              ))}
            </div>
          ) : electiveCourses.length > 0 ? (
            <div className="space-y-4">
              {electiveCourses.map((course) => {
                const isSelected = selectedElectives.includes(course.course_id);
                return (
                  <label
                    key={course.id}
                    className="group relative cursor-pointer block"
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isSelected}
                      onChange={() => toggleElective(course.course_id)}
                    />
                    <div className={`
                      h-full p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4
                      ${isSelected 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-fixed)]/30 shadow-[var(--shadow-soft)]' 
                        : 'border-transparent bg-[var(--color-surface-container-lowest)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:bg-[var(--color-surface-container)]'
                      }
                    `}>
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${isSelected
                          ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                          : 'border-[var(--color-outline-variant)]'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`font-semibold text-lg truncate transition-colors ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}`}>
                            {course.aliases?.[0] || course.course_id}
                          </h3>
                        </div>
                        <p className="text-sm text-[var(--color-on-surface-variant)]">{course.course_id}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 text-center text-[var(--color-on-surface-variant)]">
              No elective courses available.
            </div>
          )}
        </section>
      </div>

      {/* Security Section */}
      <section className="animate-fade-in pt-8 border-t border-[var(--color-surface-container-high)]" style={{ animationDelay: '0.3s' }}>
        <div className="bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6 shadow-[var(--shadow-soft)]">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-error)] text-[var(--color-on-error)] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-[var(--color-error)] mb-2">Account Security</h2>
            <p className="text-[var(--color-on-surface-variant)] max-w-xl">
              If you left your account logged in on a public computer, you can force all active sessions to log out immediately.
            </p>
          </div>
          <Button 
            onClick={logOutAllDevices} 
            variant="danger"
            size="lg"
            className="shrink-0"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log out everywhere
          </Button>
        </div>
      </section>
    </div>
  );
}
