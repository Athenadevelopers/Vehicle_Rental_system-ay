// Import Firebase
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
}

// Firebase Auth Manager
class FirebaseAuthManager {
  constructor() {
    this.auth = null
    this.user = null
    this.initialized = false
  }

  async initialize() {
    try {
      if (this.initialized) return { success: true }

      // Wait for Firebase to load
      if (typeof firebase === "undefined") {
        console.log("Waiting for Firebase to load...")
        await new Promise((resolve) => {
          const checkFirebase = setInterval(() => {
            if (typeof firebase !== "undefined") {
              clearInterval(checkFirebase)
              resolve()
            }
          }, 100)
        })
      }

      // Initialize Firebase if not already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig)
      }

      this.auth = firebase.auth()

      // Set up auth state change listener
      this.auth.onAuthStateChanged((user) => {
        this.user = user
        this.updateUI(user)
      })

      this.initialized = true
      return { success: true }
    } catch (error) {
      console.error("Firebase Auth initialization error:", error)
      return { success: false, error: error.message }
    }
  }

  async signIn(email, password) {
    try {
      if (!this.initialized) await this.initialize()
      const result = await this.auth.signInWithEmailAndPassword(email, password)
      return { success: true, user: result.user }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: error.message }
    }
  }

  async signUp(email, password) {
    try {
      if (!this.initialized) await this.initialize()
      const result = await this.auth.createUserWithEmailAndPassword(email, password)
      return { success: true, user: result.user }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: error.message }
    }
  }

  async signOut() {
    try {
      if (!this.initialized) await this.initialize()
      await this.auth.signOut()
      return { success: true }
    } catch (error) {
      console.error("Sign out error:", error)
      return { success: false, error: error.message }
    }
  }

  getCurrentUser() {
    return this.user
  }

  isAuthenticated() {
    return !!this.user
  }

  updateUI(user) {
    const authButtons = document.querySelector(".auth-buttons")
    const userMenu = document.querySelector(".user-menu")

    if (!authButtons || !userMenu) return

    if (user) {
      // User is signed in
      authButtons.classList.add("hidden")
      userMenu.classList.remove("hidden")

      // Update user info
      const userNameElement = document.getElementById("user-name")
      const userAvatarElement = document.getElementById("user-avatar")

      if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email || "User"
      }

      if (userAvatarElement) {
        userAvatarElement.src =
          user.photoURL ||
          `/placeholder.svg?width=32&height=32&text=${(user.displayName || user.email || "U").charAt(0)}`
      }

      // Update dashboard link
      const dashboardLink = document.getElementById("dashboard-link")
      if (dashboardLink) {
        // Check if user is admin
        this.checkAdminRole(user.uid).then((isAdmin) => {
          dashboardLink.href = isAdmin ? "admin/dashboard.php" : "customer/dashboard.php"
        })
      }
    } else {
      // No user is signed in
      authButtons.classList.remove("hidden")
      userMenu.classList.add("hidden")
    }
  }

  async checkAdminRole(userId) {
    try {
      if (!this.initialized) await this.initialize()

      // Get Firestore instance
      const db = firebase.firestore()

      // Check user roles in Firestore
      const userDoc = await db.collection("users").doc(userId).get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        return userData.role === "admin"
      }

      return false
    } catch (error) {
      console.error("Error checking admin role:", error)
      return false
    }
  }
}

// Firebase Database Manager
class FirebaseDatabaseManager {
  constructor() {
    this.db = null
    this.initialized = false
  }

  async initialize() {
    try {
      if (this.initialized) return { success: true }

      // Wait for Firebase to load
      if (typeof firebase === "undefined") {
        console.log("Waiting for Firebase to load...")
        await new Promise((resolve) => {
          const checkFirebase = setInterval(() => {
            if (typeof firebase !== "undefined") {
              clearInterval(checkFirebase)
              resolve()
            }
          }, 100)
        })
      }

      // Initialize Firebase if not already initialized
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig)
      }

