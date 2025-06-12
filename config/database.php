<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $charset;
    public $conn;
    private static $instance = null;
    private $config;

    private function __construct() {
        // Load configuration
        $config_file = __DIR__ . '/env.php';
        if (file_exists($config_file)) {
            $this->config = require $config_file;
        } else {
            // Auto-detect configuration for common setups
            $this->config = $this->detectEnvironment();
        }

        // Set database connection parameters
        $this->host = $this->config['DB_HOST'];
        $this->db_name = $this->config['DB_NAME'];
        $this->username = $this->config['DB_USER'];
        $this->password = $this->config['DB_PASS'];
        $this->port = $this->config['DB_PORT'];
        $this->charset = $this->config['DB_CHARSET'];
    }

    private function detectEnvironment() {
        // Auto-detect common development environments
        $detected_config = [
            'DB_HOST' => 'localhost',
            'DB_NAME' => 'vehicle_rental_db',
            'DB_USER' => 'root',
            'DB_PASS' => '',
            'DB_PORT' => '3306',
            'DB_CHARSET' => 'utf8mb4',
            'SITE_NAME' => 'VehicleRent Pro',
            'SITE_URL' => $this->detectSiteUrl(),
            'DEBUG_MODE' => true
        ];

        // Check for XAMPP/WAMP/MAMP
        if (strpos($_SERVER['SERVER_SOFTWARE'] ?? '', 'Apache') !== false) {
            // Likely XAMPP/WAMP environment
            $detected_config['DB_HOST'] = 'localhost';
            $detected_config['DB_USER'] = 'root';
            $detected_config['DB_PASS'] = '';
        }

        return $detected_config;
    }

    private function detectSiteUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $path = dirname($_SERVER['SCRIPT_NAME'] ?? '');
        return $protocol . '://' . $host . $path;
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        if ($this->conn != null) {
            return $this->conn;
        }

        try {
            // First, try to connect without database to check if we need to create it
            $this->ensureDatabaseExists();
            
            // Now connect to the specific database
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset} COLLATE {$this->charset}_unicode_ci"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Auto-setup tables if they don't exist
            $this->autoSetupTables();
            
        } catch(PDOException $exception) {
            $this->handleConnectionError($exception);
        }
        
        return $this->conn;
    }

    private function ensureDatabaseExists() {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];

            $pdo = new PDO($dsn, $this->username, $this->password, $options);
            
            // Check if database exists
            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$this->db_name]);
            
            if ($stmt->rowCount() == 0) {
                // Create database
                $pdo->exec("CREATE DATABASE `{$this->db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        } catch (Exception $e) {
            // If we can't create database, continue and let the main connection handle the error
        }
    }

    private function autoSetupTables() {
        try {
            // Check if tables exist
            if (!$this->tablesExist()) {
                $this->createTables();
                $this->insertInitialData();
            }
        } catch (Exception $e) {
            // Log error but don't break the application
            error_log("Auto-setup failed: " . $e->getMessage());
        }
    }

    private function createTables() {
        $sql = "
        -- Create users table for authentication
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            role ENUM('admin', 'customer') DEFAULT 'customer',
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            email_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_email (email),
            INDEX idx_role (role)
        ) ENGINE=InnoDB;

        -- Create vehicle categories table
        CREATE TABLE IF NOT EXISTS vehicle_categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(50) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            sort_order INT DEFAULT 0,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_sort_order (sort_order)
        ) ENGINE=InnoDB;

        -- Create vehicles table
        CREATE TABLE IF NOT EXISTS vehicles (
            id INT PRIMARY KEY AUTO_INCREMENT,
            category_id INT,
            make VARCHAR(50) NOT NULL,
            model VARCHAR(50) NOT NULL,
            year INT NOT NULL,
            license_plate VARCHAR(20) UNIQUE NOT NULL,
            vin VARCHAR(17),
            color VARCHAR(30),
            seats INT DEFAULT 4,
            fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') DEFAULT 'petrol',
            transmission ENUM('manual', 'automatic') DEFAULT 'manual',
            daily_rate DECIMAL(10,2) NOT NULL,
            weekly_rate DECIMAL(10,2),
            monthly_rate DECIMAL(10,2),
            status ENUM('available', 'rented', 'maintenance', 'retired') DEFAULT 'available',
            image_url VARCHAR(255),
            images JSON,
            features TEXT,
            mileage INT DEFAULT 0,
            last_service_date DATE,
            next_service_date DATE,
            insurance_expiry DATE,
            registration_expiry DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES vehicle_categories(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_category (category_id),
            INDEX idx_license_plate (license_plate),
            INDEX idx_daily_rate (daily_rate)
        ) ENGINE=InnoDB;

        -- Create bookings table
        CREATE TABLE IF NOT EXISTS bookings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            booking_number VARCHAR(20) UNIQUE NOT NULL,
            customer_id INT NOT NULL,
            vehicle_id INT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            start_time TIME DEFAULT '09:00:00',
            end_time TIME DEFAULT '18:00:00',
            pickup_location VARCHAR(255),
            return_location VARCHAR(255),
            total_days INT NOT NULL,
            daily_rate DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            tax_amount DECIMAL(10,2) DEFAULT 0,
            discount_amount DECIMAL(10,2) DEFAULT 0,
            total_amount DECIMAL(10,2) NOT NULL,
            deposit_amount DECIMAL(10,2) DEFAULT 0,
            status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
            payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
            booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            confirmed_at TIMESTAMP NULL,
            started_at TIMESTAMP NULL,
            completed_at TIMESTAMP NULL,
            cancelled_at TIMESTAMP NULL,
            cancellation_reason TEXT,
            notes TEXT,
            special_requests TEXT,
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
            INDEX idx_booking_number (booking_number),
            INDEX idx_customer (customer_id),
            INDEX idx_vehicle (vehicle_id),
            INDEX idx_status (status),
            INDEX idx_dates (start_date, end_date),
            INDEX idx_booking_date (booking_date)
        ) ENGINE=InnoDB;

        -- Create payments table
        CREATE TABLE IF NOT EXISTS payments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            booking_id INT NOT NULL,
            payment_reference VARCHAR(100) UNIQUE,
            amount DECIMAL(10,2) NOT NULL,
            payment_method ENUM('cash', 'card', 'bank_transfer', 'online', 'paypal', 'stripe') DEFAULT 'cash',
            payment_type ENUM('booking', 'deposit', 'additional', 'refund') DEFAULT 'booking',
            payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
            transaction_id VARCHAR(100),
            gateway_response JSON,
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            notes TEXT,
            processed_by INT,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_booking (booking_id),
            INDEX idx_reference (payment_reference),
            INDEX idx_status (payment_status),
            INDEX idx_method (payment_method),
            INDEX idx_date (payment_date)
        ) ENGINE=InnoDB;

        -- Create maintenance records table
        CREATE TABLE IF NOT EXISTS maintenance_records (
            id INT PRIMARY KEY AUTO_INCREMENT,
            vehicle_id INT NOT NULL,
            maintenance_type ENUM('routine', 'repair', 'inspection', 'cleaning', 'upgrade') DEFAULT 'routine',
            title VARCHAR(100) NOT NULL,
            description TEXT,
            cost DECIMAL(10,2) DEFAULT 0,
            labor_cost DECIMAL(10,2) DEFAULT 0,
            parts_cost DECIMAL(10,2) DEFAULT 0,
            maintenance_date DATE NOT NULL,
            completed_date DATE,
            next_maintenance_date DATE,
            mileage_at_service INT,
            service_provider VARCHAR(100),
            invoice_number VARCHAR(50),
            warranty_until DATE,
            status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
            priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_vehicle (vehicle_id),
            INDEX idx_status (status),
            INDEX idx_type (maintenance_type),
            INDEX idx_date (maintenance_date),
            INDEX idx_next_date (next_maintenance_date)
        ) ENGINE=InnoDB;

        -- Create system settings table
        CREATE TABLE IF NOT EXISTS system_settings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value TEXT,
            setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
            description TEXT,
            category VARCHAR(50) DEFAULT 'general',
            is_public BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_key (setting_key),
            INDEX idx_category (category)
        ) ENGINE=InnoDB;

        -- Create activity logs table
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INT,
            description TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_user (user_id),
            INDEX idx_action (action),
            INDEX idx_entity (entity_type, entity_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB;
        ";

        $this->conn->exec($sql);
    }

    private function insertInitialData() {
        // Check if admin user already exists
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        $admin_exists = $stmt->fetch()['count'] > 0;

        if (!$admin_exists) {
            $sql = "
            -- Insert default admin user
            INSERT INTO users (username, email, password, full_name, phone, role, status, email_verified) VALUES
            ('admin', 'admin@vehiclerental.com', '$2y$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', '+1234567890', 'admin', 'active', TRUE);

            -- Insert vehicle categories
            INSERT IGNORE INTO vehicle_categories (name, description, icon, sort_order) VALUES
            ('Economy', 'Fuel-efficient and budget-friendly vehicles perfect for city driving', 'fas fa-car', 1),
            ('Compact', 'Small cars ideal for urban environments and short trips', 'fas fa-car-side', 2),
            ('Mid-size', 'Comfortable vehicles perfect for longer journeys and family trips', 'fas fa-car-alt', 3),
            ('SUV', 'Spacious vehicles ideal for families, groups, and outdoor adventures', 'fas fa-truck', 4),
            ('Luxury', 'Premium vehicles with high-end features and superior comfort', 'fas fa-gem', 5),
            ('Van', 'Large vehicles perfect for moving, group travel, and cargo transport', 'fas fa-shuttle-van', 6),
            ('Sports', 'High-performance vehicles for enthusiasts and special occasions', 'fas fa-tachometer-alt', 7),
            ('Electric', 'Eco-friendly electric vehicles for sustainable transportation', 'fas fa-leaf', 8);

            -- Insert sample vehicles
            INSERT IGNORE INTO vehicles (category_id, make, model, year, license_plate, color, seats, fuel_type, transmission, daily_rate, weekly_rate, monthly_rate, status, features, mileage) VALUES
            (1, 'Toyota', 'Corolla', 2023, 'ECO001', 'White', 5, 'petrol', 'automatic', 45.00, 270.00, 1080.00, 'available', 'Air Conditioning, Bluetooth, USB Charging, Backup Camera, Fuel Efficient', 15000),
            (1, 'Honda', 'Civic', 2022, 'ECO002', 'Silver', 5, 'petrol', 'manual', 40.00, 240.00, 960.00, 'available', 'Air Conditioning, Radio, Power Windows, Manual Transmission', 22000),
            (2, 'Nissan', 'Sentra', 2023, 'COM001', 'Blue', 5, 'petrol', 'automatic', 50.00, 300.00, 1200.00, 'available', 'Air Conditioning, Bluetooth, Backup Camera, Lane Assist, Compact Design', 8000),
            (3, 'Honda', 'Accord', 2023, 'MID001', 'Black', 5, 'petrol', 'automatic', 65.00, 390.00, 1560.00, 'available', 'Leather Seats, Sunroof, Navigation System, Heated Seats, Premium Audio', 12000),
            (4, 'Toyota', 'RAV4', 2023, 'SUV001', 'Red', 7, 'hybrid', 'automatic', 80.00, 480.00, 1920.00, 'available', 'AWD, Heated Seats, Apple CarPlay, Safety Suite, Hybrid Engine', 5000),
            (4, 'Ford', 'Explorer', 2022, 'SUV002', 'Gray', 7, 'petrol', 'automatic', 85.00, 510.00, 2040.00, 'available', '4WD, Third Row Seating, Towing Package, Premium Audio, Spacious Interior', 18000),
            (5, 'BMW', '3 Series', 2023, 'LUX001', 'Black', 5, 'petrol', 'automatic', 120.00, 720.00, 2880.00, 'available', 'Leather Interior, Premium Sound, Navigation, Sport Package, Luxury Features', 3000),
            (6, 'Ford', 'Transit', 2022, 'VAN001', 'White', 12, 'diesel', 'automatic', 95.00, 570.00, 2280.00, 'available', 'Large Cargo Space, Power Steering, AC, GPS, Commercial Grade', 25000),
            (7, 'Chevrolet', 'Camaro', 2023, 'SPT001', 'Yellow', 4, 'petrol', 'manual', 150.00, 900.00, 3600.00, 'available', 'V8 Engine, Sport Suspension, Premium Audio, Racing Stripes, Performance Package', 2000),
            (8, 'Tesla', 'Model 3', 2023, 'ELC001', 'Blue', 5, 'electric', 'automatic', 110.00, 660.00, 2640.00, 'available', 'Autopilot, Supercharging, Premium Interior, Glass Roof, Zero Emissions', 1000);

            -- Insert system settings
            INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
            ('site_name', 'VehicleRent Pro', 'string', 'Website name', 'general', TRUE),
            ('site_description', 'Professional Vehicle Rental Management System', 'string', 'Website description', 'general', TRUE),
            ('currency', 'USD', 'string', 'Default currency', 'financial', TRUE),
            ('currency_symbol', '$', 'string', 'Currency symbol', 'financial', TRUE),
            ('tax_rate', '0.08', 'number', 'Default tax rate (8%)', 'financial', FALSE),
            ('booking_advance_days', '365', 'number', 'Maximum days in advance for booking', 'booking', TRUE),
            ('cancellation_hours', '24', 'number', 'Hours before rental to allow free cancellation', 'booking', TRUE),
            ('auto_confirm_bookings', 'false', 'boolean', 'Automatically confirm new bookings', 'booking', FALSE),
            ('email_notifications', 'true', 'boolean', 'Enable email notifications', 'notifications', FALSE),
            ('maintenance_reminder_days', '7', 'number', 'Days before maintenance to send reminder', 'maintenance', FALSE);
            ";

            $this->conn->exec($sql);
        }
    }

    private function handleConnectionError($exception) {
        $error_message = $exception->getMessage();
        
        // Create a user-friendly error page
        $site_url = $this->detectSiteUrl();
        
        die("
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Database Setup Required - VehicleRent Pro</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 0; padding: 0; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh; display: flex; align-items: center; justify-content: center;
                }
                .container {
                    background: white; max-width: 600px; margin: 20px;
                    padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    text-align: center;
                }
                .logo { font-size: 4rem; margin-bottom: 20px; }
                h1 { color: #1f2937; margin-bottom: 10px; }
                .subtitle { color: #6b7280; margin-bottom: 30px; }
                .error-box { 
                    background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; 
                    padding: 20px; margin: 20px 0; text-align: left;
                }
                .info-box { 
                    background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; 
                    padding: 20px; margin: 20px 0; text-align: left;
                }
                .btn {
                    background: #3b82f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    margin: 10px; font-weight: 500; transition: all 0.3s ease;
                }
                .btn:hover { background: #2563eb; transform: translateY(-2px); }
                .btn-success { background: #10b981; }
                .btn-success:hover { background: #059669; }
                .steps { text-align: left; margin: 20px 0; }
                .steps li { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='logo'>🚗</div>
                <h1>VehicleRent Pro</h1>
                <p class='subtitle'>Database Setup Required</p>
                
                <div class='error-box'>
                    <h3>⚠️ Database Connection Issue</h3>
                    <p>The system couldn't connect to the database. This is normal for first-time setup.</p>
                </div>
                
                <div class='info-box'>
                    <h3>🔧 Quick Setup Guide</h3>
                    <div class='steps'>
                        <ol>
                            <li><strong>Start your database server</strong><br>
                                Make sure MySQL/MariaDB is running (XAMPP, WAMP, MAMP, or standalone)
                            </li>
                            <li><strong>Check phpMyAdmin</strong><br>
                                Visit <a href='http://localhost/phpmyadmin' target='_blank'>phpMyAdmin</a> to verify database access
                            </li>
                            <li><strong>Update database credentials</strong><br>
                                Edit <code>config/env.php</code> if your database settings are different
                            </li>
                            <li><strong>Refresh this page</strong><br>
                                The system will automatically create the database and tables
                            </li>
                        </ol>
                    </div>
                </div>
                
                <div style='margin-top: 30px;'>
                    <a href='javascript:location.reload()' class='btn btn-success'>🔄 Try Again</a>
                    <a href='http://localhost/phpmyadmin' target='_blank' class='btn'>📊 Open phpMyAdmin</a>
                </div>
                
                <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;'>
                    <p><strong>Current Settings:</strong></p>
                    <p>Host: {$this->host} | Database: {$this->db_name} | User: {$this->username}</p>
                </div>
            </div>
        </body>
        </html>
        ");
    }

    public function tablesExist() {
        try {
            $required_tables = [
                'users', 'vehicle_categories', 'vehicles', 'bookings', 
                'payments', 'maintenance_records', 'system_settings', 'activity_logs'
            ];

            foreach ($required_tables as $table) {
                $stmt = $this->conn->prepare("SHOW TABLES LIKE ?");
                $stmt->execute([$table]);
                if ($stmt->rowCount() == 0) {
                    return false;
                }
            }
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    // Log user activity
    public function logActivity($user_id, $action, $entity_type = null, $entity_id = null, $description = null) {
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $user_id,
                $action,
                $entity_type,
                $entity_id,
                $description,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $e) {
            // Log error but don't break the application
            error_log("Activity logging failed: " . $e->getMessage());
        }
    }

    // Get system setting
    public function getSetting($key, $default = null) {
        try {
            $stmt = $this->conn->prepare("SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ?");
            $stmt->execute([$key]);
            $result = $stmt->fetch();
            
            if ($result) {
                $value = $result['setting_value'];
                switch ($result['setting_type']) {
                    case 'boolean':
                        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
                    case 'number':
                        return is_numeric($value) ? (float)$value : $default;
                    case 'json':
                        return json_decode($value, true) ?: $default;
                    default:
                        return $value;
                }
            }
            return $default;
        } catch (Exception $e) {
            return $default;
        }
    }

    // Set system setting
    public function setSetting($key, $value, $type = 'string', $description = null, $category = 'general') {
        try {
            if ($type === 'json') {
                $value = json_encode($value);
            } elseif ($type === 'boolean') {
                $value = $value ? 'true' : 'false';
            }

            $stmt = $this->conn->prepare("
                INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                setting_type = VALUES(setting_type),
                description = VALUES(description),
                category = VALUES(category),
                updated_at = CURRENT_TIMESTAMP
            ");
            return $stmt->execute([$key, $value, $type, $description, $category]);
        } catch (Exception $e) {
            error_log("Setting update failed: " . $e->getMessage());
            return false;
        }
    }

    // Generate unique booking number
    public function generateBookingNumber() {
        $prefix = 'VR';
        $year = date('Y');
        $month = date('m');
        
        // Get the next sequence number for this month
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) + 1 as next_num 
            FROM bookings 
            WHERE booking_number LIKE ? 
            AND YEAR(booking_date) = ? 
            AND MONTH(booking_date) = ?
        ");
        $stmt->execute(["{$prefix}{$year}{$month}%", $year, $month]);
        $next_num = $stmt->fetch()['next_num'];
        
        return $prefix . $year . $month . str_pad($next_num, 4, '0', STR_PAD_LEFT);
    }

    public function getConfig($key = null) {
        if ($key === null) {
            return $this->config;
        }
        return isset($this->config[$key]) ? $this->config[$key] : null;
    }

    public function getDatabaseInfo() {
        return [
            'host' => $this->host,
            'database' => $this->db_name,
            'username' => $this->username,
            'port' => $this->port,
            'charset' => $this->charset
        ];
    }
}
?>
