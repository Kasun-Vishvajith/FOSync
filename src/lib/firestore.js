import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from './firebase';
// ========================
// ACTIVITY LOGGING
// ========================

async function recordActivity(action, eventId, eventTitle, details = '') {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Fetch user profile from firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const profile = userDoc.exists() ? userDoc.data() : {};
    
    await addDoc(collection(db, 'activity_logs'), {
      timestamp: Timestamp.now(),
      user_id: currentUser.uid,
      user_name: profile.name || currentUser.email || 'Anonymous',
      user_reg_no: profile.reg_no || 'N/A',
      action, // 'add' | 'edit' | 'delete'
      event_id: eventId || '',
      event_title: eventTitle || '',
      details: details || ''
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function getActivityLogs() {
  const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ========================
// ALLOWED USERS
// ========================

export async function getAllowedUser(regNo) {
  const ref = doc(db, 'allowed_users', regNo);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllAllowedUsers() {
  const snap = await getDocs(collection(db, 'allowed_users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addAllowedUser(regNo, degree) {
  await setDoc(doc(db, 'allowed_users', regNo), { reg_no: regNo, degree });
}

export async function removeAllowedUser(regNo) {
  await deleteDoc(doc(db, 'allowed_users', regNo));
}

export async function bulkAddAllowedUsers(entries) {
  const promises = entries.map(({ reg_no, degree }) =>
    setDoc(doc(db, 'allowed_users', reg_no), { reg_no, degree })
  );
  await Promise.all(promises);
}

// ========================
// USERS
// ========================

export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserByRegNo(regNo) {
  const q = query(collection(db, 'users'), where('reg_no', '==', regNo));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    reg_no: data.reg_no,
    name: data.name,
    role: data.role || 'student',
    degree: data.degree,
    year: data.year || '3',
    batch: data.batch || '2022/2023',
    electives: data.electives || [],
    created_at: Timestamp.now(),
    ...(data.password ? { password: data.password } : {}),
    ...(data.email ? { email: data.email } : {}),
  });
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, 'users', uid));
}

// ========================
// COURSES
// ========================

export async function getCourse(courseId) {
  const ref = doc(db, 'courses', courseId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllCourses() {
  const snap = await getDocs(collection(db, 'courses'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function normalizeCourseId(id) {
  return id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export async function autoLinkCourses() {
  const courses = await getAllCourses();
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const cA = courses[i];
      const cB = courses[j];
      const sameCode = normalizeCourseId(cA.course_id) === normalizeCourseId(cB.course_id);
      const sameYear = cA.year && cB.year && cA.year === cB.year;
      
      if (sameCode && sameYear) {
        await linkCourses(cA.course_id, cB.course_id);
      } else if (sameCode && !sameYear) {
        if (cA.linked_courses?.includes(cB.course_id) || cB.linked_courses?.includes(cA.course_id)) {
          await unlinkCourses(cA.course_id, cB.course_id);
        }
      }
    }
  }
}

export async function addCourse(courseId, data) {
  const ref = doc(db, 'courses', courseId);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const existingData = snap.data();
    const mergedDegrees = Array.from(new Set([...(existingData.degrees || []), ...(data.degrees || [])]));
    const mergedAliases = Array.from(new Set([...(existingData.aliases || []), ...(data.aliases || [])]));
    
    await updateDoc(ref, {
      aliases: mergedAliases,
      degrees: mergedDegrees,
      is_elective: existingData.is_elective || data.is_elective,
      semester: data.semester || existingData.semester || '',
      credits: data.credits || existingData.credits || 0,
      year: data.year || existingData.year || '',
      linked_courses: Array.from(new Set([...(existingData.linked_courses || []), ...(data.linked_courses || [])]))
    });
  } else {
    await setDoc(ref, {
      course_id: courseId,
      aliases: data.aliases || [],
      degrees: data.degrees || [],
      is_elective: data.is_elective || false,
      semester: data.semester || '',
      credits: data.credits || 0,
      year: data.year || '',
      linked_courses: data.linked_courses || [],
    });
  }
  await autoLinkCourses();
}

export async function updateCourse(courseId, data) {
  await updateDoc(doc(db, 'courses', courseId), data);
  await autoLinkCourses();
}

export async function deleteCourse(courseId) {
  await deleteDoc(doc(db, 'courses', courseId));
}

export async function bulkAddCourses(coursesData) {
  const mergedBatch = {};
  for (const c of coursesData) {
    const id = c.course_id.toUpperCase();
    if (mergedBatch[id]) {
      mergedBatch[id].degrees = Array.from(new Set([...mergedBatch[id].degrees, ...(c.degrees || [])]));
      mergedBatch[id].aliases = Array.from(new Set([...mergedBatch[id].aliases, ...(c.aliases || [])]));
      mergedBatch[id].is_elective = mergedBatch[id].is_elective || c.is_elective;
    } else {
      mergedBatch[id] = { ...c };
    }
  }

  const promises = Object.keys(mergedBatch).map(async (courseId) => {
    const ref = doc(db, 'courses', courseId);
    const snap = await getDoc(ref);
    const data = mergedBatch[courseId];
    
    if (snap.exists()) {
      const existingData = snap.data();
      const mergedDegrees = Array.from(new Set([...(existingData.degrees || []), ...(data.degrees || [])]));
      const mergedAliases = Array.from(new Set([...(existingData.aliases || []), ...(data.aliases || [])]));
      
      await updateDoc(ref, {
        aliases: mergedAliases,
        degrees: mergedDegrees,
        is_elective: existingData.is_elective || data.is_elective,
        semester: data.semester || existingData.semester || '',
        credits: data.credits || existingData.credits || 0,
        year: data.year || existingData.year || '',
        linked_courses: Array.from(new Set([...(existingData.linked_courses || []), ...(data.linked_courses || [])]))
      });
    } else {
      await setDoc(ref, {
        course_id: courseId,
        aliases: data.aliases || [],
        degrees: data.degrees || [],
        is_elective: data.is_elective || false,
        semester: data.semester || '',
        credits: data.credits || 0,
        year: data.year || '',
        linked_courses: data.linked_courses || [],
      });
    }
  });

  await Promise.all(promises);
  await autoLinkCourses();
}

export async function getCoursesForDegree(degree) {
  const q = query(
    collection(db, 'courses'),
    where('degrees', 'array-contains', degree)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function linkCourses(courseIdA, courseIdB) {
  if (courseIdA === courseIdB) return;
  const refA = doc(db, 'courses', courseIdA);
  const refB = doc(db, 'courses', courseIdB);

  await updateDoc(refA, {
    linked_courses: arrayUnion(courseIdB)
  });
  await updateDoc(refB, {
    linked_courses: arrayUnion(courseIdA)
  });
}

export async function unlinkCourses(courseIdA, courseIdB) {
  const refA = doc(db, 'courses', courseIdA);
  const refB = doc(db, 'courses', courseIdB);

  await updateDoc(refA, {
    linked_courses: arrayRemove(courseIdB)
  });
  await updateDoc(refB, {
    linked_courses: arrayRemove(courseIdA)
  });
}

// ========================
// EVENTS
// ========================

export async function getAllEvents() {
  const q = query(collection(db, 'events'), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addEvent(data) {
  const ref = await addDoc(collection(db, 'events'), {
    course_id: data.course_id,
    title: data.title,
    date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
    ...(data.end_date ? { end_date: data.end_date instanceof Date ? Timestamp.fromDate(data.end_date) : data.end_date } : {}),
    type: data.type,
    note: data.note || '',
    created_by: data.created_by || '',
  });

  // Log activity
  const dateStr = data.date instanceof Date ? data.date.toLocaleString() : new Date(data.date).toLocaleString();
  await recordActivity('add', ref.id, data.title, `Added new event for course ${data.course_id} on ${dateStr}`);

  return ref.id;
}

export async function updateEvent(eventId, data) {
  const ref = doc(db, 'events', eventId);
  const snap = await getDoc(ref);
  const oldData = snap.exists() ? snap.data() : null;

  const updateData = { ...data };
  if (updateData.date instanceof Date) {
    updateData.date = Timestamp.fromDate(updateData.date);
  }
  if (updateData.end_date instanceof Date) {
    updateData.end_date = Timestamp.fromDate(updateData.end_date);
  }
  await updateDoc(ref, updateData);

  // Log activity
  if (oldData) {
    const changes = [];
    if (oldData.title !== updateData.title) {
      changes.push(`Title: "${oldData.title}" ➔ "${updateData.title}"`);
    }
    if (oldData.course_id !== updateData.course_id) {
      changes.push(`Course: "${oldData.course_id}" ➔ "${updateData.course_id}"`);
    }
    if (oldData.type !== updateData.type) {
      changes.push(`Type: "${oldData.type}" ➔ "${updateData.type}"`);
    }
    if (oldData.note !== updateData.note) {
      changes.push(`Note: "${oldData.note || ''}" ➔ "${updateData.note || ''}"`);
    }
    
    // Compare dates
    const oldDateStr = oldData.date?.toDate ? oldData.date.toDate().toLocaleString() : new Date(oldData.date).toLocaleString();
    const newDateStr = updateData.date?.toDate ? updateData.date.toDate().toLocaleString() : new Date(updateData.date).toLocaleString();
    if (oldDateStr !== newDateStr) {
      changes.push(`Date: "${oldDateStr}" ➔ "${newDateStr}"`);
    }

    const details = changes.length > 0 ? `Edited fields:\n${changes.join('\n')}` : 'No visible fields changed.';
    await recordActivity('edit', eventId, updateData.title, details);
  }
}

export async function deleteEvent(eventId) {
  const ref = doc(db, 'events', eventId);
  const snap = await getDoc(ref);
  const oldData = snap.exists() ? snap.data() : null;

  await deleteDoc(ref);

  // Log activity
  if (oldData) {
    await recordActivity('delete', eventId, oldData.title, `Deleted event of type ${oldData.type} for course ${oldData.course_id}`);
  }
}

export async function getEventsForCourses(courseIds) {
  if (!courseIds.length) return [];
  // Firestore 'in' queries support max 30 values
  const chunks = [];
  for (let i = 0; i < courseIds.length; i += 30) {
    chunks.push(courseIds.slice(i, i + 30));
  }
  const results = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, 'events'),
      where('course_id', 'in', chunk)
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  
  // Sort in memory by date to avoid requiring a composite Firestore index
  return results.sort((a, b) => {
    const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return da - db;
  });
}

export async function resetDatabase(currentUid, currentProfile) {
  const collections = ['events', 'users', 'allowed_users', 'courses', 'activity_logs'];
  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    const deletePromises = snap.docs
      .filter(d => {
        // Always delete admin99 and user99 profiles/allowed documents
        if (collName === 'users' && d.data()?.reg_no === 'admin99') return true;
        if (collName === 'allowed_users' && d.id === 'admin99') return true;
        if (collName === 'users' && d.data()?.reg_no === 'user99') return true;
        if (collName === 'allowed_users' && d.id === 'user99') return true;

        if (collName === 'users' && currentUid && d.id === currentUid) return false;
        if (collName === 'allowed_users' && currentProfile?.reg_no && d.id === currentProfile.reg_no) return false;
        return true;
      })
      .map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  }
  // Automatically restore default courses and allowed users to prevent corrupting the system structure
  await seedDefaultData();
}


export const DEFAULT_COURSES = [
  {
    course_id: 'DS 4007',
    aliases: ['Data Science II', 'Data Science Project'],
    degrees: ['Data Science'],
    is_elective: false,
    semester: '7',
    credits: 3,
    year: '4'
  },
  {
    course_id: 'DS 4001',
    aliases: ['Machine Learning'],
    degrees: ['Data Science'],
    is_elective: false,
    semester: '7',
    credits: 3,
    year: '4'
  },
  {
    course_id: 'STAT 201',
    aliases: ['Statistical Inference'],
    degrees: ['Statistics', 'Data Science', 'Applied Statistics', 'Industrial Statistics'],
    is_elective: false,
    semester: '3',
    credits: 3,
    year: '2'
  },
  {
    course_id: 'AS 3001',
    aliases: ['Applied Multivariate Analysis'],
    degrees: ['Applied Statistics', 'Statistics'],
    is_elective: false,
    semester: '5',
    credits: 3,
    year: '3'
  },
  {
    course_id: 'AS 4001',
    aliases: ['Applied Time Series Analysis'],
    degrees: ['Applied Statistics'],
    is_elective: true,
    semester: '7',
    credits: 3,
    year: '4'
  },
  {
    course_id: 'IS 2002',
    aliases: ['Industrial Statistics and Quality Control'],
    degrees: ['Industrial Statistics'],
    is_elective: false,
    semester: '4',
    credits: 3,
    year: '2'
  },
  {
    course_id: 'ST 1001',
    aliases: ['Introduction to Probability'],
    degrees: ['Statistics', 'Data Science', 'Applied Statistics', 'Industrial Statistics'],
    is_elective: false,
    semester: '1',
    credits: 3,
    year: '1'
  }
];

export async function seedDefaultData() {
  await bulkAddCourses(DEFAULT_COURSES);
  await addAllowedUser('2022s19535', 'Data Science');
}

export async function exportDatabase() {
  const collections = ['events', 'users', 'allowed_users', 'courses'];
  const data = {};
  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    data[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return data;
}

function restoreTimestamps(data, collName) {
  if (!data) return data;
  const timestampFields = {
    users: ['created_at', 'session_valid_after'],
    events: ['date', 'end_date']
  };
  
  const fields = timestampFields[collName] || [];
  const restored = { ...data };
  
  for (const field of fields) {
    if (restored[field]) {
      const val = restored[field];
      if (val && typeof val === 'object' && 'seconds' in val) {
        restored[field] = new Timestamp(val.seconds, val.nanoseconds || 0);
      } else if (typeof val === 'string' || typeof val === 'number') {
        restored[field] = Timestamp.fromDate(new Date(val));
      }
    }
  }
  return restored;
}

export async function importDatabase(data) {
  const collections = ['events', 'users', 'allowed_users', 'courses'];
  for (const collName of collections) {
    const docs = data[collName] || [];
    for (const docData of docs) {
      const { id, ...fields } = docData;
      if (!id) continue;
      
      const processedFields = restoreTimestamps(fields, collName);
      await setDoc(doc(db, collName, id), processedFields);
    }
  }
}

export async function getSemesterSettings() {
  const ref = doc(db, 'system_settings', 'semester');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  const defaultSettings = {
    current_semester: '7',
    batch_year: '2022/2023',
    start_date: Timestamp.fromDate(new Date('2026-03-01')),
    end_date: Timestamp.fromDate(new Date('2026-07-31')),
    mid_sem_break_start: Timestamp.fromDate(new Date('2026-05-01')),
    mid_sem_break_end: Timestamp.fromDate(new Date('2026-05-07')),
    study_leave_start: Timestamp.fromDate(new Date('2026-07-15')),
    study_leave_end: Timestamp.fromDate(new Date('2026-07-25'))
  };
  await setDoc(ref, defaultSettings);
  return defaultSettings;
}

export async function updateSemesterSettings(settings) {
  const ref = doc(db, 'system_settings', 'semester');
  await setDoc(ref, settings, { merge: true });
}

export async function progressStudentsToNextSemester(newSemester) {
  const snap = await getDocs(collection(db, 'users'));
  const promises = snap.docs.map(async (uDoc) => {
    const data = uDoc.data();
    if (data.role === 'student') {
      const currentYearNum = parseInt(data.year || '3', 10);
      let nextYear = String(currentYearNum);
      let clearElectives = false;
      if (newSemester === '3' || newSemester === '5' || newSemester === '7') {
        nextYear = String(currentYearNum + 1);
        clearElectives = true;
      }
      const updates = {
        year: nextYear,
        ...(clearElectives ? { electives: [] } : {})
      };
      await updateDoc(uDoc.ref, updates);
    }
  });
  await Promise.all(promises);
}


