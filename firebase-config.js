/**
 * firebase-config.js - Firebase 초기화 및 Firestore 인스턴스
 */
const firebaseConfig = {
    apiKey: "AIzaSyBUaQmxPmvnZ0Fz1bFCkaH2UXS0j8RdHrA",
    authDomain: "wiseup-notice-ab1f3.firebaseapp.com",
    projectId: "wiseup-notice-ab1f3",
    storageBucket: "wiseup-notice-ab1f3.firebasestorage.app",
    messagingSenderId: "1094179164887",
    appId: "1:1094179164887:web:562cc485baa1a80f869692",
    measurementId: "G-PLR6PT8GSE"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore DB 인스턴스 (전역)
const db = firebase.firestore();
