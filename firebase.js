// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyAafzar7_PYFRbh55_5iYKHVzAXJ7mTilY",
    authDomain: "chada-map-bd.firebaseapp.com",
    projectId: "chada-map-bd",
    storageBucket: "chada-map-bd.firebasestorage.app",
    messagingSenderId: "860746872895",
    appId: "1:860746872895:web:ad40cf8191cc6c4388a08a",
    measurementId: "G-Z830CKMKEH"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);

// Services
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Admin email
const ADMIN_EMAIL = 'chadamap7@gmail.com';

function isAdmin(user) {
    return user && user.email === ADMIN_EMAIL;
}
