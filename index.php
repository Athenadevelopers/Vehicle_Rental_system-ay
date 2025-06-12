<?php
$page_title = "Home";
require_once 'config/config.php';
require_once 'config/database.php';
require_once 'classes/Vehicle.php';

try {
    // Get database connection - this will auto-setup if needed
    $database = Database::getInstance();
    $db = $database->getConnection();
    
    // Create vehicle instance and get available vehicles
    $vehicle = new Vehicle($db);
    $stmt = $vehicle->readAvailable();
    
    // Get vehicle categories for filter
    $categories_query = $db->query("SELECT id, name FROM vehicle_categories WHERE status = 'active' ORDER BY sort_order, name");
    $categories = $categories_query->fetchAll();
    
    // Get system settings
    $site_name = $database->getSetting('site_name', 'VehicleRent Pro');
    $site_description = $database->getSetting('site_description', 'Professional Vehicle Rental Management System');
    
} catch (Exception $e) {
    // Database will handle the error and show setup page if needed
    // This should not reach here due to auto-setup in Database class
    error_log("Index page error: " . $e->getMessage());
}

include 'includes/header.php';
?>

<!-- Hero Section -->
<section class="relative bg-gradient-to-r from-secondary-800 to-secondary-900 text-white overflow-hidden">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Hero Background" class="w-full h-full object-cover opacity-20">
        <div class="absolute inset-0 bg-gradient-to-r from-secondary-800/80 to-secondary-900/80"></div>
    </div>
    
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div class="absolute top-40 left-40 w-80 h-80 bg-secondary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
    
    <!-- Content -->
    <div class="container mx-auto px-4 py-24 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
                <div class="inline-flex items-center px-4 py-2 bg-primary-600/20 rounded-full text-primary-200 text-sm font-medium mb-6">
                    <i class="fas fa-star mr-2"></i>
                    #1 Vehicle Rental Platform
                </div>
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading leading-tight">
                    Find Your Perfect 
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                        Rental Vehicle
                    </span>
                </h1>
                <p class="text-xl mb-8 text-gray-300 max-w-lg leading-relaxed">
                    Choose from our premium fleet of well-maintained vehicles. Easy booking, competitive rates, and exceptional service for your next adventure.
                </p>
                
                <!-- Stats -->
                <div class="grid grid-cols-3 gap-6 mb-8">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-white">500+</div>
                        <div class="text-sm text-gray-400">Happy Customers</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-white">50+</div>
                        <div class="text-sm text-gray-400">Premium Vehicles</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-white">24/7</div>
                        <div class="text-sm text-gray-400">Support</div>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4">
                    <a href="#vehicles" class="group bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg transition font-medium flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <i class="fas fa-car-side mr-3 group-hover:scale-110 transition-transform"></i> 
                        Browse Vehicles
                    </a>
                    <a href="#how-it-works" class="group bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-lg transition font-medium flex items-center">
                        <i class="fas fa-play mr-3 group-hover:scale-110 transition-transform"></i> 
                        How It Works
                    </a>
                </div>
            </div>
            
            <div data-aos="fade-left" class="hidden lg:block">
                <!-- Enhanced Search Form Card -->
                <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-gray-800 border border-white/20">
                    <div class="flex items-center mb-6">
                        <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                            <i class="fas fa-search text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-secondary-800">Quick Search</h3>
                            <p class="text-gray-600">Find your perfect vehicle</p>
                        </div>
                    </div>
                    
                    <form action="vehicles.php" method="GET" class="space-y-6">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="pickup_date" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-calendar-alt mr-2 text-primary-600"></i>Pickup Date
                                </label>
                                <input type="date" 
                                       id="pickup_date" 
                                       name="pickup_date" 
                                       min="<?php echo date('Y-m-d'); ?>" 
                                       value="<?php echo date('Y-m-d'); ?>"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" 
                                       required>
                            </div>
                            
                            <div>
                                <label for="return_date" class="block text-sm font-medium text-gray-700 mb-2">
                                    <i class="fas fa-calendar-check mr-2 text-primary-600"></i>Return Date
                                </label>
                                <input type="date" 
                                       id="return_date" 
                                       name="return_date" 
                                       min="<?php echo date('Y-m-d', strtotime('+1 day')); ?>"
                                       value="<?php echo date('Y-m-d', strtotime('+3 days')); ?>"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition" 
                                       required>
                            </div>
                        </div>
                        
                        <div>
                            <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-car mr-2 text-primary-600"></i>Vehicle Type
                            </label>
                            <select id="category" 
                                    name="category" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition">
                                <option value="">All Vehicle Types</option>
                                <?php if (isset($categories)): ?>
                                    <?php foreach($categories as $category): ?>
                                        <option value="<?php echo $category['id']; ?>"><?php echo $category['name']; ?></option>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </select>
                        </div>
                        
                        <div>
                            <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-map-marker-alt mr-2 text-primary-600"></i>Pickup Location
                            </label>
                            <select id="location" 
                                    name="location" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition">
                                <option value="">Select Location</option>
                                <option value="downtown">Downtown Office</option>
                                <option value="airport">Airport Terminal</option>
                                <option value="hotel">Hotel Pickup</option>
                                <option value="custom">Custom Location</option>
                            </select>
                        </div>
                        
                        <button type="submit" 
                                class="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-4 rounded-lg transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center">
                            <i class="fas fa-search mr-3"></i> 
                            Search Available Vehicles
                        </button>
                    </form>
                    
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <div class="flex items-center justify-between text-sm text-gray-600">
                            <span class="flex items-center">
                                <i class="fas fa-shield-alt text-green-500 mr-2"></i>
                                Secure Booking
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-clock text-blue-500 mr-2"></i>
                                Instant Confirmation
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Wave Divider -->
    <div class="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" class="w-full h-auto">
            <path fill="#f9fafb" fill-opacity="1" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
    </div>
