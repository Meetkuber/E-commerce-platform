/**
 * Main JS — Landing Page & Global Utilities
 */

// ==========================================
// Intersection Observer for Scroll Animations
// ==========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    scrollObserver.observe(el);
});

// ==========================================
// Navbar Scroll & Hero Overlap Effect
// ==========================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('mainNavbar');
    const navbarBrand = navbar.querySelector('.navbar-brand');
    const hero = document.getElementById('hero');

    if (!hero || !navbar || !navbarBrand) return;

    const heroRect = hero.getBoundingClientRect();
    const navHeight = navbar.offsetHeight;

    // If navbar is overlapping hero section, keep the brand white
    if (heroRect.bottom > navHeight) {
        navbar.classList.remove('scrolled');
        navbarBrand.classList.add('hero-over-hero');
        navbarBrand.classList.remove('past-hero');
    } else {
        // When navbar has moved past hero, switch to dark brand and scrolled styles
        navbar.classList.add('scrolled');
        navbarBrand.classList.remove('hero-over-hero');
        navbarBrand.classList.add('past-hero');
    }

    // Additional smooth fallback if user scrolls a small amount for opaque background
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else if (heroRect.bottom <= navHeight) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ==========================================
// Load Featured Products
// ==========================================
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    try {
        const products = await ApiClient.getFeaturedProducts();

        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-box-seam" style="font-size: 3rem; color: var(--text-tertiary);"></i>
                    <p class="text-muted mt-3">No products available yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = products.slice(0, 8).map(product => createProductCard(product)).join('');

        // Re-observe new elements and force visibility with stagger
        container.querySelectorAll('.animate-on-scroll').forEach((el, index) => {
            setTimeout(() => el.classList.add('visible'), index * 80);
            scrollObserver.observe(el);
        });
    } catch (error) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-wifi-off" style="font-size: 3rem; color: var(--text-tertiary);"></i>
                <p class="text-muted mt-3">Unable to load products. Make sure the server is running.</p>
                <button class="btn btn-ghost btn-sm mt-2" onclick="loadFeaturedProducts()">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
    }
}

// ==========================================
// Product Card Template
// ==========================================
function createProductCard(product) {
    const discount = product.compare_price
        ? Math.round((1 - product.price / product.compare_price) * 100)
        : 0;

    const stars = '★'.repeat(Math.floor(product.rating || 0)) + '☆'.repeat(5 - Math.floor(product.rating || 0));

    const imageUrl = product.image && !product.image.includes('undefined')
        ? (product.image.startsWith('http') ? product.image : `${API_BASE.replace('/api', '')}${product.image}`)
        : `https://placehold.co/400x300/1c1c1e/6e6e73?text=${encodeURIComponent(product.name?.substring(0, 15) || 'Product')}`;

    return `
        <div class="col-xl-3 col-lg-4 col-md-6 animate-on-scroll">
            <div class="product-card" onclick="window.location.href='product-detail.html?id=${product.id}'">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy"
                         onerror="this.src='https://placehold.co/400x300/1c1c1e/6e6e73?text=Product'">
                    ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ''}
                </div>
                <div class="product-body">
                    <div class="product-category">${product.category_name || 'Tech'}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-vendor">by ${product.store_name || 'Vendor'}</div>
                    <div class="product-rating">
                        <span class="stars">${stars}</span>
                        <span class="count">(${product.review_count || 0})</span>
                    </div>
                    <div class="product-price">
                        <span class="current">₹${formatPrice(product.price)}</span>
                        ${product.compare_price ? `<span class="original">₹${formatPrice(product.compare_price)}</span>` : ''}
                        ${discount > 0 ? `<span class="discount">${discount}% off</span>` : ''}
                    </div>
                </div>
                <div class="product-actions" onclick="event.stopPropagation()">
                    <button class="btn-add-cart" onclick="addToCartQuick(${product.id})">
                        <i class="bi bi-bag-plus"></i> Add to Cart
                    </button>
                    <button class="btn-wishlist">
                        <i class="bi bi-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// Utility: Format Price
// ==========================================
function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

// ==========================================
// Quick Add to Cart
// ==========================================
async function addToCartQuick(productId) {
    if (!ApiClient.isLoggedIn()) {
        showToast('Please sign in to add items to cart.', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    try {
        await ApiClient.addToCart(productId, 1);
        showToast('Product added to cart!', 'success');
        updateCartBadge();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==========================================
// Cart Badge
// ==========================================
async function updateCartBadge() {
    const badge = document.getElementById('navCartCount');
    if (!badge) return;

    if (!ApiClient.isLoggedIn()) {
        badge.style.display = 'none';
        return;
    }

    try {
        const cart = await ApiClient.getCart();
        if (cart.itemCount > 0) {
            badge.textContent = cart.itemCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch {
        badge.style.display = 'none';
    }
}

// ==========================================
// Auth UI Update
// ==========================================
function updateAuthUI() {
    const authArea = document.getElementById('navAuthArea');
    if (!authArea) return;

    if (ApiClient.isLoggedIn()) {
        const user = ApiClient.getUser();
        let dashLink = '';
        if (user?.role === 'admin') {
            dashLink = '<a class="dropdown-item" href="admin-dashboard.html"><i class="bi bi-shield-lock"></i> Admin Dashboard</a>';
        } else if (user?.role === 'vendor') {
            dashLink = '<a class="dropdown-item" href="vendor-dashboard.html"><i class="bi bi-speedometer2"></i> Dashboard</a>';
        }

        authArea.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-ghost btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle"></i> ${user?.name || 'Account'}
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                    ${dashLink}
                    <li><a class="dropdown-item" href="orders.html"><i class="bi bi-box-seam"></i> My Orders</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="ApiClient.logout()"><i class="bi bi-box-arrow-right"></i> Sign Out</a></li>
                </ul>
            </div>
        `;
    }
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'exclamation-triangle'}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}

// ==========================================
// Init
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();
    updateAuthUI();
    updateCartBadge();
});
