// Import Firebase configuration and managers
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos" // Declare AOS variable

// Main application class
class VehicleRentalApp {
  constructor() {
    this.initialized = false
    this.initializationAttempts = 0
    this.maxInitAttempts = 3
    this.init()
  }

  async init() {
    try {
      console.log("Initializing VehicleRent Pro...")
      this.initializationAttempts++

      // Initialize Firebase Auth
      const authResult = await firebaseAuth.initialize().catch((err) => {
        console.error("Auth initialization error:", err)
        return { success: false, error: err.message }
      })

      if (!authResult.success) {
        this.handleInitializationError("Authentication initialization failed")
        return
      }

      // Setup event listeners
      this.setupEventListeners()

      // Initialize sample data if needed
      await this.initializeSampleData()

      // Hide loading screen
      this.hideLoadingScreen()

      this.initialized = true
      console.log("✅ VehicleRentalApp initialized successfully")
    } catch (error) {
      console.error("❌ VehicleRentalApp initialization failed:", error)
      this.handleInitializationError(error.message)
    }
  }

  handleInitializationError(message) {
    console.error(`Initialization error: ${message}`)

    if (this.initializationAttempts < this.maxInitAttempts) {
      console.log(`Retrying initialization (attempt ${this.initializationAttempts + 1}/${this.maxInitAttempts})...`)
      setTimeout(() => this.init(), 3000) // Retry after 3 seconds
    } else {
      this.showInitializationError(message)
    }
  }

