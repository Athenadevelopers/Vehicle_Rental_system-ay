// Import Firebase configuration and managers
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos"

class VehiclesPage {
  constructor() {
    this.vehicles = []
    this.categories = []
    this.filteredVehicles = []
    this.currentPage = 1
    this.vehiclesPerPage = 9
    this.categoryMap = {}
    this.urlParams = new URLSearchParams(window.location.search)
    this.init()
  }

  async init() {
    try {
      console.log("Initializing Vehicles Page...")

      // Initialize AOS
      if (typeof AOS !== "undefined") {
        AOS.init({ duration: 800, easing: "ease-in-out", once: true, offset: 50 })
      }

      // Initialize Firebase Auth
      await firebaseAuth.initialize().catch((err) => {
        console.error("Auth initialization error:", err)
        return { success: false, error: err.message }
      })

      // Load data
      await this.loadData()

      // Setup event listeners
      this.setupEventListeners()

      // Apply URL filters if any
      this.applyUrlFilters()

      // Hide loading screen
      this.hideLoadingScreen()

      console.log("✅ Vehicles Page initialized successfully")
    } catch (error) {
      console.error("❌ Vehicles Page initialization failed:", error)
      this.showInitializationError(error.message)
    }
  }

  async loadData() {
    try {
      const [categoriesResult, vehiclesResult] = await Promise.all([
        firebaseDB.getCategories(),
        firebaseDB.getVehicles(),
      ])

      if (categoriesResult.success) {
        this.categories = categoriesResult.categories
        // Create a map for easy lookup
        this.categories.forEach((cat) => {
          this.categoryMap[cat.id] = cat
        })
      } else {
        console.warn("Could not load categories:", categoriesResult.error)
      }

      if (vehiclesResult.success) {
        this.vehicles = vehiclesResult.vehicles
        this.filteredVehicles = [...this.vehicles]
        this.renderVehicles()
        this.updateResultsCount()
        this.renderPagination()
      } else {
        console.warn("Could not load vehicles:", vehiclesResult.error)
        this.showNoVehiclesMessage()
      }
    } catch (error) {
      console.error("Error loading data:", error)
      this.showNoVehiclesMessage("Error loading vehicles. Please try again later.")
    }
  }

