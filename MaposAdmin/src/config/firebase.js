import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgZszl920xZI-cYJvudA6NSR5ZJxDc1rM",
  authDomain: "ulitan-53082.firebaseapp.com",
  projectId: "ulitan-53082",
  storageBucket: "ulitan-53082.firebasestorage.app",
  messagingSenderId: "603927746768",
  appId: "1:603927746768:web:36cac95776cc994c57a6d5",
  measurementId: "G-ESTC2SBL08"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);