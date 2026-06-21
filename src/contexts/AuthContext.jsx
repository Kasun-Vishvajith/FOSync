import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  updatePassword
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile, getAllowedUser, getUserByRegNo, updateUserProfile } from '../lib/firestore';
import { regNoToEmail } from '../utils/helpers';
import { Timestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
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
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (!profile) {
            console.warn('User profile does not exist in Firestore. Signing out.');
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }
          
          // Check for 'log out from all devices' validity
          if (profile?.session_valid_after) {
            // Get the token's issue time (auth_time is in seconds)
            const tokenResult = await user.getIdTokenResult();
            const authTime = new Date(tokenResult.claims.auth_time * 1000).getTime();
            const validAfter = profile.session_valid_after.toMillis();
            
            if (authTime < validAfter) {
              // This session is older than the last "log out of all devices" event
              console.warn("Session invalidated because of 'log out of all devices'");
              await signOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
              setLoading(false);
              return;
            }
          }
          
          setCurrentUser(user);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setUserProfile(null);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup(regNo, name, password, batch) {

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
    let email = regNoToEmail(regNo);
    let credential;
    let emailSuffix = 0;
    
    while (!credential) {
      try {
        credential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          // If the Firestore profile is missing but the Auth account is in use,
          // it's orphaned. Use an email variant.
          emailSuffix++;
          email = `${regNo}_${emailSuffix}@fosync.local`;
        } else {
          throw err;
        }
      }
    }

    // Calculate academic year from batch and semester settings
    const { getSemesterSettings } = await import('../lib/firestore');
    const semSettings = await getSemesterSettings();
    let calculatedYear = '3';
    if (batch && semSettings?.batch_year) {
      const studentStart = parseInt(batch.split('/')[0], 10);
      const systemStart = parseInt(semSettings.batch_year.split('/')[0], 10);
      if (!isNaN(studentStart) && !isNaN(systemStart)) {
        calculatedYear = String(Math.max(3, Math.min(4, 4 - (studentStart - systemStart))));
      }
    }

    // 5. Create Firestore profile
    await createUserProfile(credential.user.uid, {
      reg_no: regNo,
      name,
      degree: allowed.degree,
      role: 'student',
      batch: batch || '2022/2023',
      year: calculatedYear,
      electives: [],
      password: password,
      email: email,
    });

    // 6. Refresh profile
    const profile = await getUserProfile(credential.user.uid);
    setUserProfile(profile);

    return credential.user;
  }

  async function login(regNo, password, rememberMe = true) {
    // Fetch user profile first
    const existingProfile = await getUserByRegNo(regNo.trim().toLowerCase());
    const email = existingProfile?.email || regNoToEmail(regNo);

    // Apply persistence preference
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);

    let credential;
    if (existingProfile && existingProfile.authPasswordNeedsReset && password === 'FOS123') {
      // Use oldPassword to authenticate with Firebase Auth
      credential = await signInWithEmailAndPassword(auth, email, existingProfile.oldPassword);
      // Immediately update Firebase Auth password to 'FOS123'
      await updatePassword(credential.user, 'FOS123');
      // Update firestore profile to remove old password flags
      await updateUserProfile(credential.user.uid, {
        authPasswordNeedsReset: false,
        oldPassword: '',
        password: 'FOS123'
      });
    } else {
      credential = await signInWithEmailAndPassword(auth, email, password);
    }

    const profile = await getUserProfile(credential.user.uid);
    
    // Sync firestore password field if missing or mismatched
    if (profile && (!profile.password || (profile.password !== password && !profile.authPasswordNeedsReset))) {
      await updateUserProfile(credential.user.uid, { password: password });
      profile.password = password;
    }

    setUserProfile(profile);

    return credential.user;
  }

  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function logOutAllDevices() {
    if (!currentUser) return;
    
    // Set a timestamp representing the exact moment all older sessions become invalid.
    await updateUserProfile(currentUser.uid, {
      session_valid_after: Timestamp.now()
    });
    
    // Automatically signs the user out of *this* device too
    await logout();
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
    logOutAllDevices,
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
