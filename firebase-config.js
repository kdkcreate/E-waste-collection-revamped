// Firebase initialization for NOVARA.
// This file is safe to be public — the apiKey below is an identifier, not a
// secret. Real access control lives in your Firestore Security Rules
// (see firestore.rules), not in this file.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7BqkOTmPmOGJKipGSmUTWadPRmUCCfQ0",
  authDomain: "novara-bdcf9.firebaseapp.com",
  projectId: "novara-bdcf9",
  storageBucket: "novara-bdcf9.firebasestorage.app",
  messagingSenderId: "264052309396",
  appId: "1:264052309396:web:b118a9fdae2ebc3b562381",
  measurementId: "G-BHMXZ3WQSG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
