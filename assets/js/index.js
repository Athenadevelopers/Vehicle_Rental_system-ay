// Main entry point for the application
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import "./main.js"

// Export for global access if needed
window.firebaseAuth = firebaseAuth
window.firebaseDB = firebaseDB

console.log("Application initialized")
