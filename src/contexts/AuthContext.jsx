import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile, getAllowedUser, getUserByRegNo } from '../lib/firestore';
import { regNoToEmail, validateRegNo } from '../utils/helpers';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup(regNo, name, password) {
    // 1. Validate format
    if (!validateRegNo(regNo)) {
      throw new Error('Invalid registration number format. Expected: YYYYsXXXXX (e.g., 2022s19001)');
    }

    // 2. Check whitelist
    const allowed = await getAllowedUser(regNo);
    if (!allowed) {
      throw new Error('This registration number is not in the approved list. Contact your department.');
    }

    // 3. Check for duplicate registration
    const existing = await getUserByRegNo(regNo);
    if (existing) {
      throw new Error('This registration number is already registered.');
    }

    // 4. Create Firebase Auth account
    const email = regNoToEmail(regNo);
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    // 5. Create Firestore profile
    await createUserProfile(credential.user.uid, {
      reg_no: regNo,
      name,
      degree: allowed.degree,
      role: 'student',
      electives: [],
    });

    // 6. Refresh profile
    const profile = await getUserProfile(credential.user.uid);
    setUserProfile(profile);

    return credential.user;
  }

  async function login(regNo, password) {
    if (!validateRegNo(regNo)) {
      throw new Error('Invalid registration number format. Expected: YYYYsXXXXX (e.g., 2022s19001)');
    }
    const email = regNoToEmail(regNo);
    const credential = await signInWithEmailAndPassword(auth, email, password);

    const profile = await getUserProfile(credential.user.uid);
    setUserProfile(profile);

    return credential.user;
  }

  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function refreshProfile() {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    refreshProfile,
    isAdmin: userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
    isSuperAdmin: userProfile?.role === 'super_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
