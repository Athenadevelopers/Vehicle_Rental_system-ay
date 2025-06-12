// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyDzaniZd0ZJXU3Rk__wR8hjwfp8xI4_VO4",
  authDomain: "vehicle-rental-system-20698.firebaseapp.com",
  projectId: "vehicle-rental-system-20698",
  storageBucket: "vehicle-rental-system-20698.firebasestorage.app",
  messagingSenderId: "86431969601",
  appId: "1:86431969601:web:574b2d2a212e70a5caf1c0",
  measurementId: "G-XXXXXXXXXX",
}

// Declare the firebase variable before using it
const firebase = window.firebase

// Initialize Firebase (using global firebase object from CDN)
let app, auth, db, storage

// Check if Firebase is loaded from CDN
if (typeof firebase !== "undefined") {
  app = firebase.initializeApp(firebaseConfig)
  auth = firebase.auth()
  db = firebase.firestore()
  storage = firebase.storage()

  // Enable offline persistence
  db.enablePersistence().catch((err) => {
    console.error("Firestore persistence error:", err)
  })

  console.log("Firebase initialized successfully")
} else {
  console.error("Firebase SDK not loaded. Please check your CDN links.")
}

// Firebase Database Manager
class FirebaseDBManager {
  constructor() {
    this.collections = {
      users: "users",
      vehicles: "vehicles",
      categories: "vehicle_categories",
      bookings: "bookings",
      payments: "payments",
      maintenance: "maintenance_records",
      settings: "system_settings",
      activities: "activity_logs",
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Generate booking number
  generateBookingNumber() {
    const prefix = "VR"
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, "0")
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `${prefix}${year}${month}${random}`
  }

  // Users Management
  async createUser(userData) {
    try {
      const userRef = db.collection(this.collections.users).doc(userData.uid)
      const user = {
        uid: userData.uid,
        email: userData.email,
        username: userData.username || this.generateUsernameFromEmail(userData.email),
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        address: userData.address || "",
        role: userData.role || "customer",
        status: "active",
        emailVerified: userData.emailVerified || false,
        photoURL: userData.photoURL || "",
        authProvider: userData.authProvider || "firebase",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          language: "en",
          currency: "USD",
        },
        stats: {
          totalBookings: 0,
          totalSpent: 0,
          activeBookings: 0,
        },
      }

      await userRef.set(user)
      await this.logActivity(userData.uid, "user_created", "user", userData.uid, "User account created")
      return { success: true, user }
    } catch (error) {
      console.error("Error creating user:", error)
      return { success: false, error: error.message }
    }
  }

  async getUser(uid) {
    try {
      const userRef = db.collection(this.collections.users).doc(uid)
      const userSnap = await userRef.get()

      if (userSnap.exists) {
        return { success: true, user: userSnap.data() }
      } else {
        return { success: false, error: "User not found" }
      }
    } catch (error) {
      console.error("Error getting user:", error)
      return { success: false, error: error.message }
    }
  }

  async updateUser(uid, userData) {
    try {
      const userRef = db.collection(this.collections.users).doc(uid)
      const updateData = {
        ...userData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }

      await userRef.update(updateData)
      await this.logActivity(uid, "user_updated", "user", uid, "User profile updated")
      return { success: true }
    } catch (error) {
      console.error("Error updating user:", error)
      return { success: false, error: error.message }
    }
  }

