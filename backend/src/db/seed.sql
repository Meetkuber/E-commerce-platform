-- =============================================
-- Seed Data for E-Commerce Platform
-- =============================================

USE ecommerce_platform;

-- =============================================
-- Insert Admin User (password: SuperAdmin@123)
-- =============================================
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'admin@marketplace.com', '$2a$10$dPm74.n5R5pWXP/8GiGtm.zC0ovs/hYE.RfKDd3S.l2Zm.4c0bL82', 'admin');

-- =============================================
-- Insert Demo Vendors
-- =============================================
INSERT INTO users (name, email, password, role) VALUES
('TechHub Store', 'techhub@marketplace.com', '$2a$10$8KzQ5x5G5Z5Z5Z5Z5Z5Z5OqX5X5X5X5X5X5X5X5X5X5X5X5X5X5X5', 'vendor'),
('GadgetWorld', 'gadgetworld@marketplace.com', '$2a$10$8KzQ5x5G5Z5Z5Z5Z5Z5Z5OqX5X5X5X5X5X5X5X5X5X5X5X5X5X5X5', 'vendor'),
('StyleTech', 'styletech@marketplace.com', '$2a$10$8KzQ5x5G5Z5Z5Z5Z5Z5Z5OqX5X5X5X5X5X5X5X5X5X5X5X5X5X5X5', 'vendor');

INSERT INTO vendors (user_id, store_name, description, is_verified) VALUES
(2, 'TechHub Store', 'Premium laptops and computing accessories for professionals and gamers.', TRUE),
(3, 'GadgetWorld', 'Latest smartphones and mobile accessories at unbeatable prices.', TRUE),
(4, 'StyleTech', 'Stylish wearable tech and audio gear for the modern lifestyle.', TRUE);

-- =============================================
-- Insert Demo Customer
-- =============================================
INSERT INTO users (name, email, password, role) VALUES
('John Doe', 'john@example.com', '$2a$10$8KzQ5x5G5Z5Z5Z5Z5Z5Z5OqX5X5X5X5X5X5X5X5X5X5X5X5X5X5X5', 'customer');

-- =============================================
-- Insert Categories
-- =============================================
INSERT INTO categories (name, slug, icon) VALUES
('Laptops', 'laptops', 'bi-laptop'),
('Smartphones', 'smartphones', 'bi-phone'),
('Headphones', 'headphones', 'bi-headphones'),
('Accessories', 'accessories', 'bi-mouse'),
('Tablets', 'tablets', 'bi-tablet'),
('Smartwatches', 'smartwatches', 'bi-smartwatch'),
('Gaming', 'gaming', 'bi-controller'),
('Cameras', 'cameras', 'bi-camera');

-- =============================================
-- Products — TechHub Store (vendor_id = 1)
-- =============================================
INSERT INTO products (vendor_id, category_id, name, slug, description, price, compare_price, stock, image, rating, review_count, features) VALUES
(1, 1, 'Macbook Ultra 15', 'macbook-ultra-15',
 'Ultra-thin 15.6" laptop with Intel i7 13th Gen, 16GB RAM, 512GB SSD, and stunning 2K IPS display. Perfect for professionals who demand power and portability.',
 79999.00, 94999.00, 25, '/uploads/products/laptop1.jpg', 4.5, 128,
 '[\"Intel Core i7-13700H\", \"16GB DDR5 RAM\", \"512GB NVMe SSD\", \"15.6 inch 2K IPS Display\", \"Backlit Keyboard\", \"Fingerprint Reader\"]'),

(1, 1, 'new RTX Pro', 'gameforce-rtx-pro',
 'Ultimate gaming laptop with RTX 4070, Intel i9, 32GB RAM, 1TB SSD, 144Hz display, and RGB keyboard. Dominate every game.',
 149999.00, 179999.00, 10, '/uploads/products/laptop2.jpg', 4.8, 89,
 '[\"Intel Core i9-13900H\", \"32GB DDR5 RAM\", \"1TB NVMe SSD\", \"RTX 4070 8GB\", \"16 inch 144Hz QHD Display\", \"Per-key RGB Keyboard\"]'),

