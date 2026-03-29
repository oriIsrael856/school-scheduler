import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAS1aCJhn-oUR_nxwr9NFw0YuVq9emZlpk",
  authDomain: "school-scheduler-2af66.firebaseapp.com",
  projectId: "school-scheduler-2af66",
  storageBucket: "school-scheduler-2af66.firebasestorage.app",
  messagingSenderId: "327356940452",
  appId: "1:327356940452:web:b85a227b4b2de9e8d5e631",
  measurementId: "G-3JMY3HZWZ3"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
