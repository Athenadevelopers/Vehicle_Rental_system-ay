<?php
// Environment Configuration
// Copy this file and modify the values according to your environment

return [
    // Database Configuration
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'vehicle_rental_db',
    'DB_USER' => 'root',
    'DB_PASS' => '',
    'DB_PORT' => '3306',
    'DB_CHARSET' => 'utf8mb4',
    
    // Site Configuration
    'SITE_NAME' => 'VehicleRent Pro',
    'SITE_URL' => 'http://localhost/vehicle-rental-system',
    'SITE_DESCRIPTION' => 'Professional Vehicle Rental Management System',
    
    // Email Configuration (for notifications)
    'MAIL_HOST' => 'smtp.mailtrap.io',
    'MAIL_PORT' => 2525,
    'MAIL_USERNAME' => 'your_username',
    'MAIL_PASSWORD' => 'your_password',
    'MAIL_FROM' => 'info@vehiclerent.com',
    'MAIL_FROM_NAME' => 'VehicleRent Pro',
    'MAIL_ENCRYPTION' => 'tls',
    
    // Application Settings
    'TIMEZONE' => 'America/New_York',
    'DEBUG_MODE' => true,
    'MAINTENANCE_MODE' => false,
    
    // File Upload Settings
    'UPLOAD_PATH' => 'uploads/',
    'MAX_FILE_SIZE' => 5242880, // 5MB in bytes
    'ALLOWED_IMAGE_TYPES' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    
    // Security Settings
    'SESSION_LIFETIME' => 3600, // 1 hour in seconds
    'CSRF_TOKEN_LIFETIME' => 1800, // 30 minutes
    'PASSWORD_MIN_LENGTH' => 6,
    'MAX_LOGIN_ATTEMPTS' => 5,
    'LOGIN_LOCKOUT_TIME' => 900, // 15 minutes
    
    // Business Settings
    'DEFAULT_CURRENCY' => 'USD',
    'CURRENCY_SYMBOL' => '$',
    'TAX_RATE' => 0.08, // 8%
    'LATE_FEE_RATE' => 0.05, // 5% per day
    'BOOKING_ADVANCE_DAYS' => 365, // How far in advance bookings can be made
    'CANCELLATION_HOURS' => 24, // Hours before rental start to allow free cancellation
    
    // Feature Flags
    'ENABLE_ONLINE_PAYMENTS' => true,
    'ENABLE_SMS_NOTIFICATIONS' => false,
    'ENABLE_EMAIL_NOTIFICATIONS' => true,
    'ENABLE_LOYALTY_PROGRAM' => true,
    'ENABLE_MULTI_LANGUAGE' => false,
    'ENABLE_API' => true,
    
    // API Configuration
    'API_VERSION' => 'v1',
    'API_RATE_LIMIT' => 100, // requests per hour
    
    // Third-party Integrations
    'GOOGLE_MAPS_API_KEY' => '',
    'STRIPE_PUBLIC_KEY' => '',
    'STRIPE_SECRET_KEY' => '',
    'PAYPAL_CLIENT_ID' => '',
    'PAYPAL_CLIENT_SECRET' => '',
    'TWILIO_SID' => '',
    'TWILIO_TOKEN' => '',
    'TWILIO_PHONE' => '',
    
    // Backup Settings
    'BACKUP_ENABLED' => true,
    'BACKUP_FREQUENCY' => 'daily', // daily, weekly, monthly
    'BACKUP_RETENTION_DAYS' => 30,
    'BACKUP_PATH' => 'backups/',
];
?>
