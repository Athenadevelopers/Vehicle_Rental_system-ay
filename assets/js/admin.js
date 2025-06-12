import { firebaseAuth, firebaseDB } from "./firebase-config.js"

class AdminDashboard {
  constructor() {
    this.currentUser = null
    this.currentSection = "dashboard"
    this.data = {
      vehicles: [],
      bookings: [],
      customers: [],
      categories: [],
      stats: {},
    }

    this.init()
  }

  async init() {
    // Check authentication
    await this.checkAuth()

    // Set up event listeners
    this.setupEventListeners()

    // Load initial data
    await this.loadDashboardData()

    // Hide loading screen
    this.hideLoadingScreen()
  }

  async checkAuth() {
    return new Promise((resolve) => {
      const unsubscribe = firebaseAuth.auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userRole = await firebaseAuth.getUserRole()
          if (userRole === "admin") {
            this.currentUser = user
            this.updateUserInfo(user)
            resolve()
          } else {
            // Redirect to main site if not admin
            window.location.href = "../index.html"
          }
        } else {
          // Redirect to login if not authenticated
          window.location.href = "../index.html"
        }
        unsubscribe()
      })
    })
  }

  updateUserInfo(user) {
    const adminName = document.getElementById("admin-name")
    const adminAvatar = document.getElementById("admin-avatar")

    if (adminName) {
      adminName.textContent = user.displayName || user.email
    }

    if (adminAvatar && user.photoURL) {
      adminAvatar.src = user.photoURL
    }
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault()
        const section = e.currentTarget.getAttribute("href").substring(1)
        this.showSection(section)
      })
    })

    // Sidebar toggle
    document.getElementById("sidebar-toggle")?.addEventListener("click", this.toggleSidebar)

    // User menu
    document.getElementById("user-menu-btn")?.addEventListener("click", this.toggleUserMenu)

    // Logout buttons
    document.getElementById("logout-btn")?.addEventListener("click", this.handleLogout.bind(this))
    document.getElementById("logout-btn-header")?.addEventListener("click", this.handleLogout.bind(this))

    // Add buttons
    document.getElementById("add-vehicle-btn")?.addEventListener("click", () => this.showAddVehicleModal())
    document.getElementById("add-category-btn")?.addEventListener("click", () => this.showAddCategoryModal())

    // Modal close
    document.getElementById("modal-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") {
        this.hideModal()
      }
    })

    // Toast close
    document.getElementById("close-toast")?.addEventListener("click", this.hideNotification)
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.add("hidden")
      section.classList.remove("active")
    })

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`)
    if (targetSection) {
      targetSection.classList.remove("hidden")
      targetSection.classList.add("active")
    }

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active", "bg-primary-50", "text-primary-600")
    })

    const activeNavItem = document.querySelector(`[href="#${sectionName}"]`)
    if (activeNavItem) {
      activeNavItem.classList.add("active", "bg-primary-50", "text-primary-600")
    }

    // Update page title
    const pageTitle = document.getElementById("page-title")
    if (pageTitle) {
      pageTitle.textContent = this.capitalize(sectionName)
    }

    this.currentSection = sectionName

    // Load section-specific data
    this.loadSectionData(sectionName)
  }

  async loadSectionData(sectionName) {
    switch (sectionName) {
      case "dashboard":
        await this.loadDashboardData()
        break
      case "vehicles":
        await this.loadVehicles()
        break
      case "bookings":
        await this.loadBookings()
        break
      case "customers":
        await this.loadCustomers()
        break
      case "categories":
        await this.loadCategories()
        break
    }
  }

  async loadDashboardData() {
    try {
      // Load stats
      const statsResult = await firebaseDB.getDashboardStats(null, "admin")
      if (statsResult.success) {
        this.data.stats = statsResult.stats
        this.updateStatsCards()
      }

      // Load recent bookings
      const bookingsResult = await firebaseDB.getBookings(null, null, 5)
      if (bookingsResult.success) {
        this.renderRecentBookings(bookingsResult.bookings)
      }

      // Load vehicle status
      const vehiclesResult = await firebaseDB.getVehicles()
      if (vehiclesResult.success) {
        this.renderVehicleStatus(vehiclesResult.vehicles)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      this.showNotification("Error", "Failed to load dashboard data", "error")
    }
  }

  updateStatsCards() {
    const stats = this.data.stats

    document.getElementById("total-vehicles").textContent = stats.totalVehicles || 0
    document.getElementById("active-bookings").textContent = stats.activeBookings || 0
    document.getElementById("total-customers").textContent = stats.totalCustomers || 0
    document.getElementById("total-revenue").textContent = `$${(stats.totalRevenue || 0).toLocaleString()}`
  }

  renderRecentBookings(bookings) {
    const container = document.getElementById("recent-bookings")

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-calendar-alt text-3xl mb-2"></i>
          <p>No recent bookings</p>
        </div>
      `
      return
    }

    container.innerHTML = bookings
      .map(
        (booking) => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 class="font-medium text-gray-900">${booking.bookingNumber}</h4>
          <p class="text-sm text-gray-600">${booking.customerInfo?.name || "Customer"}</p>
        </div>
        <div class="text-right">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(booking.status)}">
            ${this.capitalize(booking.status)}
          </span>
          <p class="text-sm text-gray-600 mt-1">$${booking.totalAmount}</p>
        </div>
      </div>
    `,
      )
      .join("")
  }

  renderVehicleStatus(vehicles) {
    const container = document.getElementById("vehicle-status")

    const statusCounts = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1
      return acc
    }, {})

    const statuses = [
      { key: "available", label: "Available", color: "text-green-600", icon: "fas fa-check-circle" },
      { key: "rented", label: "Rented", color: "text-blue-600", icon: "fas fa-car" },
      { key: "maintenance", label: "Maintenance", color: "text-yellow-600", icon: "fas fa-wrench" },
      { key: "unavailable", label: "Unavailable", color: "text-red-600", icon: "fas fa-times-circle" },
    ]

    container.innerHTML = statuses
      .map(
        (status) => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center">
          <i class="${status.icon} ${status.color} mr-3"></i>
          <span class="font-medium text-gray-900">${status.label}</span>
        </div>
        <span class="text-lg font-bold ${status.color}">${statusCounts[status.key] || 0}</span>
      </div>
    `,
      )
      .join("")
  }

  async loadVehicles() {
    try {
      const result = await firebaseDB.getVehicles()
      if (result.success) {
        this.data.vehicles = result.vehicles
        this.renderVehiclesTable()
      }
    } catch (error) {
      console.error("Error loading vehicles:", error)
      this.showNotification("Error", "Failed to load vehicles", "error")
    }
  }

  renderVehiclesTable() {
    const container = document.getElementById("vehicles-table")
    const vehicles = this.data.vehicles

    if (vehicles.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-car text-3xl mb-2"></i>
          <p>No vehicles found</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${vehicles
            .map(
              (vehicle) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img class="h-10 w-10 rounded-lg object-cover" src="${vehicle.imageUrl || "https://via.placeholder.com/40"}" alt="${vehicle.make} ${vehicle.model}">
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${vehicle.make} ${vehicle.model}</div>
                    <div class="text-sm text-gray-500">${vehicle.year} • ${vehicle.licensePlate}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.getCategoryName(vehicle.categoryId)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(vehicle.status)}">
                  ${this.capitalize(vehicle.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $${vehicle.dailyRate}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="admin.editVehicle('${vehicle.id}')" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                <button onclick="admin.deleteVehicle('${vehicle.id}')" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `
  }

  async loadBookings() {
    try {
      const result = await firebaseDB.getBookings()
      if (result.success) {
        this.data.bookings = result.bookings
        this.renderBookingsTable()
      }
    } catch (error) {
      console.error("Error loading bookings:", error)
      this.showNotification("Error", "Failed to load bookings", "error")
    }
  }

  renderBookingsTable() {
    const container = document.getElementById("bookings-table")
    const bookings = this.data.bookings

    if (bookings.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-calendar-alt text-3xl mb-2"></i>
          <p>No bookings found</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking #</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${bookings
            .map(
              (booking) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${booking.bookingNumber}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${booking.customerInfo?.name || "N/A"}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${booking.vehicleInfo?.make} ${booking.vehicleInfo?.model}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.formatDate(booking.startDate)} - ${this.formatDate(booking.endDate)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(booking.status)}">
                  ${this.capitalize(booking.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $${booking.totalAmount}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="admin.viewBooking('${booking.id}')" class="text-primary-600 hover:text-primary-900 mr-3">View</button>
                <button onclick="admin.updateBookingStatus('${booking.id}')" class="text-green-600 hover:text-green-900">Update</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `
  }

  async loadCustomers() {
    try {
      const result = await firebaseDB.getAllUsers("customer")
      if (result.success) {
        this.data.customers = result.users
        this.renderCustomersTable()
      }
    } catch (error) {
      console.error("Error loading customers:", error)
      this.showNotification("Error", "Failed to load customers", "error")
    }
  }

  renderCustomersTable() {
    const container = document.getElementById("customers-table")
    const customers = this.data.customers

    if (customers.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-users text-3xl mb-2"></i>
          <p>No customers found</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${customers
            .map(
              (customer) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img class="h-10 w-10 rounded-full" src="${customer.photoURL || "https://via.placeholder.com/40"}" alt="${customer.fullName}">
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${customer.fullName || "N/A"}</div>
                    <div class="text-sm text-gray-500">@${customer.username}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${customer.email}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${customer.phone || "N/A"}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${customer.stats?.totalBookings || 0}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(customer.status)}">
                  ${this.capitalize(customer.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="admin.viewCustomer('${customer.uid}')" class="text-primary-600 hover:text-primary-900 mr-3">View</button>
                <button onclick="admin.toggleCustomerStatus('${customer.uid}')" class="text-yellow-600 hover:text-yellow-900">Toggle Status</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `
  }

  async loadCategories() {
    try {
      const result = await firebaseDB.getCategories()
      if (result.success) {
        this.data.categories = result.categories
        this.renderCategoriesTable()
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      this.showNotification("Error", "Failed to load categories", "error")
    }
  }

  renderCategoriesTable() {
    const container = document.getElementById("categories-table")
    const categories = this.data.categories

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-tags text-3xl mb-2"></i>
          <p>No categories found</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${categories
            .map(
              (category) => `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${category.name}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${category.description}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${category.sortOrder}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(category.status)}">
                  ${this.capitalize(category.status)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="admin.editCategory('${category.id}')" class="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                <button onclick="admin.deleteCategory('${category.id}')" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString()
  }

  getStatusColor(status) {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "rented":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "unavailable":
        return "bg-red-100 text-red-800"
      default:
        return ""
    }
  }

  getCategoryName(categoryId) {
    const category = this.data.categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "N/A"
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      loadingScreen.classList.add("hidden")
    }
  }

  showNotification(title, message, type) {
    const toast = document.getElementById("toast")
    const toastTitle = document.getElementById("toast-title")
    const toastMessage = document.getElementById("toast-message")
    const toastType = document.getElementById("toast-type")

    if (toast && toastTitle && toastMessage && toastType) {
      toastTitle.textContent = title
      toastMessage.textContent = message
      toastType.className = `fas fa-${type === "error" ? "times" : "check"} text-${type === "error" ? "red" : "green"}-500`
      toast.classList.remove("hidden")
    }
  }

  hideNotification() {
    const toast = document.getElementById("toast")
    if (toast) {
      toast.classList.add("hidden")
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.remove("hidden")
    }
  }

  hideModal() {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      modal.classList.add("hidden")
    })
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar")
    if (sidebar) {
      sidebar.classList.toggle("hidden")
    }
  }

  toggleUserMenu() {
    const userMenu = document.getElementById("user-menu")
    if (userMenu) {
      userMenu.classList.toggle("hidden")
    }
  }

  handleLogout() {
    firebaseAuth.auth
      .signOut()
      .then(() => {
        window.location.href = "../index.html"
      })
      .catch((error) => {
        console.error("Error logging out:", error)
        this.showNotification("Error", "Failed to log out", "error")
      })
  }

  showAddVehicleModal() {
    this.showModal("add-vehicle-modal")
  }

  showAddCategoryModal() {
    this.showModal("add-category-modal")
  }

  editVehicle(vehicleId) {
    console.log("Edit vehicle:", vehicleId)
    // Implement edit vehicle logic here
  }

  deleteVehicle(vehicleId) {
    console.log("Delete vehicle:", vehicleId)
    // Implement delete vehicle logic here
  }

  viewBooking(bookingId) {
    console.log("View booking:", bookingId)
    // Implement view booking logic here
  }

  updateBookingStatus(bookingId) {
    console.log("Update booking status:", bookingId)
    // Implement update booking status logic here
  }

  viewCustomer(customerId) {
    console.log("View customer:", customerId)
    // Implement view customer logic here
  }

  toggleCustomerStatus(customerId) {
    console.log("Toggle customer status:", customerId)
    // Implement toggle customer status logic here
  }

  editCategory(categoryId) {
    console.log("Edit category:", categoryId)
    // Implement edit category logic here
  }

  deleteCategory(categoryId) {
    console.log("Delete category:", categoryId)
    // Implement delete category logic here
  }
}

const admin = new AdminDashboard()