(1, 1, 'ZenBook Creator 14', 'zenbook-creator-14',
 'Ultra-premium 14 inch OLED creator laptop with Intel i7, 32GB RAM, 1TB SSD, and color-accurate 4K display. Built for content creators and designers.',
 119999.00, 139999.00, 15, '/uploads/products/laptop3.jpg', 4.7, 201,
 '[\"Intel Core i7-13700H\", \"32GB DDR5 RAM\", \"1TB NVMe SSD\", \"14 inch 4K OLED Touch\", \"Thunderbolt 4\", \"AI Noise Cancellation\"]'),

(1, 1, 'SwiftEdge Budget Laptop', 'swiftedge-budget-laptop',
 'Affordable 15.6 inch laptop with Ryzen 5, 8GB RAM, 256GB SSD. Perfect for students and everyday tasks at an unbeatable price.',
 34999.00, 42999.00, 60, '/uploads/products/laptop4.jpg', 4.0, 432,
 '[\"AMD Ryzen 5 7520U\", \"8GB DDR4 RAM\", \"256GB NVMe SSD\", \"15.6 inch FHD IPS\", \"Wi-Fi 6\", \"720p Webcam\"]'),

(1, 4, 'ErgoType Mechanical Keyboard', 'ergotype-mechanical-keyboard',
 'Premium mechanical keyboard with Cherry MX switches, RGB backlighting, USB-C connectivity, and aircraft-grade aluminum frame.',
 5999.00, 7999.00, 50, '/uploads/products/keyboard1.jpg', 4.3, 256,
 '[\"Cherry MX Brown Switches\", \"Per-key RGB Lighting\", \"USB-C Detachable Cable\", \"Aluminum Frame\", \"PBT Keycaps\", \"N-Key Rollover\"]'),

(1, 4, 'UltraCharge 100W GaN Charger', 'ultracharge-100w-gan',
 'Compact 100W GaN charger with 4 ports. Charges laptop, phone, tablet, and watch simultaneously. Travel-ready design.',
 3999.00, 5499.00, 120, '/uploads/products/charger1.jpg', 4.5, 678,
 '[\"100W Total Output\", \"2x USB-C + 2x USB-A\", \"GaN Technology\", \"Universal Compatibility\", \"Foldable Prongs\", \"LED Indicator\"]'),

(1, 4, 'AirStream Laptop Cooling Pad', 'airstream-cooling-pad',
 'Professional laptop cooling pad with 6 fans, adjustable height, RGB lighting, and USB hub. Keeps your laptop running cool under heavy load.',
 2499.00, 3499.00, 80, '/uploads/products/cooling-pad1.jpg', 4.2, 189,
 '[\"6 Quiet Fans\", \"Adjustable Height (5 Levels)\", \"RGB LED Lighting\", \"2x USB Hub\", \"Fits 12-17 inch Laptops\", \"Anti-Slip Surface\"]'),

(1, 7, 'ProGamer Mouse X1', 'progamer-mouse-x1',
 'Professional gaming mouse with 25600 DPI sensor, 1ms response, 70-hour battery, and customizable RGB lighting.',
 3499.00, 4999.00, 75, '/uploads/products/mouse1.jpg', 4.6, 334,
 '[\"25600 DPI Optical Sensor\", \"1ms Wireless Response\", \"70-Hour Battery\", \"Lightweight 63g Design\", \"Customizable RGB\", \"5 Programmable Buttons\"]'),

(1, 7, 'ThunderStrike Gaming Headset', 'thunderstrike-gaming-headset',
 'Immersive 7.1 surround sound gaming headset with detachable mic, RGB lighting, and ultra-comfortable memory foam cushions.',
 4999.00, 6999.00, 45, '/uploads/products/gaming-headset1.jpg', 4.4, 312,
 '[\"7.1 Virtual Surround Sound\", \"50mm Neodymium Drivers\", \"Detachable Boom Mic\", \"RGB Lighting\", \"Memory Foam Pads\", \"USB + 3.5mm\"]'),