  showInitializationError(message) {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
          </div>
          <h3 class="text-lg font-medium text-red-600 mb-2">Initialization Failed</h3>
          <p class="text-gray-600 mb-4">We couldn't connect to our services. Please check your connection and try again.</p>
          <button onclick="location.reload()" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            Retry
          </button>
        </div>
      `
    }
  }

  setupEventListeners() {
    // Navigation
    document.getElementById("mobile-menu-btn")?.addEventListener("click", this.toggleMobileMenu)
    document.getElementById("user-menu-btn")?.addEventListener("click", this.toggleUserMenu)

    // Auth buttons
    document.getElementById("login-btn")?.addEventListener("click", () => this.showAuthModal("login"))
    document.getElementById("register-btn")?.addEventListener("click", () => this.showAuthModal("register"))
    document.getElementById("logout-btn")?.addEventListener("click", () => this.handleLogout())

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute("href"))
        if (target) {
          target.scrollIntoView({ behavior: "smooth" })
        }
      })
    })
  }

  async initializeSampleData() {
    try {
      // Check if categories exist
      const categoriesResult = await firebaseDB.getCategories()

      if (!categoriesResult.success || categoriesResult.categories.length === 0) {
        console.log("Initializing sample data...")

        // Create sample categories
        const categories = [
          {
            name: "Economy",
            description: "Fuel-efficient and budget-friendly vehicles perfect for city driving",
            icon: "fas fa-car",
            sortOrder: 1,
          },
          {
            name: "SUV",
            description: "Spacious vehicles ideal for families, groups, and outdoor adventures",
            icon: "fas fa-truck",
            sortOrder: 2,
          },
          {
            name: "Luxury",
            description: "Premium vehicles with high-end features and superior comfort",
            icon: "fas fa-gem",
            sortOrder: 3,
          },
        ]

        for (const category of categories) {
          await firebaseDB.createCategory(category)
        }

        console.log("Sample categories created")
      }

      // Check if vehicles exist
      const vehiclesResult = await firebaseDB.getVehicles()

      if (!vehiclesResult.success || vehiclesResult.vehicles.length === 0) {
        // Get categories for vehicle creation
        const updatedCategoriesResult = await firebaseDB.getCategories()

        if (updatedCategoriesResult.success) {
          const categories = updatedCategoriesResult.categories
          const categoryMap = {}
          categories.forEach((cat) => {
            categoryMap[cat.name.toLowerCase()] = cat.id
          })

          // Create sample vehicles
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
              imageUrl: "https://via.placeholder.com/400x300?text=Toyota+Corolla",
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
              imageUrl: "https://via.placeholder.com/400x300?text=Toyota+RAV4",
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
              imageUrl: "https://via.placeholder.com/400x300?text=BMW+3+Series",
            },
          ]

          for (const vehicle of sampleVehicles) {
            if (vehicle.categoryId) {
              await firebaseDB.createVehicle(vehicle)
            }
          }

          console.log("Sample vehicles created")
        }
      }

      // Initialize system settings
      await firebaseDB.setSetting("site_name", "VehicleRent Pro", "Website name", "general")
      await firebaseDB.setSetting("currency", "USD", "Default currency", "financial")
      await firebaseDB.setSetting("tax_rate", "0.08", "Default tax rate (8%)", "financial")

      console.log("Sample data initialization complete")
    } catch (error) {
      console.error("Error initializing sample data:", error)
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = "0"
        setTimeout(() => {
          loadingScreen.style.display = "none"
        }, 500)
      }, 1000)
    }
  }

  toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu")
    if (mobileMenu) {
      mobileMenu.classList.toggle("hidden")
    }
  }

  toggleUserMenu() {
    const dropdown = document.getElementById("user-dropdown")
    if (dropdown) {
      dropdown.classList.toggle("hidden")
    }
  }

  showAuthModal(type) {
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    modal.id = "auth-modal"

    const isLogin = type === "login"
    const title = isLogin ? "Sign In" : "Create Account"
    const switchText = isLogin ? "Don't have an account?" : "Already have an account?"
    const switchAction = isLogin ? "Sign Up" : "Sign In"

    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">${title}</h2>
          <button id="close-modal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <form id="auth-form" class="space-y-4">
          ${
            !isLogin
              ? `
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" id="fullName" required 
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
            `
              : ""
          }
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" required 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" id="password" required 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          </div>

          ${
            !isLogin
              ? `
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input type="tel" id="phone" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
            `
              : ""
          }

          <button type="submit" id="auth-submit" 
                 class="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition">
            ${title}
          </button>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3">
            <button id="google-signin" 
                   class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <i class="fab fa-google text-red-500 mr-2"></i>
              Google
            </button>
            <button id="facebook-signin" 
                   class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <i class="fab fa-facebook text-blue-600 mr-2"></i>
              Facebook
            </button>
          </div>
        </div>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            ${switchText}
            <button id="switch-auth" class="text-primary-600 hover:text-primary-700 font-medium">
              ${switchAction}
            </button>
          </p>
          ${
            isLogin
              ? `
              <button id="forgot-password" class="text-sm text-primary-600 hover:text-primary-700 mt-2">
                Forgot your password?
              </button>
            `
              : ""
          }
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Setup modal event listeners
    this.setupModalEventListeners(modal, type)
  }

  setupModalEventListeners(modal, type) {
    const closeBtn = modal.querySelector("#close-modal")
    const authForm = modal.querySelector("#auth-form")
    const googleBtn = modal.querySelector("#google-signin")
    const facebookBtn = modal.querySelector("#facebook-signin")
    const switchBtn = modal.querySelector("#switch-auth")
    const forgotBtn = modal.querySelector("#forgot-password")

    // Close modal
    closeBtn.addEventListener("click", () => {
      modal.remove()
    })

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })

    // Form submission
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      await this.handleAuthSubmit(type, modal)
    })

    // Social sign-in
    googleBtn.addEventListener("click", () => this.handleSocialSignIn("google", modal))
    facebookBtn.addEventListener("click", () => this.handleSocialSignIn("facebook", modal))

    // Switch between login/register
    switchBtn.addEventListener("click", () => {
      modal.remove()
      this.showAuthModal(type === "login" ? "register" : "login")
    })

    // Forgot password
    if (forgotBtn) {
      forgotBtn.addEventListener("click", () => this.handleForgotPassword(modal))
    }
  }

  async handleAuthSubmit(type, modal) {
    const submitBtn = modal.querySelector("#auth-submit")
    const originalText = submitBtn.textContent

    try {
      submitBtn.textContent = "Processing..."
      submitBtn.disabled = true

      const email = modal.querySelector("#email").value
      const password = modal.querySelector("#password").value

      let result

      if (type === "login") {
        result = await firebaseAuth.signInWithEmail(email, password)
      } else {
        const fullName = modal.querySelector("#fullName").value
        const phone = modal.querySelector("#phone").value

        result = await firebaseAuth.signUpWithEmail(email, password, {
          fullName,
          phone,
          username: email.split("@")[0],
        })
      }

      if (result.success) {
        this.showNotification(`${type === "login" ? "Signed in" : "Account created"} successfully!`, "success")
        modal.remove()
      } else {
        this.showNotification(result.error, "error")
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
      let result

      if (provider === "google") {
        result = await firebaseAuth.signInWithGoogle()
      } else if (provider === "facebook") {
        result = await firebaseAuth.signInWithFacebook()
      }

      if (result.success) {
        this.showNotification(`Signed in with ${provider} successfully!`, "success")
        modal.remove()
      } else {
        this.showNotification(result.error, "error")
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
        this.showNotification(result.error, "error")
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
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out`

    // Set colors based on type
    const colors = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-500 text-white",
    }

    // Set icons based on type
    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    }

    notification.className += ` ${colors[type] || colors.info}`
    notification.style.transform = "translateX(100%)"

    notification.innerHTML = `
      <div class="flex items-center">
        <i class="${icons[type] || icons.info} mr-3"></i>
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 10)

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove()
        }
      }, 300)
    }, 5000)
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS animation library if available
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
    })
  }

  // Initialize the app
  window.app = new VehicleRentalApp()
})

// Export app for global access
window.VehicleRentPro = {
  firebaseAuth,
  firebaseDB,
  showNotification: (message, type) => {
    if (window.app) {
      window.app.showNotification(message, type)
    }
  },
}
