import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const foodsCol = (uid) => collection(db, 'users', uid, 'foods')
const toFood = (d) => ({ id: d.id, ...d.data() })

export function normalizeFood({ name, servingLabel, calories }) {
  return {
    name: String(name ?? '').trim(),
    servingLabel: String(servingLabel ?? '').trim(),
    calories: Math.round(Number(calories)),
  }
}

export function validateFood(food) {
  if (food.name.length < 1 || food.name.length > 60) return 'Name must be 1 to 60 characters.'
  if (!food.servingLabel) return 'Serving description is required.'
  if (!Number.isFinite(food.calories) || food.calories < 0) {
    return 'Calories must be a whole number of 0 or more.'
  }
  return ''
}

// Most recently used foods first.
export async function listRecentFoods(uid, max = 20) {
  const snap = await getDocs(query(foodsCol(uid), orderBy('lastUsedAt', 'desc'), limit(max)))
  return snap.docs.map(toFood)
}

// Prefix search on the lowercase name (Firestore has no substring search).
export async function searchFoods(uid, text, max = 30) {
  const q = text.trim().toLowerCase()
  if (!q) return listRecentFoods(uid, max)
  const snap = await getDocs(
    query(
      foodsCol(uid),
      where('nameLower', '>=', q),
      where('nameLower', '<=', q + ''),
      orderBy('nameLower'),
      limit(max),
    ),
  )
  return snap.docs.map(toFood)
}

export async function listAllFoods(uid) {
  const snap = await getDocs(query(foodsCol(uid), orderBy('nameLower')))
  return snap.docs.map(toFood)
}

async function findDuplicate(uid, food, ignoreId) {
  const snap = await getDocs(
    query(foodsCol(uid), where('nameLower', '==', food.name.toLowerCase())),
  )
  return snap.docs.some(
    (d) =>
      d.id !== ignoreId &&
      (d.data().servingLabel || '').toLowerCase() === food.servingLabel.toLowerCase(),
  )
}

export async function createFood(uid, input) {
  const food = normalizeFood(input)
  const error = validateFood(food)
  if (error) throw new Error(error)
  if (await findDuplicate(uid, food)) {
    throw new Error('You already have a food with this name and serving.')
  }
  const now = serverTimestamp()
  const data = { ...food, nameLower: food.name.toLowerCase(), createdAt: now, lastUsedAt: now }
  const ref = await addDoc(foodsCol(uid), data)
  return { id: ref.id, ...food, nameLower: data.nameLower }
}

export async function updateFood(uid, id, input) {
  const food = normalizeFood(input)
  const error = validateFood(food)
  if (error) throw new Error(error)
  if (await findDuplicate(uid, food, id)) {
    throw new Error('You already have a food with this name and serving.')
  }
  await updateDoc(doc(foodsCol(uid), id), { ...food, nameLower: food.name.toLowerCase() })
  return { id, ...food, nameLower: food.name.toLowerCase() }
}

export function deleteFood(uid, id) {
  return deleteDoc(doc(foodsCol(uid), id))
}

export function touchFood(uid, id) {
  return updateDoc(doc(foodsCol(uid), id), { lastUsedAt: serverTimestamp() })
}
