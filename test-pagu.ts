import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const docRef = doc(db, "bidangConfigs", "BM");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("BM Data:", docSnap.data());
    } else {
      console.log("BM Document does not exist");
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
