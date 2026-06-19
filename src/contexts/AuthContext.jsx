import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
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
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          
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

  async function signup(regNo, name, password) {

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

  async function login(regNo, password, rememberMe = true) {
    const email = regNoToEmail(regNo);

    // Apply persistence preference
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);

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

  async function logOutAllDevices() {
    if (!currentUser) return;
    
    // Set a timestamp representing the exact moment all older sessions become invalid.
    // In firestore.js we don't have Timestamp directly imported here, so we use JS Date.
    // updateUserProfile will handle saving the JS date to Firestore as a Timestamp (if we use Timestamp.fromDate, or we just pass the Date)
    const { Timestamp } = await import('firebase/firestore');
    
    await import('../lib/firestore').then(m => 
      m.updateUserProfile(currentUser.uid, {
        session_valid_after: Timestamp.now()
      })
    );
    
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
