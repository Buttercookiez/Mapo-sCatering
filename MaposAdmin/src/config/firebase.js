import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-mnJ5lOvYuAmh8LqH7LB_GJnrh27oqdU",
  authDomain: "maposdatabase.firebaseapp.com",
  projectId: "maposdatabase",
  storageBucket: "maposdatabase.firebasestorage.app",
  messagingSenderId: "968001456546",
  appId: "1:968001456546:web:4c678546344d16207b0afb",
  measurementId: "G-WLV8E9QGH1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);