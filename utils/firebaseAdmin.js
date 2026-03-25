import admin from 'firebase-admin';

let firebaseReady = false;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
const hasPlaceholderKey = typeof privateKeyRaw === 'string' && privateKeyRaw.includes('YOUR_KEY_HERE');

if (projectId && clientEmail && privateKeyRaw && !hasPlaceholderKey) {
  try {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    }

    firebaseReady = true;
  } catch (error) {
    firebaseReady = false;
    console.warn('[Firebase Admin] Initialization failed:', error.message);
  }
} else {
  console.info('[Firebase Admin] Credentials not set (or placeholder in use). Falling back to JWT auth when allowed.');
}

export const isFirebaseReady = () => firebaseReady;

export const verifyFirebaseIdToken = async (token) => {
  if (!firebaseReady || !token) {
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
};

export default admin;
