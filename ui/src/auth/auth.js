// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAt1VdqgOR93Wy-fmyTdeKJamvtRBfIAKg",
  authDomain: "jetblue-airlines.firebaseapp.com",
  projectId: "jetblue-airlines",
  storageBucket: "jetblue-airlines.appspot.com",
  messagingSenderId: "383939260049",
  appId: "1:383939260049:web:96a573d06e77a9ded4d930",
  measurementId: "G-QRCR6L9LRX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)


export const initiateSignInWithGoogle = async ()=> {
  const res = await signInWithPopup(auth, new GoogleAuthProvider())
  console.log("res ", res)
}

