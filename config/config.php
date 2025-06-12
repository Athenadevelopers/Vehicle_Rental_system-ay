<?php
// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Load environment configuration
$config_file = __DIR__ . '/env.php';
if (file_exists($config_file)) {
    $env = require $config_file;
} else {
    // Fallback configuration
    $env = [
        'DB_HOST' => 'localhost',
        'DB_NAME' => 'vehicle_rental_db',
        'DB_USER' => 'root',
        'DB_PASS' => '',
        'SITE_NAME' => 'VehicleRent Pro',
        'SITE_URL' => 'http://localhost/vehicle-rental-system',
        'TIMEZONE' => 'America/New_York',
        'DEBUG_MODE' => true
    ];
}

// Define constants from environment
foreach ($env as $key => $value) {
    if (!defined($key)) {
        define($key, $value);
    }
}

// Error reporting based on debug mode
if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
if (defined('TIMEZONE')) {
    date_default_timezone_set(TIMEZONE);
}

// Helper functions
if (!function_exists('redirect')) {
    function redirect($url) {
        header("Location: $url");
        exit;
    }
}

if (!function_exists('sanitize_input')) {
    function sanitize_input($data) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data);
        return $data;
    }
}

if (!function_exists('flash_message')) {
    function flash_message($message, $type = 'success') {
        $_SESSION['flash_message'] = [
            'message' => $message,
            'type' => $type
        ];
    }
}

if (!function_exists('display_flash_message')) {
    function display_flash_message() {
        if (isset($_SESSION['flash_message'])) {
            $message = $_SESSION['flash_message']['message'];
            $type = $_SESSION['flash_message']['type'];
            unset($_SESSION['flash_message']);
            
            return "<div class='alert alert-$type alert-dismissible fade show' role='alert'>
                        $message
                        <button type='button' class='btn-close' data-bs-dismiss='alert' aria-label='Close'></button>
                    </div>";
        }
        return '';
    }
}

// CSRF Protection
if (!function_exists('generate_csrf_token')) {
    function generate_csrf_token() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
}

if (!function_exists('verify_csrf_token')) {
    function verify_csrf_token($token) {
        if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            return false;
        }
        return true;
    }
}

// Format currency
if (!function_exists('format_currency')) {
    function format_currency($amount) {
        return '$' . number_format($amount, 2);
    }
}

// Format date
if (!function_exists('format_date')) {
    function format_date($date, $format = 'M d, Y') {
        return date($format, strtotime($date));
    }
}

// Check if user is logged in
if (!function_exists('is_logged_in')) {
    function is_logged_in() {
        return isset($_SESSION['user_id']);
    }
}

// Check if user is admin
if (!function_exists('is_admin')) {
    function is_admin() {
        return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
    }
}

// Check if user is customer
if (!function_exists('is_customer')) {
    function is_customer() {
        return isset($_SESSION['role']) && $_SESSION['role'] === 'customer';
    }
}

// Get current user ID
if (!function_exists('get_user_id')) {
    function get_user_id() {
        return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    }
}

// Get current user name
if (!function_exists('get_user_name')) {
    function get_user_name() {
        return isset($_SESSION['full_name']) ? $_SESSION['full_name'] : 'Guest';
    }
}
?>