  async getAllUsers(role = null, limitCount = 50) {
    try {
      let query = db.collection(this.collections.users)

      if (role) {
        query = query.where("role", "==", role)
      }

      query = query.orderBy("createdAt", "desc").limit(limitCount)

      const querySnapshot = await query.get()
      const users = []

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, users }
    } catch (error) {
      console.error("Error getting users:", error)
      return { success: false, error: error.message }
    }
  }

  // Vehicle Categories Management
  async createCategory(categoryData) {
    try {
      const categoryRef = db.collection(this.collections.categories).doc()
      const category = {
        id: categoryRef.id,
        name: categoryData.name,
        description: categoryData.description || "",
        icon: categoryData.icon || "fas fa-car",
        sortOrder: categoryData.sortOrder || 0,
        status: "active",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }

      await categoryRef.set(category)
      return { success: true, category }
    } catch (error) {
      console.error("Error creating category:", error)
      return { success: false, error: error.message }
    }
  }

  async getCategories() {
    try {
      const query = db
        .collection(this.collections.categories)
        .where("status", "==", "active")
        .orderBy("sortOrder")
        .orderBy("name")

      const querySnapshot = await query.get()
      const categories = []

      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, categories }
    } catch (error) {
      console.error("Error getting categories:", error)
      return { success: false, error: error.message }
    }
  }

  // Vehicles Management
  async createVehicle(vehicleData) {
    try {
      const vehicleRef = db.collection(this.collections.vehicles).doc()
      const vehicle = {
        id: vehicleRef.id,
        categoryId: vehicleData.categoryId,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        licensePlate: vehicleData.licensePlate,
        vin: vehicleData.vin || "",
        color: vehicleData.color,
        seats: vehicleData.seats || 4,
        fuelType: vehicleData.fuelType || "petrol",
        transmission: vehicleData.transmission || "manual",
        dailyRate: vehicleData.dailyRate,
        weeklyRate: vehicleData.weeklyRate || vehicleData.dailyRate * 6,
        monthlyRate: vehicleData.monthlyRate || vehicleData.dailyRate * 25,
        status: "available",
        imageUrl: vehicleData.imageUrl || "",
        images: vehicleData.images || [],
        features: vehicleData.features || "",
        mileage: vehicleData.mileage || 0,
        lastServiceDate: vehicleData.lastServiceDate || null,
        nextServiceDate: vehicleData.nextServiceDate || null,
        insuranceExpiry: vehicleData.insuranceExpiry || null,
        registrationExpiry: vehicleData.registrationExpiry || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        stats: {
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalRatings: 0,
        },
      }

      await vehicleRef.set(vehicle)
      return { success: true, vehicle }
    } catch (error) {
      console.error("Error creating vehicle:", error)
      return { success: false, error: error.message }
    }
  }

  async getVehicles(status = null, categoryId = null, limitCount = 50) {
    try {
      let query = db.collection(this.collections.vehicles)

      if (status) {
        query = query.where("status", "==", status)
      }

      if (categoryId) {
        query = query.where("categoryId", "==", categoryId)
      }

      query = query.orderBy("createdAt", "desc").limit(limitCount)

      const querySnapshot = await query.get()
      const vehicles = []

      querySnapshot.forEach((doc) => {
        vehicles.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, vehicles }
    } catch (error) {
      console.error("Error getting vehicles:", error)
      return { success: false, error: error.message }
    }
  }

  async getVehicle(vehicleId) {
    try {
      const vehicleRef = db.collection(this.collections.vehicles).doc(vehicleId)
      const vehicleSnap = await vehicleRef.get()

      if (vehicleSnap.exists) {
        return { success: true, vehicle: vehicleSnap.data() }
      } else {
        return { success: false, error: "Vehicle not found" }
      }
    } catch (error) {
      console.error("Error getting vehicle:", error)
      return { success: false, error: error.message }
    }
  }

  async updateVehicle(vehicleId, vehicleData) {
    try {
      const vehicleRef = db.collection(this.collections.vehicles).doc(vehicleId)
      const updateData = {
        ...vehicleData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }

      await vehicleRef.update(updateData)
      return { success: true }
    } catch (error) {
      console.error("Error updating vehicle:", error)
      return { success: false, error: error.message }
    }
  }

  // System Settings
  async getSetting(key, defaultValue = null) {
    try {
      const settingRef = db.collection(this.collections.settings).doc(key)
      const settingSnap = await settingRef.get()

      if (settingSnap.exists) {
        const data = settingSnap.data()
        return data.value
      } else {
        return defaultValue
      }
    } catch (error) {
      console.error("Error getting setting:", error)
      return defaultValue
    }
  }

  async setSetting(key, value, description = "", category = "general") {
    try {
      const settingRef = db.collection(this.collections.settings).doc(key)
      const setting = {
        key: key,
        value: value,
        description: description,
        category: category,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }

      await settingRef.set(setting, { merge: true })
      return { success: true }
    } catch (error) {
      console.error("Error setting value:", error)
      return { success: false, error: error.message }
    }
  }

  // Activity Logging
  async logActivity(userId, action, entityType = null, entityId = null, description = null) {
    try {
      const activityRef = db.collection(this.collections.activities).doc()
      const activity = {
        id: activityRef.id,
        userId: userId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        description: description,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }

      await activityRef.set(activity)
      return { success: true }
    } catch (error) {
      console.error("Error logging activity:", error)
      return { success: false }
    }
  }

  // Utility Functions
  generateUsernameFromEmail(email) {
    let username = email.split("@")[0]
    username = username.replace(/[^a-zA-Z0-9_]/g, "")

    if (username.length < 3) {
      username += Math.floor(Math.random() * 1000)
    }

    return username
  }

  async getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json")
      const data = await response.json()
      return data.ip
    } catch (error) {
      return "unknown"
    }
  }
}

// Firebase Auth Manager
class FirebaseAuthManager {
  constructor() {
    this.currentUser = null
    this.dbManager = new FirebaseDBManager()
    this.initAuthStateListener()
  }

  initAuthStateListener() {
    if (auth) {
      auth.onAuthStateChanged(async (user) => {
        this.currentUser = user
        if (user) {
          await this.handleUserSignIn(user)
        } else {
          this.handleUserSignOut()
        }
      })
    }
  }

