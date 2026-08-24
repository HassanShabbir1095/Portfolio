// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

// Import Firebase App
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

// Import Firebase Authentication
import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// Import Cloud Firestore
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDnl2D_u5Of9WPKaAayoUqwUpACudEiM_o",
    authDomain: "hassan-portfolio-a7210.firebaseapp.com",
    projectId: "hassan-portfolio-a7210",
    messagingSenderId: "753503639016",
    appId: "1:753503639016:web:a17f819cb90bd4b2db005d",
    measurementId: "G-8Z8KEVNJDX"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// INITIALIZE FIREBASE SERVICES
// ============================================================

const auth = getAuth(app);

const db = getFirestore(app);


// ============================================================
// EXPORT FIREBASE SERVICES
// ============================================================

export {
    app,
    auth,
    db
};