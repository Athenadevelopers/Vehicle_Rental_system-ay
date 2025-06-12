<?php
require_once 'config/config.php';
require_once 'config/database.php';
require_once 'classes/Vehicle.php';
require_once 'classes/Booking.php';

// Check if user is logged in and is customer
if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'customer') {
    header("Location: login.php");
    exit();
}

if(!isset($_GET['id'])) {
    header("Location: index.php");
    exit();
}

$database = new Database();
$db = $database->getConnection();
$vehicle = new Vehicle($db);
$vehicle->id = $_GET['id'];

if(!$vehicle->readOne()) {
    header("Location: index.php");
    exit();
}

$message = '';
$message_type = '';

if($_POST) {
    $booking = new Booking($db);
    
    $start_date = $_POST['start_date'];
    $end_date = $_POST['end_date'];
    
    // Calculate total days and amount
    $start = new DateTime($start_date);
    $end = new DateTime($end_date);
    $total_days = $end->diff($start)->days;
    
    if($total_days <= 0) {
        $message = "End date must be after start date.";
        $message_type = "danger";
    } elseif(!$booking->isVehicleAvailable($vehicle->id, $start_date, $end_date)) {
        $message = "Vehicle is not available for the selected dates.";
        $message_type = "danger";
    } else {
        $booking->customer_id = $_SESSION['user_id'];
        $booking->vehicle_id = $vehicle->id;
        $booking->start_date = $start_date;
        $booking->end_date = $end_date;
        $booking->pickup_location = $_POST['pickup_location'];
        $booking->return_location = $_POST['return_location'];
        $booking->total_days = $total_days;
        $booking->daily_rate = $vehicle->daily_rate;
        $booking->total_amount = $total_days * $vehicle->daily_rate;
        $booking->status = 'pending';
        $booking->notes = $_POST['notes'];
        
        if($booking->create()) {
            $message = "Booking request submitted successfully! We will contact you soon.";
            $message_type = "success";
        } else {
            $message = "Booking failed. Please try again.";
            $message_type = "danger";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Vehicle - <?php echo SITE_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-car"></i> Vehicle Rental
            </a>
            <div class="navbar-nav ms-auto">
                <div class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user"></i> <?php echo $_SESSION['full_name']; ?>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="customer/dashboard.php">My Dashboard</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="logout.php">Logout</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <img src="<?php echo $vehicle->image_url ?: 'https://via.placeholder.com/400x300?text=Vehicle'; ?>" 
                         class="card-img-top" alt="<?php echo $vehicle->make . ' ' . $vehicle->model; ?>">
                    <div class="card-body">
                        <h3 class="card-title"><?php echo $vehicle->make . ' ' . $vehicle->model; ?></h3>
                        <div class="row">
                            <div class="col-6">
                                <p><strong>Year:</strong> <?php echo $vehicle->year; ?></p>
                                <p><strong>Color:</strong> <?php echo $vehicle->color; ?></p>
                                <p><strong>Seats:</strong> <?php echo $vehicle->seats; ?></p>
                            </div>
                            <div class="col-6">
                                <p><strong>Fuel Type:</strong> <?php echo ucfirst($vehicle->fuel_type); ?></p>
                                <p><strong>Transmission:</strong> <?php echo ucfirst($vehicle->transmission); ?></p>
                                <p><strong>Daily Rate:</strong> $<?php echo number_format($vehicle->daily_rate, 2); ?></p>
                            </div>
                        </div>
                        <?php if($vehicle->features): ?>
                        <p><strong>Features:</strong> <?php echo $vehicle->features; ?></p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h4>Book This Vehicle</h4>
                    </div>
                    <div class="card-body">
                        <?php if($message): ?>
                            <div class="alert alert-<?php echo $message_type; ?>"><?php echo $message; ?></div>
                        <?php endif; ?>
                        
                        <form method="POST" id="bookingForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="start_date" class="form-label">Start Date</label>
                                    <input type="date" class="form-control" id="start_date" name="start_date" 
                                           min="<?php echo date('Y-m-d'); ?>" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="end_date" class="form-label">End Date</label>
                                    <input type="date" class="form-control" id="end_date" name="end_date" 
                                           min="<?php echo date('Y-m-d'); ?>" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="pickup_location" class="form-label">Pickup Location</label>
                                <input type="text" class="form-control" id="pickup_location" name="pickup_location" 
                                       placeholder="Enter pickup location" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="return_location" class="form-label">Return Location</label>
                                <input type="text" class="form-control" id="return_location" name="return_location" 
                                       placeholder="Enter return location" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="notes" class="form-label">Additional Notes</label>
                                <textarea class="form-control" id="notes" name="notes" rows="3" 
                                          placeholder="Any special requirements or notes"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6">
                                                <p class="mb-1"><strong>Daily Rate:</strong></p>
                                                <p class="mb-1"><strong>Total Days:</strong></p>
                                                <p class="mb-0"><strong>Total Amount:</strong></p>
                                            </div>
                                            <div class="col-6 text-end">
                                                <p class="mb-1">$<?php echo number_format($vehicle->daily_rate, 2); ?></p>
                                                <p class="mb-1" id="totalDays">0</p>
                                                <p class="mb-0 h5 text-primary" id="totalAmount">$0.00</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn btn-primary w-100">Submit Booking Request</button>
                        </form>
                        
                        <div class="text-center mt-3">
                            <a href="index.php" class="btn btn-link">Back to Vehicles</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const startDate = document.getElementById('start_date');
            const endDate = document.getElementById('end_date');
            const totalDaysElement = document.getElementById('totalDays');
            const totalAmountElement = document.getElementById('totalAmount');
            const dailyRate = <?php echo $vehicle->daily_rate; ?>;

            function calculateTotal() {
                if (startDate.value && endDate.value) {
                    const start = new Date(startDate.value);
                    const end = new Date(endDate.value);
                    const timeDiff = end.getTime() - start.getTime();
                    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    
                    if (dayDiff > 0) {
                        totalDaysElement.textContent = dayDiff;
                        totalAmountElement.textContent = '$' + (dayDiff * dailyRate).toFixed(2);
                    } else {
                        totalDaysElement.textContent = '0';
                        totalAmountElement.textContent = '$0.00';
                    }
                }
            }

            startDate.addEventListener('change', calculateTotal);
            endDate.addEventListener('change', calculateTotal);
        });
    </script>
</body>
</html>
