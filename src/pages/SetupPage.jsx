import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCoursesForDegree, updateUserProfile } from '../lib/firestore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { BookOpen, Check, ArrowRight, Sparkles, ShieldAlert, LogOut, User } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { useEvents } from '../contexts/EventsContext';

export default function SetupPage() {
  const { userProfile, currentUser, refreshProfile, logOutAllDevices } = useAuth();
  const navigate = useNavigate();
  const { semesterSettings } = useEvents();
  const [courses, setCourses] = useState([]);
  const [selectedElectives, setSelectedElectives] = useState([]);
  const [batch, setBatch] = useState('2022/2023');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const degreeCourses = await getCoursesForDegree(userProfile.degree);
        setCourses(degreeCourses);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        Promise.resolve().then(() => setLoading(false));
      }
    }

    if (userProfile?.degree) {
      loadCourses();
    } else {
      Promise.resolve().then(() => setLoading(false));
    }
  }, [userProfile?.degree]);

  useEffect(() => {
    if (userProfile && !isInitialized) {
      Promise.resolve().then(() => {
        if (userProfile.electives) setSelectedElectives(userProfile.electives);
        if (userProfile.batch) setBatch(userProfile.batch);
        if (userProfile.name) setName(userProfile.name);
        setIsInitialized(true);
      });
    }
  }, [userProfile, isInitialized]);

  function toggleElective(courseId) {
    setSelectedElectives((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  }

  // Compute academic year dynamically
  let computedYear = '3';
  if (batch && semesterSettings?.batch_year) {
    const studentStart = parseInt(batch.split('/')[0], 10);
    const systemStart = parseInt(semesterSettings.batch_year.split('/')[0], 10);
    if (!isNaN(studentStart) && !isNaN(systemStart)) {
      computedYear = String(Math.max(3, Math.min(4, 4 - (studentStart - systemStart))));
    }
  }

  async function handleSave() {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      if (password) {
        await updatePassword(currentUser, password);
      }

      const updates = {
        electives: selectedElectives,
        batch: batch,
        year: computedYear,
        name: name.trim(),
      };
      if (password) {
        updates.password = password;
      }

      await updateUserProfile(currentUser.uid, updates);
      await refreshProfile();
      setSuccess('Profile and settings saved successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err.message || 'Failed to save setup data.');
    } finally {
      setSaving(false);
    }
  }

  const coreCourses = courses.filter((c) => !c.is_elective && c.year === computedYear);
  const electiveCourses = courses.filter((c) => c.is_elective && c.year === computedYear);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header Area */}
      <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight mb-2">
            Profile & Curriculum Settings
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-lg">
            {userProfile?.degree} — {userProfile?.reg_no}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings Panel */}
        <section className="lg:col-span-1 space-y-6 animate-fade-in">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 border border-[var(--color-surface-container)] shadow-[var(--shadow-soft)] space-y-6">
            <div className="flex items-center gap-3 border-b border-[var(--color-surface-container)] pb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Edit Profile</h2>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="p-3.5 rounded-xl text-sm font-semibold border-2 border-[var(--color-error)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] animate-fade-in">
                ⚠ {error}
              </div>
            )}

            {/* Success Feedback */}
            {success && (
              <div className="p-3.5 rounded-xl text-sm font-semibold border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 animate-fade-in">
                ✓ {success}
              </div>
            )}

            <div className="space-y-4">
              {/* Name Field */}
              <Input
                id="profile-name"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />

              {/* Batch Field */}
              <div className="space-y-1.5">
                <label htmlFor="profile-batch" className="block text-sm font-medium text-[var(--color-on-surface)]">
                  Batch Year (Computes Year {computedYear})
                </label>
                <select
                  id="profile-batch"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
                >
                  <option value="2022/2023">2022/2023</option>
                  <option value="2023/2024">2023/2024</option>
                </select>
              </div>

              {/* Change Password Divider */}
              <div className="pt-2 border-t border-[var(--color-surface-container)]" />

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Change Password</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)]">Leave blank if you don't want to change it.</p>
              </div>

              {/* New Password Field */}
              <Input
                id="profile-pwd"
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />

              {/* Confirm Password Field */}
              <Input
                id="profile-confirm-pwd"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              loading={saving}
              className="w-full py-3 mt-4"
              size="lg"
            >
              Save Profile
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </section>

        {/* Right Column: Courses Configuration */}
        <div className="lg:col-span-2 space-y-8">
          {/* Core Courses Section */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Core Courses</h2>
                <p className="text-sm text-[var(--color-on-surface-variant)]">Automatically assigned to you for Year {computedYear}.</p>
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
                No core courses defined yet for Year {computedYear}.
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
                <p className="text-sm text-[var(--color-on-surface-variant)]">Select your preferences for Year {computedYear}.</p>
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
                No elective courses available for Year {computedYear}.
              </div>
            )}
          </section>
        </div>
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
