<?php
$page_title = "Executive Dashboard";
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../classes/Vehicle.php';
require_once '../classes/Booking.php';

// Check if user is logged in and is admin
if(!is_logged_in() || !is_admin()) {
    redirect("../login.php");
}

$database = Database::getInstance();
$db = $database->getConnection();

// Get comprehensive statistics
$stats = [
    'total_vehicles' => $db->query("SELECT COUNT(*) as count FROM vehicles")->fetch()['count'],
    'available_vehicles' => $db->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'")->fetch()['count'],
    'rented_vehicles' => $db->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'rented'")->fetch()['count'],
    'maintenance_vehicles' => $db->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'")->fetch()['count'],
    'total_bookings' => $db->query("SELECT COUNT(*) as count FROM bookings")->fetch()['count'],
    'active_bookings' => $db->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'active'")->fetch()['count'],
    'pending_bookings' => $db->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'")->fetch()['count'],
    'completed_bookings' => $db->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'")->fetch()['count'],
    'total_customers' => $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'")->fetch()['count'],
    'new_customers_month' => $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")->fetch()['count'],
    'total_revenue' => $db->query("SELECT SUM(total_amount) as total FROM bookings WHERE status IN ('completed', 'active')")->fetch()['total'] ?: 0,
    'monthly_revenue' => $db->query("SELECT SUM(total_amount) as total FROM bookings WHERE status IN ('completed', 'active') AND booking_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")->fetch()['total'] ?: 0,
    'fleet_utilization' => 0
];

// Calculate fleet utilization
if ($stats['total_vehicles'] > 0) {
    $stats['fleet_utilization'] = round(($stats['rented_vehicles'] / $stats['total_vehicles']) * 100, 1);
}

