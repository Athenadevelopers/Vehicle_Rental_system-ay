<?php
$page_title = "Create Account";
require_once 'config/config.php';
require_once 'config/database.php';
require_once 'classes/User.php';

$message = '';
$message_type = '';

if($_POST) {
    // CSRF Protection
    if(!verify_csrf_token($_POST['csrf_token'])) {
        $message = "Invalid request. Please try again.";
        $message_type = "error";
    } else {
        try {
            $database = Database::getInstance();
            $db = $database->getConnection();
            $user = new User($db);

            // Sanitize inputs
            $user->username = sanitize_input($_POST['username']);
            $user->email = sanitize_input($_POST['email']);
            $user->password = $_POST['password'];
            $user->full_name = sanitize_input($_POST['full_name']);
            $user->phone = sanitize_input($_POST['phone']);
            $user->address = sanitize_input($_POST['address']);

            // Validate inputs
            if(empty($user->username) || empty($user->email) || empty($user->password) || empty($user->full_name)) {
                $message = "Please fill in all required fields.";
                $message_type = "error";
            } elseif(strlen($user->username) < 3) {
                $message = "Username must be at least 3 characters long.";
                $message_type = "error";
            } elseif(!filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
                $message = "Please enter a valid email address.";
                $message_type = "error";
            } elseif($user->usernameExists()) {
                $message = "Username already exists. Please choose a different one.";
                $message_type = "error";
            } elseif($user->emailExists()) {
                $message = "Email already exists. Please use a different email or login.";
                $message_type = "error";
            } elseif(strlen($_POST['password']) < 6) {
                $message = "Password must be at least 6 characters long.";
                $message_type = "error";
            } elseif($_POST['password'] !== $_POST['confirm_password']) {
                $message = "Passwords do not match.";
                $message_type = "error";
            } else {
                // Register user
                if($user->register()) {
                    // Log the registration activity
                    $database->logActivity($user->id, 'user_registered', 'user', $user->id, "New user registered: {$user->username}");
                    
                    // Auto-login the user
                    $_SESSION['user_id'] = $user->id;
                    $_SESSION['username'] = $user->username;
                    $_SESSION['full_name'] = $user->full_name;
                    $_SESSION['role'] = 'customer';
                    
                    flash_message("Welcome to VehicleRent Pro, {$user->full_name}! Your account has been created successfully.", "success");
                    redirect("customer/dashboard.php");
                } else {
                    $message = "Registration failed. Please try again.";
                    $message_type = "error";
                }
            }
        } catch (Exception $e) {
            $message = "System error occurred. Please try again later.";
            $message_type = "error";
            error_log("Registration error: " . $e->getMessage());
        }
    }
}

