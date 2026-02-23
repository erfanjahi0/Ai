// ============================================================
// Firebase Authentication Module
// NOTE: Replace the firebaseConfig below with your own config
// from https://console.firebase.google.com/
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️ REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDiIpfl0ijYWFNASESCInuPFBMLP2TNUwI",
  authDomain: "pulsechat-7c26e.firebaseapp.com",
  projectId: "pulsechat-7c26e",
  storageBucket: "pulsechat-7c26e.firebasestorage.app",
  messagingSenderId: "376727797021",
  appId: "1:376727797021:web:56b1a16246b5b9c84af5f4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Auth state observer
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── INIT AUTH PAGE ───────────────────────────────────────────
export function initAuth(mode) {
  const errorBox = document.getElementById('error-box');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const googleBtn = document.getElementById('googleBtn');

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
  function setLoading(on) {
    submitBtn.disabled = on;
    btnText.style.display = on ? 'none' : 'inline';
    btnLoader.style.display = on ? 'inline-block' : 'none';
  }

  // Google Sign-In
  googleBtn?.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await ensureUserDoc(result.user);
      window.location.href = 'chat.html';
    } catch (e) { showError(getErrorMessage(e.code)); }
  });

  if (mode === 'login') {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault(); setLoading(true); errorBox.style.display = 'none';
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'chat.html';
      } catch (err) { showError(getErrorMessage(err.code)); setLoading(false); }
    });
  }

  if (mode === 'register') {
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault(); setLoading(true); errorBox.style.display = 'none';
      const displayName = document.getElementById('displayName').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await ensureUserDoc(cred.user, displayName);
        window.location.href = 'chat.html';
      } catch (err) { showError(getErrorMessage(err.code)); setLoading(false); }
    });
  }
}

async function ensureUserDoc(user, displayName) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || 'User',
      createdAt: serverTimestamp(),
      preferences: { model: 'glm-5-flash', thinkingMode: false, theme: 'dark' }
    });
  }
}

export async function logOut() {
  await signOut(auth);
  window.location.href = '../index.html';
}

function getErrorMessage(code) {
  const msgs = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
  };
  return msgs[code] || 'An error occurred. Please try again.';
}
