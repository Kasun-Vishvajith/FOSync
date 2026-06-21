import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, addAllowedUser, createUserProfile } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Button from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function AdminSetupPage() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleUpgrade() {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!currentUser) {
        throw new Error('You must be logged in first.');
      }
      
      await updateUserProfile(currentUser.uid, {
        role: 'super_admin'
      });
      
      await refreshProfile();
      setSuccess('Successfully upgraded to Super Admin! Redirecting...');
      
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upgrade account.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDummies() {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Add to allowed users
      await addAllowedUser('2022s19535', 'Data Science');

      // 2. Create Admin Account
      try {
        const cred1 = await createUserWithEmailAndPassword(auth, '2022s19535@fosync.local', 'darknight2022');
        await createUserProfile(cred1.user.uid, { reg_no: '2022s19535', name: 'Super Admin', degree: 'Data Science', role: 'super_admin', electives: [], password: 'darknight2022' });
        await signOut(auth);
      } catch(e) {
        if (e.code === 'auth/email-already-in-use' || e.message.includes('email-already-in-use')) {
          const cred1 = await signInWithEmailAndPassword(auth, '2022s19535@fosync.local', 'darknight2022');
          await createUserProfile(cred1.user.uid, { reg_no: '2022s19535', name: 'Super Admin', degree: 'Data Science', role: 'super_admin', electives: [], password: 'darknight2022' });
          await signOut(auth);
        } else {
          throw e;
        }
      }

      setSuccess('Developer account created/restored! Admin (2022s19535 / darknight2022). Please log in with it.');
    } catch(err) {
      console.error(err);
      setError(err.message || 'Failed to create developer account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg px-6">
      <div className="w-full max-w-md auth-card p-8 sm:p-10 text-center animate-slide-in-right">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldAlert className="w-7 h-7 text-red-600" />
        </div>
        
        <h2 className="text-3xl font-serif font-bold text-surface-100 mb-3">
          Developer Tools
        </h2>
        
        <p className="text-surface-400 text-sm mb-8">
          This is a hidden setup page. Clicking the button below will grant your account full <b>Super Admin</b> privileges. Use with caution.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="text-left bg-surface-800 p-4 rounded-xl border border-surface-700">
            <p className="text-xs text-surface-500 uppercase font-bold mb-1">Current Status</p>
            <p className="text-sm font-medium text-surface-200">
              Role: <span className="text-primary-600 font-bold">{userProfile?.role || 'Guest'}</span>
            </p>
            <p className="text-sm font-medium text-surface-200">
              User: <span className="text-surface-500">{userProfile?.reg_no || 'Not logged in'}</span>
            </p>
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={loading || !currentUser || userProfile?.role === 'super_admin'}
            className="w-full"
            size="lg"
          >
            {loading ? 'Upgrading...' : userProfile?.role === 'super_admin' ? 'Already Super Admin' : 'Make Me Super Admin'}
          </Button>

          <Button
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            className="w-full"
          >
            Return to Dashboard
          </Button>

          <Button
            onClick={handleCreateDummies}
            disabled={loading}
            className="w-full !bg-surface-800 hover:!bg-surface-700 !text-surface-200 border border-surface-700"
          >
            Create Developer Account (2022s19535)
          </Button>
        </div>
      </div>
    </div>
  );
}
