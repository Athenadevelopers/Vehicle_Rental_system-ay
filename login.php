<?php
$page_title = "Login";
require_once 'config/config.php';
require_once 'config/database.php';
require_once 'classes/User.php';

$message = '';
$message_type = '';

if($_POST && !isset($_POST['firebase_auth'])) {
    // Traditional PHP login
    if(!verify_csrf_token($_POST['csrf_token'])) {
        $message = "Invalid request. Please try again.";
        $message_type = "error";
    } else {
        $database = Database::getInstance();
        $db = $database->getConnection();
        $user = new User($db);

        $username = sanitize_input($_POST['username']);
        $password = $_POST['password'];

        if($user->login($username, $password)) {
            $_SESSION['user_id'] = $user->id;
            $_SESSION['username'] = $user->username;
            $_SESSION['full_name'] = $user->full_name;
            $_SESSION['role'] = $user->role;
            $_SESSION['auth_provider'] = 'traditional';

            flash_message("Welcome back, " . $user->full_name . "!", "success");

            if($user->role == 'admin') {
                redirect("admin/dashboard.php");
            } else {
                redirect("customer/dashboard.php");
            }
        } else {
            $message = "Invalid username or password.";
            $message_type = "error";
        }
    }
}

include 'includes/header.php';
?>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center" data-aos="fade-down">
            <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-car-side text-white text-2xl"></i>
            </div>
            <h2 class="text-3xl font-bold text-secondary-800 font-heading">Welcome Back</h2>
            <p class="mt-2 text-sm text-gray-600">
                Sign in to your account to continue
            </p>
        </div>

        <!-- Login Form -->
        <div class="bg-white rounded-lg shadow-lg p-8" data-aos="fade-up">
            <?php if($message): ?>
                <div class="mb-4 p-4 rounded-md <?php echo $message_type == 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'; ?>">
                    <div class="flex items-center">
                        <i class="fas fa-<?php echo $message_type == 'error' ? 'exclamation-circle' : 'check-circle'; ?> mr-2"></i>
                        <?php echo $message; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Social Login Buttons -->
            <div class="space-y-3 mb-6">
                <button type="button" 
                        id="google-signin-btn"
                        class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition">
                    <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </button>

                <button type="button" 
                        id="facebook-signin-btn"
                        class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
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

            <!-- Traditional Login Form -->
            <form method="POST" data-validate id="traditional-login-form">
                <input type="hidden" name="csrf_token" value="<?php echo generate_csrf_token(); ?>">
                
                <div class="space-y-6">
                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                            Username or Email
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-user text-gray-400"></i>
                            </div>
                            <input type="text" 
                                   id="username" 
                                   name="username" 
                                   required 
                                   class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                                   placeholder="Enter your username or email">
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                            Password
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
                                   placeholder="Enter your password">
                            <button type="button" 
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onclick="togglePassword('password')">
                                <i class="fas fa-eye text-gray-400 hover:text-gray-600" id="password-toggle"></i>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <input id="remember-me" 
                                   name="remember-me" 
                                   type="checkbox" 
                                   class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded">
                            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>

                        <div class="text-sm">
                            <a href="#" id="forgot-password-link" class="font-medium text-primary-600 hover:text-primary-500 transition">
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button type="submit" 
                                class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition">
                            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                <i class="fas fa-sign-in-alt group-hover:text-primary-300 transition"></i>
                            </span>
                            Sign In
                        </button>
                    </div>
                </div>
            </form>

            <!-- Register Link -->
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600">
                    Don't have an account?
                    <a href="register.php" class="font-medium text-primary-600 hover:text-primary-500 transition">
                        Sign up now
                    </a>
                </p>
            </div>
        </div>

        <!-- Demo Credentials -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4" data-aos="fade-up" data-aos-delay="200">
            <div class="flex items-start">
                <i class="fas fa-info-circle text-yellow-600 mt-0.5 mr-2"></i>
                <div class="text-sm text-yellow-800">
                    <p class="font-medium mb-1">Demo Credentials:</p>
                    <p><strong>Admin:</strong> admin / admin123</p>
                    <p><strong>Customer:</strong> john_doe / password123</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Firebase Auth Modal -->
