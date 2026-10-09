import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const userRef = (uid) => doc(db, 'users', uid)

export async function getProfile(uid) {
  const snap = await getDoc(userRef(uid))
  return snap.exists() ? snap.data() : null
}

// Merges `data` into users/{uid}, creating the document on first save.
export async function saveProfile(uid, data) {
  const snap = await getDoc(userRef(uid))
  if (snap.exists()) {
    await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(userRef(uid), { ...data, createdAt: serverTimestamp() })
  }
}

export const saveDailyGoal = (uid, dailyGoal) => saveProfile(uid, { dailyGoal })