(1, 7, 'NexPad Elite Controller', 'nexpad-elite-controller',
 'Premium wireless gamepad with Hall effect joysticks, adaptive triggers, and customizable back buttons. Works with PC, Android, and Switch.',
 5499.00, 7999.00, 35, '/uploads/products/controller1.jpg', 4.6, 267,
 '[\"Hall Effect Joysticks\", \"Adaptive Triggers\", \"4 Back Buttons\", \"Bluetooth 5.2 + 2.4G\", \"20-Hour Battery\", \"PC/Android/Switch\"]');

-- =============================================
-- Products — GadgetWorld (vendor_id = 2)
-- =============================================
INSERT INTO products (vendor_id, category_id, name, slug, description, price, compare_price, stock, image, rating, review_count, features) VALUES
(2, 2, 'NexPhone 15 Pro Max', 'nexphone-15-pro-max',
 'Flagship smartphone with 6.7 inch Super AMOLED display, 200MP camera, Snapdragon 8 Gen 3, 12GB RAM, and 5000mAh battery with 120W charging.',
 89999.00, 99999.00, 30, '/uploads/products/phone1.jpg', 4.7, 342,
 '[\"Snapdragon 8 Gen 3\", \"12GB RAM + 256GB Storage\", \"200MP Triple Camera\", \"6.7 inch Super AMOLED 120Hz\", \"5000mAh Battery\", \"120W Fast Charging\"]'),

(2, 2, 'BudgetKing A55', 'budgetking-a55',
 'Best value smartphone with 6.5 inch AMOLED display, 64MP camera, 5000mAh battery, and clean Android experience. All essentials at an unbeatable price.',
 12999.00, 16999.00, 100, '/uploads/products/phone2.jpg', 4.2, 567,
 '[\"MediaTek Dimensity 7050\", \"6GB RAM + 128GB Storage\", \"64MP Dual Camera\", \"6.5 inch AMOLED 90Hz\", \"5000mAh Battery\", \"33W Fast Charging\"]'),

(2, 2, 'PixelMax 8 Pro', 'pixelmax-8-pro',
 'Camera-first smartphone with 108MP quad camera, 6.6 inch AMOLED, Dimensity 9200, 8GB RAM, and AI-powered photography features.',
 49999.00, 59999.00, 40, '/uploads/products/phone3.jpg', 4.5, 423,
 '[\"Dimensity 9200\", \"8GB RAM + 256GB Storage\", \"108MP Quad Camera\", \"6.6 inch AMOLED 120Hz\", \"4800mAh Battery\", \"67W Fast Charging\"]'),

(2, 2, 'MiniPhone SE', 'miniphone-se',
 'Compact powerhouse with 6.1 inch display, A16 chip, 48MP camera, and all-day battery. Premium experience in a pocket-friendly size.',
 54999.00, 62999.00, 50, '/uploads/products/phone4.jpg', 4.4, 556,
 '[\"A16 Bionic Chip\", \"6GB RAM + 128GB Storage\", \"48MP Camera\", \"6.1 inch Super Retina XDR\", \"Ceramic Shield\", \"MagSafe Compatible\"]'),

(2, 5, 'TabPro 12.4', 'tabpro-12-4',
 'Professional tablet with 12.4 inch 2K display, S-Pen support, Snapdragon 8 Gen 2, 8GB RAM, ideal for artists and professionals.',
 54999.00, 64999.00, 15, '/uploads/products/tablet1.jpg', 4.6, 178,
 '[\"Snapdragon 8 Gen 2\", \"8GB RAM + 256GB Storage\", \"12.4 inch 2K Super AMOLED\", \"S-Pen Included\", \"10090mAh Battery\", \"Quad Speakers with Dolby Atmos\"]'),

(2, 5, 'TabLite 10.1', 'tablite-10-1',
 'Lightweight 10.1 inch tablet perfect for entertainment and casual use. Metal body, stereo speakers, and 12-hour battery life.',
 18999.00, 24999.00, 70, '/uploads/products/tablet2.jpg', 4.1, 334,
 '[\"Unisoc T616\", \"4GB RAM + 64GB Storage\", \"10.1 inch FHD IPS\", \"Stereo Speakers\", \"7040mAh Battery\", \"Metal Unibody\"]'),