include 'includes/header.php';
?>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full space-y-8">
        <!-- Header -->
        <div class="text-center" data-aos="fade-down">
            <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-user-plus text-white text-2xl"></i>
            </div>
            <h2 class="text-3xl font-bold text-secondary-800 font-heading">Create Your Account</h2>
            <p class="mt-2 text-sm text-gray-600">
                Join VehicleRent Pro and start your journey with us
            </p>
        </div>

        <!-- Registration Form -->
        <div class="bg-white rounded-lg shadow-lg p-8" data-aos="fade-up">
            <?php if($message): ?>
                <div class="mb-6 p-4 rounded-md <?php echo $message_type == 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'; ?>">
                    <div class="flex items-center">
                        <i class="fas fa-<?php echo $message_type == 'error' ? 'exclamation-circle' : 'check-circle'; ?> mr-2"></i>
                        <?php echo $message; ?>
                    </div>
                </div>
            <?php endif; ?>

            <form method="POST" data-validate>
                <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Personal Information -->
                    <div class="md:col-span-2">
                        <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-user mr-2 text-primary-600"></i>
                            Personal Information
                        </h3>
                    </div>

                    <div>
                        <label for="full_name" class="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-id-card text-gray-400"></i>
                            </div>
                            <input type="text" 
                                   id="full_name" 
                                   name="full_name" 
                                   required 
                                   value="<?php echo htmlspecialchars($_POST['full_name'] ?? ''); ?>"
                                   class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Enter your full name">
                        </div>
                    </div>

                    <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-phone text-gray-400"></i>
                            </div>
                            <input type="tel" 
                                   id="phone" 
                                   name="phone" 
                                   value="<?php echo htmlspecialchars($_POST['phone'] ?? ''); ?>"
                                   class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Enter your phone number">
                        </div>
                    </div>

                    <!-- Account Information -->
                    <div class="md:col-span-2 mt-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-key mr-2 text-primary-600"></i>
                            Account Information
                        </h3>
                    </div>

                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                            Username *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-user text-gray-400"></i>
                            </div>
                            <input type="text" 
                                   id="username" 
                                   name="username" 
                                   required 
                                   value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
                                   class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Choose a username">
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Must be at least 3 characters long</p>
                    </div>

                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-envelope text-gray-400"></i>
                            </div>
                            <input type="email" 
                                   id="email" 
                                   name="email" 
                                   required 
                                   value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>"
                                   class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Enter your email address">
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-lock text-gray-400"></i>
                            </div>
                            <input type="password" 
                                   id="password" 
                                   name="password" 
                                   required 
                                   class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Create a password">
                            <button type="button" 
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onclick="togglePassword('password')">
                                <i class="fas fa-eye text-gray-400 hover:text-gray-600" id="password-toggle"></i>
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
                    </div>

                    <div>
                        <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-lock text-gray-400"></i>
                            </div>
                            <input type="password" 
                                   id="confirm_password" 
                                   name="confirm_password" 
                                   required 
                                   class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Confirm your password">
                            <button type="button" 
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onclick="togglePassword('confirm_password')">
                                <i class="fas fa-eye text-gray-400 hover:text-gray-600" id="confirm_password-toggle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="md:col-span-2 mt-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-map-marker-alt mr-2 text-primary-600"></i>
                            Address Information
                        </h3>
                    </div>

                    <div class="md:col-span-2">
                        <label for="address" class="block text-sm font-medium text-gray-700 mb-2">
                            Address
                        </label>
                        <div class="relative">
                            <div class="absolute top-3 left-3 pointer-events-none">
                                <i class="fas fa-home text-gray-400"></i>
                            </div>
                            <textarea id="address" 
                                      name="address" 
                                      rows="3"
                                      class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                      placeholder="Enter your address (optional)"><?php echo htmlspecialchars($_POST['address'] ?? ''); ?></textarea>
                        </div>
                    </div>

                    <!-- Terms and Conditions -->
                    <div class="md:col-span-2 mt-6">
                        <div class="flex items-start">
                            <div class="flex items-center h-5">
                                <input id="terms" 
                                       name="terms" 
                                       type="checkbox" 
                                       required
                                       class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                            </div>
                            <div class="ml-3 text-sm">
                                <label for="terms" class="text-gray-700">
                                    I agree to the 
                                    <a href="terms.php" target="_blank" class="text-primary-600 hover:text-primary-500 underline">Terms and Conditions</a> 
                                    and 
                                    <a href="privacy.php" target="_blank" class="text-primary-600 hover:text-primary-500 underline">Privacy Policy</a>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Newsletter Subscription -->
                    <div class="md:col-span-2">
                        <div class="flex items-start">
                            <div class="flex items-center h-5">
                                <input id="newsletter" 
                                       name="newsletter" 
                                       type="checkbox" 
                                       class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                            </div>
                            <div class="ml-3 text-sm">
                                <label for="newsletter" class="text-gray-700">
                                    Subscribe to our newsletter for updates and special offers
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="md:col-span-2 mt-6">
                        <button type="submit" 
                                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition">
                            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                <i class="fas fa-user-plus group-hover:text-primary-300 transition"></i>
                            </span>
                            Create Account
                        </button>
                    </div>
                </div>
            </form>

            <!-- Login Link -->
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600">
                    Already have an account?
                    <a href="login.php" class="font-medium text-primary-600 hover:text-primary-500 transition">
                        Sign in here
                    </a>
                </p>
            </div>

            <!-- Features -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <h4 class="text-sm font-medium text-gray-900 mb-4">Why choose VehicleRent Pro?</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div class="flex items-center">
                        <i class="fas fa-shield-alt text-primary-600 mr-2"></i>
                        <span>Secure & Safe</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-clock text-primary-600 mr-2"></i>
                        <span>24/7 Support</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-star text-primary-600 mr-2"></i>
                        <span>Best Rates</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const toggle = document.getElementById(fieldId + '-toggle');
    
    if (field.type === 'password') {
        field.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// Real-time password validation
document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    const confirmPassword = document.getElementById('confirm_password');
    
    // Update confirm password validation
    if (confirmPassword.value && confirmPassword.value !== password) {
        confirmPassword.setCustomValidity('Passwords do not match');
    } else {
        confirmPassword.setCustomValidity('');
    }
});

document.getElementById('confirm_password').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword !== password) {
        this.setCustomValidity('Passwords do not match');
    } else {
        this.setCustomValidity('');
    }
});

// Username availability check (optional enhancement)
let usernameTimeout;
document.getElementById('username').addEventListener('input', function() {
    const username = this.value;
    
    if (username.length >= 3) {
        clearTimeout(usernameTimeout);
        usernameTimeout = setTimeout(() => {
            // You can add AJAX call here to check username availability
            // checkUsernameAvailability(username);
        }, 500);
    }
});
</script>

<?php include 'includes/footer.php'; ?>
