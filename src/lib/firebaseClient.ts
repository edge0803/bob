import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAnalytics,
  logEvent,
  isSupported,
  type Analytics,
} from "firebase/analytics";
import {
  getFirestore,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  deleteField,
  type Unsubscribe,
} from "firebase/firestore";

// TODO: 운영에서는 아래 firebaseConfig를 반드시 환경변수(NEXT_PUBLIC_*)로 옮기세요.
const firebaseConfig = {
  apiKey: "AIzaSyApmsx69SDdb96hTMXhTljGdN5Rs7JVp2o",
  authDomain: "bob-friend-95188.firebaseapp.com",
  projectId: "bob-friend-95188",
  storageBucket: "bob-friend-95188.firebasestorage.app",
  messagingSenderId: "313893947909",
  appId: "1:313893947909:web:bd89169af988a6a67a2a6c",
  measurementId: "G-7JVT1L3FZJ",
};

let appInstance: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;
let firestoreInstance:
  | ReturnType<typeof getFirestore>
  | null = null;

const getFirebaseApp = (): FirebaseApp => {
  if (appInstance) return appInstance;
  const existing = getApps();
  appInstance = existing.length ? existing[0] : initializeApp(firebaseConfig);
  return appInstance;
};

export const initFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    analyticsInstance = getAnalytics(getFirebaseApp());
    return analyticsInstance;
  } catch (error) {
    console.error("[Firebase] Analytics init error:", error);
    return null;
  }
};

export const logFirebaseEventSafe = async (
  eventName: string,
  params?: Record<string, unknown>
) => {
  const analytics = await initFirebaseAnalytics();
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, params as Record<string, unknown>);
  } catch (error) {
    console.error("[Firebase] logEvent error:", error);
  }
};

const getFirebaseFirestore = () => {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getFirebaseApp());
  return firestoreInstance;
};

const getHeartDocRef = (videoId: string) => {
  return doc(getFirebaseFirestore(), "video_hearts", videoId);
};

export const subscribeHeartCount = (
  videoId: string,
  onCount: (count: number) => void
): Unsubscribe => {
  const ref = getHeartDocRef(videoId);
  return onSnapshot(ref, (snap) => {
    const data = snap.data() as { hearts?: number } | undefined;
    onCount(typeof data?.hearts === "number" ? data.hearts : 0);
  });
};

export const incrementHeartCount = async (
  videoId: string,
  meta?: {
    menu?: string;
    selected_time?: number;
    name?: string;
  }
) => {
  const ref = getHeartDocRef(videoId);
  const db = getFirebaseFirestore();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const raw = snap.data() as { hearts?: number } | undefined;
    const current = typeof raw?.hearts === "number" ? raw.hearts : 0;
    tx.set(
      ref,
      {
        hearts: current + 1,
        menu: meta?.menu ?? null,
        selected_time: meta?.selected_time ?? null,
        name: meta?.name ?? null,
        count: deleteField(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
};

