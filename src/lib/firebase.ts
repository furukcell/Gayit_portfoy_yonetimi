import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Firebase 11.10's React Native runtime exports this helper, although its
// shared TypeScript declarations may omit it. Metro resolves the RN entry point.
// @ts-ignore -- see Firebase RN export mismatch
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Auth may already have been initialized by another module; reuse that instance.
    return getAuth(app);
  }
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}
