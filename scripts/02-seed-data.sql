-- Insert sample data
USE vehicle_rental_db;

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('admin', 'admin@vehiclerental.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', '+1234567890', 'admin');

-- Insert sample customers
INSERT INTO users (username, email, password, full_name, phone, address, role) VALUES
('john_doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', '+1234567891', '123 Main St, City, State', 'customer'),
('jane_smith', 'jane@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', '+1234567892', '456 Oak Ave, City, State', 'customer');

-- Insert vehicle categories
INSERT INTO vehicle_categories (name, description) VALUES
('Economy', 'Fuel-efficient and budget-friendly vehicles'),
('Compact', 'Small cars perfect for city driving'),
('Mid-size', 'Comfortable vehicles for longer trips'),
('SUV', 'Spacious vehicles for families and groups'),
('Luxury', 'Premium vehicles with high-end features'),
('Van', 'Large vehicles for moving or group travel');

-- Insert sample vehicles
INSERT INTO vehicles (category_id, make, model, year, license_plate, color, seats, fuel_type, transmission, daily_rate, status, features) VALUES
(1, 'Toyota', 'Corolla', 2022, 'ABC123', 'White', 5, 'petrol', 'automatic', 45.00, 'available', 'Air Conditioning, Bluetooth, USB Charging'),
(1, 'Honda', 'Civic', 2021, 'DEF456', 'Silver', 5, 'petrol', 'manual', 40.00, 'available', 'Air Conditioning, Radio, Power Windows'),
(2, 'Nissan', 'Sentra', 2023, 'GHI789', 'Blue', 5, 'petrol', 'automatic', 50.00, 'available', 'Air Conditioning, Bluetooth, Backup Camera'),
(3, 'Honda', 'Accord', 2022, 'JKL012', 'Black', 5, 'petrol', 'automatic', 65.00, 'available', 'Leather Seats, Sunroof, Navigation System'),
(4, 'Toyota', 'RAV4', 2023, 'MNO345', 'Red', 7, 'hybrid', 'automatic', 80.00, 'available', 'AWD, Heated Seats, Apple CarPlay'),
(4, 'Ford', 'Explorer', 2022, 'PQR678', 'Gray', 7, 'petrol', 'automatic', 85.00, 'available', '4WD, Third Row Seating, Towing Package'),
(5, 'BMW', '3 Series', 2023, 'STU901', 'Black', 5, 'petrol', 'automatic', 120.00, 'available', 'Leather Interior, Premium Sound, Navigation'),
(6, 'Ford', 'Transit', 2022, 'VWX234', 'White', 12, 'diesel', 'automatic', 95.00, 'available', 'Large Cargo Space, Power Steering, AC');

-- Insert sample bookings
INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date, pickup_location, return_location, total_days, daily_rate, total_amount, status) VALUES
(2, 1, '2024-01-15', '2024-01-18', 'Downtown Office', 'Downtown Office', 3, 45.00, 135.00, 'completed'),
(3, 3, '2024-01-20', '2024-01-25', 'Airport', 'Airport', 5, 50.00, 250.00, 'active');

-- Insert sample payments
INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id) VALUES
(1, 135.00, 'card', 'completed', 'TXN001'),
(2, 250.00, 'online', 'completed', 'TXN002');
