// Import Firebase configuration and managers
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos"

class HomePage {
  constructor() {
    this.init()
  }

  async init() {
    try {
      console.log("Initializing Home Page...")

      // Initialize AOS
      if (typeof AOS !== "undefined") {
        AOS.init({ duration: 800, easing: "ease-in-out", once: true, offset: 50 })
      }

      // Initialize Firebase Auth
      await firebaseAuth.initialize().catch((err) => {
        console.error("Auth initialization error:", err)
        return { success: false, error: err.message }
      })

      // Setup event listeners
      this.setupEventListeners()

      // Load popular vehicles
      this.loadPopularVehicles()

      // Set default dates
      this.setDefaultDates()

      // Hide loading screen
      this.hideLoadingScreen()

      console.log("✅ Home Page initialized successfully")
    } catch (error) {
      console.error("❌ Home Page initialization failed:", error)
      this.showInitializationError(error.message)
    }
  }

  setupEventListeners() {
    // Mobile menu toggle
    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
      const mobileMenu = document.getElementById("mobile-menu")
      if (mobileMenu) {
        mobileMenu.classList.toggle("hidden")
      }
    })

    // User menu toggle
    document.getElementById("user-menu-btn")?.addEventListener("click", () => {
      const userDropdown = document.getElementById("user-dropdown")
      if (userDropdown) {
        userDropdown.classList.toggle("hidden")
      }
    })

    // Login button
    document.getElementById("login-btn")?.addEventListener("click", () => {
      window.location.href = "login.php"
    })

    // Register button
    document.getElementById("register-btn")?.addEventListener("click", () => {
      window.location.href = "register.php"
    })

    // Logout button
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      try {
        await firebaseAuth.signOut()
        window.location.href = "index.html"
      } catch (error) {
        console.error("Logout error:", error)
      }
    })

    // Use my location button
    document.getElementById("use-my-location")?.addEventListener("click", () => {
      this.getUserLocation()
    })

    // Search form submission
    document.querySelector(".search-form")?.addEventListener("submit", (e) => {
      e.preventDefault()

      const pickupLocation = document.getElementById("pickup-location").value
      const vehicleType = document.getElementById("vehicle-type").value
      const pickupDate = document.getElementById("pickup-date").value
      const returnDate = document.getElementById("return-date").value

      // Validate dates
      if (!pickupDate || !returnDate) {
        alert("Please select both pickup and return dates.")
        return
      }

      const pickupDateTime = new Date(pickupDate)
      const returnDateTime = new Date(returnDate)

      if (returnDateTime <= pickupDateTime) {
        alert("Return date must be after pickup date.")
        return
      }

      // Build query string
      const params = new URLSearchParams()
      if (pickupLocation) params.set("location", pickupLocation)
      if (vehicleType) params.set("category", vehicleType)
      if (pickupDate) params.set("pickup_date", pickupDate)
      if (returnDate) params.set("return_date", returnDate)

      // Redirect to vehicles page with filters
      window.location.href = `vehicles.html?${params.toString()}`
    })
  }

  async loadPopularVehicles() {
    try {
      const result = await firebaseDB.getPopularVehicles(4)

      if (result.success) {
        this.renderPopularVehicles(result.vehicles)
      } else {
        console.warn("Could not load popular vehicles:", result.error)
        this.showNoVehiclesMessage()
      }
    } catch (error) {
      console.error("Error loading popular vehicles:", error)
      this.showNoVehiclesMessage()
    }
  }

  renderPopularVehicles(vehicles) {
    const container = document.getElementById("popular-vehicles")
    if (!container) return

    if (!vehicles || vehicles.length === 0) {
      this.showNoVehiclesMessage()
      return
    }

    container.innerHTML = vehicles
      .map(
        (vehicle, index) => `
      <div class="vehicle-card bg-white rounded-lg shadow-md overflow-hidden" data-aos="fade-up" data-aos-delay="${100 * index}">
        <div class="relative">
          <img src="${vehicle.imageUrl || "/placeholder.svg?width=400&height=250&text=Vehicle+Image"}" 
               alt="${vehicle.make} ${vehicle.model}" class="w-full h-48 object-cover">
          <div class="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 text-sm font-semibold">
            ${vehicle.status === "rented" ? "Rented" : "Available"}
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-1">${vehicle.make} ${vehicle.model}</h3>
          <p class="text-sm text-gray-500 mb-3">
            ${vehicle.year} • ${vehicle.transmission} • ${vehicle.fuelType}
          </p>
          <div class="flex justify-between items-center">
            <div>
              <span class="text-xl font-bold text-primary-600">LKR ${vehicle.dailyRate ? vehicle.dailyRate.toLocaleString("en-LK") : "N/A"}</span>
              <span class="text-sm text-gray-500">/day</span>
            </div>
            <a href="vehicles.html?vehicle_id=${vehicle.id}" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition text-sm font-medium">
              View Details
            </a>
          </div>
        </div>
      </div>
    `,
      )
      .join("")
  }

  showNoVehiclesMessage() {
    const container = document.getElementById("popular-vehicles")
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-car-side text-3xl text-gray-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No Vehicles Available</h3>
          <p class="text-gray-500">We're currently updating our fleet. Please check back soon.</p>
        </div>
      `
    }
  }

  setDefaultDates() {
    const pickupDateInput = document.getElementById("pickup-date")
    const returnDateInput = document.getElementById("return-date")

    if (pickupDateInput && returnDateInput) {
      // Set pickup date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      pickupDateInput.valueAsDate = tomorrow

      // Set return date to 3 days after pickup
      const returnDate = new Date(tomorrow)
      returnDate.setDate(returnDate.getDate() + 3)
      returnDateInput.valueAsDate = returnDate

      // Set min dates
      const today = new Date().toISOString().split("T")[0]
      pickupDateInput.min = today
      returnDateInput.min = tomorrow.toISOString().split("T")[0]

      // Update return date min when pickup date changes
      pickupDateInput.addEventListener("change", () => {
        const newPickupDate = new Date(pickupDateInput.value)
        const nextDay = new Date(newPickupDate)
        nextDay.setDate(nextDay.getDate() + 1)
        returnDateInput.min = nextDay.toISOString().split("T")[0]

        // If return date is before or equal to pickup date, update it
        const returnDate = new Date(returnDateInput.value)
        if (returnDate <= newPickupDate) {
          const newReturnDate = new Date(newPickupDate)
          newReturnDate.setDate(newReturnDate.getDate() + 3)
          returnDateInput.valueAsDate = newReturnDate
        }
      })
    }
  }

  getUserLocation() {
    const locationInput = document.getElementById("pickup-location")
    const locationButton = document.getElementById("use-my-location")

    if (!locationInput || !locationButton) return

    if (navigator.geolocation) {
      // Show loading state
      locationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
      locationButton.disabled = true

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            // Use reverse geocoding to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            )
            const data = await response.json()

            if (data && data.display_name) {
              // Extract city and country
              const address = data.address
              let locationString = ""

              if (address.city || address.town || address.village) {
                locationString = address.city || address.town || address.village
              }

              if (address.suburb && !locationString.includes(address.suburb)) {
                locationString = locationString ? `${address.suburb}, ${locationString}` : address.suburb
              }

              if (address.state_district && !locationString.includes(address.state_district)) {
                locationString = locationString
                  ? `${locationString}, ${address.state_district}`
                  : address.state_district
              }

              if (!locationString) {
                locationString = data.display_name.split(",").slice(0, 2).join(",")
              }

              locationInput.value = locationString
            } else {
              locationInput.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }
          } catch (error) {
            console.error("Error getting location:", error)
            locationInput.value = "Location detection failed"
          } finally {
            // Reset button
            locationButton.innerHTML = '<i class="fas fa-location-arrow"></i>'
            locationButton.disabled = false
          }
        },
        (error) => {
          console.error("Geolocation error:", error)

          let errorMessage = "Could not detect location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              break
          }

          locationInput.value = errorMessage

          // Reset button
          locationButton.innerHTML = '<i class="fas fa-location-arrow"></i>'
          locationButton.disabled = false
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      locationInput.value = "Geolocation not supported by your browser"
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
      }, 500)
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
          <h3 class="text-lg font-semibold text-red-600 mb-2">Initialization Error</h3>
          <p class="text-gray-600 mb-4 text-sm">We couldn't initialize the page. This might be due to a network issue or a problem with the Firebase configuration.</p>
          <p class="text-xs text-gray-500 mb-4">Error: ${message}</p>
          <button onclick="location.reload()" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm">
            Try Again
          </button>
        </div>
      `
    }
  }
}

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.homePage = new HomePage()
})