(2, 4, 'NexDock USB-C Hub 11-in-1', 'nexdock-usb-c-hub',
 'All-in-one USB-C hub with HDMI 4K, triple display support, SD card reader, Ethernet, and 100W power delivery.',
 4499.00, 6999.00, 55, '/uploads/products/hub1.jpg', 4.3, 445,
 '[\"HDMI 4K@60Hz\", \"Triple Display Support\", \"SD + MicroSD Reader\", \"Gigabit Ethernet\", \"100W PD Passthrough\", \"3x USB 3.0\"]'),

(2, 4, 'PowerBank Titan 20000', 'powerbank-titan-20000',
 'High-capacity 20000mAh power bank with 65W PD output, laptop charging support, and OLED display showing battery percentage.',
 3299.00, 4499.00, 90, '/uploads/products/powerbank1.jpg', 4.4, 721,
 '[\"20000mAh Capacity\", \"65W PD Output\", \"Charges Laptops\", \"OLED Display\", \"3 Ports (2xUSB-C, 1xUSB-A)\", \"Airline Approved\"]'),

(2, 8, 'ActionCam Pro 5K', 'actioncam-pro-5k',
 'Rugged action camera with 5K video, electronic stabilization, waterproof to 10m, and voice control. Capture every adventure.',
 19999.00, 27999.00, 25, '/uploads/products/camera1.jpg', 4.5, 198,
 '[\"5K@30fps / 4K@60fps Video\", \"48MP Photos\", \"HyperSmooth 5.0\", \"Waterproof to 10m\", \"Voice Control\", \"Wi-Fi + Bluetooth\"]'),

(2, 8, 'LensMaster Mirrorless Z7', 'lensmaster-mirrorless-z7',
 'Professional mirrorless camera with 45.7MP full-frame sensor, 8K video, in-body stabilization, and dual card slots.',
 189999.00, 219999.00, 8, '/uploads/products/camera2.jpg', 4.9, 87,
 '[\"45.7MP Full-Frame CMOS\", \"8K30 / 4K120 Video\", \"5-Axis IBIS\", \"Dual CFexpress Slots\", \"493 AF Points\", \"3.2 inch Tilt Touch LCD\"]');

-- =============================================
-- Products — StyleTech (vendor_id = 3)
-- =============================================
INSERT INTO products (vendor_id, category_id, name, slug, description, price, compare_price, stock, image, rating, review_count, features) VALUES
(3, 3, 'AirBass Pro X', 'airbass-pro-x',
 'Premium wireless earbuds with active noise cancellation, 40-hour battery, Hi-Res audio, and seamless multi-device switching.',
 7999.00, 11999.00, 80, '/uploads/products/earbuds1.jpg', 4.4, 892,
 '[\"Active Noise Cancellation\", \"40-Hour Battery Life\", \"Hi-Res Audio Certified\", \"IPX5 Water Resistant\", \"Multi-Device Pairing\", \"Wireless Charging Case\"]'),

(3, 3, 'StudioMax Over-Ear', 'studiomax-over-ear',
 'Audiophile-grade over-ear headphones with 50mm drivers, ANC, 60-hour battery, and ultra-comfortable memory foam cushions.',
 14999.00, 19999.00, 35, '/uploads/products/headphones1.jpg', 4.9, 445,
 '[\"50mm Custom Drivers\", \"Hybrid ANC\", \"60-Hour Battery\", \"Hi-Res Audio + LDAC\", \"Memory Foam Cushions\", \"Foldable Design\"]'),

(3, 3, 'BassBuds Mini', 'bassbuds-mini',
 'Ultra-compact true wireless earbuds with deep bass, 30-hour battery, IPX7 waterproof, and touch controls. Perfect workout companion.',
 2999.00, 4999.00, 150, '/uploads/products/earbuds2.jpg', 4.1, 1203,
 '[\"10mm Dynamic Drivers\", \"Deep Bass Mode\", \"30-Hour Battery\", \"IPX7 Waterproof\", \"Touch Controls\", \"Type-C Charging\"]'),