  async handleUserSignIn(user) {
    try {
      // Check if user exists in Firestore
      const userResult = await this.dbManager.getUser(user.uid)

      if (!userResult.success) {
        // Create new user in Firestore
        await this.dbManager.createUser({
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "",
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || "",
          authProvider: "firebase",
        })
      } else {
        // Update last login
        await this.dbManager.updateUser(user.uid, {
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
      }

      this.updateUIForAuthenticatedUser(user)
    } catch (error) {
      console.error("Error handling user sign in:", error)
    }
  }

  handleUserSignOut() {
    this.updateUIForUnauthenticatedUser()
    // Clear any cached data
    sessionStorage.clear()
    localStorage.removeItem("userRole")
    localStorage.removeItem("userPreferences")
  }

  async signUpWithEmail(email, password, userData) {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password)
      const user = userCredential.user

      await user.updateProfile({
        displayName: userData.fullName,
      })

      await this.dbManager.createUser({
        uid: user.uid,
        email: user.email,
        username: userData.username,
        fullName: userData.fullName,
        phone: userData.phone || "",
        address: userData.address || "",
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || "",
        authProvider: "firebase",
      })

      return { success: true, user: user }
    } catch (error) {
      console.error("Firebase signup error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async signInWithEmail(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password)
      return { success: true, user: userCredential.user }
    } catch (error) {
      console.error("Firebase signin error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: "select_account",
      })

      const result = await auth.signInWithPopup(provider)
      const user = result.user
      const isNewUser = result.additionalUserInfo?.isNewUser || false

      if (isNewUser) {
        await this.dbManager.createUser({
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "",
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || "",
          authProvider: "google",
        })
      }

      return { success: true, user: user, isNewUser: isNewUser }
    } catch (error) {
      console.error("Google signin error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async signInWithFacebook() {
    try {
      const provider = new firebase.auth.FacebookAuthProvider()
      provider.setCustomParameters({
        display: "popup",
      })

      const result = await auth.signInWithPopup(provider)
      const user = result.user
      const isNewUser = result.additionalUserInfo?.isNewUser || false

      if (isNewUser) {
        await this.dbManager.createUser({
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "",
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || "",
          authProvider: "facebook",
        })
      }

      return { success: true, user: user, isNewUser: isNewUser }
    } catch (error) {
      console.error("Facebook signin error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async signOut() {
    try {
      await auth.signOut()
      return { success: true }
    } catch (error) {
      console.error("Signout error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email)
      return { success: true }
    } catch (error) {
      console.error("Password reset error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  updateUIForAuthenticatedUser(user) {
    const authButtons = document.querySelectorAll(".auth-buttons")
    const userMenu = document.querySelectorAll(".user-menu")

    authButtons.forEach((btn) => (btn.style.display = "none"))
    userMenu.forEach((menu) => {
      menu.style.display = "block"
      const userNameElement = menu.querySelector(".user-name")
      const userAvatarElement = menu.querySelector(".user-avatar")

      if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email
      }

      if (userAvatarElement && user.photoURL) {
        userAvatarElement.src = user.photoURL
      }
    })

    const authContent = document.querySelectorAll(".auth-required")
    authContent.forEach((content) => (content.style.display = "block"))
  }

  updateUIForUnauthenticatedUser() {
    const authButtons = document.querySelectorAll(".auth-buttons")
    const userMenu = document.querySelectorAll(".user-menu")

    authButtons.forEach((btn) => (btn.style.display = "block"))
    userMenu.forEach((menu) => (menu.style.display = "none"))

    const authContent = document.querySelectorAll(".auth-required")
    authContent.forEach((content) => (content.style.display = "none"))
  }

  getErrorMessage(error) {
    const errorMessages = {
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "Password should be at least 6 characters long.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many failed attempts. Please try again later.",
      "auth/network-request-failed": "Network error. Please check your connection.",
      "auth/popup-closed-by-user": "Sign-in popup was closed before completion.",
      "auth/cancelled-popup-request": "Sign-in was cancelled.",
    }

    return errorMessages[error.code] || error.message || "An unexpected error occurred."
  }

  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return this.currentUser !== null
  }

  async getUserRole() {
    if (!this.currentUser) return null

    const userResult = await this.dbManager.getUser(this.currentUser.uid)
    if (userResult.success) {
      return userResult.user.role
    }
    return "customer"
  }

  async isAdmin() {
    const role = await this.getUserRole()
    return role === "admin"
  }

  async isCustomer() {
    const role = await this.getUserRole()
    return role === "customer"
  }
}

// Initialize managers
let firebaseAuth, firebaseDB

// Wait for Firebase to be loaded
if (typeof firebase !== "undefined") {
  firebaseAuth = new FirebaseAuthManager()
  firebaseDB = new FirebaseDBManager()
} else {
  // If Firebase is not loaded yet, wait for it
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== "undefined") {
      firebaseAuth = new FirebaseAuthManager()
      firebaseDB = new FirebaseDBManager()
    }
  })
}

// Export for use in other modules
window.firebaseAuth = firebaseAuth
window.firebaseDB = firebaseDB
window.firebase = firebase

// Also export as named exports for ES6 modules
export { firebase, firebaseAuth, firebaseDB, auth, db, storage, app }
export default firebase
