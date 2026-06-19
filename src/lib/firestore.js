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
import { db } from './firebase';

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
    electives: data.electives || [],
    created_at: Timestamp.now(),
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

export async function addCourse(courseId, data) {
  await setDoc(doc(db, 'courses', courseId), {
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

export async function updateCourse(courseId, data) {
  await updateDoc(doc(db, 'courses', courseId), data);
}

export async function deleteCourse(courseId) {
  await deleteDoc(doc(db, 'courses', courseId));
}

export async function bulkAddCourses(coursesData) {
  const promises = coursesData.map(c => 
    setDoc(doc(db, 'courses', c.course_id), {
      course_id: c.course_id,
      aliases: c.aliases || [],
      degrees: c.degrees || [],
      is_elective: c.is_elective || false,
      semester: c.semester || '',
      credits: c.credits || 0,
      year: c.year || '',
      linked_courses: c.linked_courses || [],
    })
  );
  await Promise.all(promises);
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
    type: data.type,
    created_by: data.created_by || '',
  });
  return ref.id;
}

export async function updateEvent(eventId, data) {
  const updateData = { ...data };
  if (updateData.date instanceof Date) {
    updateData.date = Timestamp.fromDate(updateData.date);
  }
  await updateDoc(doc(db, 'events', eventId), updateData);
}

export async function deleteEvent(eventId) {
  await deleteDoc(doc(db, 'events', eventId));
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
      where('course_id', 'in', chunk),
      orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    results.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }
  return results;
}
