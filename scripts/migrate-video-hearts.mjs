import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const firebaseConfig = {
  apiKey: "AIzaSyApmsx69SDdb96hTMXhTljGdN5Rs7JVp2o",
  authDomain: "bob-friend-95188.firebaseapp.com",
  projectId: "bob-friend-95188",
  storageBucket: "bob-friend-95188.firebasestorage.app",
  messagingSenderId: "313893947909",
  appId: "1:313893947909:web:bd89169af988a6a67a2a6c",
  measurementId: "G-7JVT1L3FZJ",
};

const videosPath = path.join(rootDir, "data", "videos.json");
const videosJson = JSON.parse(fs.readFileSync(videosPath, "utf8"));
const videoMap = new Map(videosJson.videos.map((v) => [v.id, v]));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const run = async () => {
  console.log("[migrate] start video_hearts migration");
  const snapshot = await getDocs(collection(db, "video_hearts"));

  let updated = 0;
  let skipped = 0;

  for (const snap of snapshot.docs) {
    const id = snap.id;
    const data = snap.data() || {};
    const video = videoMap.get(id);

    const hearts =
      typeof data.hearts === "number"
        ? data.hearts
        : typeof data.count === "number"
          ? data.count
          : 0;

    const payload = {
      hearts,
      menu: video?.mood ?? data.menu ?? null,
      selected_time:
        Number(video?.time ?? data.selected_time ?? 0) || null,
      name: video?.title ?? data.name ?? null,
    };

    if (!payload.menu || !payload.selected_time || !payload.name) {
      skipped += 1;
      console.log(`[migrate] skip ${id} (metadata not found)`);
      await setDoc(doc(db, "video_hearts", id), { hearts }, { merge: true });
      continue;
    }

    await setDoc(doc(db, "video_hearts", id), payload, { merge: true });
    updated += 1;
    console.log(`[migrate] updated ${id}`);
  }

  console.log(`[migrate] done. updated=${updated}, skipped=${skipped}, total=${snapshot.size}`);
};

run().catch((err) => {
  console.error("[migrate] failed", err);
  process.exit(1);
});

