// Import Firebase configuration and managers
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos" // Declare the AOS variable

// Initialize AOS (Animate On Scroll)
document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
  })

  // Hide loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      loadingScreen.style.opacity = "0"
      setTimeout(() => {
        loadingScreen.style.display = "none"
      }, 500)
    }
  }, 2000)

  // Initialize the application
  initializeApp()
})

// Initialize application
async function initializeApp() {
  try {
    console.log("Initializing VehicleRent Pro...")

    // Wait for Firebase Auth to initialize
    await firebaseAuth.initialize()

    // Setup event listeners
    setupEventListeners()

    // Initialize sample data if needed
    await initializeSampleData()

    console.log("Application initialized successfully")
  } catch (error) {
    console.error("Error initializing application:", error)
    showNotification("Error initializing application. Please refresh the page.", "error")
  }
}

// Setup event listeners
function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn")
  const mobileMenu = document.getElementById("mobile-menu")

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden")
    })
  }

  // User menu toggle
  const userMenuBtn = document.getElementById("user-menu-btn")
  const userDropdown = document.getElementById("user-dropdown")

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("hidden")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.classList.add("hidden")
    })
  }

  // Auth buttons
  const loginBtn = document.getElementById("login-btn")
  const registerBtn = document.getElementById("register-btn")
  const logoutBtn = document.getElementById("logout-btn")

  if (loginBtn) {
    loginBtn.addEventListener("click", showLoginModal)
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", showRegisterModal)
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }

  // Dashboard links
  const dashboardLink = document.getElementById("dashboard-link")
  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      e.preventDefault()
      redirectToDashboard()
    })
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

// Show login modal
function showLoginModal() {
  const modal = createAuthModal("login")
  document.body.appendChild(modal)
}

// Show register modal
function showRegisterModal() {
  const modal = createAuthModal("register")
  document.body.appendChild(modal)
}

// Create authentication modal
function createAuthModal(type) {
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

  // Setup modal event listeners
  setupModalEventListeners(modal, type)

  return modal
}

// Setup modal event listeners
function setupModalEventListeners(modal, type) {
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
    await handleAuthSubmit(type, modal)
  })

  // Social sign-in
  googleBtn.addEventListener("click", () => handleSocialSignIn("google", modal))
  facebookBtn.addEventListener("click", () => handleSocialSignIn("facebook", modal))

  // Switch between login/register
  switchBtn.addEventListener("click", () => {
    modal.remove()
    const newType = type === "login" ? "register" : "login"
    const newModal = createAuthModal(newType)
    document.body.appendChild(newModal)
  })

  // Forgot password
  if (forgotBtn) {
    forgotBtn.addEventListener("click", () => handleForgotPassword(modal))
  }
}

// Handle authentication form submission
async function handleAuthSubmit(type, modal) {
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
      showNotification(`${type === "login" ? "Signed in" : "Account created"} successfully!`, "success")
      modal.remove()
    } else {
      showNotification(result.error, "error")
    }
  } catch (error) {
    console.error("Auth error:", error)
    showNotification("An unexpected error occurred. Please try again.", "error")
  } finally {
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }
}

// Handle social sign-in
async function handleSocialSignIn(provider, modal) {
  try {
    let result

    if (provider === "google") {
      result = await firebaseAuth.signInWithGoogle()
    } else if (provider === "facebook") {
      result = await firebaseAuth.signInWithFacebook()
    }

    if (result.success) {
      showNotification(`Signed in with ${provider} successfully!`, "success")
      modal.remove()
    } else {
      showNotification(result.error, "error")
    }
  } catch (error) {
    console.error("Social sign-in error:", error)
    showNotification("Social sign-in failed. Please try again.", "error")
  }
}

// Handle forgot password
async function handleForgotPassword(modal) {
  const email = modal.querySelector("#email").value

  if (!email) {
    showNotification("Please enter your email address first.", "warning")
    return
  }

  try {
    const result = await firebaseAuth.resetPassword(email)

    if (result.success) {
      showNotification("Password reset email sent! Check your inbox.", "success")
      modal.remove()
    } else {
      showNotification(result.error, "error")
    }
  } catch (error) {
    console.error("Password reset error:", error)
    showNotification("Failed to send password reset email.", "error")
  }
}

