import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteField,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApmsx69SDdb96hTMXhTljGdN5Rs7JVp2o",
  authDomain: "bob-friend-95188.firebaseapp.com",
  projectId: "bob-friend-95188",
  storageBucket: "bob-friend-95188.firebasestorage.app",
  messagingSenderId: "313893947909",
  appId: "1:313893947909:web:bd89169af988a6a67a2a6c",
  measurementId: "G-7JVT1L3FZJ",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const run = async () => {
  console.log("[cleanup] start removing count field");
  const snapshot = await getDocs(collection(db, "video_hearts"));

  let updated = 0;
  for (const item of snapshot.docs) {
    await setDoc(
      doc(db, "video_hearts", item.id),
      { count: deleteField() },
      { merge: true }
    );
    updated += 1;
    console.log(`[cleanup] removed count from ${item.id}`);
  }

  console.log(`[cleanup] done. updated=${updated}, total=${snapshot.size}`);
};

run().catch((error) => {
  console.error("[cleanup] failed", error);
  process.exit(1);
});

