// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzaniZd0ZJXU3Rk__wR8hjwfp8xI4_VO4",
  authDomain: "vehicle-rental-system-20698.firebaseapp.com",
  projectId: "vehicle-rental-system-20698",
  storageBucket: "vehicle-rental-system-20698.firebasestorage.app",
  messagingSenderId: "86431969601",
  appId: "1:86431969601:web:574b2d2a212e70a5caf1c0",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize providers
export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()

// Configure providers
googleProvider.setCustomParameters({
  prompt: "select_account",
})

facebookProvider.setCustomParameters({
  display: "popup",
})

// Firebase Database Manager
export class FirebaseDBManager {
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
      const userRef = doc(db, this.collections.users, userData.uid)
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
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

      await setDoc(userRef, user)
      await this.logActivity(userData.uid, "user_created", "user", userData.uid, "User account created")
      return { success: true, user }
    } catch (error) {
      console.error("Error creating user:", error)
      return { success: false, error: error.message }
    }
  }

  async getUser(uid) {
    try {
      const userRef = doc(db, this.collections.users, uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
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
      const userRef = doc(db, this.collections.users, uid)
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(userRef, updateData)
      await this.logActivity(uid, "user_updated", "user", uid, "User profile updated")
      return { success: true }
    } catch (error) {
      console.error("Error updating user:", error)
      return { success: false, error: error.message }
    }
  }

  async getAllUsers(role = null, limit_count = 50) {
    try {
      let q = collection(db, this.collections.users)

      if (role) {
        q = query(q, where("role", "==", role))
      }

      q = query(q, orderBy("createdAt", "desc"), limit(limit_count))

      const querySnapshot = await getDocs(q)
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
      const categoryRef = doc(db, this.collections.categories, this.generateId())
      const category = {
        id: categoryRef.id,
        name: categoryData.name,
        description: categoryData.description || "",
        icon: categoryData.icon || "fas fa-car",
        sortOrder: categoryData.sortOrder || 0,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(categoryRef, category)
      return { success: true, category }
    } catch (error) {
      console.error("Error creating category:", error)
      return { success: false, error: error.message }
    }
  }

  async getCategories() {
    try {
      const q = query(
        collection(db, this.collections.categories),
        where("status", "==", "active"),
        orderBy("sortOrder"),
        orderBy("name"),
      )

      const querySnapshot = await getDocs(q)
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
      const vehicleRef = doc(db, this.collections.vehicles, this.generateId())
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalRatings: 0,
        },
      }

      await setDoc(vehicleRef, vehicle)
      return { success: true, vehicle }
    } catch (error) {
      console.error("Error creating vehicle:", error)
      return { success: false, error: error.message }
    }
  }

  async getVehicles(status = null, categoryId = null, limit_count = 50) {
    try {
      let q = collection(db, this.collections.vehicles)
      const conditions = []

      if (status) {
        conditions.push(where("status", "==", status))
      }

      if (categoryId) {
        conditions.push(where("categoryId", "==", categoryId))
      }

      if (conditions.length > 0) {
        q = query(q, ...conditions)
      }

      q = query(q, orderBy("createdAt", "desc"), limit(limit_count))

      const querySnapshot = await getDocs(q)
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
      const vehicleRef = doc(db, this.collections.vehicles, vehicleId)
      const vehicleSnap = await getDoc(vehicleRef)

      if (vehicleSnap.exists()) {
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
      const vehicleRef = doc(db, this.collections.vehicles, vehicleId)
      const updateData = {
        ...vehicleData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(vehicleRef, updateData)
      return { success: true }
    } catch (error) {
      console.error("Error updating vehicle:", error)
      return { success: false, error: error.message }
    }
  }

  // Bookings Management
  async createBooking(bookingData) {
    try {
      const bookingRef = doc(db, this.collections.bookings, this.generateId())
      const booking = {
        id: bookingRef.id,
        bookingNumber: this.generateBookingNumber(),
        customerId: bookingData.customerId,
        vehicleId: bookingData.vehicleId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime || "09:00",
        endTime: bookingData.endTime || "18:00",
        pickupLocation: bookingData.pickupLocation,
        returnLocation: bookingData.returnLocation,
        totalDays: bookingData.totalDays,
        dailyRate: bookingData.dailyRate,
        subtotal: bookingData.subtotal,
        taxAmount: bookingData.taxAmount || 0,
        discountAmount: bookingData.discountAmount || 0,
        totalAmount: bookingData.totalAmount,
        depositAmount: bookingData.depositAmount || 0,
        status: "pending",
        paymentStatus: "pending",
        bookingDate: serverTimestamp(),
        confirmedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: "",
        notes: bookingData.notes || "",
        specialRequests: bookingData.specialRequests || "",
        customerInfo: bookingData.customerInfo || {},
        vehicleInfo: bookingData.vehicleInfo || {},
      }

      await setDoc(bookingRef, booking)

      // Update vehicle status
      await this.updateVehicle(bookingData.vehicleId, { status: "rented" })

      // Update user stats
      await this.updateUserStats(bookingData.customerId, {
        totalBookings: increment(1),
        activeBookings: increment(1),
      })

      await this.logActivity(
        bookingData.customerId,
        "booking_created",
        "booking",
        bookingRef.id,
        `Booking created: ${booking.bookingNumber}`,
      )

      return { success: true, booking }
    } catch (error) {
      console.error("Error creating booking:", error)
      return { success: false, error: error.message }
    }
  }

  async getBookings(customerId = null, status = null, limit_count = 50) {
    try {
      let q = collection(db, this.collections.bookings)
      const conditions = []

      if (customerId) {
        conditions.push(where("customerId", "==", customerId))
      }

      if (status) {
        conditions.push(where("status", "==", status))
      }

      if (conditions.length > 0) {
        q = query(q, ...conditions)
      }

      q = query(q, orderBy("bookingDate", "desc"), limit(limit_count))

      const querySnapshot = await getDocs(q)
      const bookings = []

      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() })
      })

      return { success: true, bookings }
    } catch (error) {
      console.error("Error getting bookings:", error)
      return { success: false, error: error.message }
    }
  }

  async updateBookingStatus(bookingId, status, userId = null) {
    try {
      const bookingRef = doc(db, this.collections.bookings, bookingId)
      const updateData = {
        status: status,
        updatedAt: serverTimestamp(),
      }

      // Set timestamp based on status
      switch (status) {
        case "confirmed":
          updateData.confirmedAt = serverTimestamp()
          break
        case "active":
          updateData.startedAt = serverTimestamp()
          break
        case "completed":
          updateData.completedAt = serverTimestamp()
          break
        case "cancelled":
          updateData.cancelledAt = serverTimestamp()
          break
      }

      await updateDoc(bookingRef, updateData)

      if (userId) {
        await this.logActivity(
          userId,
          "booking_status_updated",
          "booking",
          bookingId,
          `Booking status changed to: ${status}`,
        )
      }

      return { success: true }
    } catch (error) {
      console.error("Error updating booking status:", error)
      return { success: false, error: error.message }
    }
  }

  // Payments Management
  async createPayment(paymentData) {
    try {
      const paymentRef = doc(db, this.collections.payments, this.generateId())
      const payment = {
        id: paymentRef.id,
        bookingId: paymentData.bookingId,
        paymentReference: paymentData.paymentReference || this.generateId(),
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod || "cash",
        paymentType: paymentData.paymentType || "booking",
        paymentStatus: "completed",
        transactionId: paymentData.transactionId || "",
        gatewayResponse: paymentData.gatewayResponse || {},
        paymentDate: serverTimestamp(),
        processedAt: serverTimestamp(),
        notes: paymentData.notes || "",
        processedBy: paymentData.processedBy || "",
      }

      await setDoc(paymentRef, payment)
      return { success: true, payment }
    } catch (error) {
      console.error("Error creating payment:", error)
      return { success: false, error: error.message }
    }
  }

  // Activity Logging
  async logActivity(userId, action, entityType = null, entityId = null, description = null) {
    try {
      const activityRef = doc(db, this.collections.activities, this.generateId())
      const activity = {
        id: activityRef.id,
        userId: userId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        description: description,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
      }

      await setDoc(activityRef, activity)
      return { success: true }
    } catch (error) {
      console.error("Error logging activity:", error)
      return { success: false }
    }
  }

  // System Settings
  async getSetting(key, defaultValue = null) {
    try {
      const settingRef = doc(db, this.collections.settings, key)
      const settingSnap = await getDoc(settingRef)

      if (settingSnap.exists()) {
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
      const settingRef = doc(db, this.collections.settings, key)
      const setting = {
        key: key,
        value: value,
        description: description,
        category: category,
        updatedAt: serverTimestamp(),
      }

      await setDoc(settingRef, setting, { merge: true })
      return { success: true }
    } catch (error) {
      console.error("Error setting value:", error)
      return { success: false, error: error.message }
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

  async updateUserStats(userId, stats) {
    try {
      const userRef = doc(db, this.collections.users, userId)
      await updateDoc(userRef, {
        [`stats.${Object.keys(stats)[0]}`]: Object.values(stats)[0],
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (error) {
      console.error("Error updating user stats:", error)
      return { success: false }
    }
  }

  // Check vehicle availability
  async isVehicleAvailable(vehicleId, startDate, endDate, excludeBookingId = null) {
    try {
      const q = query(
        collection(db, this.collections.bookings),
        where("vehicleId", "==", vehicleId),
        where("status", "in", ["confirmed", "active"]),
      )

      const querySnapshot = await getDocs(q)
      const bookings = []

      querySnapshot.forEach((doc) => {
        const booking = doc.data()
        if (excludeBookingId && doc.id === excludeBookingId) {
          return // Skip this booking
        }
        bookings.push(booking)
      })

      // Check for date conflicts
      const start = new Date(startDate)
      const end = new Date(endDate)

      for (const booking of bookings) {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)

        if (
          (start >= bookingStart && start <= bookingEnd) ||
          (end >= bookingStart && end <= bookingEnd) ||
          (start <= bookingStart && end >= bookingEnd)
        ) {
          return false // Conflict found
        }
      }

      return true // No conflicts
    } catch (error) {
      console.error("Error checking vehicle availability:", error)
      return false
    }
  }

  // Dashboard Statistics
  async getDashboardStats(userId = null, role = "customer") {
    try {
      let stats = {}

      if (role === "admin") {
        // Admin dashboard stats
        const usersSnapshot = await getDocs(
          query(collection(db, this.collections.users), where("role", "==", "customer")),
        )
        stats.totalCustomers = usersSnapshot.size

        const vehiclesSnapshot = await getDocs(collection(db, this.collections.vehicles))
        stats.totalVehicles = vehiclesSnapshot.size

        const availableVehiclesSnapshot = await getDocs(
          query(collection(db, this.collections.vehicles), where("status", "==", "available")),
        )
        stats.availableVehicles = availableVehiclesSnapshot.size

        const activeBookingsSnapshot = await getDocs(
          query(collection(db, this.collections.bookings), where("status", "==", "active")),
        )
        stats.activeBookings = activeBookingsSnapshot.size

        // Calculate total revenue
        const bookingsSnapshot = await getDocs(
          query(collection(db, this.collections.bookings), where("status", "in", ["completed", "active"])),
        )
        let totalRevenue = 0
        bookingsSnapshot.forEach((doc) => {
          totalRevenue += doc.data().totalAmount || 0
        })
        stats.totalRevenue = totalRevenue

        stats.fleetUtilization =
          stats.totalVehicles > 0 ? ((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100 : 0
      } else if (role === "customer" && userId) {
        // Customer dashboard stats
        const userResult = await this.getUser(userId)
        if (userResult.success) {
          stats = userResult.user.stats || {}
        }
      }

      return { success: true, stats }
    } catch (error) {
      console.error("Error getting dashboard stats:", error)
      return { success: false, error: error.message }
    }
  }
}

// Firebase Auth Manager
export class FirebaseAuthManager {
  constructor() {
    this.currentUser = null
    this.dbManager = new FirebaseDBManager()
    this.initAuthStateListener()
  }

  initAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user
      if (user) {
        await this.handleUserSignIn(user)
      } else {
        this.handleUserSignOut()
      }
    })
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
          lastLoginAt: serverTimestamp(),
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: userCredential.user }
    } catch (error) {
      console.error("Firebase signin error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const isNewUser = result._tokenResponse?.isNewUser || false

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
      const result = await signInWithPopup(auth, facebookProvider)
      const user = result.user
      const isNewUser = result._tokenResponse?.isNewUser || false

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
      await signOut(auth)
      return { success: true }
    } catch (error) {
      console.error("Signout error:", error)
      return { success: false, error: this.getErrorMessage(error) }
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
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

// Initialize Firebase Auth Manager
export const firebaseAuth = new FirebaseAuthManager()
export const firebaseDB = new FirebaseDBManager()

// Export default app
export default app
