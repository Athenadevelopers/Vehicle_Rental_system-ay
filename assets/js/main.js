// Import Firebase configuration and managers
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos"

// Main application class
class VehicleRentalApp {
  constructor() {
    this.initialized = false
    this.initializationAttempts = 0
    this.maxInitAttempts = 3
    this.vehicles = []
    this.categories = []
    this.init()
  }

  async init() {
    try {
      console.log("Initializing VehicleRent Pro (Sri Lanka)...")
      this.initializationAttempts++

      const authResult = await firebaseAuth.initialize().catch((err) => {
        console.error("Auth initialization error:", err)
        return { success: false, error: err.message }
      })

      if (!authResult.success) {
        this.handleInitializationError(
          "Authentication initialization failed. Please check your Firebase setup and network.",
        )
        return
      }

      await this.loadInitialData()
      this.setupEventListeners()
      this.renderVehicles() // Initial render

      this.hideLoadingScreen()
      this.initialized = true
      console.log("✅ VehicleRentalApp (Sri Lanka) initialized successfully")
    } catch (error) {
      console.error("❌ VehicleRentalApp (Sri Lanka) initialization failed:", error)
      this.handleInitializationError(error.message)
    }
  }

  async loadInitialData() {
    try {
      const [categoriesResult, vehiclesResult] = await Promise.all([
        firebaseDB.getCategories(),
        firebaseDB.getVehicles(),
      ])

      if (categoriesResult.success) {
        this.categories = categoriesResult.categories
      } else {
        console.warn("Could not load categories:", categoriesResult.error)
        this.showNotification("Warning: Could not load vehicle categories.", "warning")
      }

      if (vehiclesResult.success) {
        this.vehicles = vehiclesResult.vehicles
      } else {
        console.warn("Could not load vehicles:", vehiclesResult.error)
        this.showNotification("Warning: Could not load vehicles.", "warning")
      }

      // Initialize sample data if DB is empty
      if (this.categories.length === 0 && this.vehicles.length === 0) {
        await this.initializeSampleData()
        // Reload data after seeding
        const [newCategoriesResult, newVehiclesResult] = await Promise.all([
          firebaseDB.getCategories(),
          firebaseDB.getVehicles(),
        ])
        if (newCategoriesResult.success) this.categories = newCategoriesResult.categories
        if (newVehiclesResult.success) this.vehicles = newVehiclesResult.vehicles
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      this.showNotification("Error loading essential app data. Some features might not work.", "error")
    }
  }

  renderVehicles() {
    const vehiclesGrid = document.getElementById("vehicles-grid")
    if (!vehiclesGrid) return

    if (this.vehicles.length === 0) {
      vehiclesGrid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-car-crash text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No Vehicles Available</h3>
                <p class="text-gray-500">Please check back later or contact us for assistance.</p>
            </div>`
      return
    }

    vehiclesGrid.innerHTML = this.vehicles
      .slice(0, 6)
      .map(
        (vehicle, index) => `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300" 
             data-aos="fade-up" data-aos-delay="${100 + index * 100}">
            <img src="${vehicle.imageUrl || "/placeholder.svg?width=400&height=300&text=Vehicle+Image"}" 
                 alt="${vehicle.make} ${vehicle.model}" class="w-full h-56 object-cover">
            <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${vehicle.make} ${vehicle.model} (${vehicle.year})</h3>
                <p class="text-sm text-gray-500 mb-1">Category: ${this.getCategoryName(vehicle.categoryId)}</p>
                <p class="text-sm text-gray-500 mb-3">Seats: ${vehicle.seats}, Fuel: ${vehicle.fuelType}</p>
                <div class="text-2xl font-bold text-primary-600 mb-4">
                    LKR ${vehicle.dailyRate ? vehicle.dailyRate.toLocaleString("en-LK") : "N/A"}<span class="text-sm font-normal text-gray-500">/day</span>
                </div>
                <button class="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition font-medium">
                    Book Now
                </button>
            </div>
        </div>
    `,
      )
      .join("")
  }

  getCategoryName(categoryId) {
    const category = this.categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Uncategorized"
  }

  handleInitializationError(message) {
    console.error(`Initialization error: ${message}`)
    if (this.initializationAttempts < this.maxInitAttempts && !this.initialized) {
      console.log(`Retrying initialization (attempt ${this.initializationAttempts + 1}/${this.maxInitAttempts})...`)
      setTimeout(() => this.init(), 3000)
    } else if (!this.initialized) {
      this.showInitializationError(message)
    }
  }

  showInitializationError(message) {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="text-center p-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold text-red-600 mb-2">Application Initialization Failed</h3>
          <p class="text-gray-600 mb-4 text-sm">We couldn't connect to our services. This might be due to a network issue or a problem with the Firebase configuration. Please check your internet connection and ensure Firebase is correctly set up.</p>
          <p class="text-xs text-gray-500 mb-4">Error: ${message}</p>
          <button onclick="location.reload()" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm">
            Try Reloading Page
          </button>
        </div>
      `
    }
  }

  setupEventListeners() {
    document.getElementById("mobile-menu-btn")?.addEventListener("click", this.toggleMobileMenu)
    const userMenuButton = document.getElementById("user-menu-btn")
    if (userMenuButton) {
      userMenuButton.addEventListener("click", (e) => {
        e.stopPropagation() // Prevent click from bubbling to document
        this.toggleUserMenu()
      })
    }

    document.addEventListener("click", (event) => {
      const userDropdown = document.getElementById("user-dropdown")
      const userMenuBtn = document.getElementById("user-menu-btn")
      if (userDropdown && !userDropdown.classList.contains("hidden")) {
        if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
          userDropdown.classList.add("hidden")
        }
      }
    })

    document.getElementById("login-btn")?.addEventListener("click", () => this.showAuthModal("login"))
    document.getElementById("register-btn")?.addEventListener("click", () => this.showAuthModal("register"))
    document.getElementById("logout-btn")?.addEventListener("click", () => this.handleLogout())

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        const targetId = this.getAttribute("href")
        const targetElement = document.querySelector(targetId)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" })
        }
      })
    })
  }

  async initializeSampleData() {
    try {
      console.log("Initializing Sri Lankan sample data...")

      const slCategories = [
        {
          name: "Budget Cars (Hatchback)",
          description: "Small, fuel-efficient cars like Alto, Wagon R",
          icon: "fas fa-car-side",
          sortOrder: 1,
        },
        {
          name: "Sedans",
          description: "Comfortable sedans like Axio, Allion, Premio",
          icon: "fas fa-car-alt",
          sortOrder: 2,
        },
        {
          name: "SUVs & Jeeps",
          description: "For exploring diverse terrains, e.g., Prado, Montero",
          icon: "fas fa-truck-monster",
          sortOrder: 3,
        },
        {
          name: "Vans (KDH/HiAce)",
          description: "Ideal for group travel and tours",
          icon: "fas fa-bus-alt",
          sortOrder: 4,
        },
        {
          name: "Luxury Cars",
          description: "Premium vehicles for special occasions",
          icon: "fas fa-gem",
          sortOrder: 5,
        },
      ]

      const createdCategoryMap = {}
      for (const category of slCategories) {
        const result = await firebaseDB.createCategory(category)
        if (result.success && result.id) {
          createdCategoryMap[category.name] = result.id
        }
      }
      console.log("Sample Sri Lankan categories created.")

      const slVehicles = [
        {
          categoryId: createdCategoryMap["Budget Cars (Hatchback)"],
          make: "Suzuki",
          model: "Alto 800",
          year: 2022,
          licensePlate: "CBA-1234",
          color: "White",
          seats: 4,
          fuelType: "petrol",
          transmission: "manual",
          dailyRate: 6500,
          features: "AC, Basic Audio",
          imageUrl: "/placeholder.svg?width=400&height=300&text=Suzuki+Alto",
        },
        {
          categoryId: createdCategoryMap["Sedans"],
          make: "Toyota",
          model: "Axio",
          year: 2019,
          licensePlate: "KDH-5678",
          color: "Silver",
          seats: 5,
          fuelType: "hybrid",
          transmission: "automatic",
          dailyRate: 12000,
          features: "AC, Bluetooth, Reverse Camera",
          imageUrl: "/placeholder.svg?width=400&height=300&text=Toyota+Axio",
        },
        {
          categoryId: createdCategoryMap["SUVs & Jeeps"],
          make: "Toyota",
          model: "Prado",
          year: 2018,
          licensePlate: "SUV-0011",
          color: "Black",
          seats: 7,
          fuelType: "diesel",
          transmission: "automatic",
          dailyRate: 25000,
          features: "4WD, Sunroof, Leather Seats",
          imageUrl: "/placeholder.svg?width=400&height=300&text=Toyota+Prado",
        },
        {
          categoryId: createdCategoryMap["Vans (KDH/HiAce)"],
          make: "Toyota",
          model: "KDH High Roof",
          year: 2020,
          licensePlate: "VAN-7788",
          color: "Pearl White",
          seats: 10,
          fuelType: "diesel",
          transmission: "automatic",
          dailyRate: 18000,
          features: "Dual AC, TV, Adjustable Seats",
          imageUrl: "/placeholder.svg?width=400&height=300&text=Toyota+KDH+Van",
        },
      ]

      for (const vehicle of slVehicles) {
        if (vehicle.categoryId) {
          // Ensure categoryId was successfully mapped
          await firebaseDB.createVehicle(vehicle)
        }
      }
      console.log("Sample Sri Lankan vehicles created.")

      await firebaseDB.setSetting("site_name", "VehicleRent Pro Sri Lanka", "Website name", "general")
      await firebaseDB.setSetting("currency", "LKR", "Default currency", "financial")
      await firebaseDB.setSetting("tax_rate", "0.15", "Default tax rate (15%) for Sri Lanka", "financial")

      console.log("Sample Sri Lankan settings initialized.")
    } catch (error) {
      console.error("Error initializing Sri Lankan sample data:", error)
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = "0"
        setTimeout(() => {
          loadingScreen.style.display = "none"
        }, 300) // Matches opacity transition
      }, 500) // Initial delay before fade out
    }
  }

  toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu")
    if (mobileMenu) mobileMenu.classList.toggle("hidden")
  }

  toggleUserMenu() {
    const dropdown = document.getElementById("user-dropdown")
    if (dropdown) dropdown.classList.toggle("hidden")
  }

  showAuthModal(type) {
    // Remove existing modal if any
    const existingModal = document.getElementById("auth-modal")
    if (existingModal) existingModal.remove()

    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
    modal.id = "auth-modal"

    const isLogin = type === "login"
    const title = isLogin ? "Sign In" : "Create Account"
    const switchText = isLogin ? "Don't have an account?" : "Already have an account?"
    const switchAction = isLogin ? "Sign Up" : "Sign In"

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8" data-aos="fade-up" data-aos-duration="300">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${title}</h2>
          <button id="close-modal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <form id="auth-form" class="space-y-4">
          ${!isLogin ? `<div><label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" id="fullName" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"></div>` : ""}
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" id="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" id="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"></div>
          ${!isLogin ? `<div><label class="block text-sm font-medium text-gray-700 mb-1">Phone (Optional, e.g., +94771234567)</label><input type="tel" id="phone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"></div>` : ""}
          <button type="submit" id="auth-submit" class="w-full bg-primary-600 text-white py-2.5 px-4 rounded-md hover:bg-primary-700 transition font-medium">${title}</button>
        </form>
        <div class="mt-6"><div class="relative"><div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-300"></div></div><div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">Or continue with</span></div></div>
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button id="google-signin" class="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-sm"><i class="fab fa-google text-red-500 mr-2"></i>Google</button>
            <button id="facebook-signin" class="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-sm"><i class="fab fa-facebook text-blue-600 mr-2"></i>Facebook</button>
          </div>
        </div>
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">${switchText} <button id="switch-auth" class="text-primary-600 hover:text-primary-700 font-medium">${switchAction}</button></p>
          ${isLogin ? `<button id="forgot-password" class="text-sm text-primary-600 hover:text-primary-700 mt-2">Forgot your password?</button>` : ""}
        </div>
      </div>
    `
    document.body.appendChild(modal)
    this.setupModalEventListeners(modal, type)
  }

  setupModalEventListeners(modal, type) {
    modal.querySelector("#close-modal")?.addEventListener("click", () => modal.remove())
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove()
    })
    modal.querySelector("#auth-form")?.addEventListener("submit", async (e) => {
      e.preventDefault()
      await this.handleAuthSubmit(type, modal)
    })
    modal.querySelector("#google-signin")?.addEventListener("click", () => this.handleSocialSignIn("google", modal))
    modal.querySelector("#facebook-signin")?.addEventListener("click", () => this.handleSocialSignIn("facebook", modal))
    modal.querySelector("#switch-auth")?.addEventListener("click", () => {
      modal.remove()
      this.showAuthModal(type === "login" ? "register" : "login")
    })
    modal.querySelector("#forgot-password")?.addEventListener("click", () => this.handleForgotPassword(modal))
  }

  async handleAuthSubmit(type, modal) {
    const submitBtn = modal.querySelector("#auth-submit")
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Processing..."
    submitBtn.disabled = true

    try {
      const email = modal.querySelector("#email").value
      const password = modal.querySelector("#password").value
      let result

      if (type === "login") {
        result = await firebaseAuth.signInWithEmail(email, password)
      } else {
        const fullName = modal.querySelector("#fullName").value
        const phone = modal.querySelector("#phone").value
        result = await firebaseAuth.signUpWithEmail(email, password, { fullName, phone, username: email.split("@")[0] })
      }

      if (result.success) {
        this.showNotification(`${type === "login" ? "Signed in" : "Account created"} successfully! Welcome!`, "success")
        modal.remove()
      } else {
        this.showNotification(result.error || "Authentication failed. Please try again.", "error")
      }
    } catch (error) {
      console.error("Auth error:", error)
      this.showNotification("An unexpected error occurred. Please try again.", "error")
    } finally {
      submitBtn.textContent = originalText
      submitBtn.disabled = false
    }
  }

  async handleSocialSignIn(provider, modal) {
    try {
      const result =
        provider === "google" ? await firebaseAuth.signInWithGoogle() : await firebaseAuth.signInWithFacebook()
      if (result.success) {
        this.showNotification(`Signed in with ${provider} successfully! Welcome!`, "success")
        modal.remove()
      } else {
        this.showNotification(result.error || `Sign in with ${provider} failed.`, "error")
      }
    } catch (error) {
      console.error("Social sign-in error:", error)
      this.showNotification("Social sign-in failed. Please try again.", "error")
    }
  }

  async handleForgotPassword(modal) {
    const email = modal.querySelector("#email").value
    if (!email) {
      this.showNotification("Please enter your email address first.", "warning")
      return
    }
    try {
      const result = await firebaseAuth.resetPassword(email)
      if (result.success) {
        this.showNotification("Password reset email sent! Check your inbox.", "success")
        modal.remove()
      } else {
        this.showNotification(result.error || "Failed to send reset email.", "error")
      }
    } catch (error) {
      console.error("Password reset error:", error)
      this.showNotification("Failed to send password reset email.", "error")
    }
  }

  async handleLogout() {
    try {
      const result = await firebaseAuth.signOut()
      if (result.success) {
        this.showNotification("Signed out successfully!", "success")
      } else {
        this.showNotification("Error signing out. Please try again.", "error")
      }
    } catch (error) {
      console.error("Logout error:", error)
      this.showNotification("Error signing out. Please try again.", "error")
    }
  }

  showNotification(message, type = "info") {
    const existingNotification = document.querySelector(".app-notification")
    if (existingNotification) existingNotification.remove()

    const notification = document.createElement("div")
    notification.className = `app-notification fixed top-5 right-5 z-[100] px-4 py-3 rounded-md shadow-lg text-sm font-medium flex items-center transform transition-all duration-300 ease-in-out`

    const typeClasses = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-black",
      info: "bg-blue-500 text-white",
    }
    const typeIcons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    }

    notification.classList.add(...(typeClasses[type] || typeClasses.info).split(" "))
    notification.style.transform = "translateX(120%)" // Start off-screen

    notification.innerHTML = `
        <i class="${typeIcons[type] || typeIcons.info} mr-2"></i>
        <span>${message}</span>
        <button class="ml-3 text-lg leading-none hover:opacity-75" onclick="this.parentElement.remove()">&times;</button>
    `
    document.body.appendChild(notification)

    requestAnimationFrame(() => {
      // Ensure element is in DOM before transform
      notification.style.transform = "translateX(0)"
    })

    setTimeout(() => {
      notification.style.transform = "translateX(120%)"
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, easing: "ease-in-out", once: true, offset: 50 })
  }
  window.app = new VehicleRentalApp()
})

// Export app and core modules for global access if needed
window.VehicleRentPro = {
  firebaseAuth,
  firebaseDB,
  showNotification: (message, type) => {
    if (window.app) window.app.showNotification(message, type)
  },
}