</section>

<!-- Auto-setup notification (only shown if database was just created) -->
<?php if (isset($_GET['setup']) && $_GET['setup'] === 'complete'): ?>
<div class="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
    <div class="flex">
        <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-400"></i>
        </div>
        <div class="ml-3">
            <p class="text-sm text-green-700">
                <strong>System Ready!</strong> Database has been automatically configured. You can now start using VehicleRent Pro.
                <a href="login.php" class="underline font-medium">Login as admin</a> or continue browsing vehicles.
            </p>
        </div>
    </div>
</div>
<?php endif; ?>

<!-- Features Section -->
<section id="features" class="py-20 bg-gray-50">
    <div class="container mx-auto px-4">
        <div class="text-center mb-16">
            <div class="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full text-primary-800 text-sm font-medium mb-4">
                <i class="fas fa-award mr-2"></i>
                Why Choose Us
            </div>
            <h2 class="text-4xl md:text-5xl font-bold mb-6 text-secondary-800 font-heading" data-aos="fade-up">
                Premium Vehicle Rental Experience
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                We offer the best vehicle rental experience with premium services, competitive pricing, and unmatched customer satisfaction
            </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Feature 1 -->
            <div class="group bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 hover:border-primary-200" data-aos="fade-up" data-aos-delay="200">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-car-side text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-4 text-secondary-800 group-hover:text-primary-600 transition-colors">Premium Fleet</h3>
                <p class="text-gray-600 leading-relaxed">
                    Choose from our diverse collection of well-maintained, premium vehicles for any occasion or journey
                </p>
                <div class="mt-4 text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn More <i class="fas fa-arrow-right ml-2"></i>
                </div>
            </div>
            
            <!-- Feature 2 -->
            <div class="group bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 hover:border-primary-200" data-aos="fade-up" data-aos-delay="300">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-dollar-sign text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-4 text-secondary-800 group-hover:text-primary-600 transition-colors">Best Rates</h3>
                <p class="text-gray-600 leading-relaxed">
                    Competitive pricing with transparent costs, no hidden fees, and special discounts for loyal customers
                </p>
                <div class="mt-4 text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Pricing <i class="fas fa-arrow-right ml-2"></i>
                </div>
            </div>
            
            <!-- Feature 3 -->
            <div class="group bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 hover:border-primary-200" data-aos="fade-up" data-aos-delay="400">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-headset text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-4 text-secondary-800 group-hover:text-primary-600 transition-colors">24/7 Support</h3>
                <p class="text-gray-600 leading-relaxed">
                    Our dedicated customer service team is available around the clock to assist you with any needs
                </p>
                <div class="mt-4 text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Contact Support <i class="fas fa-arrow-right ml-2"></i>
                </div>
            </div>
            
            <!-- Feature 4 -->
            <div class="group bg-white p-8 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 hover:border-primary-200" data-aos="fade-up" data-aos-delay="500">
                <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas fa-shield-alt text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-4 text-secondary-800 group-hover:text-primary-600 transition-colors">Safe & Secure</h3>
                <p class="text-gray-600 leading-relaxed">
                    All vehicles are regularly maintained, sanitized, and insured for your safety and peace of mind
                </p>
                <div class="mt-4 text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Safety Info <i class="fas fa-arrow-right ml-2"></i>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Featured Vehicles Section -->
