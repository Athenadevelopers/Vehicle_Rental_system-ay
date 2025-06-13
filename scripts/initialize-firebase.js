// This script initializes the Firebase database with sample data
// It can be run from the browser console or as a Node.js script

// Import Firebase configuration
import { firebaseDB } from "../assets/js/firebase-config.js"

async function initializeFirebase() {
  console.log("Starting Firebase initialization...")

  try {
    // Initialize the database
    await firebaseDB.initialize()

    // Initialize sample data
    const result = await firebaseDB.initializeSampleData()

    if (result.success) {
      console.log("✅ Firebase initialization successful!")
      if (result.message) {
        console.log(result.message)
      }
    } else {
      console.error("❌ Firebase initialization failed:", result.error)
    }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error)
  }
}

// Run the initialization
initializeFirebase()
