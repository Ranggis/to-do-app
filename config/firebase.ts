import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCCybUxq6CY0rOf8mE_C6HfjHQ2ERQtT_s",
  authDomain: "to-do-app-82422.firebaseapp.com",
  projectId: "to-do-app-82422",
  storageBucket: "to-do-app-82422.firebasestorage.app",
  messagingSenderId: "675529104214",
  appId: "1:675529104214:web:cb15c9a9a4e818ca0754f7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);