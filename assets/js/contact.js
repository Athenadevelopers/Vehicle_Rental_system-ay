// Import Firebase configuration and managers
import { firebaseAuth, firebaseDB } from "./firebase-config.js"
import AOS from "aos"

class ContactPage {
  constructor() {
    this.init()
  }

  async init() {
    try {
      console.log("Initializing Contact Page...")

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

      console.log("✅ Contact Page initialized successfully")
    } catch (error) {
      console.error("❌ Contact Page initialization failed:", error)
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

    // Contact form submission
    document.getElementById("contact-form")?.addEventListener("submit", async (e) => {
      e.preventDefault()

      const submitBtn = document.getElementById("submit-btn")
      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...'
      }

      try {
        const formData = {
          name: document.getElementById("name").value,
          email: document.getElementById("email").value,
          phone: document.getElementById("phone").value,
          subject: document.getElementById("subject").value,
          message: document.getElementById("message").value,
          timestamp: new Date().toISOString(),
        }

        // Save to Firebase
        const result = await firebaseDB.addContactMessage(formData)

        if (result.success) {
          this.showFormSuccess()
        } else {
          this.showFormError(result.error)
        }
      } catch (error) {
        console.error("Form submission error:", error)
        this.showFormError("An unexpected error occurred. Please try again later.")
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Message'
        }
      }
    })
  }

  showFormSuccess() {
    const form = document.getElementById("contact-form")
    if (form) {
      form.innerHTML = `
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-check-circle text-2xl"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Message Sent Successfully!</h3>
          <p class="text-gray-600 mb-6">
            Thank you for contacting us. We've received your message and will get back to you as soon as possible.
          </p>
          <button onclick="location.reload()" class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition font-medium">
            Send Another Message
          </button>
        </div>
      `
    }
  }

  showFormError(message) {
    const form = document.getElementById("contact-form")
    if (form) {
      // Insert error message at the top of the form
      const errorDiv = document.createElement("div")
      errorDiv.className = "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6"
      errorDiv.innerHTML = `
        <div class="flex items-center">
          <i class="fas fa-exclamation-circle mr-2"></i>
          <span class="font-medium">Error:</span>
          <span class="ml-1">${message || "Failed to send your message. Please try again."}</span>
        </div>
      `
      form.prepend(errorDiv)

      // Scroll to the top of the form
      form.scrollIntoView({ behavior: "smooth" })

      // Remove the error message after 5 seconds
      setTimeout(() => {
        errorDiv.remove()
      }, 5000)
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
  window.contactPage = new ContactPage()
})
