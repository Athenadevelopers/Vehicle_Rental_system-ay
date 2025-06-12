// Initialize Firebase data on first load
import { firebaseDB } from "./firebase-config.js"

class FirebaseInitializer {
  constructor() {
    this.initialized = false
  }

  async initializeSystemData() {
    if (this.initialized) return

    try {
      console.log("Initializing Firebase system data...")

      // Initialize vehicle categories
      await this.initializeCategories()

      // Initialize system settings
      await this.initializeSettings()

      // Initialize sample vehicles
      await this.initializeSampleVehicles()

      // Create admin user if needed
      await this.createAdminUser()

      this.initialized = true
      console.log("Firebase system data initialized successfully")
    } catch (error) {
      console.error("Error initializing Firebase data:", error)
    }
  }

  async initializeCategories() {
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

    // Check if categories already exist
    const existingCategories = await firebaseDB.getCategories()
    if (existingCategories.success && existingCategories.categories.length > 0) {
      console.log("Categories already exist, skipping initialization")
      return
    }

    for (const category of categories) {
      await firebaseDB.createCategory(category)
    }

    console.log("Vehicle categories initialized")
  }

  async initializeSettings() {
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
    ]

    for (const setting of settings) {
      await firebaseDB.setSetting(setting.key, setting.value, setting.description, setting.category)
    }

    console.log("System settings initialized")
  }

  async initializeSampleVehicles() {
    // Check if vehicles already exist
    const existingVehicles = await firebaseDB.getVehicles()
    if (existingVehicles.success && existingVehicles.vehicles.length > 0) {
      console.log("Vehicles already exist, skipping initialization")
      return
    }

    // Get categories first
    const categoriesResult = await firebaseDB.getCategories()
    if (!categoriesResult.success) {
      console.error("Cannot initialize vehicles without categories")
      return
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
        await firebaseDB.createVehicle(vehicle)
      }
    }

    console.log("Sample vehicles initialized")
  }

  async createAdminUser() {
    try {
      // This would typically be done through Firebase Auth admin SDK
      // For now, we'll just set up the admin user structure
      console.log("Admin user setup should be done through Firebase Console")

      // You can manually create an admin user in Firebase Console
      // Then update their role in Firestore using the admin panel
    } catch (error) {
      console.error("Error creating admin user:", error)
    }
  }
}

// Initialize on page load
const initializer = new FirebaseInitializer()

// Auto-initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to ensure Firebase is fully loaded
  setTimeout(() => {
    initializer.initializeSystemData()
  }, 1000)
})

export default initializer