// Handle logout
async function handleLogout() {
  try {
    const result = await firebaseAuth.signOut()

    if (result.success) {
      showNotification("Signed out successfully!", "success")
    } else {
      showNotification("Error signing out. Please try again.", "error")
    }
  } catch (error) {
    console.error("Logout error:", error)
    showNotification("Error signing out. Please try again.", "error")
  }
}

// Redirect to dashboard based on user role
async function redirectToDashboard() {
  try {
    const isAdmin = await firebaseAuth.isAdmin()

    if (isAdmin) {
      window.location.href = "admin/dashboard.html"
    } else {
      // For now, show a message since customer dashboard isn't implemented
      showNotification("Customer dashboard coming soon!", "info")
    }
  } catch (error) {
    console.error("Error redirecting to dashboard:", error)
    showNotification("Error accessing dashboard. Please try again.", "error")
  }
}

// Initialize sample data
async function initializeSampleData() {
  try {
    // Check if sample data already exists
    const categoriesResult = await firebaseDB.getCategories()

    if (categoriesResult.success && categoriesResult.categories.length === 0) {
      console.log("Initializing sample data...")

      // Create sample categories
      const sampleCategories = [
        {
          name: "Economy Cars",
          description: "Affordable and fuel-efficient vehicles",
          icon: "fas fa-car",
          sortOrder: 1,
        },
        {
          name: "Luxury Cars",
          description: "Premium vehicles with advanced features",
          icon: "fas fa-gem",
          sortOrder: 2,
        },
        {
          name: "SUVs",
          description: "Spacious sport utility vehicles",
          icon: "fas fa-truck",
          sortOrder: 3,
        },
        {
          name: "Vans",
          description: "Large capacity vehicles for groups",
          icon: "fas fa-shuttle-van",
          sortOrder: 4,
        },
      ]

      for (const category of sampleCategories) {
        await firebaseDB.createCategory(category)
      }

      // Create sample vehicles
      const categories = await firebaseDB.getCategories()
      if (categories.success && categories.categories.length > 0) {
        const economyCategory = categories.categories.find((c) => c.name === "Economy Cars")
        const luxuryCategory = categories.categories.find((c) => c.name === "Luxury Cars")

        const sampleVehicles = [
          {
            categoryId: economyCategory?.id,
            make: "Toyota",
            model: "Corolla",
            year: 2023,
            licensePlate: "ABC-123",
            color: "White",
            seats: 5,
            fuelType: "petrol",
            transmission: "automatic",
            dailyRate: 45,
            features: "Air Conditioning, Bluetooth, Backup Camera",
            imageUrl: "/placeholder.svg?height=300&width=400",
          },
          {
            categoryId: luxuryCategory?.id,
            make: "BMW",
            model: "3 Series",
            year: 2023,
            licensePlate: "XYZ-789",
            color: "Black",
            seats: 5,
            fuelType: "petrol",
            transmission: "automatic",
            dailyRate: 120,
            features: "Leather Seats, Navigation, Premium Sound",
            imageUrl: "/placeholder.svg?height=300&width=400",
          },
        ]

        for (const vehicle of sampleVehicles) {
          await firebaseDB.createVehicle(vehicle)
        }
      }

      console.log("Sample data initialized successfully")
    }
  } catch (error) {
    console.error("Error initializing sample data:", error)
  }
}

// Show notification
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification")
  existingNotifications.forEach((notification) => notification.remove())

  const notification = document.createElement("div")
  notification.className = `notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`

  const colors = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
  }

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }

  notification.className += ` ${colors[type] || colors.info}`
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
  }, 100)

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(full)"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, 5000)
}

// Utility functions
function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

// Export functions for use in other modules
window.VehicleRentPro = {
  firebaseAuth,
  firebaseDB,
  showNotification,
  formatCurrency,
  formatDate,
  formatDateTime,
}

console.log("VehicleRent Pro main.js loaded successfully")
