<?php require_once __DIR__ . '/../config/config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' . SITE_NAME : SITE_NAME; ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="<?php echo SITE_URL; ?>/assets/images/favicon.png">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            200: '#bae6fd',
                            300: '#7dd3fc',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            700: '#0369a1',
                            800: '#075985',
                            900: '#0c4a6e',
                        },
                        secondary: {
                            50: '#f8fafc',
                            100: '#f1f5f9',
                            200: '#e2e8f0',
                            300: '#cbd5e1',
                            400: '#94a3b8',
                            500: '#64748b',
                            600: '#475569',
                            700: '#334155',
                            800: '#1e293b',
                            900: '#0f172a',
                        },
                        accent: {
                            50: '#ecfdf5',
                            100: '#d1fae5',
                            200: '#a7f3d0',
                            300: '#6ee7b7',
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                            800: '#065f46',
                            900: '#064e3b',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Poppins', 'sans-serif']
                    },
                    boxShadow: {
                        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    }
                }
            }
        }
    </script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- AOS Animation Library -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/style.css">
    
    <?php if(isset($extra_css)): echo $extra_css; endif; ?>
</head>
<body class="bg-gray-50 font-sans text-gray-800 antialiased">
    <!-- Preloader -->
    <div id="preloader" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>

    <!-- Mobile Menu -->
    <div id="mobile-menu" class="fixed top-0 right-0 w-64 h-full bg-white z-50 transform translate-x-full transition-transform duration-300 ease-in-out shadow-lg overflow-y-auto">
        <div class="p-4 border-b">
            <div class="flex items-center justify-between">
                <div class="text-xl font-bold text-primary-600">
                    <i class="fas fa-car-side"></i> VehicleRent
                </div>
                <button id="close-mobile-menu" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <nav class="p-4">
            <ul class="space-y-2">
                <li><a href="<?php echo SITE_URL; ?>/index.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Home</a></li>
                <li><a href="<?php echo SITE_URL; ?>/vehicles.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Vehicles</a></li>
                <li><a href="<?php echo SITE_URL; ?>/about.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">About Us</a></li>
                <li><a href="<?php echo SITE_URL; ?>/contact.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Contact</a></li>
                <?php if(is_logged_in()): ?>
                    <?php if(is_admin()): ?>
                        <li><a href="<?php echo SITE_URL; ?>/admin/dashboard.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Admin Dashboard</a></li>
                    <?php else: ?>
                        <li><a href="<?php echo SITE_URL; ?>/customer/dashboard.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">My Dashboard</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/customer/bookings.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">My Bookings</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/customer/profile.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">My Profile</a></li>
                    <?php endif; ?>
                    <li><a href="<?php echo SITE_URL; ?>/logout.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Logout</a></li>
                <?php else: ?>
                    <li><a href="<?php echo SITE_URL; ?>/login.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Login</a></li>
                    <li><a href="<?php echo SITE_URL; ?>/register.php" class="block py-2 px-4 hover:bg-gray-100 rounded-md transition">Register</a></li>
                <?php endif; ?>
            </ul>
        </nav>
    </div>

    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-30">
        <div class="container mx-auto px-4">
            <div class="flex justify-between items-center py-4">
                <!-- Logo -->
                <a href="<?php echo SITE_URL; ?>/index.php" class="flex items-center space-x-2">
                    <div class="bg-primary-600 text-white p-2 rounded-lg">
                        <i class="fas fa-car-side"></i>
                    </div>
                    <span class="text-xl font-bold text-primary-600 font-heading">VehicleRent<span class="text-accent-500">Pro</span></span>
                </a>
                
                <!-- Desktop Navigation -->
                <nav class="hidden md:flex items-center space-x-6">
                    <a href="<?php echo SITE_URL; ?>/index.php" class="text-gray-700 hover:text-primary-600 transition">Home</a>
                    <a href="<?php echo SITE_URL; ?>/vehicles.php" class="text-gray-700 hover:text-primary-600 transition">Vehicles</a>
                    <a href="<?php echo SITE_URL; ?>/about.php" class="text-gray-700 hover:text-primary-600 transition">About Us</a>
                    <a href="<?php echo SITE_URL; ?>/contact.php" class="text-gray-700 hover:text-primary-600 transition">Contact</a>
                </nav>
                
                <!-- User Actions -->
                <div class="flex items-center space-x-4">
                    <?php if(is_logged_in()): ?>
                        <div class="hidden md:block relative group">
                            <button class="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition">
                                <i class="fas fa-user-circle"></i>
                                <span><?php echo $_SESSION['username']; ?></span>
                                <i class="fas fa-chevron-down text-xs"></i>
                            </button>
                            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
                                <?php if(is_admin()): ?>
                                    <a href="<?php echo SITE_URL; ?>/admin/dashboard.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</a>
                                <?php else: ?>
                                    <a href="<?php echo SITE_URL; ?>/customer/dashboard.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Dashboard</a>
                                    <a href="<?php echo SITE_URL; ?>/customer/bookings.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Bookings</a>
                                    <a href="<?php echo SITE_URL; ?>/customer/profile.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</a>
                                <?php endif; ?>
                                <div class="border-t border-gray-100"></div>
                                <a href="<?php echo SITE_URL; ?>/logout.php" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
                            </div>
                        </div>
                    <?php else: ?>
                        <a href="<?php echo SITE_URL; ?>/login.php" class="hidden md:block text-gray-700 hover:text-primary-600 transition">Login</a>
                        <a href="<?php echo SITE_URL; ?>/register.php" class="hidden md:block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition">Register</a>
                    <?php endif; ?>
                    
                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-button" class="md:hidden text-gray-700 hover:text-primary-600">
                        <i class="fas fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Flash Messages -->
    <?php if(isset($_SESSION['flash_message'])): ?>
    <div class="container mx-auto px-4 mt-4">
        <div class="bg-<?php echo $_SESSION['flash_message']['type'] == 'success' ? 'green' : ($_SESSION['flash_message']['type'] == 'warning' ? 'yellow' : 'red'); ?>-100 border-l-4 border-<?php echo $_SESSION['flash_message']['type'] == 'success' ? 'green' : ($_SESSION['flash_message']['type'] == 'warning' ? 'yellow' : 'red'); ?>-500 text-<?php echo $_SESSION['flash_message']['type'] == 'success' ? 'green' : ($_SESSION['flash_message']['type'] == 'warning' ? 'yellow' : 'red'); ?>-700 p-4 rounded-md" role="alert">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-<?php echo $_SESSION['flash_message']['type'] == 'success' ? 'check-circle' : ($_SESSION['flash_message']['type'] == 'warning' ? 'exclamation-triangle' : 'times-circle'); ?> mr-2"></i>
                </div>
                <div>
                    <?php echo $_SESSION['flash_message']['message']; ?>
                </div>
                <button type="button" class="ml-auto close-alert">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
    <?php unset($_SESSION['flash_message']); ?>
    <?php endif; ?>

    <!-- Main Content -->
    <main>
