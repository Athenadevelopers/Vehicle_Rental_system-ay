</main>

    <!-- Footer -->
    <footer class="bg-secondary-800 text-white mt-16">
        <div class="container mx-auto px-4">
            <!-- Footer Top -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                <!-- Company Info -->
                <div>
                    <div class="flex items-center space-x-2 mb-4">
                        <div class="bg-primary-600 text-white p-2 rounded-lg">
                            <i class="fas fa-car-side"></i>
                        </div>
                        <span class="text-xl font-bold text-white font-heading">VehicleRent<span class="text-accent-500">Pro</span></span>
                    </div>
                    <p class="text-gray-300 mb-4">Your premium vehicle rental service. Quality vehicles for all your needs with exceptional customer service.</p>
                    <div class="flex space-x-4">
                        <a href="#" class="text-gray-300 hover:text-white transition">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-white transition">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-white transition">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-white transition">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                    </div>
                </div>
                
                <!-- Quick Links -->
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-white">Quick Links</h3>
                    <ul class="space-y-2">
                        <li><a href="<?php echo SITE_URL; ?>/index.php" class="text-gray-300 hover:text-white transition">Home</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/vehicles.php" class="text-gray-300 hover:text-white transition">Vehicles</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/about.php" class="text-gray-300 hover:text-white transition">About Us</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/contact.php" class="text-gray-300 hover:text-white transition">Contact</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/terms.php" class="text-gray-300 hover:text-white transition">Terms & Conditions</a></li>
                        <li><a href="<?php echo SITE_URL; ?>/privacy.php" class="text-gray-300 hover:text-white transition">Privacy Policy</a></li>
                    </ul>
                </div>
                
                <!-- Contact Info -->
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-white">Contact Us</h3>
                    <ul class="space-y-3">
                        <li class="flex items-start">
                            <i class="fas fa-map-marker-alt mt-1 mr-3 text-primary-500"></i>
                            <span class="text-gray-300">123 Main Street, City, State 12345</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-phone-alt mr-3 text-primary-500"></i>
                            <span class="text-gray-300">+1 (555) 123-4567</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-envelope mr-3 text-primary-500"></i>
                            <span class="text-gray-300">info@vehiclerentpro.com</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-clock mr-3 text-primary-500"></i>
                            <span class="text-gray-300">Mon-Fri: 9AM - 6PM</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Newsletter -->
                <div>
                    <h3 class="text-lg font-semibold mb-4 text-white">Newsletter</h3>
                    <p class="text-gray-300 mb-4">Subscribe to our newsletter for updates and promotions.</p>
                    <form action="#" method="POST" class="space-y-2">
                        <div>
                            <input type="email" name="email" placeholder="Your email address" class="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                        </div>
                        <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition w-full">Subscribe</button>
                    </form>
                </div>
            </div>
            
            <!-- Footer Bottom -->
            <div class="py-4 border-t border-gray-700 text-center text-gray-400">
                <p>&copy; <?php echo date('Y'); ?> VehicleRentPro. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Back to Top Button -->
    <button id="back-to-top" class="fixed bottom-6 right-6 bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 invisible transition-all duration-300">
        <i class="fas fa-chevron-up"></i>
    </button>

    <!-- Scripts -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="<?php echo SITE_URL; ?>/assets/js/main.js"></script>
    
    <script>
        // Initialize AOS
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
        
        // Preloader
        window.addEventListener('load', function() {
            const preloader = document.getElementById('preloader');
            setTimeout(() => {
                preloader.classList.add('opacity-0');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 300);
            }, 500);
        });
        
        // Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const closeMobileMenu = document.getElementById('close-mobile-menu');
        
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('translate-x-full');
            mobileMenuOverlay.classList.toggle('hidden');
            document.body.classList.toggle('overflow-hidden');
        });
        
        closeMobileMenu.addEventListener('click', function() {
            mobileMenu.classList.add('translate-x-full');
            mobileMenuOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
        
        mobileMenuOverlay.addEventListener('click', function() {
            mobileMenu.classList.add('translate-x-full');
            mobileMenuOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        });
        
        // Back to Top Button
        const backToTopButton = document.getElementById('back-to-top');
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.remove('opacity-0', 'invisible');
                backToTopButton.classList.add('opacity-100', 'visible');
            } else {
                backToTopButton.classList.add('opacity-0', 'invisible');
                backToTopButton.classList.remove('opacity-100', 'visible');
            }
        });
        
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Close alert messages
        document.querySelectorAll('.close-alert').forEach(button => {
            button.addEventListener('click', function() {
                this.closest('[role="alert"]').remove();
            });
        });
    </script>
    
    <?php if(isset($extra_js)): echo $extra_js; endif; ?>
</body>
</html>
