/**
 * API Client — E-Commerce Platform
 * Centralized API communication with JWT handling
 */

const API_BASE = '/api';

class ApiClient {
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    static setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    static removeToken() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    static getUser() {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    }

    static setUser(user) {
        localStorage.setItem('user_data', JSON.stringify(user));
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            ...options.headers,
        };

        // Add auth header
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Auto-add Content-Type for JSON bodies
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to server. Please try again.');
            }
            throw error;
        }
    }

    // Auth
    static async register(name, email, password, role = 'customer') {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: { name, email, password, role },
        });
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    }

    static async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        this.setToken(data.token);
        this.setUser(data.user);
        return data;
    }

    static async getMe() {
        return this.request('/auth/me');
    }

    static logout() {
        this.removeToken();
        window.location.href = 'login.html';
    }

    // Products (public)
    static async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/products?${query}`);
    }

    static async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    static async getFeaturedProducts() {
        return this.request('/products/featured');
    }

    static async getCategories() {
        return this.request('/products/categories');
    }

    // Product CRUD (vendor/admin)
    static async createProduct(formData) {
        return this.request('/products', {
            method: 'POST',
            body: formData, // FormData for file upload
        });
    }

    static async updateProduct(id, formData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: formData,
        });
    }

    static async deleteProduct(id) {
        return this.request(`/products/${id}`, { method: 'DELETE' });
    }

    // Vendor — own products only
    static async getMyProducts() {
        return this.request('/vendor/my-products');
    }

    // Cart
    static async getCart() {
        return this.request('/cart');
    }

    static async addToCart(productId, quantity = 1) {
        return this.request('/cart/add', {
            method: 'POST',
            body: { productId, quantity },
        });
    }

    static async updateCartItem(itemId, quantity) {
        return this.request(`/cart/update/${itemId}`, {
            method: 'PUT',
            body: { quantity },
        });
    }

    static async removeFromCart(itemId) {
        return this.request(`/cart/remove/${itemId}`, { method: 'DELETE' });
    }

    // Orders
    static async createOrder(shippingData) {
        return this.request('/orders', {
            method: 'POST',
            body: shippingData,
        });
    }

    static async getOrders() {
        return this.request('/orders');
    }

    static async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    // Payment
    static async createPaymentIntent() {
        return this.request('/payment/create-intent', { method: 'POST' });
    }

    // Search
    static async search(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/search?${query}`);
    }

    // Chatbot
    static async askChatbot(message) {
        return this.request('/chatbot/ask', {
            method: 'POST',
            body: { message },
        });
    }

    // Reviews
    static async getReviews(productId) {
        return this.request(`/reviews/product/${productId}`);
    }

    static async addReview(productId, rating, comment) {
        return this.request('/reviews', {
            method: 'POST',
            body: { productId, rating, comment },
        });
    }

    // Vendor Dashboard
    static async getVendorStats() {
        return this.request('/vendor/dashboard-stats');
    }

    static async getVendorOrders() {
        return this.request('/vendor/orders');
    }

    // Admin Dashboard
    static async getAdminStats() {
        return this.request('/admin/stats');
    }

    static async getAdminProducts() {
        return this.request('/admin/products');
    }

    static async getAdminVendors() {
        return this.request('/admin/vendors');
    }

    static async getAdminOrders() {
        return this.request('/admin/orders');
    }
}

// Export for use
window.ApiClient = ApiClient;
