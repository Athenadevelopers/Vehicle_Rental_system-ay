// Firebase Initialization Manager
import { firebaseAuth, firebaseDB } from "./firebase-config.js"

class FirebaseInitializer {
  constructor() {
    this.initialized = false
    this.initializationPromise = null
    this.retryCount = 0
    this.maxRetries = 3
  }

  // Main initialization method
  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._performInitialization()
    return this.initializationPromise
  }

  async _performInitialization() {
    try {
      console.log("🔥 Starting Firebase initialization...")
      this.showInitializationStatus("Connecting to Firebase...")

      // Step 1: Initialize Firebase Auth
      await this.initializeAuth()

      // Step 2: Initialize system data
      await this.initializeSystemData()

      // Step 3: Verify Firebase connection
      await this.verifyFirebaseConnection()

      this.initialized = true
      this.hideInitializationStatus()
      console.log("✅ Firebase initialization completed successfully")

      return { success: true }
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error)

      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        console.log(`🔄 Retrying initialization (${this.retryCount}/${this.maxRetries})...`)
        await this.delay(2000 * this.retryCount) // Exponential backoff
        return this._performInitialization()
      }

      this.showInitializationError(error.message)
      return { success: false, error: error.message }
    }
  }

  async initializeAuth() {
    this.showInitializationStatus("Initializing authentication...")

    try {
      const authResult = await firebaseAuth.initialize()
      if (!authResult.success) {
        throw new Error(authResult.error)
      }
      console.log("✅ Firebase Auth initialized")
    } catch (error) {
      console.error("❌ Auth initialization failed:", error)
      throw error
    }
  }

  async initializeSystemData() {
    if (this.initialized) return

    try {
      console.log("🔧 Initializing Firebase system data...")

      // Initialize in sequence to avoid conflicts
      await this.initializeSettings()
      await this.initializeCategories()
      await this.initializeSampleVehicles()

      console.log("✅ System data initialized")
    } catch (error) {
      console.error("❌ System data initialization failed:", error)
      throw error
    }
  }

  async initializeSettings() {
    this.showInitializationStatus("Setting up system configuration...")

    try {
      // Check if settings already exist
      const existingSetting = await firebaseDB.getSetting("site_name")
      if (existingSetting) {
        console.log("⏭️ System settings already exist, skipping initialization")
        return
      }

      const settings = [
        { key: "site_name", value: "VehicleRent Pro", description: "Website name", category: "general" },
        {
          key: "site_description",
          value: "Professional Vehicle Rental Management System",
          description: "Website description",
          category: "general",
        },
        { key: "currency", value: "USD", description: "Default currency", category: "financial" },
        { key: "currency_symbol", value: "$", description: "Currency symbol", category: "financial" },
        { key: "tax_rate", value: "0.08", description: "Default tax rate (8%)", category: "financial" },
        {
          key: "booking_advance_days",
          value: "365",
          description: "Maximum days in advance for booking",
          category: "booking",
        },
        {
          key: "cancellation_hours",
          value: "24",
          description: "Hours before rental to allow free cancellation",
          category: "booking",
        },
        {
          key: "auto_confirm_bookings",
          value: "false",
          description: "Automatically confirm new bookings",
          category: "booking",
        },
        {
          key: "email_notifications",
          value: "true",
          description: "Enable email notifications",
          category: "notifications",
        },
        {
          key: "maintenance_reminder_days",
          value: "7",
          description: "Days before maintenance to send reminder",
          category: "maintenance",
        },
        { key: "system_initialized", value: "true", description: "System initialization flag", category: "system" },
        {
          key: "initialization_date",
          value: new Date().toISOString(),
          description: "System initialization date",
          category: "system",
        },
      ]

      for (const setting of settings) {
        await firebaseDB.setSetting(setting.key, setting.value, setting.description, setting.category)
      }

      console.log("✅ System settings initialized")
    } catch (error) {
      console.error("❌ Settings initialization failed:", error)
      throw error
    }
  }

  async initializeCategories() {
    this.showInitializationStatus("Creating vehicle categories...")

    try {
      // Check if categories already exist
      const existingCategories = await firebaseDB.getCategories()
      if (existingCategories.success && existingCategories.categories.length > 0) {
        console.log("⏭️ Vehicle categories already exist, skipping initialization")
        return
      }

      const categories = [
        {
          name: "Economy",
          description: "Fuel-efficient and budget-friendly vehicles perfect for city driving",
          icon: "fas fa-car",
          sortOrder: 1,
        },
        {
          name: "Compact",
          description: "Small cars ideal for urban environments and short trips",
          icon: "fas fa-car-side",
          sortOrder: 2,
        },
        {
          name: "Mid-size",
          description: "Comfortable vehicles perfect for longer journeys and family trips",
          icon: "fas fa-car-alt",
          sortOrder: 3,
        },
        {
          name: "SUV",
          description: "Spacious vehicles ideal for families, groups, and outdoor adventures",
          icon: "fas fa-truck",
          sortOrder: 4,
        },
        {
          name: "Luxury",
          description: "Premium vehicles with high-end features and superior comfort",
          icon: "fas fa-gem",
          sortOrder: 5,
        },
        {
          name: "Van",
          description: "Large vehicles perfect for moving, group travel, and cargo transport",
          icon: "fas fa-shuttle-van",
          sortOrder: 6,
        },
        {
          name: "Sports",
          description: "High-performance vehicles for enthusiasts and special occasions",
          icon: "fas fa-tachometer-alt",
          sortOrder: 7,
        },
        {
          name: "Electric",
          description: "Eco-friendly electric vehicles for sustainable transportation",
          icon: "fas fa-leaf",
          sortOrder: 8,
        },
      ]

      for (const category of categories) {
        const result = await firebaseDB.createCategory(category)
        if (!result.success) {
          throw new Error(`Failed to create category: ${category.name}`)
        }
      }

      console.log("✅ Vehicle categories initialized")
    } catch (error) {
      console.error("❌ Categories initialization failed:", error)
      throw error
    }
  }

  async initializeSampleVehicles() {
    this.showInitializationStatus("Adding sample vehicles...")

    try {
      // Check if vehicles already exist
      const existingVehicles = await firebaseDB.getVehicles()
      if (existingVehicles.success && existingVehicles.vehicles.length > 0) {
        console.log("⏭️ Sample vehicles already exist, skipping initialization")
        return
      }

      // Get categories first
      const categoriesResult = await firebaseDB.getCategories()
      if (!categoriesResult.success) {
        throw new Error("Cannot initialize vehicles without categories")
      }

      const categories = categoriesResult.categories
      const categoryMap = {}
      categories.forEach((cat) => {
        categoryMap[cat.name.toLowerCase()] = cat.id
      })

      const sampleVehicles = [
        {
          categoryId: categoryMap["economy"],
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          licensePlate: "ECO001",
          color: "White",
          seats: 5,
          fuelType: "petrol",
          transmission: "automatic",
          dailyRate: 45.0,
          features: "Air Conditioning, Bluetooth, USB Charging, Backup Camera, Fuel Efficient",
          mileage: 15000,
          imageUrl:
            "https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        {
          categoryId: categoryMap["economy"],
          make: "Honda",
          model: "Civic",
          year: 2022,
          licensePlate: "ECO002",
          color: "Silver",
          seats: 5,
          fuelType: "petrol",
          transmission: "manual",
          dailyRate: 40.0,
          features: "Air Conditioning, Radio, Power Windows, Manual Transmission",
          mileage: 22000,
          imageUrl:
            "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        {
          categoryId: categoryMap["compact"],
          make: "Nissan",
          model: "Sentra",
          year: 2023,
          licensePlate: "COM001",
          color: "Blue",
          seats: 5,
          fuelType: "petrol",
          transmission: "automatic",
          dailyRate: 50.0,
          features: "Air Conditioning, Bluetooth, Backup Camera, Lane Assist, Compact Design",
          mileage: 8000,
          imageUrl:
            "https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        {
          categoryId: categoryMap["mid-size"],
          make: "Honda",
          model: "Accord",
          year: 2023,
          licensePlate: "MID001",
          color: "Black",
          seats: 5,
          fuelType: "petrol",
          transmission: "automatic",
          dailyRate: 65.0,
          features: "Leather Seats, Sunroof, Navigation System, Heated Seats, Premium Audio",
          mileage: 12000,
          imageUrl:
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        {
          categoryId: categoryMap["suv"],
          make: "Toyota",
          model: "RAV4",
          year: 2023,
          licensePlate: "SUV001",
          color: "Red",
          seats: 7,
          fuelType: "hybrid",
          transmission: "automatic",
          dailyRate: 80.0,
          features: "AWD, Heated Seats, Apple CarPlay, Safety Suite, Hybrid Engine",
          mileage: 5000,
          imageUrl:
            "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        {
          categoryId: categoryMap["luxury"],
          make: "BMW",
          model: "3 Series",
          year: 2023,
          licensePlate: "LUX001",
          color: "Black",
          seats: 5,
          fuelType: "petrol",
          transmission: "automatic",
          dailyRate: 120.0,
          features: "Leather Interior, Premium Sound, Navigation, Sport Package, Luxury Features",
          mileage: 3000,
          imageUrl:
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
        {
          categoryId: categoryMap["electric"],
          make: "Tesla",
          model: "Model 3",
          year: 2023,
          licensePlate: "ELC001",
          color: "Blue",
          seats: 5,
          fuelType: "electric",
          transmission: "automatic",
          dailyRate: 110.0,
          features: "Autopilot, Supercharging, Premium Interior, Glass Roof, Zero Emissions",
          mileage: 1000,
          imageUrl:
            "https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        },
      ]

      for (const vehicle of sampleVehicles) {
        if (vehicle.categoryId) {
          const result = await firebaseDB.createVehicle(vehicle)
          if (!result.success) {
            console.warn(`Failed to create vehicle: ${vehicle.make} ${vehicle.model}`)
          }
        }
      }

      console.log("✅ Sample vehicles initialized")
    } catch (error) {
      console.error("❌ Vehicles initialization failed:", error)
      throw error
    }
  }

  async verifyFirebaseConnection() {
    this.showInitializationStatus("Verifying Firebase connection...")

    try {
      // Test Firestore connection
      const testResult = await firebaseDB.getSetting("system_initialized")
      if (!testResult) {
        throw new Error("Failed to verify Firestore connection")
      }

      // Test Auth connection
      const currentUser = firebaseAuth.getCurrentUser()
      console.log("🔐 Auth state:", currentUser ? "Authenticated" : "Not authenticated")

      console.log("✅ Firebase connection verified")
    } catch (error) {
      console.error("❌ Firebase connection verification failed:", error)
      throw error
    }
  }

  // UI Helper Methods
  showInitializationStatus(message) {
    const statusElement = document.getElementById("initialization-status")
    if (statusElement) {
      statusElement.textContent = message
      statusElement.className = "text-blue-600 font-medium"
    }
    console.log(`🔄 ${message}`)
  }

  showInitializationError(message) {
    const statusElement = document.getElementById("initialization-status")
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="text-red-600 font-medium">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Initialization failed: ${message}
          <button onclick="location.reload()" class="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
            Retry
          </button>
        </div>
      `
    }
  }

  hideInitializationStatus() {
    const statusElement = document.getElementById("initialization-status")
    if (statusElement) {
      statusElement.style.display = "none"
    }
  }

  // Utility Methods
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Public Methods
  isInitialized() {
    return this.initialized
  }

  async waitForInitialization() {
    if (this.initialized) return { success: true }

    if (this.initializationPromise) {
      return await this.initializationPromise
    }

    return await this.initialize()
  }

  // Reset initialization (for testing/debugging)
  reset() {
    this.initialized = false
    this.initializationPromise = null
    this.retryCount = 0
  }
}

// Create singleton instance
const firebaseInitializer = new FirebaseInitializer()

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM loaded, starting Firebase initialization...")

  // Show loading screen
  const loadingScreen = document.getElementById("loading-screen")
  if (loadingScreen) {
    loadingScreen.style.display = "flex"
  }

  try {
    // Initialize Firebase with a small delay to ensure DOM is ready
    await firebaseInitializer.delay(500)
    const result = await firebaseInitializer.initialize()

    if (result.success) {
      console.log("🎉 Application ready!")

      // Dispatch custom event to notify other scripts
      window.dispatchEvent(
        new CustomEvent("firebaseInitialized", {
          detail: { success: true },
        }),
      )
    } else {
      console.error("💥 Application initialization failed:", result.error)

      // Dispatch error event
      window.dispatchEvent(
        new CustomEvent("firebaseInitialized", {
          detail: { success: false, error: result.error },
        }),
      )
    }
  } catch (error) {
    console.error("💥 Critical initialization error:", error)

    // Show user-friendly error
    const errorElement = document.getElementById("initialization-status")
    if (errorElement) {
      errorElement.innerHTML = `
        <div class="text-red-600 font-medium text-center p-4">
          <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Unable to connect to Firebase services.</p>
          <p class="text-sm mt-2">Please check your internet connection and try again.</p>
          <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      `
    }
  }
})

// Export for use in other modules
export default firebaseInitializer
export { firebaseInitializer }
