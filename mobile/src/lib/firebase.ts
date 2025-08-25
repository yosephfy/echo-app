import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { api } from "../api/client";

// Read from Expo env (or however you manage config)
const firebaseConfig = {
  apiKey: "AIzaSyBYArWsA9YTsdNblj3Twjb_GBodL0KB6yI",
  authDomain: "echo-app-1299a.firebaseapp.com",
  projectId: "echo-app-1299a",
  storageBucket: "echo-app-1299a.firebasestorage.app",
  messagingSenderId: "929674133142",
  appId: "1:929674133142:web:36f5fda406eb723cd38cb7",
  measurementId: "G-BV6KR2SB9M",
};

const app = initializeApp(firebaseConfig);

export const fbAuth = getAuth(app);
export const fbStorage = getStorage(app);

/** Call once you have a valid JWT (your api client adds it to headers). */
export async function ensureFirebaseSignedIn() {
  // Ask backend for a Firebase custom token based on current JWT
  const { token } = await api.post<{ token: string }>("/firebase/custom-token");
  console.log("fauth", fbAuth);
  console.log("Firebase auth initialized", fbAuth);
  await signInWithCustomToken(fbAuth, token);
}
