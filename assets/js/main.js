/**
 * Main JavaScript file for VehicleRentPro
 */

import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos" // Declare AOS variable

class VehicleRentalApp {
  constructor() {
    this.currentUser = null
    this.vehicles = []
    this.categories = []
    this.currentFilters = {
      category: "all",
      priceRange: "all",
      fuelType: "all",
    }
    this.firebaseReady = false

    this.init()
  }

  async init() {
    try {
      // Wait for Firebase to be initialized
      await this.waitForFirebase()

      // Initialize AOS
      AOS.init({
        duration: 1000,
        once: true,
      })

      // Set up event listeners
      this.setupEventListeners()

      // Load initial data
      await this.loadCategories()
      await this.loadVehicles()

      // Hide loading screen
      this.hideLoadingScreen()

      // Set default dates
      this.setDefaultDates()

      console.log("✅ VehicleRentalApp initialized successfully")
    } catch (error) {
      console.error("❌ VehicleRentalApp initialization failed:", error)
      this.showInitializationError(error.message)
    }
  }

  async waitForFirebase() {
    return new Promise((resolve, reject) => {
      // Check if Firebase is already initialized
      if (window.firebaseInitializer && window.firebaseInitializer.isInitialized()) {
        this.firebaseReady = true
        resolve()
        return
      }

      // Listen for Firebase initialization event
      const handleFirebaseInit = (event) => {
        if (event.detail.success) {
          this.firebaseReady = true
          resolve()
        } else {
          reject(new Error(event.detail.error || "Firebase initialization failed"))
        }
        window.removeEventListener("firebaseInitialized", handleFirebaseInit)
      }

      window.addEventListener("firebaseInitialized", handleFirebaseInit)

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener("firebaseInitialized", handleFirebaseInit)
        reject(new Error("Firebase initialization timeout"))
      }, 30000)
    })
  }

  showInitializationError(message) {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      loadingScreen.innerHTML = `
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <h3 class="text-xl font-semibold text-red-600 mb-2">Initialization Failed</h3>
        <p class="text-gray-600 mb-4">${message}</p>
        <button onclick="location.reload()" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
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

    // Modal controls
    document.getElementById("close-auth-modal")?.addEventListener("click", this.hideAuthModal)
    document.getElementById("close-toast")?.addEventListener("click", this.hideNotification)

    // Search form
    document.getElementById("vehicle-search-form")?.addEventListener("submit", this.handleSearch.bind(this))

    // Contact form
    document.getElementById("contact-form")?.addEventListener("submit", this.handleContactForm.bind(this))

    // Hero buttons
    document.getElementById("browse-vehicles-btn")?.addEventListener("click", () => {
      document.getElementById("vehicles").scrollIntoView({ behavior: "smooth" })
    })

    document.getElementById("how-it-works-btn")?.addEventListener("click", () => {
      document.getElementById("how-it-works").scrollIntoView({ behavior: "smooth" })
    })

    document.getElementById("get-started-btn")?.addEventListener("click", () => this.showAuthModal("register"))

    // Vehicle filters
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("vehicle-filter")) {
        this.handleFilterClick(e.target)
      }
    })

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

  async loadCategories() {
    try {
      const result = await firebaseDB.getCategories()
      if (result.success) {
        this.categories = result.categories
        this.renderCategoryFilters()
        this.populateCategorySelect()
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  async loadVehicles() {
    try {
      const result = await firebaseDB.getVehicles("available")
      if (result.success) {
        this.vehicles = result.vehicles
        this.renderVehicles()
        this.updateStats()
      }
    } catch (error) {
      console.error("Error loading vehicles:", error)
      this.showNotification("Error", "Failed to load vehicles", "error")
    }
  }

  renderCategoryFilters() {
    const filtersContainer = document.querySelector(".flex.flex-wrap.justify-center.gap-4.mb-12")
    if (!filtersContainer) return

    // Clear existing filters except "All Vehicles"
    const allButton = filtersContainer.querySelector('[data-category="all"]')
    filtersContainer.innerHTML = ""
    filtersContainer.appendChild(allButton)

    // Add category filters
    this.categories.forEach((category) => {
      const button = document.createElement("button")
      button.className =
        "vehicle-filter px-6 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-primary-600 hover:text-white transition"
      button.setAttribute("data-category", category.id)
      button.innerHTML = `<i class="${category.icon} mr-2"></i>${category.name}`
      filtersContainer.appendChild(button)
    })
  }

  populateCategorySelect() {
    const categorySelect = document.getElementById("category")
    if (!categorySelect) return

    // Clear existing options except the first one
    categorySelect.innerHTML = '<option value="">All Vehicle Types</option>'

    // Add category options
    this.categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category.id
      option.textContent = category.name
      categorySelect.appendChild(option)
    })
  }

  renderVehicles(vehiclesToRender = null) {
    const vehiclesGrid = document.getElementById("vehicles-grid")
    if (!vehiclesGrid) return

    const vehicles = vehiclesToRender || this.vehicles

    if (vehicles.length === 0) {
      vehiclesGrid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-car text-3xl text-gray-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No Vehicles Available</h3>
          <p class="text-gray-500">Please check back later or adjust your filters.</p>
        </div>
      `
      return
    }

    vehiclesGrid.innerHTML = vehicles
      .map(
        (vehicle, index) => `
      <div class="group bg-white rounded-2xl shadow-lg hover:shadow-xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-300" 
           data-aos="fade-up" 
           data-aos-delay="${200 + (index % 3) * 100}"
           data-vehicle-id="${vehicle.id}">
        
        <!-- Image Container -->
        <div class="relative overflow-hidden">
          <img src="${vehicle.imageUrl || "https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"}" 
               alt="${vehicle.make} ${vehicle.model}" 
               class="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500">
          
          <!-- Status Badge -->
          <div class="absolute top-4 right-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Available
            </span>
          </div>
          
          <!-- Category Badge -->
          <div class="absolute top-4 left-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
              ${this.getCategoryName(vehicle.categoryId)}
            </span>
          </div>
          
          <!-- Favorite Button -->
          <button class="absolute bottom-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
            <i class="far fa-heart"></i>
          </button>
        </div>
        
        <!-- Card Content -->
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
                ${vehicle.make} ${vehicle.model}
              </h3>
              <p class="text-sm text-gray-500 mt-1">${vehicle.year} Model</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-primary-600">$${vehicle.dailyRate}</div>
              <div class="text-xs text-gray-500">per day</div>
            </div>
          </div>
          
          <!-- Vehicle Specs -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="flex items-center text-sm text-gray-600">
              <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-users text-primary-600 text-xs"></i>
              </div>
              <span>${vehicle.seats} Seats</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-gas-pump text-primary-600 text-xs"></i>
              </div>
              <span>${this.capitalize(vehicle.fuelType)}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-cogs text-primary-600 text-xs"></i>
              </div>
              <span>${this.capitalize(vehicle.transmission)}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-star text-primary-600 text-xs"></i>
              </div>
              <span>4.8 Rating</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button onclick="app.handleBookVehicle('${vehicle.id}')" 
                   class="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg transition text-center font-medium group-hover:shadow-lg transform group-hover:-translate-y-1">
              <i class="fas fa-calendar-check mr-2"></i>Book Now
            </button>
            <button onclick="app.showVehicleDetails('${vehicle.id}')" 
                   class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-3 rounded-lg transition flex items-center justify-center" 
                   title="View Details">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      </div>
    `,
      )
      .join("")
  }

  getCategoryName(categoryId) {
    const category = this.categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Vehicle"
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  handleFilterClick(button) {
    // Update active filter
    document.querySelectorAll(".vehicle-filter").forEach((btn) => {
      btn.classList.remove("active", "bg-primary-600", "text-white")
      btn.classList.add("bg-gray-200", "text-gray-700")
    })

    button.classList.add("active", "bg-primary-600", "text-white")
    button.classList.remove("bg-gray-200", "text-gray-700")

    // Filter vehicles
    const category = button.getAttribute("data-category")
    this.currentFilters.category = category

    let filteredVehicles = this.vehicles
    if (category !== "all") {
      filteredVehicles = this.vehicles.filter((vehicle) => vehicle.categoryId === category)
    }

    this.renderVehicles(filteredVehicles)
  }

  async handleSearch(e) {
    e.preventDefault()

    const formData = new FormData(e.target)
    const searchData = {
      pickupDate: formData.get("pickup_date"),
      returnDate: formData.get("return_date"),
      category: formData.get("category"),
      location: formData.get("location"),
    }

    // Validate dates
    if (new Date(searchData.pickupDate) >= new Date(searchData.returnDate)) {
      this.showNotification("Error", "Return date must be after pickup date", "error")
      return
    }

    // Filter vehicles based on search criteria
    let filteredVehicles = this.vehicles

    if (searchData.category) {
      filteredVehicles = filteredVehicles.filter((vehicle) => vehicle.categoryId === searchData.category)
    }

    // Check availability (simplified - in real app, check against bookings)
    // For now, just show all available vehicles

    this.renderVehicles(filteredVehicles)

    // Scroll to vehicles section
    document.getElementById("vehicles").scrollIntoView({ behavior: "smooth" })

    this.showNotification("Success", `Found ${filteredVehicles.length} available vehicles`, "success")
  }

  async handleContactForm(e) {
    e.preventDefault()

    const formData = new FormData(e.target)
    const contactData = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    }

    try {
      // In a real app, you would send this to Firebase or an email service
      console.log("Contact form submitted:", contactData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      this.showNotification("Success", "Message sent successfully! We'll get back to you soon.", "success")
      e.target.reset()
    } catch (error) {
      this.showNotification("Error", "Failed to send message. Please try again.", "error")
    }
  }

  async handleBookVehicle(vehicleId) {
    if (!firebaseAuth.isAuthenticated()) {
      this.showAuthModal("login")
      return
    }

    // In a real app, this would open a booking modal or redirect to booking page
    this.showNotification("Info", "Booking feature will be implemented in the full version", "info")
  }

  showVehicleDetails(vehicleId) {
    const vehicle = this.vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) return

    // In a real app, this would show a detailed modal or redirect to vehicle page
    alert(
      `Vehicle Details:\n\n${vehicle.make} ${vehicle.model} (${vehicle.year})\nDaily Rate: $${vehicle.dailyRate}\nFeatures: ${vehicle.features}`,
    )
  }

  showAuthModal(type = "login") {
    const modal = document.getElementById("auth-modal")
    const title = document.getElementById("auth-modal-title")
    const content = document.getElementById("auth-modal-content")

    title.textContent = type === "login" ? "Sign In" : "Create Account"

    if (type === "login") {
      content.innerHTML = this.getLoginFormHTML()
    } else {
      content.innerHTML = this.getRegisterFormHTML()
    }

    modal.classList.remove("hidden")
    modal.classList.add("flex")

    // Set up form event listeners
    this.setupAuthFormListeners(type)
  }

  hideAuthModal() {
    const modal = document.getElementById("auth-modal")
    modal.classList.add("hidden")
    modal.classList.remove("flex")
  }

  getLoginFormHTML() {
    return `
      <!-- Social Login Buttons -->
      <div class="space-y-3 mb-6">
        <button type="button" id="google-signin-btn"
                class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button type="button" id="facebook-signin-btn"
                class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition">
          <i class="fab fa-facebook-f mr-3"></i>
          Continue with Facebook
        </button>
      </div>

      <!-- Divider -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <!-- Email Login Form -->
      <form id="email-login-form" class="space-y-6">
        <div>
          <label for="login-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" id="login-email" name="email" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Enter your email">
        </div>
        
        <div>
          <label for="login-password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input type="password" id="login-password" name="password" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Enter your password">
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">Remember me</label>
          </div>
          <button type="button" id="forgot-password-btn" class="text-sm text-primary-600 hover:text-primary-500">Forgot password?</button>
        </div>
        
        <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-md transition font-medium">
          Sign In
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <button type="button" id="switch-to-register" class="font-medium text-primary-600 hover:text-primary-500">
            Sign up now
          </button>
        </p>
      </div>
    `
  }

  getRegisterFormHTML() {
    return `
      <!-- Social Login Buttons -->
      <div class="space-y-3 mb-6">
        <button type="button" id="google-signin-btn"
                class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button type="button" id="facebook-signin-btn"
                class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition">
          <i class="fab fa-facebook-f mr-3"></i>
          Continue with Facebook
        </button>
      </div>

      <!-- Divider -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or create account with email</span>
        </div>
      </div>

      <!-- Email Register Form -->
      <form id="email-register-form" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="register-firstname" class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input type="text" id="register-firstname" name="firstname" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                   placeholder="First name">
          </div>
          <div>
            <label for="register-lastname" class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input type="text" id="register-lastname" name="lastname" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                   placeholder="Last name">
          </div>
        </div>
        
        <div>
          <label for="register-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" id="register-email" name="email" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Enter your email">
        </div>
        
        <div>
          <label for="register-password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input type="password" id="register-password" name="password" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Create a password">
        </div>
        
        <div>
          <label for="register-confirm-password" class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <input type="password" id="register-confirm-password" name="confirm-password" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Confirm your password">
        </div>
        
        <div class="flex items-center">
          <input id="terms-checkbox" name="terms" type="checkbox" required class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
          <label for="terms-checkbox" class="ml-2 block text-sm text-gray-700">
            I agree to the <a href="#" class="text-primary-600 hover:text-primary-500">Terms and Conditions</a>
          </label>
        </div>
        
        <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-md transition font-medium">
          Create Account
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Already have an account?
          <button type="button" id="switch-to-login" class="font-medium text-primary-600 hover:text-primary-500">
            Sign in here
          </button>
        </p>
      </div>
    `
  }

  setupAuthFormListeners(type) {
    // Social login buttons
    document.getElementById("google-signin-btn")?.addEventListener("click", this.handleGoogleSignIn.bind(this))
    document.getElementById("facebook-signin-btn")?.addEventListener("click", this.handleFacebookSignIn.bind(this))

    // Form switches
    document.getElementById("switch-to-register")?.addEventListener("click", () => this.showAuthModal("register"))
    document.getElementById("switch-to-login")?.addEventListener("click", () => this.showAuthModal("login"))

    // Email forms
    if (type === "login") {
      document.getElementById("email-login-form")?.addEventListener("submit", this.handleEmailLogin.bind(this))
      document.getElementById("forgot-password-btn")?.addEventListener("click", this.handleForgotPassword.bind(this))
    } else {
      document.getElementById("email-register-form")?.addEventListener("submit", this.handleEmailRegister.bind(this))
    }
  }

  async handleGoogleSignIn() {
    try {
      const result = await firebaseAuth.signInWithGoogle()
      if (result.success) {
        this.hideAuthModal()
        this.showNotification("Success", "Signed in successfully!", "success")
      } else {
        this.showNotification("Error", result.error, "error")
      }
    } catch (error) {
      this.showNotification("Error", "Failed to sign in with Google", "error")
    }
  }

  async handleFacebookSignIn() {
    try {
      const result = await firebaseAuth.signInWithFacebook()
      if (result.success) {
        this.hideAuthModal()
        this.showNotification("Success", "Signed in successfully!", "success")
      } else {
        this.showNotification("Error", result.error, "error")
      }
    } catch (error) {
      this.showNotification("Error", "Failed to sign in with Facebook", "error")
    }
  }

  async handleEmailLogin(e) {
    e.preventDefault()

    const formData = new FormData(e.target)
    const email = formData.get("email")
    const password = formData.get("password")

    try {
      const result = await firebaseAuth.signInWithEmail(email, password)
      if (result.success) {
        this.hideAuthModal()
        this.showNotification("Success", "Signed in successfully!", "success")
      } else {
        this.showNotification("Error", result.error, "error")
      }
    } catch (error) {
      this.showNotification("Error", "Failed to sign in", "error")
    }
  }

  async handleEmailRegister(e) {
    e.preventDefault()

    const formData = new FormData(e.target)
    const firstname = formData.get("firstname")
    const lastname = formData.get("lastname")
    const email = formData.get("email")
    const password = formData.get("password")
    const confirmPassword = formData.get("confirm-password")

    if (password !== confirmPassword) {
      this.showNotification("Error", "Passwords do not match", "error")
      return
    }

    if (password.length < 6) {
      this.showNotification("Error", "Password must be at least 6 characters long", "error")
      return
    }

    try {
      const result = await firebaseAuth.signUpWithEmail(email, password, {
        fullName: `${firstname} ${lastname}`,
        username: email.split("@")[0],
      })

      if (result.success) {
        this.hideAuthModal()
        this.showNotification("Success", "Account created successfully!", "success")
      } else {
        this.showNotification("Error", result.error, "error")
      }
    } catch (error) {
      this.showNotification("Error", "Failed to create account", "error")
    }
  }

  async handleForgotPassword() {
    const email = prompt("Enter your email address:")
    if (!email) return

    try {
      const result = await firebaseAuth.resetPassword(email)
      if (result.success) {
        this.showNotification("Success", "Password reset email sent!", "success")
      } else {
        this.showNotification("Error", result.error, "error")
      }
    } catch (error) {
      this.showNotification("Error", "Failed to send reset email", "error")
    }
  }

  async handleLogout() {
    try {
      const result = await firebaseAuth.signOut()
      if (result.success) {
        this.showNotification("Success", "Signed out successfully", "success")
      }
    } catch (error) {
      this.showNotification("Error", "Failed to sign out", "error")
    }
  }

  toggleMobileMenu() {
    const mobileMenu = document.getElementById("mobile-menu")
    mobileMenu.classList.toggle("hidden")
  }

  toggleUserMenu() {
    const dropdown = document.getElementById("user-dropdown")
    dropdown.classList.toggle("hidden")
  }

  setDefaultDates() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 3)

    const pickupDate = document.getElementById("pickup_date")
    const returnDate = document.getElementById("return_date")

    if (pickupDate) pickupDate.value = tomorrow.toISOString().split("T")[0]
    if (returnDate) returnDate.value = dayAfter.toISOString().split("T")[0]
  }

  updateStats() {
    // Update hero stats
    const statsCustomers = document.getElementById("stats-customers")
    const statsVehicles = document.getElementById("stats-vehicles")

    if (statsVehicles) {
      statsVehicles.textContent = `${this.vehicles.length}+`
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.opacity = "0"
        setTimeout(() => {
          loadingScreen.style.display = "none"
        }, 300)
      }, 1500)
    }
  }

  showNotification(title, message, type = "success") {
    const toast = document.getElementById("notification-toast")
    const toastIcon = document.getElementById("toast-icon")
    const toastTitle = document.getElementById("toast-title")
    const toastMessage = document.getElementById("toast-message")

    // Set content
    toastTitle.textContent = title
    toastMessage.textContent = message

    // Set icon and colors based on type
    const iconClasses = {
      success: { icon: "fas fa-check", bg: "bg-green-500" },
      error: { icon: "fas fa-times", bg: "bg-red-500" },
      warning: { icon: "fas fa-exclamation-triangle", bg: "bg-yellow-500" },
      info: { icon: "fas fa-info", bg: "bg-blue-500" },
    }

    const config = iconClasses[type] || iconClasses.success
    toastIcon.className = `w-8 h-8 rounded-full flex items-center justify-center mr-3 ${config.bg}`
    toastIcon.innerHTML = `<i class="${config.icon} text-white"></i>`

    // Show toast
    toast.classList.remove("translate-x-full")
    toast.classList.add("translate-x-0")

    // Auto hide after 5 seconds
    setTimeout(() => {
      this.hideNotification()
    }, 5000)
  }

  hideNotification() {
    const toast = document.getElementById("notification-toast")
    toast.classList.remove("translate-x-0")
    toast.classList.add("translate-x-full")
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new VehicleRentalApp()
})

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  .shadow-card {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .shadow-card-hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`
document.head.appendChild(style)