(3, 3, 'SonicWave Neckband Pro', 'sonicwave-neckband-pro',
 'Premium Bluetooth neckband with 28-hour battery, dual drivers, magnetic earbuds, and crystal-clear calls with ENC.',
 1999.00, 2999.00, 200, '/uploads/products/neckband1.jpg', 4.2, 934,
 '[\"13mm + 6mm Dual Drivers\", \"28-Hour Battery\", \"Bluetooth 5.3\", \"ENC for Calls\", \"IPX5 Sweatproof\", \"Magnetic Earbuds\"]'),

(3, 3, 'StageLink Wireless Speaker', 'stagelink-wireless-speaker',
 'Portable Bluetooth speaker with 360 degree sound, 24-hour battery, IP67 waterproof, and party mode linking up to 100 speakers.',
 8999.00, 12999.00, 55, '/uploads/products/speaker1.jpg', 4.6, 512,
 '[\"360 Degree Pro Sound\", \"24-Hour Battery\", \"IP67 Dustproof + Waterproof\", \"PartyBoost (100 Speakers)\", \"Built-in Powerbank\", \"USB-C Charging\"]'),

(3, 6, 'FitBand Ultra', 'fitband-ultra',
 'Advanced smartwatch with AMOLED display, SpO2, heart rate, GPS, 100+ workout modes, and 14-day battery life.',
 9999.00, 14999.00, 60, '/uploads/products/watch1.jpg', 4.3, 623,
 '[\"1.43 inch AMOLED Display\", \"SpO2 & Heart Rate Monitor\", \"Built-in GPS\", \"100+ Workout Modes\", \"14-Day Battery Life\", \"5ATM Water Resistance\"]'),

(3, 6, 'LuxWatch Series 9', 'luxwatch-series-9',
 'Premium smartwatch with titanium case, sapphire crystal, always-on LTPO display, ECG, and cellular connectivity.',
 44999.00, 49999.00, 20, '/uploads/products/watch2.jpg', 4.8, 234,
 '[\"Titanium Case + Sapphire Crystal\", \"Always-On LTPO AMOLED\", \"ECG + Blood Oxygen\", \"Cellular Connectivity\", \"Wireless Charging\", \"WearOS with 1000+ Apps\"]'),

(3, 6, 'AquaFit Sport Watch', 'aquafit-sport-watch',
 'Rugged outdoor smartwatch with military-grade durability, dual-band GPS, 21-day battery, and 150+ sport modes.',
 12999.00, 17999.00, 40, '/uploads/products/watch3.jpg', 4.5, 345,
 '[\"1.5 inch AMOLED Display\", \"MIL-STD-810H\", \"Dual-Band GPS\", \"21-Day Battery\", \"150+ Sport Modes\", \"100m Water Resistance\"]'),

(3, 4, 'SmartTag Tracker 4-Pack', 'smarttag-tracker-4pack',
 'Precision item trackers with UWB technology, 1-year battery, replaceable coin cell, and crowd-finding network.',
 3999.00, 5499.00, 100, '/uploads/products/tracker1.jpg', 4.3, 456,
 '[\"UWB Precision Finding\", \"1-Year Battery Life\", \"Replaceable CR2032\", \"IP67 Water Resistant\", \"Crowd Finding Network\", \"Ring-to-Find\"]'),

(3, 4, 'GlowBar RGB Monitor Light', 'glowbar-rgb-monitor-light',
 'Space-saving monitor light bar with asymmetric optics, adjustable color temperature, touch controls, and USB-C powered.',
 2999.00, 3999.00, 65, '/uploads/products/lightbar1.jpg', 4.4, 287,
 '[\"Asymmetric Optics\", \"2700K-6500K Color Temp\", \"Touch Controls\", \"USB-C Powered\", \"No Screen Glare\", \"Auto Dimming Sensor\"]'),

(3, 8, 'SnapVlog 4K Creator Camera', 'snapvlog-4k-creator',
 'Pocket-sized vlogging camera with 4K video, flip screen, built-in stabilization, and wireless live streaming capabilities.',
 34999.00, 44999.00, 20, '/uploads/products/camera3.jpg', 4.5, 176,
 '[\"1-inch CMOS Sensor\", \"4K@60fps Video\", \"3-inch Flip Touch Screen\", \"FlowState Stabilization\", \"Live Streaming\", \"AI Editing\"]');
