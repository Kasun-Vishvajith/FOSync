import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCoursesForDegree } from '../lib/firestore';
import { updateUserProfile } from '../lib/firestore';
import Button from '../components/ui/Button';
import { BookOpen, Check, ArrowRight, Sparkles } from 'lucide-react';

export default function SetupPage() {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedElectives, setSelectedElectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.degree) {
      loadCourses();
    }
  }, [userProfile?.degree]);

  useEffect(() => {
    if (userProfile?.electives) {
      setSelectedElectives(userProfile.electives);
    }
  }, [userProfile?.electives]);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">
              Set Up Your Courses
            </h1>
            <p className="text-sm text-surface-400">
              {userProfile?.degree} — {userProfile?.reg_no}
            </p>
          </div>
        </div>
      </div>

      {/* Core Courses */}
      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-lg font-semibold text-surface-200 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-400" />
          Core Courses
        </h2>
        <p className="text-sm text-surface-400 mb-4">
          These are automatically assigned based on your degree.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-800/50 animate-pulse" />
            ))}
          </div>
        ) : coreCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreCourses.map((course) => (
              <div
                key={course.id}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">
                    {course.aliases?.[0] || course.course_id}
                  </p>
                  <p className="text-xs text-surface-500">{course.course_id}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-500 italic">
            No core courses defined yet. Ask an admin to add courses.
          </p>
        )}
      </section>

      {/* Elective Courses */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-lg font-semibold text-surface-200 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Elective Courses
        </h2>
        <p className="text-sm text-surface-400 mb-4">
          Select the elective courses you&apos;re enrolled in.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-800/50 animate-pulse" />
            ))}
          </div>
        ) : electiveCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {electiveCourses.map((course) => {
              const isSelected = selectedElectives.includes(course.course_id);
              return (
                <button
                  key={course.id}
                  onClick={() => toggleElective(course.course_id)}
                  className={`
                    rounded-xl px-4 py-3 flex items-center gap-3 text-left
                    transition-all duration-200 cursor-pointer
                    ${
                      isSelected
                        ? 'bg-primary-600/15 border border-primary-500/30 shadow-lg shadow-primary-600/10'
                        : 'glass hover:bg-surface-700/40'
                    }
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      transition-all duration-200
                      ${
                        isSelected
                          ? 'bg-primary-600 shadow-md'
                          : 'bg-surface-700 border border-surface-600'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary-300' : 'text-surface-200'}`}>
                      {course.aliases?.[0] || course.course_id}
                    </p>
                    <p className="text-xs text-surface-500">{course.course_id}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-surface-500 italic">
            No elective courses available for your degree yet.
          </p>
        )}
      </section>

      {/* Save Button */}
      <div className="flex justify-end animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Button onClick={handleSave} loading={saving} size="lg">
          Save & Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