  setupEventListeners() {
    // Filter form
    document.getElementById("vehicle-filter-form")?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.applyFilters()
    })

    // Category filter from URL
    const categoryFilter = document.getElementById("category-filter")
    if (categoryFilter) {
      const category = this.urlParams.get("category")
      if (category) {
        categoryFilter.value = category
      }
    }

    // Pagination
    document.getElementById("prev-page")?.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--
        this.renderVehicles()
        this.renderPagination()
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    })

    document.getElementById("next-page")?.addEventListener("click", () => {
      const totalPages = Math.ceil(this.filteredVehicles.length / this.vehiclesPerPage)
      if (this.currentPage < totalPages) {
        this.currentPage++
        this.renderVehicles()
        this.renderPagination()
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    })

    // Modal close button
    document.getElementById("close-modal")?.addEventListener("click", () => {
      this.closeVehicleModal()
    })

    // Close modal when clicking outside
    document.getElementById("vehicle-detail-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "vehicle-detail-modal") {
        this.closeVehicleModal()
      }
    })

    // Book now button in modal
    document.getElementById("book-now-btn")?.addEventListener("click", () => {
      const vehicleId = document.getElementById("book-now-btn").dataset.vehicleId
      if (vehicleId) {
        window.location.href = `book-vehicle.php?vehicle_id=${vehicleId}`
      }
    })

    // Mobile menu toggle
    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
      const mobileMenu = document.getElementById("mobile-menu")
      if (mobileMenu) {
        mobileMenu.classList.toggle("hidden")
      }
    })
  }

  applyUrlFilters() {
    const category = this.urlParams.get("category")
    if (category) {
      this.filterVehiclesByCategory(category)
      document.getElementById("results-heading").textContent = `${this.getCategoryTitle(category)} Vehicles`
    }
  }

  getCategoryTitle(categorySlug) {
    const categoryTitles = {
      budget: "Budget",
      sedan: "Sedan",
      suv: "SUV & Jeep",
      van: "Van",
      luxury: "Luxury",
    }
    return categoryTitles[categorySlug] || "All"
  }

  applyFilters() {
    const categoryValue = document.getElementById("category-filter").value
    const transmissionValue = document.getElementById("transmission-filter").value
    const fuelValue = document.getElementById("fuel-filter").value
    const minPrice = document.getElementById("min-price").value
      ? Number.parseInt(document.getElementById("min-price").value)
      : 0
    const maxPrice = document.getElementById("max-price").value
      ? Number.parseInt(document.getElementById("max-price").value)
      : Number.POSITIVE_INFINITY

    this.filteredVehicles = this.vehicles.filter((vehicle) => {
      // Category filter
      if (categoryValue && !this.matchesCategory(vehicle, categoryValue)) {
        return false
      }

      // Transmission filter
      if (transmissionValue && vehicle.transmission !== transmissionValue) {
        return false
      }

      // Fuel filter
      if (fuelValue && vehicle.fuelType !== fuelValue) {
        return false
      }

      // Price range filter
      if (vehicle.dailyRate < minPrice || vehicle.dailyRate > maxPrice) {
        return false
      }

      return true
    })

    // Update URL with filters
    const params = new URLSearchParams()
    if (categoryValue) params.set("category", categoryValue)
    if (transmissionValue) params.set("transmission", transmissionValue)
    if (fuelValue) params.set("fuel", fuelValue)
    if (minPrice > 0) params.set("min_price", minPrice)
    if (maxPrice < Number.POSITIVE_INFINITY) params.set("max_price", maxPrice)

    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`
    window.history.pushState({}, "", newUrl)

    // Reset to first page
    this.currentPage = 1

    // Update UI
    this.renderVehicles()
    this.updateResultsCount()
    this.renderPagination()

    // Update heading
    if (categoryValue) {
      document.getElementById("results-heading").textContent = `${this.getCategoryTitle(categoryValue)} Vehicles`
    } else {
      document.getElementById("results-heading").textContent = "All Vehicles"
    }
  }

  matchesCategory(vehicle, categorySlug) {
    // Map category slugs to potential category IDs or names
    const categoryMapping = {
      budget: ["budget", "economy", "Budget Cars (Hatchback)"],
      sedan: ["sedan", "Sedans"],
      suv: ["suv", "jeep", "4x4", "SUVs & Jeeps"],
      van: ["van", "minibus", "Vans (KDH/HiAce)"],
      luxury: ["luxury", "premium", "Luxury Cars"],
    }

    // Get the category name from the vehicle's categoryId
    const vehicleCategory = this.categoryMap[vehicle.categoryId]
    const categoryName = vehicleCategory ? vehicleCategory.name : ""

    // Check if the vehicle's category matches any of the mapped values
    return categoryMapping[categorySlug].some((term) => categoryName.toLowerCase().includes(term.toLowerCase()))
  }

  filterVehiclesByCategory(category) {
    this.filteredVehicles = this.vehicles.filter((vehicle) => this.matchesCategory(vehicle, category))
    this.currentPage = 1
    this.renderVehicles()
    this.updateResultsCount()
    this.renderPagination()
  }

  renderVehicles() {
    const vehiclesGrid = document.getElementById("vehicles-grid")
    if (!vehiclesGrid) return

    if (this.filteredVehicles.length === 0) {
      this.showNoVehiclesMessage()
      return
    }

    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.vehiclesPerPage
    const endIndex = startIndex + this.vehiclesPerPage
    const paginatedVehicles = this.filteredVehicles.slice(startIndex, endIndex)

    vehiclesGrid.innerHTML = paginatedVehicles
      .map(
        (vehicle, index) => `
      <div class="bg-white rounded-lg shadow-md overflow-hidden transform hover:shadow-lg transition-all duration-300" 
           data-aos="fade-up" data-aos-delay="${100 + (index % this.vehiclesPerPage) * 100}">
        <div class="relative">
          <img src="${vehicle.imageUrl || "/placeholder.svg?width=400&height=250&text=Vehicle+Image"}" 
               alt="${vehicle.make} ${vehicle.model}" class="w-full h-48 object-cover">
          <div class="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 text-sm font-semibold">
            ${this.getVehicleStatus(vehicle)}
          </div>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-semibold text-gray-800">${vehicle.make} ${vehicle.model}</h3>
            <span class="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">${vehicle.year}</span>
          </div>
          <p class="text-sm text-gray-500 mb-3">
            ${this.getCategoryName(vehicle.categoryId)} • ${vehicle.transmission} • ${vehicle.fuelType}
          </p>
          <div class="flex items-center text-sm text-gray-600 mb-4">
            <div class="flex items-center mr-4">
              <i class="fas fa-users mr-1 text-primary-600"></i> ${vehicle.seats} seats
            </div>
            <div class="flex items-center">
              <i class="fas fa-suitcase mr-1 text-primary-600"></i> ${this.getLuggageCapacity(vehicle)}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <div>
              <span class="text-2xl font-bold text-primary-600">LKR ${vehicle.dailyRate ? vehicle.dailyRate.toLocaleString("en-LK") : "N/A"}</span>
              <span class="text-sm text-gray-500">/day</span>
            </div>
            <button class="view-details-btn bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition text-sm font-medium"
                    data-vehicle-id="${vehicle.id}">
              View Details
            </button>
          </div>
        </div>
      </div>
    `,
      )
      .join("")

    // Add event listeners to view details buttons
    document.querySelectorAll(".view-details-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const vehicleId = btn.dataset.vehicleId
        this.showVehicleDetails(vehicleId)
      })
    })
  }

  getVehicleStatus(vehicle) {
    return vehicle.status === "rented" ? "Rented" : "Available"
  }

  getLuggageCapacity(vehicle) {
    // This is a placeholder. In a real app, you'd have this data in your vehicle object
    const capacityMap = {
      "Budget Cars (Hatchback)": "2 bags",
      Sedans: "3 bags",
      "SUVs & Jeeps": "5 bags",
      "Vans (KDH/HiAce)": "10+ bags",
      "Luxury Cars": "4 bags",
    }

    const category = this.getCategoryName(vehicle.categoryId)
    return capacityMap[category] || "2-3 bags"
  }

  getCategoryName(categoryId) {
    const category = this.categoryMap[categoryId]
    return category ? category.name : "Uncategorized"
  }

  updateResultsCount() {
    const resultsCount = document.getElementById("results-count")
    if (resultsCount) {
      resultsCount.textContent = `Showing ${this.filteredVehicles.length} vehicle${this.filteredVehicles.length !== 1 ? "s" : ""}`
    }
  }

  renderPagination() {
    const paginationContainer = document.getElementById("pagination-container")
    const pageNumbers = document.getElementById("page-numbers")
    const prevButton = document.getElementById("prev-page")
    const nextButton = document.getElementById("next-page")

    if (!paginationContainer || !pageNumbers || !prevButton || !nextButton) return

    const totalPages = Math.ceil(this.filteredVehicles.length / this.vehiclesPerPage)

    // Hide pagination if only one page
    if (totalPages <= 1) {
      paginationContainer.classList.add("hidden")
      return
    } else {
      paginationContainer.classList.remove("hidden")
    }

    // Update prev/next buttons
    prevButton.disabled = this.currentPage === 1
    nextButton.disabled = this.currentPage === totalPages

    // Generate page numbers
    pageNumbers.innerHTML = ""

    // Determine which page numbers to show
    let startPage = Math.max(1, this.currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4)
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageNumbers.innerHTML += `
        <button class="page-number px-3 py-1 rounded-md ${1 === this.currentPage ? "bg-primary-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}" data-page="1">1</button>
      `
      if (startPage > 2) {
        pageNumbers.innerHTML += `<span class="px-2">...</span>`
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.innerHTML += `
        <button class="page-number px-3 py-1 rounded-md ${i === this.currentPage ? "bg-primary-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}" data-page="${i}">${i}</button>
      `
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.innerHTML += `<span class="px-2">...</span>`
      }
      pageNumbers.innerHTML += `
        <button class="page-number px-3 py-1 rounded-md ${totalPages === this.currentPage ? "bg-primary-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}" data-page="${totalPages}">${totalPages}</button>
      `
    }

    // Add event listeners to page numbers
    document.querySelectorAll(".page-number").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentPage = Number.parseInt(btn.dataset.page)
        this.renderVehicles()
        this.renderPagination()
        window.scrollTo({ top: 0, behavior: "smooth" })
      })
    })
  }

  async showVehicleDetails(vehicleId) {
    try {
      const vehicle = this.vehicles.find((v) => v.id === vehicleId)
      if (!vehicle) {
        console.error("Vehicle not found:", vehicleId)
        return
      }

      const modal = document.getElementById("vehicle-detail-modal")
      const modalTitle = document.getElementById("modal-vehicle-title")
      const modalContent = document.getElementById("modal-vehicle-content")
      const bookNowBtn = document.getElementById("book-now-btn")

      if (!modal || !modalTitle || !modalContent || !bookNowBtn) return

      // Set modal title
      modalTitle.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year})`

      // Set book now button data
      bookNowBtn.dataset.vehicleId = vehicleId

      // Populate modal content
      modalContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img src="${vehicle.imageUrl || "/placeholder.svg?width=600&height=400&text=Vehicle+Image"}" 
                 alt="${vehicle.make} ${vehicle.model}" class="w-full h-64 object-cover rounded-lg">
            <div class="grid grid-cols-3 gap-2 mt-2">
              <img src="/placeholder.svg?width=200&height=150&text=Interior" alt="Interior" class="w-full h-20 object-cover rounded">
              <img src="/placeholder.svg?width=200&height=150&text=Side+View" alt="Side View" class="w-full h-20 object-cover rounded">
              <img src="/placeholder.svg?width=200&height=150&text=Back+View" alt="Back View" class="w-full h-20 object-cover rounded">
            </div>
          </div>
          <div>
            <div class="mb-4">
              <span class="inline-block bg-${vehicle.status === "rented" ? "red" : "green"}-100 text-${vehicle.status === "rented" ? "red" : "green"}-800 px-2 py-1 rounded text-sm font-medium">
                ${vehicle.status === "rented" ? "Currently Rented" : "Available for Rent"}
              </span>
              <span class="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium ml-2">
                ${this.getCategoryName(vehicle.categoryId)}
              </span>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${vehicle.make} ${vehicle.model} ${vehicle.year}</h3>
            <div class="text-3xl font-bold text-primary-600 mb-4">
              LKR ${vehicle.dailyRate ? vehicle.dailyRate.toLocaleString("en-LK") : "N/A"}<span class="text-sm font-normal text-gray-500">/day</span>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="flex items-center">
                <i class="fas fa-palette text-primary-600 mr-2"></i>
                <span class="text-gray-700">Color: <span class="font-medium">${vehicle.color || "N/A"}</span></span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-users text-primary-600 mr-2"></i>
                <span class="text-gray-700">Seats: <span class="font-medium">${vehicle.seats || "N/A"}</span></span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-gas-pump text-primary-600 mr-2"></i>
                <span class="text-gray-700">Fuel: <span class="font-medium">${vehicle.fuelType || "N/A"}</span></span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-cog text-primary-600 mr-2"></i>
                <span class="text-gray-700">Transmission: <span class="font-medium">${vehicle.transmission || "N/A"}</span></span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-tachometer-alt text-primary-600 mr-2"></i>
                <span class="text-gray-700">Mileage: <span class="font-medium">${vehicle.mileage ? vehicle.mileage.toLocaleString() + " km" : "N/A"}</span></span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-id-card text-primary-600 mr-2"></i>
                <span class="text-gray-700">License: <span class="font-medium">${vehicle.licensePlate || "N/A"}</span></span>
              </div>
            </div>
            <div class="mb-6">
              <h4 class="text-lg font-semibold mb-2">Features</h4>
              <p class="text-gray-700">${vehicle.features || "Information not available"}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-lg font-semibold mb-2">Rental Terms</h4>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>• Minimum rental period: 1 day</li>
                <li>• Security deposit: LKR ${(vehicle.dailyRate * 2).toLocaleString("en-LK")}</li>
                <li>• Valid driver's license required</li>
                <li>• Driver must be 21+ years old</li>
                <li>• Fuel policy: Return with same level</li>
              </ul>
            </div>
          </div>
        </div>
      `

      // Show modal
      modal.classList.remove("hidden")
      modal.classList.add("flex")
    } catch (error) {
      console.error("Error showing vehicle details:", error)
    }
  }

  closeVehicleModal() {
    const modal = document.getElementById("vehicle-detail-modal")
    if (modal) {
      modal.classList.add("hidden")
      modal.classList.remove("flex")
    }
  }

  showNoVehiclesMessage(message = "No vehicles match your search criteria. Please try different filters.") {
    const vehiclesGrid = document.getElementById("vehicles-grid")
    if (vehiclesGrid) {
      vehiclesGrid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-car-side text-3xl text-gray-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No Vehicles Found</h3>
          <p class="text-gray-500">${message}</p>
        </div>
      `
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
          <h3 class="text-lg font-semibold text-red-600 mb-2">Failed to Load Vehicles</h3>
          <p class="text-gray-600 mb-4 text-sm">We couldn't load the vehicle data. This might be due to a network issue or a problem with the Firebase configuration.</p>
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
  window.vehiclesPage = new VehiclesPage()
})
