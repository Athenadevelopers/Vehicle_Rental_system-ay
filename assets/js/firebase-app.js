// Firebase App Configuration
const firebaseApp = (() => {
  // Import Firebase
  const firebase = window.firebase

  // Private variables
  let _initialized = false
  let _db = null
  let _auth = null
  let _storage = null
  let _analytics = null

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "vehicle-rental-system-xxxxx.firebaseapp.com",
    projectId: "vehicle-rental-system-xxxxx",
    storageBucket: "vehicle-rental-system-xxxxx.appspot.com",
    messagingSenderId: "xxxxxxxxxxxx",
    appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxxxxxxxxxx",
    measurementId: "G-XXXXXXXXXX",
  }

  // Initialize Firebase
  function init() {
    if (_initialized) return

    try {
      // Initialize Firebase
      firebase.initializeApp(firebaseConfig)

      // Initialize services
      _db = firebase.firestore()
      _auth = firebase.auth()
      _storage = firebase.storage()
      _analytics = firebase.analytics()

      // Enable offline persistence for Firestore
      _db.enablePersistence().catch((err) => {
        if (err.code === "failed-precondition") {
          console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
        } else if (err.code === "unimplemented") {
          console.warn("The current browser does not support all of the features required to enable persistence")
        } else {
          console.error("Firestore persistence error:", err)
        }
      })

      _initialized = true
      console.log("Firebase initialized successfully")

      // Dispatch event for other scripts to know Firebase is ready
      document.dispatchEvent(new CustomEvent("firebase-ready"))

      return true
    } catch (error) {
      console.error("Firebase initialization error:", error)
      return false
    }
  }

  // Public API
  return {
    init: init,
    get db() {
      return _db
    },
    get auth() {
      return _auth
    },
    get storage() {
      return _storage
    },
    get analytics() {
      return _analytics
    },
    get initialized() {
      return _initialized
    },
  }
})()

// Auto-initialize when the script loads
document.addEventListener("DOMContentLoaded", () => {
  firebaseApp.init()
})