      this.db = firebase.firestore()
      this.initialized = true
      return { success: true }
    } catch (error) {
      console.error("Firebase Database initialization error:", error)
      return { success: false, error: error.message }
    }
  }

  async getVehicles() {
    try {
      if (!this.initialized) await this.initialize()

      const snapshot = await this.db.collection("vehicles").get()
      const vehicles = []

      snapshot.forEach((doc) => {
        vehicles.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return { success: true, vehicles }
    } catch (error) {
      console.error("Error getting vehicles:", error)
      return { success: false, error: error.message }
    }
  }

  async getVehicleById(id) {
    try {
      if (!this.initialized) await this.initialize()

      const doc = await this.db.collection("vehicles").doc(id).get()

      if (doc.exists) {
        return { success: true, vehicle: { id: doc.id, ...doc.data() } }
      } else {
        return { success: false, error: "Vehicle not found" }
      }
    } catch (error) {
      console.error("Error getting vehicle:", error)
      return { success: false, error: error.message }
    }
  }

  async getCategories() {
    try {
      if (!this.initialized) await this.initialize()

      const snapshot = await this.db.collection("categories").get()
      const categories = []

      snapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return { success: true, categories }
    } catch (error) {
      console.error("Error getting categories:", error)
      return { success: false, error: error.message }
    }
  }

  async getPopularVehicles(limit = 4) {
    try {
      if (!this.initialized) await this.initialize()

      // Get vehicles sorted by popularity (you can define your own criteria)
      // For now, we'll just get the most recently added vehicles
      const snapshot = await this.db.collection("vehicles").orderBy("createdAt", "desc").limit(limit).get()

      const vehicles = []

      snapshot.forEach((doc) => {
        vehicles.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return { success: true, vehicles }
    } catch (error) {
      console.error("Error getting popular vehicles:", error)
      return { success: false, error: error.message }
    }
  }

  async addContactMessage(formData) {
    try {
      if (!this.initialized) await this.initialize()

      const result = await this.db.collection("contactMessages").add({
        ...formData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })

      return { success: true, id: result.id }
    } catch (error) {
      console.error("Error adding contact message:", error)
      return { success: false, error: error.message }
    }
  }

  async createBooking(bookingData) {
    try {
      if (!this.initialized) await this.initialize()

      const result = await this.db.collection("bookings").add({
        ...bookingData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "pending",
      })

      return { success: true, id: result.id }
    } catch (error) {
      console.error("Error creating booking:", error)
      return { success: false, error: error.message }
    }
  }

  async getUserBookings(userId) {
    try {
      if (!this.initialized) await this.initialize()

      const snapshot = await this.db
        .collection("bookings")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get()

      const bookings = []

      snapshot.forEach((doc) => {
        bookings.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return { success: true, bookings }
    } catch (error) {
      console.error("Error getting user bookings:", error)
      return { success: false, error: error.message }
    }
  }

  async initializeSampleData() {
    try {
      if (!this.initialized) await this.initialize()

      // Check if categories exist
      const categoriesSnapshot = await this.db.collection("categories").get()
      if (categoriesSnapshot.empty) {
        // Create categories
        const categories = [
          { name: "Budget Cars (Hatchback)", description: "Affordable and fuel-efficient small cars", icon: "car" },
          { name: "Sedans", description: "Comfortable mid-size cars for families and business", icon: "car-side" },
          { name: "SUVs & Jeeps", description: "Spacious vehicles for rough terrain and adventure", icon: "truck" },
          { name: "Vans (KDH/HiAce)", description: "Large vehicles for groups and tours", icon: "shuttle-van" },
          { name: "Luxury Cars", description: "Premium vehicles for special occasions", icon: "car-alt" },
        ]

        const categoryRefs = {}
        for (const category of categories) {
          const docRef = await this.db.collection("categories").add({
            ...category,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          })
          categoryRefs[category.name] = docRef.id
        }

        // Create sample vehicles
        const vehicles = [
          {
            make: "Suzuki",
            model: "Alto",
            year: 2020,
            color: "White",
            transmission: "manual",
            fuelType: "petrol",
            seats: 4,
            dailyRate: 3500,
            categoryId: categoryRefs["Budget Cars (Hatchback)"],
            status: "available",
            features: "AC, Power Steering, Radio",
            licensePlate: "CAR-1234",
            mileage: 25000,
            imageUrl: "/placeholder.svg?width=400&height=250&text=Suzuki+Alto",
          },
          {
            make: "Toyota",
            model: "Axio",
            year: 2018,
            color: "Silver",
            transmission: "automatic",
            fuelType: "petrol",
            seats: 5,
            dailyRate: 6000,
            categoryId: categoryRefs["Sedans"],
            status: "available",
            features: "AC, Power Steering, Power Windows, Bluetooth Audio",
            licensePlate: "CAB-5678",
            mileage: 45000,
            imageUrl: "/placeholder.svg?width=400&height=250&text=Toyota+Axio",
          },
          {
            make: "Toyota",
            model: "Prado",
            year: 2019,
            color: "Black",
            transmission: "automatic",
            fuelType: "diesel",
            seats: 7,
            dailyRate: 15000,
            categoryId: categoryRefs["SUVs & Jeeps"],
            status: "available",
            features: "AC, Power Steering, Power Windows, Bluetooth Audio, Leather Seats, Sunroof",
            licensePlate: "SUV-9012",
            mileage: 35000,
            imageUrl: "/placeholder.svg?width=400&height=250&text=Toyota+Prado",
          },
          {
            make: "Toyota",
            model: "KDH",
            year: 2020,
            color: "White",
            transmission: "manual",
            fuelType: "diesel",
            seats: 14,
            dailyRate: 10000,
            categoryId: categoryRefs["Vans (KDH/HiAce)"],
            status: "available",
            features: "AC, Power Steering, DVD Player",
            licensePlate: "VAN-3456",
            mileage: 40000,
            imageUrl: "/placeholder.svg?width=400&height=250&text=Toyota+KDH",
          },
          {
            make: "BMW",
            model: "5 Series",
            year: 2021,
            color: "Blue",
            transmission: "automatic",
            fuelType: "petrol",
            seats: 5,
            dailyRate: 25000,
            categoryId: categoryRefs["Luxury Cars"],
            status: "available",
            features: "AC, Power Steering, Power Windows, Bluetooth Audio, Leather Seats, Sunroof, Navigation",
            licensePlate: "LUX-7890",
            mileage: 15000,
            imageUrl: "/placeholder.svg?width=400&height=250&text=BMW+5+Series",
          },
        ]

        for (const vehicle of vehicles) {
          await this.db.collection("vehicles").add({
            ...vehicle,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          })
        }

        // Create system settings
        await this.db.collection("settings").doc("general").set({
          siteName: "VehicleRent Pro Sri Lanka",
          currency: "LKR",
          contactEmail: "support.lk@vehiclerentpro.com",
          contactPhone: "+94 77 123 4567",
          address: "123 Galle Road, Colombo 03, Sri Lanka",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

        return { success: true }
      }

      return { success: true, message: "Sample data already exists" }
    } catch (error) {
      console.error("Error initializing sample data:", error)
      return { success: false, error: error.message }
    }
  }
}

// Create instances
const firebaseAuth = new FirebaseAuthManager()
const firebaseDB = new FirebaseDatabaseManager()

// Export the instances
export { firebaseAuth, firebaseDB }