<div id="firebase-auth-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Signing you in...</h3>
            <p class="text-sm text-gray-600">Please wait while we authenticate your account.</p>
        </div>
    </div>
</div>

<!-- Forgot Password Modal -->
<div id="forgot-password-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Reset Password</h3>
            <button type="button" id="close-forgot-modal" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <form id="forgot-password-form">
            <div class="mb-4">
                <label for="reset-email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <input type="email" 
                       id="reset-email" 
                       name="reset-email" 
                       required 
                       class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                       placeholder="Enter your email address">
            </div>
            <div class="flex justify-end space-x-3">
                <button type="button" 
                        id="cancel-reset"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition">
                    Cancel
                </button>
                <button type="submit" 
                        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition">
                    Send Reset Link
                </button>
            </div>
        </form>
    </div>
</div>

<script type="module">
import { firebaseAuth } from './assets/js/firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    const googleSigninBtn = document.getElementById('google-signin-btn');
    const facebookSigninBtn = document.getElementById('facebook-signin-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const authModal = document.getElementById('firebase-auth-modal');
    const forgotModal = document.getElementById('forgot-password-modal');

    // Google Sign In
    googleSigninBtn.addEventListener('click', async function() {
        showAuthModal();
        try {
            const result = await firebaseAuth.signInWithGoogle();
            hideAuthModal();
            
            if (result.success) {
                showNotification('Success', 'Signed in successfully!', 'success');
                // Redirect will be handled by auth state change
                setTimeout(() => {
                    window.location.href = result.user.role === 'admin' ? 'admin/dashboard.php' : 'customer/dashboard.php';
                }, 1000);
            } else {
                showNotification('Error', result.error, 'error');
            }
        } catch (error) {
            hideAuthModal();
            showNotification('Error', 'Failed to sign in with Google', 'error');
        }
    });

    // Facebook Sign In
    facebookSigninBtn.addEventListener('click', async function() {
        showAuthModal();
        try {
            const result = await firebaseAuth.signInWithFacebook();
            hideAuthModal();
            
            if (result.success) {
                showNotification('Success', 'Signed in successfully!', 'success');
                setTimeout(() => {
                    window.location.href = result.user.role === 'admin' ? 'admin/dashboard.php' : 'customer/dashboard.php';
                }, 1000);
            } else {
                showNotification('Error', result.error, 'error');
            }
        } catch (error) {
            hideAuthModal();
            showNotification('Error', 'Failed to sign in with Facebook', 'error');
        }
    });

    // Forgot Password
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        forgotModal.classList.remove('hidden');
        forgotModal.classList.add('flex');
    });

    // Close modals
    document.getElementById('close-forgot-modal').addEventListener('click', function() {
        forgotModal.classList.add('hidden');
        forgotModal.classList.remove('flex');
    });

    document.getElementById('cancel-reset').addEventListener('click', function() {
        forgotModal.classList.add('hidden');
        forgotModal.classList.remove('flex');
    });

    // Handle forgot password form
    document.getElementById('forgot-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        
        try {
            const result = await firebaseAuth.resetPassword(email);
            if (result.success) {
                showNotification('Success', 'Password reset email sent!', 'success');
                forgotModal.classList.add('hidden');
                forgotModal.classList.remove('flex');
            } else {
                showNotification('Error', result.error, 'error');
            }
        } catch (error) {
            showNotification('Error', 'Failed to send reset email', 'error');
        }
    });

    function showAuthModal() {
        authModal.classList.remove('hidden');
        authModal.classList.add('flex');
    }

    function hideAuthModal() {
        authModal.classList.add('hidden');
        authModal.classList.remove('flex');
    }
});

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

function showNotification(title, message, type = 'success') {
    // You can integrate with your existing notification system
    alert(title + ': ' + message);
}
</script>

<?php include 'includes/footer.php'; ?>
