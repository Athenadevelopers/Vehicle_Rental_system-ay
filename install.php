<?php
require_once 'config/config.php';
require_once 'config/database.php';

$step = $_GET['step'] ?? 1;
$message = '';
$message_type = '';

if ($_POST && isset($_POST['install'])) {
    try {
        $database = Database::getInstance();
        $db_info = $database->getDatabaseInfo();
        
        // Step 1: Create database
        if (!$database->databaseExists()) {
            if (!$database->createDatabase()) {
                throw new Exception("Failed to create database. Please check permissions.");
            }
            $message = "Database '{$db_info['database']}' created successfully!";
        } else {
            $message = "Database '{$db_info['database']}' already exists.";
        }
        
        // Step 2: Get connection to the database
        $db = $database->getConnection();
        
        // Step 3: Create tables
        $sql_file = __DIR__ . '/scripts/01-create-database.sql';
        if (file_exists($sql_file)) {
            $sql = file_get_contents($sql_file);
            // Remove the database creation part since we already created it
            $sql = preg_replace('/CREATE DATABASE.*?;/i', '', $sql);
            $sql = preg_replace('/USE.*?;/i', '', $sql);
            
            // Execute SQL
            $db->exec($sql);
            $message .= "\nTables created successfully!";
        } else {
            // Inline table creation
            $create_tables_sql = "
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );

            -- Create vehicle categories table
            CREATE TABLE IF NOT EXISTS vehicle_categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create vehicles table
            CREATE TABLE IF NOT EXISTS vehicles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                category_id INT,
                make VARCHAR(50) NOT NULL,
                model VARCHAR(50) NOT NULL,
                year INT NOT NULL,
                license_plate VARCHAR(20) UNIQUE NOT NULL,
                color VARCHAR(30),
                seats INT DEFAULT 4,
                fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') DEFAULT 'petrol',
                transmission ENUM('manual', 'automatic') DEFAULT 'manual',
                daily_rate DECIMAL(10,2) NOT NULL,
                status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
                image_url VARCHAR(255),
                features TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES vehicle_categories(id) ON DELETE SET NULL
            );

            -- Create bookings table
            CREATE TABLE IF NOT EXISTS bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                customer_id INT NOT NULL,
                vehicle_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                pickup_location VARCHAR(255),
                return_location VARCHAR(255),
                total_days INT NOT NULL,
                daily_rate DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            );

            -- Create payments table
            CREATE TABLE IF NOT EXISTS payments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method ENUM('cash', 'card', 'bank_transfer', 'online') DEFAULT 'cash',
                payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                transaction_id VARCHAR(100),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            );

            -- Create maintenance records table
            CREATE TABLE IF NOT EXISTS maintenance_records (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                maintenance_type VARCHAR(100) NOT NULL,
                description TEXT,
                cost DECIMAL(10,2),
                maintenance_date DATE NOT NULL,
                next_maintenance_date DATE,
                status ENUM('scheduled', 'in_progress', 'completed') DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            );
            ";
            
            $db->exec($create_tables_sql);
            $message .= "\nTables created successfully!";
        }
        
        // Step 4: Insert sample data
        $sample_data_sql = "
        -- Insert admin user (password: admin123)
        INSERT IGNORE INTO users (username, email, password, full_name, phone, role) VALUES
        ('admin', 'admin@vehiclerental.com', '$2y$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', '+1234567890', 'admin');

        -- Insert sample customers (password: password123)
        INSERT IGNORE INTO users (username, email, password, full_name, phone, address, role) VALUES
        ('john_doe', 'john@example.com', '$2y$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', '+1234567891', '123 Main St, City, State', 'customer'),
        ('jane_smith', 'jane@example.com', '$2y$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', '+1234567892', '456 Oak Ave, City, State', 'customer'),
        ('mike_wilson', 'mike@example.com', '$2y$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Wilson', '+1234567893', '789 Pine St, City, State', 'customer');

        -- Insert vehicle categories
        INSERT IGNORE INTO vehicle_categories (name, description) VALUES
        ('Economy', 'Fuel-efficient and budget-friendly vehicles'),
        ('Compact', 'Small cars perfect for city driving'),
        ('Mid-size', 'Comfortable vehicles for longer trips'),
        ('SUV', 'Spacious vehicles for families and groups'),
        ('Luxury', 'Premium vehicles with high-end features'),
        ('Van', 'Large vehicles for moving or group travel'),
        ('Sports', 'High-performance sports cars'),
        ('Electric', 'Eco-friendly electric vehicles');

        -- Insert sample vehicles
        INSERT IGNORE INTO vehicles (category_id, make, model, year, license_plate, color, seats, fuel_type, transmission, daily_rate, status, features) VALUES
        (1, 'Toyota', 'Corolla', 2022, 'ABC123', 'White', 5, 'petrol', 'automatic', 45.00, 'available', 'Air Conditioning, Bluetooth, USB Charging, Backup Camera'),
        (1, 'Honda', 'Civic', 2021, 'DEF456', 'Silver', 5, 'petrol', 'manual', 40.00, 'available', 'Air Conditioning, Radio, Power Windows'),
        (2, 'Nissan', 'Sentra', 2023, 'GHI789', 'Blue', 5, 'petrol', 'automatic', 50.00, 'available', 'Air Conditioning, Bluetooth, Backup Camera, Lane Assist'),
        (3, 'Honda', 'Accord', 2022, 'JKL012', 'Black', 5, 'petrol', 'automatic', 65.00, 'available', 'Leather Seats, Sunroof, Navigation System, Heated Seats'),
        (4, 'Toyota', 'RAV4', 2023, 'MNO345', 'Red', 7, 'hybrid', 'automatic', 80.00, 'available', 'AWD, Heated Seats, Apple CarPlay, Safety Suite'),
        (4, 'Ford', 'Explorer', 2022, 'PQR678', 'Gray', 7, 'petrol', 'automatic', 85.00, 'available', '4WD, Third Row Seating, Towing Package, Premium Audio'),
        (5, 'BMW', '3 Series', 2023, 'STU901', 'Black', 5, 'petrol', 'automatic', 120.00, 'available', 'Leather Interior, Premium Sound, Navigation, Sport Package'),
        (6, 'Ford', 'Transit', 2022, 'VWX234', 'White', 12, 'diesel', 'automatic', 95.00, 'available', 'Large Cargo Space, Power Steering, AC, GPS'),
        (7, 'Chevrolet', 'Camaro', 2023, 'SPT001', 'Yellow', 4, 'petrol', 'manual', 150.00, 'available', 'V8 Engine, Sport Suspension, Premium Audio, Racing Stripes'),
        (8, 'Tesla', 'Model 3', 2023, 'ELC001', 'Blue', 5, 'electric', 'automatic', 110.00, 'available', 'Autopilot, Supercharging, Premium Interior, Glass Roof');

        -- Insert sample bookings
        INSERT IGNORE INTO bookings (customer_id, vehicle_id, start_date, end_date, pickup_location, return_location, total_days, daily_rate, total_amount, status) VALUES
        (2, 1, '2024-01-15', '2024-01-18', 'Downtown Office', 'Downtown Office', 3, 45.00, 135.00, 'completed'),
        (3, 3, '2024-01-20', '2024-01-25', 'Airport', 'Airport', 5, 50.00, 250.00, 'active'),
        (4, 5, '2024-02-01', '2024-02-05', 'Hotel Pickup', 'Airport Drop-off', 4, 80.00, 320.00, 'confirmed');

        -- Insert sample payments
        INSERT IGNORE INTO payments (booking_id, amount, payment_method, payment_status, transaction_id) VALUES
        (1, 135.00, 'card', 'completed', 'TXN001'),
        (2, 250.00, 'online', 'completed', 'TXN002'),
        (3, 320.00, 'card', 'completed', 'TXN003');

        -- Insert sample maintenance records
        INSERT IGNORE INTO maintenance_records (vehicle_id, maintenance_type, description, cost, maintenance_date, next_maintenance_date, status) VALUES
        (1, 'Oil Change', 'Regular oil change and filter replacement', 45.00, '2024-01-10', '2024-04-10', 'completed'),
        (2, 'Tire Rotation', 'Rotate tires and check alignment', 35.00, '2024-01-12', '2024-07-12', 'completed'),
        (3, 'Brake Inspection', 'Check brake pads and fluid', 25.00, '2024-01-15', '2024-07-15', 'completed');
        ";
        
        $db->exec($sample_data_sql);
        $message .= "\nSample data inserted successfully!";
        
        $message_type = 'success';
        $step = 'complete';
        
    } catch (Exception $e) {
        $message = "Installation failed: " . $e->getMessage();
        $message_type = 'error';
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install VehicleRent Pro Database</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 700px; 
            margin: 50px auto; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
        }
        .logo {
            font-size: 3rem;
            margin-bottom: 10px;
        }
        h1 {
            color: #1f2937;
            margin: 0;
            font-size: 2rem;
        }
        .subtitle {
            color: #6b7280;
            margin: 10px 0 0 0;
        }
        .step-indicator {
            display: flex;
            justify-content: center;
            margin: 30px 0;
        }
        .step {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 10px;
            font-weight: bold;
            color: #6b7280;
        }
        .step.active {
            background: #3b82f6;
            color: white;
        }
        .step.completed {
            background: #10b981;
            color: white;
        }
        .message {
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            white-space: pre-line;
        }
        .success {
            background: #ecfdf5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .error {
            background: #fef2f2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }
        .info-box {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .btn {
            background: #3b82f6;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .btn-success {
            background: #10b981;
        }
        .btn-success:hover {
            background: #059669;
        }
        .config-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .config-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .config-info td {
            padding: 8px;
            border-bottom: 1px solid #dee2e6;
        }
        .config-info td:first-child {
            font-weight: 600;
            color: #374151;
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚗</div>
            <h1>VehicleRent Pro</h1>
            <p class="subtitle">Professional Vehicle Rental Management System</p>
        </div>

        <?php if ($step == 'complete'): ?>
            <div class="step-indicator">
                <div class="step completed">1</div>
                <div class="step completed">2</div>
                <div class="step completed">✓</div>
            </div>

            <?php if ($message): ?>
                <div class="message <?php echo $message_type; ?>">
                    <strong>Installation Complete!</strong><br>
                    <?php echo htmlspecialchars($message); ?>
                </div>
            <?php endif; ?>

            <div class="info-box">
                <h3>🎉 Installation Successful!</h3>
                <p>Your VehicleRent Pro system has been installed successfully. You can now start using the system with the following credentials:</p>
                
                <div class="config-info">
                    <h4>Default Login Credentials:</h4>
                    <table>
                        <tr><td>Admin Username:</td><td><strong>admin</strong></td></tr>
                        <tr><td>Admin Password:</td><td><strong>admin123</strong></td></tr>
                        <tr><td>Customer Username:</td><td><strong>john_doe</strong></td></tr>
                        <tr><td>Customer Password:</td><td><strong>password123</strong></td></tr>
                    </table>
                </div>

                <div class="feature-list">
                    <div class="feature-item">
                        <div class="feature-icon">📊</div>
                        <h4>Dashboard</h4>
                        <p>Executive analytics and insights</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🚙</div>
                        <h4>Fleet Management</h4>
                        <p>Complete vehicle management</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📅</div>
                        <h4>Reservations</h4>
                        <p>Advanced booking system</p>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">👥</div>
                        <h4>Customer CRM</h4>
                        <p>Customer relationship management</p>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="index.php" class="btn btn-success">🏠 Go to Home Page</a>
                <a href="login.php" class="btn">🔐 Admin Login</a>
                <a href="setup.php" class="btn">🔧 System Test</a>
            </div>

        <?php else: ?>
            <div class="step-indicator">
                <div class="step active">1</div>
                <div class="step">2</div>
                <div class="step">✓</div>
            </div>

            <?php if ($message): ?>
                <div class="message <?php echo $message_type; ?>">
                    <?php echo htmlspecialchars($message); ?>
                </div>
            <?php endif; ?>

            <div class="info-box">
                <h3>📋 Pre-Installation Check</h3>
                <p>This installer will set up the VehicleRent Pro database and create sample data for testing.</p>
                
                <?php
                $database = Database::getInstance();
                $db_info = $database->getDatabaseInfo();
                ?>
                
                <div class="config-info">
                    <h4>Database Configuration:</h4>
                    <table>
                        <tr><td>Host:</td><td><?php echo $db_info['host']; ?></td></tr>
                        <tr><td>Database:</td><td><?php echo $db_info['database']; ?></td></tr>
                        <tr><td>Username:</td><td><?php echo $db_info['username']; ?></td></tr>
                        <tr><td>Port:</td><td><?php echo $db_info['port']; ?></td></tr>
                    </table>
                </div>

                <h4>What will be installed:</h4>
                <ul>
                    <li>✅ Database structure (6 tables)</li>
                    <li>✅ Admin user account</li>
                    <li>✅ Sample customer accounts</li>
                    <li>✅ Vehicle categories and sample vehicles</li>
                    <li>✅ Sample bookings and payments</li>
                    <li>✅ Maintenance records</li>
                </ul>

                <p><strong>Note:</strong> Make sure your MySQL server is running and the credentials above are correct.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <form method="POST">
                    <button type="submit" name="install" class="btn">🚀 Install Database</button>
                </form>
                <br>
                <a href="setup.php" class="btn" style="background: #6b7280;">🔧 Test Connection First</a>
            </div>
        <?php endif; ?>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>VehicleRent Pro v1.0 - Professional Vehicle Rental Management System</p>
        </div>
    </div>
</body>
</html>
