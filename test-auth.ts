import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("Signed in:", auth.currentUser?.uid);
    
    console.log("Testing write to bidangConfigs/TEST...");
    const docRef = doc(db, "bidangConfigs", "TEST");
    await setDoc(docRef, { name: "Test", pagu: 1000 });
    console.log("Write successful!");
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}
test();
