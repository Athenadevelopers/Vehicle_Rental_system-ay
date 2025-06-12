<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../classes/Booking.php';

// Check if user is logged in and is customer
if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'customer') {
    header("Location: ../login.php");
    exit();
}

$database = new Database();
$db = $database->getConnection();
$booking = new Booking($db);

$my_bookings = $booking->readByCustomer($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Dashboard - <?php echo SITE_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="../index.php">
                <i class="fas fa-car"></i> Vehicle Rental
            </a>
            <div class="navbar-nav ms-auto">
                <div class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user"></i> <?php echo $_SESSION['full_name']; ?>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="../index.php">Browse Vehicles</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="../logout.php">Logout</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-12">
                <h2>Welcome, <?php echo $_SESSION['full_name']; ?>!</h2>
                <p class="text-muted">Manage your vehicle bookings and rental history.</p>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">My Bookings</h5>
                        <a href="../index.php#vehicles" class="btn btn-primary">Book New Vehicle</a>
                    </div>
                    <div class="card-body">
                        <?php if($my_bookings->rowCount() > 0): ?>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Vehicle</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Days</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Booked On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php while($row = $my_bookings->fetch(PDO::FETCH_ASSOC)): ?>
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <?php if($row['image_url']): ?>
                                                <img src="<?php echo $row['image_url']; ?>" alt="Vehicle" class="me-2" style="width: 50px; height: 35px; object-fit: cover;">
                                                <?php endif; ?>
                                                <div>
                                                    <strong><?php echo $row['make'] . ' ' . $row['model']; ?></strong><br>
                                                    <small class="text-muted"><?php echo $row['license_plate']; ?></small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><?php echo date('M d, Y', strtotime($row['start_date'])); ?></td>
                                        <td><?php echo date('M d, Y', strtotime($row['end_date'])); ?></td>
                                        <td><?php echo $row['total_days']; ?></td>
                                        <td>$<?php echo number_format($row['total_amount'], 2); ?></td>
                                        <td>
                                            <span class="badge bg-<?php 
                                                echo $row['status'] == 'confirmed' ? 'success' : 
                                                    ($row['status'] == 'pending' ? 'warning' : 
                                                    ($row['status'] == 'active' ? 'info' : 
                                                    ($row['status'] == 'completed' ? 'primary' : 'secondary'))); 
                                            ?>">
                                                <?php echo ucfirst($row['status']); ?>
                                            </span>
                                        </td>
                                        <td><?php echo date('M d, Y', strtotime($row['booking_date'])); ?></td>
                                    </tr>
                                    <?php endwhile; ?>
                                </tbody>
                            </table>
                        </div>
                        <?php else: ?>
                        <div class="text-center py-4">
                            <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                            <h5>No bookings yet</h5>
                            <p class="text-muted">Start by browsing our available vehicles and make your first booking.</p>
                            <a href="../index.php#vehicles" class="btn btn-primary">Browse Vehicles</a>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