// Get recent bookings
$recent_bookings = $db->query("
    SELECT b.*, u.full_name as customer_name, u.email as customer_email, 
           v.make, v.model, v.license_plate, v.image_url
    FROM bookings b 
    LEFT JOIN users u ON b.customer_id = u.id 
    LEFT JOIN vehicles v ON b.vehicle_id = v.id 
    ORDER BY b.booking_date DESC 
    LIMIT 10
")->fetchAll();

// Get revenue data for chart (last 12 months)
$revenue_data = $db->query("
    SELECT 
        DATE_FORMAT(booking_date, '%Y-%m') as month,
        DATE_FORMAT(booking_date, '%M %Y') as month_name,
        SUM(total_amount) as revenue,
        COUNT(*) as bookings
    FROM bookings 
    WHERE status IN ('completed', 'active') 
    AND booking_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(booking_date, '%Y-%m')
    ORDER BY month
")->fetchAll();

// Get top performing vehicles
$top_vehicles = $db->query("
    SELECT v.make, v.model, v.license_plate, v.image_url,
           COUNT(b.id) as booking_count,
           SUM(b.total_amount) as total_revenue,
           AVG(b.total_amount) as avg_booking_value
    FROM vehicles v
    LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status IN ('completed', 'active')
    GROUP BY v.id
    ORDER BY total_revenue DESC
    LIMIT 5
")->fetchAll();

// Get booking status distribution
$booking_status = $db->query("
    SELECT status, COUNT(*) as count
    FROM bookings
    GROUP BY status
")->fetchAll();

include '../includes/header.php';
?>

<!-- Admin Navigation -->
<nav class="bg-dark text-white shadow-lg sticky top-0 z-50">
    <div class="container mx-auto px-4">
        <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
                <a href="dashboard.php" class="text-xl font-bold font-heading flex items-center">
                    <i class="fas fa-tachometer-alt mr-2 text-primary"></i>
                    Executive Dashboard
                </a>
            </div>
            
            <!-- Quick Stats -->
            <div class="hidden lg:flex items-center space-x-6 text-sm">
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-secondary rounded-full"></div>
                    <span><?php echo $stats['available_vehicles']; ?> Available</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-accent rounded-full"></div>
                    <span><?php echo $stats['pending_bookings']; ?> Pending</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-primary rounded-full"></div>
                    <span><?php echo format_currency($stats['monthly_revenue']); ?> This Month</span>
                </div>
            </div>
            
            <!-- User Menu -->
            <div class="relative group">
                <button class="flex items-center space-x-2 text-gray-300 hover:text-white transition">
                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span class="text-xs font-bold"><?php echo strtoupper(substr($_SESSION['full_name'], 0, 2)); ?></span>
                    </div>
                    <span class="hidden md:block"><?php echo $_SESSION['full_name']; ?></span>
                    <i class="fas fa-chevron-down text-xs"></i>
                </button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-20 hidden group-hover:block">
                    <a href="../index.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-home mr-2"></i>View Site
                    </a>
                    <a href="profile.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-user mr-2"></i>Profile
                    </a>
                    <a href="settings.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-cog mr-2"></i>Settings
                    </a>
                    <div class="border-t border-gray-100"></div>
                    <a href="../logout.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </a>
                </div>
            </div>
        </div>
    </div>
</nav>

<!-- Sidebar Navigation -->
<div class="flex">
    <aside class="sidebar w-64 min-h-screen text-white no-print">
        <div class="p-6">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-car-side text-2xl"></i>
                </div>
                <h3 class="font-semibold">VehicleRent Pro</h3>
                <p class="text-xs text-gray-400">Admin Panel</p>
            </div>
            
            <nav class="space-y-2">
                <a href="dashboard.php" class="sidebar-link active flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-tachometer-alt mr-3"></i>
                    Dashboard
                </a>
                <a href="fleet-management.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-car mr-3"></i>
                    Fleet Management
                </a>
                <a href="reservations.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-calendar-alt mr-3"></i>
                    Reservations
                </a>
                <a href="customers.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-users mr-3"></i>
                    Customer CRM
                </a>
                <a href="financial.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-chart-line mr-3"></i>
                    Financial Center
                </a>
                <a href="analytics.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-chart-bar mr-3"></i>
                    Analytics Suite
                </a>
                <a href="maintenance.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-tools mr-3"></i>
                    Maintenance
                </a>
                <a href="reports.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-file-alt mr-3"></i>
                    Reports
                </a>
                <a href="settings.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-cog mr-3"></i>
                    Settings
                </a>
            </nav>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 bg-light min-h-screen">
        <div class="p-6">
            <!-- Page Header -->
            <div class="mb-8">
                <div class="flex justify-between items-start">
                    <div>
                        <h1 class="text-3xl font-bold text-dark mb-2">Executive Dashboard</h1>
                        <p class="text-gray-600">Welcome back, <?php echo $_SESSION['full_name']; ?>! Here's your business overview.</p>
                    </div>
                    <div class="flex gap-3">
                        <button class="btn btn-outline btn-sm" onclick="window.print()">
                            <i class="fas fa-print mr-2"></i>Print Report
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="exportDashboard()">
                            <i class="fas fa-download mr-2"></i>Export Data
                        </button>
                    </div>
                </div>
            </div>

            <!-- Key Metrics Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Total Revenue -->
                <div class="stats-card card">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                                <p class="text-2xl font-bold text-dark"><?php echo format_currency($stats['total_revenue']); ?></p>
                                <p class="text-sm text-secondary mt-1">
                                    <i class="fas fa-arrow-up mr-1"></i>
                                    +12.5% from last month
                                </p>
                            </div>
                            <div class="icon w-12 h-12 bg-primary-100 text-primary rounded-xl flex items-center justify-center">
                                <i class="fas fa-dollar-sign text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fleet Utilization -->
                <div class="stats-card card">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 mb-1">Fleet Utilization</p>
                                <p class="text-2xl font-bold text-dark"><?php echo $stats['fleet_utilization']; ?>%</p>
                                <p class="text-sm text-gray-500 mt-1">
                                    <?php echo $stats['rented_vehicles']; ?> of <?php echo $stats['total_vehicles']; ?> vehicles
                                </p>
                            </div>
                            <div class="icon w-12 h-12 bg-secondary-100 text-secondary rounded-xl flex items-center justify-center">
                                <i class="fas fa-car text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Active Bookings -->
                <div class="stats-card card">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 mb-1">Active Bookings</p>
                                <p class="text-2xl font-bold text-dark"><?php echo $stats['active_bookings']; ?></p>
                                <p class="text-sm text-accent mt-1">
                                    <i class="fas fa-clock mr-1"></i>
                                    <?php echo $stats['pending_bookings']; ?> pending approval
                                </p>
                            </div>
                            <div class="icon w-12 h-12 bg-accent-100 text-accent rounded-xl flex items-center justify-center">
                                <i class="fas fa-calendar-check text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer Growth -->
                <div class="stats-card card">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
                                <p class="text-2xl font-bold text-dark"><?php echo $stats['total_customers']; ?></p>
                                <p class="text-sm text-secondary mt-1">
                                    <i class="fas fa-user-plus mr-1"></i>
                                    +<?php echo $stats['new_customers_month']; ?> this month
                                </p>
                            </div>
                            <div class="icon w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <i class="fas fa-users text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts and Analytics -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Revenue Chart -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-dark">Revenue Trends</h3>
                            <div class="flex items-center space-x-2">
                                <select class="form-control form-control-sm" style="width: auto;">
                                    <option>Last 12 Months</option>
                                    <option>Last 6 Months</option>
                                    <option>Last 3 Months</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="h-64">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Booking Status Distribution -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-dark">Booking Status Distribution</h3>
                    </div>
                    <div class="card-body">
                        <div class="h-64">
                            <canvas id="bookingStatusChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fleet Status and Top Performers -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Fleet Status -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-dark">Fleet Status Overview</h3>
                            <a href="fleet-management.php" class="btn btn-primary btn-sm">
                                <i class="fas fa-car mr-2"></i>Manage Fleet
                            </a>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-3 h-3 bg-secondary rounded-full mr-3"></div>
                                    <span class="text-sm font-medium">Available</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-lg font-bold mr-2"><?php echo $stats['available_vehicles']; ?></span>
                                    <div class="w-24 bg-gray-200 rounded-full h-2">
                                        <div class="bg-secondary h-2 rounded-full" style="width: <?php echo ($stats['available_vehicles'] / $stats['total_vehicles']) * 100; ?>%"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-3 h-3 bg-primary rounded-full mr-3"></div>
                                    <span class="text-sm font-medium">Rented</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-lg font-bold mr-2"><?php echo $stats['rented_vehicles']; ?></span>
                                    <div class="w-24 bg-gray-200 rounded-full h-2">
                                        <div class="bg-primary h-2 rounded-full" style="width: <?php echo ($stats['rented_vehicles'] / $stats['total_vehicles']) * 100; ?>%"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="w-3 h-3 bg-accent rounded-full mr-3"></div>
                                    <span class="text-sm font-medium">Maintenance</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="text-lg font-bold mr-2"><?php echo $stats['maintenance_vehicles']; ?></span>
                                    <div class="w-24 bg-gray-200 rounded-full h-2">
                                        <div class="bg-accent h-2 rounded-full" style="width: <?php echo ($stats['maintenance_vehicles'] / $stats['total_vehicles']) * 100; ?>%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Performing Vehicles -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-dark">Top Performing Vehicles</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-4">
                            <?php foreach($top_vehicles as $index => $vehicle): ?>
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                        <?php echo $index + 1; ?>
                                    </div>
                                    <div>
                                        <p class="font-medium text-sm"><?php echo $vehicle['make'] . ' ' . $vehicle['model']; ?></p>
                                        <p class="text-xs text-gray-500"><?php echo $vehicle['license_plate']; ?></p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-sm"><?php echo format_currency($vehicle['total_revenue'] ?: 0); ?></p>
                                    <p class="text-xs text-gray-500"><?php echo $vehicle['booking_count']; ?> bookings</p>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-dark">Recent Bookings</h3>
                        <a href="reservations.php" class="btn btn-outline btn-sm">
                            View All <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Vehicle</th>
                                    <th>Dates</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($recent_bookings as $booking): ?>
                                <tr>
                                    <td>
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-xs font-medium text-primary">
                                                    <?php echo strtoupper(substr($booking['customer_name'], 0, 2)); ?>
                                                </span>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm"><?php echo $booking['customer_name']; ?></div>
                                                <div class="text-xs text-gray-500"><?php echo $booking['customer_email']; ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="font-medium text-sm"><?php echo $booking['make'] . ' ' . $booking['model']; ?></div>
                                        <div class="text-xs text-gray-500"><?php echo $booking['license_plate']; ?></div>
                                    </td>
                                    <td>
                                        <div class="text-sm"><?php echo format_date($booking['start_date']); ?></div>
                                        <div class="text-xs text-gray-500">to <?php echo format_date($booking['end_date']); ?></div>
                                    </td>
                                    <td>
                                        <span class="font-bold text-sm"><?php echo format_currency($booking['total_amount']); ?></span>
                                    </td>
                                    <td>
                                        <span class="badge badge-<?php 
                                            echo $booking['status'] == 'confirmed' ? 'success' : 
                                                ($booking['status'] == 'pending' ? 'warning' : 
                                                ($booking['status'] == 'active' ? 'info' : 
                                                ($booking['status'] == 'completed' ? 'primary' : 'danger'))); 
                                        ?>">
                                            <?php echo ucfirst($booking['status']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <div class="flex gap-2">
                                            <button class="btn btn-ghost btn-sm" onclick="viewBooking(<?php echo $booking['id']; ?>)">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-ghost btn-sm" onclick="editBooking(<?php echo $booking['id']; ?>)">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// Revenue Chart
const revenueCtx = document.getElementById('revenueChart').getContext('2d');
const revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
        labels: <?php echo json_encode(array_column($revenue_data, 'month_name')); ?>,
        datasets: [{
            label: 'Revenue',
            data: <?php echo json_encode(array_column($revenue_data, 'revenue')); ?>,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                },
                grid: {
                    color: '#E5E7EB'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        elements: {
            point: {
                hoverRadius: 8
            }
        }
    }
});

// Booking Status Chart
const statusCtx = document.getElementById('bookingStatusChart').getContext('2d');
const statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
        labels: <?php echo json_encode(array_column($booking_status, 'status')); ?>,
        datasets: [{
            data: <?php echo json_encode(array_column($booking_status, 'count')); ?>,
            backgroundColor: [
                '#10B981', // confirmed - secondary
                '#F59E0B', // pending - accent
                '#3B82F6', // active - primary
                '#6B7280', // completed - gray
                '#EF4444'  // cancelled - danger
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true
                }
            }
        }
    }
});

// Dashboard Functions
function viewBooking(id) {
    window.location.href = `booking-details.php?id=${id}`;
}

function editBooking(id) {
    window.location.href = `edit-booking.php?id=${id}`;
}

function exportDashboard() {
    // Implement export functionality
    alert('Export functionality will be implemented');
}

// Real-time updates (optional)
function updateDashboard() {
    // Fetch updated data and refresh charts
    // This would typically use AJAX to get fresh data
}

// Update dashboard every 5 minutes
setInterval(updateDashboard, 300000);
</script>

<?php include '../includes/footer.php'; ?>
