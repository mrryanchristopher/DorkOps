import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const isWebView = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('wv') || // Generic Android WebView
    (userAgent.includes('android') && userAgent.includes('version/')) || // Android WebView
    (userAgent.includes('iphone') && !userAgent.includes('safari')) // iOS WebView
  );
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    // If in a WebView environment, go straight to redirect
    if (isWebView()) {
      await signInWithRedirect(auth, provider);
      return;
    }
    
    // Otherwise try popup
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    // If popup was blocked or failed for some reason, fallback to redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
       try {
         await signInWithRedirect(auth, provider);
       } catch (redirError) {
         console.error("Error signing in with Google Redirect", redirError);
       }
    }
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
