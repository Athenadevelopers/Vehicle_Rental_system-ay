// Import Firebase configuration and managers
import { firebaseAuth } from "./firebase-config.js"
import AOS from "aos"

class AboutPage {
  constructor() {
    this.init()
  }

  async init() {
    try {
      console.log("Initializing About Page...")

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

      // Hide loading screen
      this.hideLoadingScreen()

      console.log("✅ About Page initialized successfully")
    } catch (error) {
      console.error("❌ About Page initialization failed:", error)
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
  window.aboutPage = new AboutPage()
})
