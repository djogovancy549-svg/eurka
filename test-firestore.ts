import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const querySnapshot = await getDocs(collection(db, "bidangConfigs"));
    console.log("Documents:", querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
