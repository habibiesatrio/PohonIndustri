import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClPWdli7bk-dYQw6zxv8MV9tRj1PRSMQQ",
  authDomain: "pohonindustri-26.firebaseapp.com",
  databaseURL: "https://pohonindustri-26-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pohonindustri-26",
  storageBucket: "pohonindustri-26.appspot.com",
  messagingSenderId: "304599819692",
  appId: "1:304599819692:web:d214294c01be9e0d814609",
  measurementId: "G-752HFMWTFR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
const analytics = getAnalytics(app);