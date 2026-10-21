import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// Web config is public by design; access is controlled by firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyAWNEtY7kI6ERxkTh98PGCGiZh6raDayV4',
  authDomain: 'esla-game.firebaseapp.com',
  projectId: 'esla-game',
  storageBucket: 'esla-game.firebasestorage.app',
  messagingSenderId: '722291975619',
  appId: '1:722291975619:web:0f8f352262a2dc13edc976',
})

export const auth = getAuth(app)

// Persistent cache: games keep working (and queue writes) with no signal.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// `npm run dev:emulator` talks to local Firebase emulators instead of the real project.
if (import.meta.env.VITE_EMULATOR) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
}
