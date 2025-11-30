import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ilagay mo dito yung api key
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);