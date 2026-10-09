import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { touchFood } from './foods'
import { clampServings, totalFor } from '@/utils/calories'

const entriesCol = (uid) => collection(db, 'users', uid, 'entries')
const toEntry = (d) => ({ id: d.id, ...d.data() })

export async function listEntriesByDate(uid, date) {
  const snap = await getDocs(query(entriesCol(uid), where('date', '==', date)))
  return snap.docs
    .map(toEntry)
    .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
}

// Inclusive range of "YYYY-MM-DD" strings.
export async function listEntriesInRange(uid, start, end) {
  const snap = await getDocs(
    query(entriesCol(uid), where('date', '>=', start), where('date', '<=', end)),
  )
  return snap.docs.map(toEntry)
}

// The entry stores a snapshot of the food, so later edits to the food don't change history.
export async function addEntry(uid, { food, date, meal, servings }) {
  const count = clampServings(servings)
  const data = {
    date,
    meal,
    foodId: food.id,
    name: food.name,
    servingLabel: food.servingLabel,
    caloriesPerServing: food.calories,
    servings: count,
    totalCalories: totalFor(food.calories, count),
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(entriesCol(uid), data)
  // lastUsedAt only drives the "Recent" list, so a failure here shouldn't fail the log.
  touchFood(uid, food.id).catch(() => {})
  return { id: ref.id, ...data }
}

export async function updateEntry(uid, entry, { servings, meal }) {
  const count = clampServings(servings)
  const changes = {
    servings: count,
    meal,
    totalCalories: totalFor(entry.caloriesPerServing, count),
  }
  await updateDoc(doc(entriesCol(uid), entry.id), changes)
  return { ...entry, ...changes }
}

export function deleteEntry(uid, id) {
  return deleteDoc(doc(entriesCol(uid), id))
}