<section id="vehicles" class="py-20 bg-white">
    <div class="container mx-auto px-4">
        <div class="text-center mb-16">
            <div class="inline-flex items-center px-4 py-2 bg-accent-100 rounded-full text-accent-800 text-sm font-medium mb-4">
                <i class="fas fa-star mr-2"></i>
                Featured Collection
            </div>
            <h2 class="text-4xl md:text-5xl font-bold mb-6 text-secondary-800 font-heading" data-aos="fade-up">
                Our Premium Vehicle Fleet
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                Explore our carefully curated selection of top-rated vehicles, each maintained to the highest standards
            </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <?php 
            if (isset($stmt)):
                $delay = 200;
                $count = 0;
                while($row = $stmt->fetch(PDO::FETCH_ASSOC) && $count < 6): 
                    $count++;
            ?>
            <div class="group bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-300" 
                 data-aos="fade-up" 
                 data-aos-delay="<?php echo $delay; ?>"
                 data-category="<?php echo $row['category_id']; ?>"
                 data-price="<?php echo $row['daily_rate']; ?>"
                 data-transmission="<?php echo $row['transmission']; ?>"
                 data-fuel-type="<?php echo $row['fuel_type']; ?>">
                
                <!-- Image Container -->
                <div class="relative overflow-hidden">
                    <img src="<?php echo $row['image_url'] ?: 'https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'; ?>" 
                         alt="<?php echo $row['make'] . ' ' . $row['model']; ?>" 
                         class="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500">
                    
                    <!-- Status Badge -->
                    <div class="absolute top-4 right-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                            Available
                        </span>
                    </div>
                    
                    <!-- Category Badge -->
                    <div class="absolute top-4 left-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
                            <?php echo isset($row['category_name']) ? $row['category_name'] : 'Vehicle'; ?>
                        </span>
                    </div>
                    
                    <!-- Favorite Button -->
                    <button class="absolute bottom-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                
                <!-- Card Content -->
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-secondary-800 group-hover:text-primary-600 transition-colors">
                                <?php echo $row['make'] . ' ' . $row['model']; ?>
                            </h3>
                            <p class="text-sm text-gray-500 mt-1"><?php echo $row['year']; ?> Model</p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-primary-600"><?php echo format_currency($row['daily_rate']); ?></div>
                            <div class="text-xs text-gray-500">per day</div>
                        </div>
                    </div>
                    
                    <!-- Vehicle Specs -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-users text-primary-600 text-xs"></i>
                            </div>
                            <span><?php echo $row['seats']; ?> Seats</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-gas-pump text-primary-600 text-xs"></i>
                            </div>
                            <span><?php echo ucfirst($row['fuel_type']); ?></span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-cogs text-primary-600 text-xs"></i>
                            </div>
                            <span><?php echo ucfirst($row['transmission']); ?></span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-star text-primary-600 text-xs"></i>
                            </div>
                            <span>4.8 Rating</span>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex gap-3">
                        <?php if(is_logged_in() && is_customer()): ?>
                            <a href="book-vehicle.php?id=<?php echo $row['id']; ?>" 
                               class="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg transition text-center font-medium group-hover:shadow-lg transform group-hover:-translate-y-1">
                                <i class="fas fa-calendar-check mr-2"></i>Book Now
                            </a>
                        <?php else: ?>
                            <a href="login.php" 
                               class="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg transition text-center font-medium group-hover:shadow-lg transform group-hover:-translate-y-1">
                                <i class="fas fa-sign-in-alt mr-2"></i>Login to Book
                            </a>
                        <?php endif; ?>
                        <button class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-3 rounded-lg transition flex items-center justify-center" 
                                onclick="viewVehicleDetails(<?php echo $row['id']; ?>)"
                                title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
            <?php 
                $delay += 100;
                if($delay > 600) $delay = 200; // Reset delay
                endwhile; 
            else:
            ?>
            <div class="col-span-full text-center py-16">
                <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-car text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No Vehicles Available</h3>
                <p class="text-gray-500 mb-6">Our fleet is being prepared. Please check back soon!</p>
                <?php if(is_admin()): ?>
                <a href="admin/fleet-management.php" class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                    <i class="fas fa-plus mr-2"></i>Add Vehicles
                </a>
                <?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
        
        <!-- View All Button -->
        <div class="text-center mt-12" data-aos="fade-up">
            <a href="vehicles.php" class="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <i class="fas fa-th-large mr-3"></i> 
                View All Vehicles
                <i class="fas fa-arrow-right ml-3"></i>
            </a>
        </div>
    </div>
