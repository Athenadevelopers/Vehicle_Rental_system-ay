<?php
$page_title = "Fleet Management Console";
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../classes/Vehicle.php';

// Check if user is logged in and is admin
if(!is_logged_in() || !is_admin()) {
    redirect("../login.php");
}

$database = Database::getInstance();
$db = $database->getConnection();

// Handle vehicle actions
if ($_POST) {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'add_vehicle':
                // Add new vehicle logic
                break;
            case 'update_status':
                $vehicle_id = $_POST['vehicle_id'];
                $new_status = $_POST['status'];
                $stmt = $db->prepare("UPDATE vehicles SET status = ? WHERE id = ?");
                $stmt->execute([$new_status, $vehicle_id]);
                flash_message("Vehicle status updated successfully", "success");
                break;
            case 'schedule_maintenance':
                // Schedule maintenance logic
                break;
        }
    }
}

// Get vehicles with filters
$where_conditions = [];
$params = [];

if (isset($_GET['status']) && $_GET['status'] !== '') {
    $where_conditions[] = "v.status = ?";
    $params[] = $_GET['status'];
}

if (isset($_GET['category']) && $_GET['category'] !== '') {
    $where_conditions[] = "v.category_id = ?";
    $params[] = $_GET['category'];
}

if (isset($_GET['search']) && $_GET['search'] !== '') {
    $where_conditions[] = "(v.make LIKE ? OR v.model LIKE ? OR v.license_plate LIKE ?)";
    $search_term = '%' . $_GET['search'] . '%';
    $params[] = $search_term;
    $params[] = $search_term;
    $params[] = $search_term;
}

$where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';

$vehicles_query = "
    SELECT v.*, c.name as category_name,
           COUNT(b.id) as total_bookings,
           SUM(CASE WHEN b.status IN ('completed', 'active') THEN b.total_amount ELSE 0 END) as total_revenue
    FROM vehicles v
    LEFT JOIN vehicle_categories c ON v.category_id = c.id
    LEFT JOIN bookings b ON v.id = b.vehicle_id
    $where_clause
    GROUP BY v.id
    ORDER BY v.created_at DESC
";

$vehicles = $db->prepare($vehicles_query);
$vehicles->execute($params);

// Get categories for filter
$categories = $db->query("SELECT * FROM vehicle_categories ORDER BY name")->fetchAll();

