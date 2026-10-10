// firebase-config.js
// This file connects every page to YOUR Firebase project.
// You only need to touch this file once — every other page imports it.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPCMiTIwTni7_4zd2qrAOpqnnlUP-avYk",
  authDomain: "pharmalook-6a2ad.firebaseapp.com",
  projectId: "pharmalook-6a2ad",
  storageBucket: "pharmalook-6a2ad.firebasestorage.app",
  messagingSenderId: "1044570415058",
  appId: "1:1044570415058:web:5680b9e2c840610613320b",
  databaseURL: "https://pharmalook-6a2ad-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

// The one email that's allowed into the admin pages.
// Create this exact account manually in Firebase Console > Authentication > Add user.
export const ADMIN_EMAIL = "admin@pharmalook.com";