import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // True until Firebase resolves initial state

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Syncs Firebase user to MongoDB after login/signup
  const syncUserToBackend = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      await axios.post(
        `${API}/auth/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Backend sync failed:', err.message);
      // Non-fatal — auth still works, just MongoDB won't have the record yet
    }
  };

  const signup = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await syncUserToBackend(result.user);
    return result;
  };

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserToBackend(result.user);
    return result;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await syncUserToBackend(result.user);
    return result;
  };

  const logout = () => signOut(auth);

  // Returns a fresh token for API calls — Firebase auto-refreshes if expired
  const getToken = () => currentUser?.getIdToken();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const syncCurrentUser = async () => {
        setLoading(true);
        try {
          await syncUserToBackend(user);
        } catch (err) {
          console.error('Auto backend sync failed:', err.message);
        } finally {
          setLoading(false);
        }
      };

      syncCurrentUser();
    });
    return unsubscribe; // Cleanup listener on unmount
  }, []);

  const value = { currentUser, signup, login, loginWithGoogle, logout, getToken };

  // Don't render children until Firebase resolves — avoids flash of wrong UI
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