// Get maintenance alerts
$maintenance_alerts = $db->query("
    SELECT v.*, mr.next_maintenance_date, mr.maintenance_type
    FROM vehicles v
    LEFT JOIN maintenance_records mr ON v.id = mr.vehicle_id
    WHERE v.status = 'maintenance' OR mr.next_maintenance_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
    ORDER BY mr.next_maintenance_date ASC
")->fetchAll();

include '../includes/header.php';
?>

<div class="flex">
    <!-- Sidebar -->
    <aside class="sidebar w-64 min-h-screen text-white no-print">
        <div class="p-6">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                    <i class="fas fa-car-side text-2xl"></i>
                </div>
                <h3 class="font-semibold">VehicleRent Pro</h3>
                <p class="text-xs text-gray-400">Fleet Management</p>
            </div>
            
            <nav class="space-y-2">
                <a href="dashboard.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-tachometer-alt mr-3"></i>Dashboard
                </a>
                <a href="fleet-management.php" class="sidebar-link active flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-car mr-3"></i>Fleet Management
                </a>
                <a href="reservations.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-calendar-alt mr-3"></i>Reservations
                </a>
                <a href="customers.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-users mr-3"></i>Customer CRM
                </a>
                <a href="financial.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-chart-line mr-3"></i>Financial Center
                </a>
                <a href="analytics.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-chart-bar mr-3"></i>Analytics Suite
                </a>
                <a href="maintenance.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-tools mr-3"></i>Maintenance
                </a>
                <a href="reports.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-file-alt mr-3"></i>Reports
                </a>
                <a href="settings.php" class="sidebar-link flex items-center px-4 py-3 text-sm">
                    <i class="fas fa-cog mr-3"></i>Settings
                </a>
            </nav>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 bg-light min-h-screen">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-dark">Fleet Management Console</h1>
                    <p class="text-gray-600">Manage your vehicle fleet, track performance, and schedule maintenance</p>
                </div>
                <div class="flex gap-3">
                    <button class="btn btn-outline btn-sm" onclick="exportFleetData()">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button class="btn btn-primary" onclick="openAddVehicleModal()">
                        <i class="fas fa-plus mr-2"></i>Add Vehicle
                    </button>
                </div>
            </div>
        </div>

        <div class="p-6">
            <!-- Maintenance Alerts -->
            <?php if (!empty($maintenance_alerts)): ?>
            <div class="alert alert-warning mb-6">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle mr-3 mt-1"></i>
                    <div>
                        <h4 class="font-semibold mb-2">Maintenance Alerts</h4>
                        <p class="mb-3"><?php echo count($maintenance_alerts); ?> vehicles require attention:</p>
                        <div class="space-y-2">
                            <?php foreach(array_slice($maintenance_alerts, 0, 3) as $alert): ?>
                            <div class="flex items-center justify-between bg-white bg-opacity-50 rounded p-2">
                                <span class="text-sm"><?php echo $alert['make'] . ' ' . $alert['model'] . ' (' . $alert['license_plate'] . ')'; ?></span>
                                <span class="text-xs"><?php echo $alert['maintenance_type'] ?: 'General Maintenance'; ?></span>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        <?php if (count($maintenance_alerts) > 3): ?>
                        <a href="maintenance.php" class="text-sm underline mt-2 inline-block">View all alerts</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Filters and Search -->
            <div class="card mb-6">
                <div class="card-body">
                    <form method="GET" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="form-label">Search</label>
                            <input type="text" name="search" class="form-control" placeholder="Make, model, or license plate" value="<?php echo $_GET['search'] ?? ''; ?>">
                        </div>
                        <div>
                            <label class="form-label">Status</label>
                            <select name="status" class="form-control">
                                <option value="">All Status</option>
                                <option value="available" <?php echo ($_GET['status'] ?? '') === 'available' ? 'selected' : ''; ?>>Available</option>
                                <option value="rented" <?php echo ($_GET['status'] ?? '') === 'rented' ? 'selected' : ''; ?>>Rented</option>
                                <option value="maintenance" <?php echo ($_GET['status'] ?? '') === 'maintenance' ? 'selected' : ''; ?>>Maintenance</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Category</label>
                            <select name="category" class="form-control">
                                <option value="">All Categories</option>
                                <?php foreach($categories as $category): ?>
                                <option value="<?php echo $category['id']; ?>" <?php echo ($_GET['category'] ?? '') == $category['id'] ? 'selected' : ''; ?>>
                                    <?php echo $category['name']; ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button type="submit" class="btn btn-primary w-full">
                                <i class="fas fa-search mr-2"></i>Filter
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Fleet Overview Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 bg-secondary-100 text-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-car text-xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-dark mb-1">
                            <?php 
                            $available_count = $db->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'")->fetch()['count'];
                            echo $available_count;
                            ?>
                        </h3>
                        <p class="text-sm text-gray-600">Available</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 bg-primary-100 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-key text-xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-dark mb-1">
                            <?php 
                            $rented_count = $db->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'rented'")->fetch()['count'];
                            echo $rented_count;
                            ?>
                        </h3>
                        <p class="text-sm text-gray-600">Rented</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 bg-accent-100 text-accent rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-tools text-xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-dark mb-1">
                            <?php 
                            $maintenance_count = $db->query("SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'")->fetch()['count'];
                            echo $maintenance_count;
                            ?>
                        </h3>
                        <p class="text-sm text-gray-600">Maintenance</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body text-center">
                        <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <i class="fas fa-chart-line text-xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-dark mb-1">
                            <?php 
                            $total_vehicles = $db->query("SELECT COUNT(*) as count FROM vehicles")->fetch()['count'];
                            $utilization = $total_vehicles > 0 ? round(($rented_count / $total_vehicles) * 100, 1) : 0;
                            echo $utilization . '%';
                            ?>
                        </h3>
                        <p class="text-sm text-gray-600">Utilization</p>
                    </div>
                </div>
            </div>

            <!-- Vehicle Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <?php while($vehicle = $vehicles->fetch()): ?>
                <div class="card vehicle-card">
                    <div class="relative">
                        <img src="<?php echo $vehicle['image_url'] ?: 'https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'; ?>" 
                             alt="<?php echo $vehicle['make'] . ' ' . $vehicle['model']; ?>" 
                             class="w-full h-48 object-cover">
                        
                        <!-- Status Badge -->
                        <div class="absolute top-3 right-3">
                            <span class="badge badge-<?php 
                                echo $vehicle['status'] == 'available' ? 'success' : 
                                    ($vehicle['status'] == 'rented' ? 'info' : 'warning'); 
                            ?>">
                                <?php echo ucfirst($vehicle['status']); ?>
                            </span>
                        </div>

                        <!-- Quick Actions -->
                        <div class="absolute top-3 left-3">
                            <div class="flex gap-2">
                                <button class="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition" 
                                        onclick="viewVehicleDetails(<?php echo $vehicle['id']; ?>)" 
                                        title="View Details">
                                    <i class="fas fa-eye text-sm"></i>
                                </button>
                                <button class="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition" 
                                        onclick="editVehicle(<?php echo $vehicle['id']; ?>)" 
                                        title="Edit Vehicle">
                                    <i class="fas fa-edit text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card-body">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="text-lg font-semibold text-dark"><?php echo $vehicle['make'] . ' ' . $vehicle['model']; ?></h3>
                                <p class="text-sm text-gray-500"><?php echo $vehicle['category_name']; ?> • <?php echo $vehicle['year']; ?></p>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-primary"><?php echo format_currency($vehicle['daily_rate']); ?></div>
                                <div class="text-xs text-gray-500">per day</div>
                            </div>
                        </div>

                        <!-- Vehicle Specs -->
                        <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-id-card mr-2 text-primary"></i>
                                <span><?php echo $vehicle['license_plate']; ?></span>
                            </div>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-users mr-2 text-primary"></i>
                                <span><?php echo $vehicle['seats']; ?> seats</span>
                            </div>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-gas-pump mr-2 text-primary"></i>
                                <span><?php echo ucfirst($vehicle['fuel_type']); ?></span>
                            </div>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-cogs mr-2 text-primary"></i>
                                <span><?php echo ucfirst($vehicle['transmission']); ?></span>
                            </div>
                        </div>

                        <!-- Performance Metrics -->
                        <div class="bg-gray-50 rounded-lg p-3 mb-4">
                            <div class="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div class="text-lg font-bold text-dark"><?php echo $vehicle['total_bookings']; ?></div>
                                    <div class="text-xs text-gray-500">Total Bookings</div>
                                </div>
                                <div>
                                    <div class="text-lg font-bold text-dark"><?php echo format_currency($vehicle['total_revenue'] ?: 0); ?></div>
                                    <div class="text-xs text-gray-500">Total Revenue</div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex gap-2">
                            <?php if($vehicle['status'] == 'available'): ?>
                                <button class="btn btn-primary btn-sm flex-1" onclick="createBooking(<?php echo $vehicle['id']; ?>)">
                                    <i class="fas fa-calendar-plus mr-1"></i>Book
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="scheduleMaintenance(<?php echo $vehicle['id']; ?>)">
                                    <i class="fas fa-tools"></i>
                                </button>
                            <?php elseif($vehicle['status'] == 'rented'): ?>
                                <button class="btn btn-secondary btn-sm flex-1" onclick="viewCurrentBooking(<?php echo $vehicle['id']; ?>)">
                                    <i class="fas fa-eye mr-1"></i>View Booking
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="markAsReturned(<?php echo $vehicle['id']; ?>)">
                                    <i class="fas fa-undo"></i>
                                </button>
                            <?php else: ?>
                                <button class="btn btn-accent btn-sm flex-1" onclick="viewMaintenance(<?php echo $vehicle['id']; ?>)">
                                    <i class="fas fa-wrench mr-1"></i>Maintenance
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="markAsAvailable(<?php echo $vehicle['id']; ?>)">
                                    <i class="fas fa-check"></i>
                                </button>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                <?php endwhile; ?>
            </div>

            <!-- Pagination -->
            <div class="flex justify-center mt-8">
                <nav class="flex items-center gap-2">
                    <button class="btn btn-outline btn-sm">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="btn btn-primary btn-sm">1</button>
                    <button class="btn btn-outline btn-sm">2</button>
                    <button class="btn btn-outline btn-sm">3</button>
                    <button class="btn btn-outline btn-sm">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </nav>
            </div>
        </div>
    </main>
</div>

<!-- Add Vehicle Modal -->
<div id="addVehicleModal" class="modal-overlay">
    <div class="modal">
        <div class="modal-header">
            <h3 class="text-lg font-semibold">Add New Vehicle</h3>
            <button onclick="closeAddVehicleModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="addVehicleForm" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="action" value="add_vehicle">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">Make</label>
                        <input type="text" name="make" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Model</label>
                        <input type="text" name="model" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Year</label>
                        <input type="number" name="year" class="form-control" min="2000" max="2024" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">License Plate</label>
                        <input type="text" name="license_plate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select name="category_id" class="form-control" required>
                            <option value="">Select Category</option>
                            <?php foreach($categories as $category): ?>
                            <option value="<?php echo $category['id']; ?>"><?php echo $category['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <input type="text" name="color" class="form-control">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Seats</label>
                        <input type="number" name="seats" class="form-control" min="2" max="12" value="5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fuel Type</label>
                        <select name="fuel_type" class="form-control">
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="electric">Electric</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Transmission</label>
                        <select name="transmission" class="form-control">
                            <option value="manual">Manual</option>
                            <option value="automatic">Automatic</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Rate ($)</label>
                        <input type="number" name="daily_rate" class="form-control" step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Features</label>
                    <textarea name="features" class="form-control" rows="3" placeholder="Air Conditioning, Bluetooth, GPS, etc."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Vehicle Image</label>
                    <input type="file" name="vehicle_image" class="form-control" accept="image/*">
                    <div class="form-text">Upload a high-quality image of the vehicle</div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeAddVehicleModal()">Cancel</button>
            <button type="submit" form="addVehicleForm" class="btn btn-primary">Add Vehicle</button>
        </div>
    </div>
</div>

<!-- Vehicle Details Modal -->
<div id="vehicleDetailsModal" class="modal-overlay">
    <div class="modal" style="max-width: 800px;">
        <div class="modal-header">
            <h3 class="text-lg font-semibold">Vehicle Details</h3>
            <button onclick="closeVehicleDetailsModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body" id="vehicleDetailsContent">
            <!-- Content will be loaded dynamically -->
        </div>
    </div>
</div>

<script>
// Modal Functions
function openAddVehicleModal() {
    document.getElementById('addVehicleModal').classList.add('active');
}

function closeAddVehicleModal() {
    document.getElementById('addVehicleModal').classList.remove('active');
}

function closeVehicleDetailsModal() {
    document.getElementById('vehicleDetailsModal').classList.remove('active');
}

// Vehicle Management Functions
function viewVehicleDetails(vehicleId) {
    // Load vehicle details via AJAX
    fetch(`get-vehicle-details.php?id=${vehicleId}`)
        .then(response => response.text())
        .then(html => {
            document.getElementById('vehicleDetailsContent').innerHTML = html;
            document.getElementById('vehicleDetailsModal').classList.add('active');
        });
}

function editVehicle(vehicleId) {
    window.location.href = `edit-vehicle.php?id=${vehicleId}`;
}

function createBooking(vehicleId) {
    window.location.href = `create-booking.php?vehicle_id=${vehicleId}`;
}

function scheduleMaintenance(vehicleId) {
    window.location.href = `schedule-maintenance.php?vehicle_id=${vehicleId}`;
}

function viewCurrentBooking(vehicleId) {
    // Find and view current booking for this vehicle
    window.location.href = `current-booking.php?vehicle_id=${vehicleId}`;
}

function markAsReturned(vehicleId) {
    if (confirm('Mark this vehicle as returned?')) {
        updateVehicleStatus(vehicleId, 'available');
    }
}

function markAsAvailable(vehicleId) {
    if (confirm('Mark this vehicle as available?')) {
        updateVehicleStatus(vehicleId, 'available');
    }
}

function viewMaintenance(vehicleId) {
    window.location.href = `vehicle-maintenance.php?vehicle_id=${vehicleId}`;
}

function updateVehicleStatus(vehicleId, status) {
    const formData = new FormData();
    formData.append('action', 'update_status');
    formData.append('vehicle_id', vehicleId);
    formData.append('status', status);

    fetch('fleet-management.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Error updating vehicle status');
        }
    });
}

function exportFleetData() {
    window.location.href = 'export-fleet.php';
}

// Real-time updates
function updateFleetStatus() {
    // Fetch updated fleet status
    fetch('get-fleet-status.php')
        .then(response => response.json())
        .then(data => {
            // Update status indicators
            updateStatusCounts(data);
        });
}

function updateStatusCounts(data) {
    // Update the status count cards
    // This would update the numbers in real-time
}

// Update every 30 seconds
setInterval(updateFleetStatus, 30000);

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});
</script>

<?php include '../includes/footer.php'; ?>
