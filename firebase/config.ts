import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  // @ts-expect-error - getReactNativePersistence is not typed in Firebase SDK but exists at runtime
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyD_KEIa0prarjjazi4rGBJqw_jtbHrFk",
  authDomain: "guesthouse-7536d.firebaseapp.com",
  projectId: "guesthouse-7536d",
  storageBucket: "guesthouse-7536d.firebasestorage.app",
  messagingSenderId: "574321621057",
  appId: "1:574321621057:web:790d81a3026b760dd26ec0",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(
    AsyncStorage
  ),
});
export const db = getFirestore(app);