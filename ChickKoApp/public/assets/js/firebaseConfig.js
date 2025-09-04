// Centralized Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2v4UuQABJJc9VxA5YKSDoeEpY00NE8Tw",
    authDomain: "chickkoapp.firebaseapp.com",
    projectId: "chickkoapp",
    storageBucket: "chickkoapp.firebasestorage.app",
    messagingSenderId: "94867797048",
    appId: "1:94867797048:web:954a36ceacbcbbc5fbe2cd",
    measurementId: "G-8VPWXNX4SS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