</section>

<!-- How It Works Section -->
<section id="how-it-works" class="py-20 bg-gradient-to-br from-primary-50 to-accent-50">
    <div class="container mx-auto px-4">
        <div class="text-center mb-16">
            <div class="inline-flex items-center px-4 py-2 bg-white rounded-full text-primary-800 text-sm font-medium mb-4 shadow-sm">
                <i class="fas fa-route mr-2"></i>
                Simple Process
            </div>
            <h2 class="text-4xl md:text-5xl font-bold mb-6 text-secondary-800 font-heading" data-aos="fade-up">
                How It Works
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="100">
                Rent a vehicle in just a few simple steps. Quick, easy, and hassle-free process.
            </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Step 1 -->
            <div class="text-center" data-aos="fade-up" data-aos-delay="200">
                <div class="relative mb-6">
                    <div class="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <i class="fas fa-search text-white text-2xl"></i>
                    </div>
                    <div class="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                </div>
                <h3 class="text-xl font-bold mb-3 text-secondary-800">Search & Select</h3>
                <p class="text-gray-600">Browse our fleet and choose the perfect vehicle for your needs</p>
            </div>
            
            <!-- Step 2 -->
            <div class="text-center" data-aos="fade-up" data-aos-delay="300">
                <div class="relative mb-6">
                    <div class="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <i class="fas fa-calendar-alt text-white text-2xl"></i>
                    </div>
                    <div class="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                </div>
                <h3 class="text-xl font-bold mb-3 text-secondary-800">Book Online</h3>
                <p class="text-gray-600">Select your dates and complete the booking with instant confirmation</p>
            </div>
            
            <!-- Step 3 -->
            <div class="text-center" data-aos="fade-up" data-aos-delay="400">
                <div class="relative mb-6">
                    <div class="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <i class="fas fa-credit-card text-white text-2xl"></i>
                    </div>
                    <div class="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                </div>
                <h3 class="text-xl font-bold mb-3 text-secondary-800">Secure Payment</h3>
                <p class="text-gray-600">Pay securely online or at pickup with multiple payment options</p>
            </div>
            
            <!-- Step 4 -->
            <div class="text-center" data-aos="fade-up" data-aos-delay="500">
                <div class="relative mb-6">
                    <div class="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <i class="fas fa-key text-white text-2xl"></i>
                    </div>
                    <div class="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                </div>
                <h3 class="text-xl font-bold mb-3 text-secondary-800">Pick Up & Go</h3>
                <p class="text-gray-600">Collect your vehicle and start your journey with confidence</p>
            </div>
        </div>
        
        <div class="text-center mt-12" data-aos="fade-up" data-aos-delay="600">
            <a href="register.php" class="inline-flex items-center bg-accent-600 hover:bg-accent-700 text-white px-8 py-4 rounded-lg transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <i class="fas fa-user-plus mr-3"></i> 
                Get Started Today
            </a>
        </div>
    </div>
</section>

<script>
// Enhanced search form functionality
document.addEventListener('DOMContentLoaded', function() {
    const pickupDate = document.getElementById('pickup_date');
    const returnDate = document.getElementById('return_date');
    
    if (pickupDate && returnDate) {
        pickupDate.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            returnDate.min = nextDay.toISOString().split('T')[0];
            
            if (returnDate.value && new Date(returnDate.value) <= selectedDate) {
                returnDate.value = nextDay.toISOString().split('T')[0];
            }
        });
    }
});

// Vehicle details modal
function viewVehicleDetails(vehicleId) {
    // You can implement a modal or redirect to vehicle details page
    window.location.href = `vehicle-details.php?id=${vehicleId}`;
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation classes for blob animation
const style = document.createElement('style');
style.textContent = `
    @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
        animation: blob 7s infinite;
    }
    .animation-delay-2000 {
        animation-delay: 2s;
    }
    .animation-delay-4000 {
        animation-delay: 4s;
    }
`;
document.head.appendChild(style);
</script>

<?php include 'includes/footer.php'; ?>
