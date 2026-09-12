import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const configured = !Object.values(firebaseConfig).some((value) => value.startsWith('REPLACE_'));
let db;

export async function saveConsentedEstimate(estimate) {
  if (!configured) return { saved: false, reason: 'not-configured' };
  if (!db) {
    const app = initializeApp(firebaseConfig);
    await signInAnonymously(getAuth(app));
    db = getFirestore(app);
  }
  await addDoc(collection(db, 'estimates'), { ...estimate, createdAt: new Date().toISOString() });
  return { saved: true };
}
