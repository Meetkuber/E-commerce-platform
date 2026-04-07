import pool from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import redis from './redis.service';

function safeParseJson(val: any): any[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch { return []; }
}

interface ProductRow extends RowDataPacket {
    id: number;
    vendor_id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    compare_price: number;
    stock: number;
    image: string;
    images: string;
    features: string;
    is_active: boolean;
    rating: number;
    review_count: number;
    store_name: string;
    category_name: string;
}

interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    vendorId?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
}

export class ProductService {
    static async getAll(filters: ProductFilters) {
        // Build cache key from filters
        const cacheKey = `products:list:${JSON.stringify(filters)}`;
        const cached = await redis.get<any>(cacheKey);
        if (cached) return cached;

        const page = filters.page || 1;
        const limit = filters.limit || 12;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.*, v.store_name, c.name as category_name 
            FROM products p
            LEFT JOIN vendors v ON p.vendor_id = v.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        `;
        const params: any[] = [];

        if (filters.category) {
            query += ' AND c.slug = ?';
            params.push(filters.category);
        }

        if (filters.minPrice) {
            query += ' AND p.price >= ?';
            params.push(filters.minPrice);
        }

        if (filters.maxPrice) {
            query += ' AND p.price <= ?';
            params.push(filters.maxPrice);
        }

        if (filters.vendorId) {
            query += ' AND p.vendor_id = ?';
            params.push(filters.vendorId);
        }

        if (filters.search) {
            query += ' AND (MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE) OR p.name LIKE ?)';
            params.push(filters.search);
            params.push(`%${filters.search}%`);
        }

        // Count total
        const countQuery = query.replace(/SELECT p\.\*, v\.store_name, c\.name as category_name/, 'SELECT COUNT(*) as total');
        const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
        const total = countRows[0].total;

        // Sort
        switch (filters.sortBy) {
            case 'price_asc':
                query += ' ORDER BY p.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY p.price DESC';
                break;
            case 'rating':
                query += ' ORDER BY p.rating DESC';
                break;
            case 'newest':
                query += ' ORDER BY p.created_at DESC';
                break;
            default:
                query += ' ORDER BY p.created_at DESC';
        }

        query += ' LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset));

        const [rows] = await pool.execute<ProductRow[]>(query, params);

        const result = {
            products: rows.map(p => ({
                ...p,
                features: safeParseJson(p.features),
                images: safeParseJson(p.images),
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };

        // Cache for 5 minutes
        await redis.set(cacheKey, result, 300);
        return result;
    }

    static async getById(id: number) {
        const cacheKey = `products:detail:${id}`;
        const cached = await redis.get<any>(cacheKey);
        if (cached) return cached;

        const [rows] = await pool.execute<ProductRow[]>(
            `SELECT p.*, v.store_name, v.is_verified, c.name as category_name 
             FROM products p
             LEFT JOIN vendors v ON p.vendor_id = v.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
        }

        const product = rows[0];
        const result = {
            ...product,
            features: safeParseJson(product.features),
            images: safeParseJson(product.images),
        };

        // Cache for 10 minutes
        await redis.set(cacheKey, result, 600);
        return result;
    }

    /**
     * Get all products for a specific vendor (used in vendor dashboard).
     * This scopes the listing to ONLY the vendor's own products.
     */
    static async getByVendor(vendorId: number) {
        const [rows] = await pool.execute<ProductRow[]>(
            `SELECT p.*, v.store_name, c.name as category_name 
             FROM products p
             LEFT JOIN vendors v ON p.vendor_id = v.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.vendor_id = ?
             ORDER BY p.created_at DESC`,
            [vendorId]
        );

        return rows.map(p => ({
            ...p,
            features: safeParseJson(p.features),
            images: safeParseJson(p.images),
        }));
    }

    /**
     * Get ALL products (for admin dashboard). No vendor scoping.
     */
    static async getAllAdmin() {
        const [rows] = await pool.execute<ProductRow[]>(
            `SELECT p.*, v.store_name, c.name as category_name 
             FROM products p
             LEFT JOIN vendors v ON p.vendor_id = v.id
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );

        return rows.map(p => ({
            ...p,
            features: safeParseJson(p.features),
            images: safeParseJson(p.images),
        }));
    }

    static async create(vendorId: number, data: any) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO products (vendor_id, category_id, name, slug, description, price, compare_price, stock, image, features)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                vendorId,
                data.category_id || null,
                data.name,
                slug + '-' + Date.now(),
                data.description || null,
                data.price,
                data.compare_price || null,
                data.stock || 0,
                data.image || null,
                data.features ? JSON.stringify(data.features) : null,
            ]
        );

        // Invalidate product caches
        await redis.invalidateProducts();

        return this.getById(result.insertId);
    }

    static async update(id: number, vendorId: number | null, data: any, isAdmin: boolean = false) {
        // Check existence and ownership
        const [existing] = await pool.execute<ProductRow[]>(
            'SELECT vendor_id FROM products WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
        }

        // Vendors can only edit their own products. Admins can edit any product.
        if (!isAdmin && existing[0].vendor_id !== vendorId) {
            throw Object.assign(new Error('Not authorized to edit this product.'), { statusCode: 403 });
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (data.name) { fields.push('name = ?'); values.push(data.name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.price) { fields.push('price = ?'); values.push(data.price); }
        if (data.compare_price !== undefined) { fields.push('compare_price = ?'); values.push(data.compare_price); }
        if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
        if (data.category_id) { fields.push('category_id = ?'); values.push(data.category_id); }
        if (data.image) { fields.push('image = ?'); values.push(data.image); }
        if (data.features) { fields.push('features = ?'); values.push(JSON.stringify(data.features)); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

        if (fields.length === 0) {
            throw Object.assign(new Error('No fields to update.'), { statusCode: 400 });
        }

        values.push(id);

        await pool.execute(
            `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        // Invalidate product caches
        await redis.invalidateProducts();

        return this.getById(id);
    }

    static async delete(id: number, vendorId: number | null, isAdmin: boolean = false) {
        const [existing] = await pool.execute<ProductRow[]>(
            'SELECT vendor_id FROM products WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            throw Object.assign(new Error('Product not found.'), { statusCode: 404 });
        }

        // Vendors can only delete their own products. Admins can delete any product.
        if (!isAdmin && existing[0].vendor_id !== vendorId) {
            throw Object.assign(new Error('Not authorized to delete this product.'), { statusCode: 403 });
        }

        await pool.execute('DELETE FROM products WHERE id = ?', [id]);

        // Invalidate product caches
        await redis.invalidateProducts();

        return { message: 'Product deleted successfully.' };
    }

    static async getCategories() {
        const cacheKey = 'categories:all';
        const cached = await redis.get<any>(cacheKey);
        if (cached) return cached;

        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE GROUP BY c.id ORDER BY c.name'
        );

        // Cache for 30 minutes (categories change rarely)
        await redis.set(cacheKey, rows, 1800);
        return rows;
    }

    static async getFeatured(limit: number = 8) {
        const cacheKey = `featured:${limit}`;
        const cached = await redis.get<any>(cacheKey);
        if (cached) return cached;

        const [rows] = await pool.execute<ProductRow[]>(
            `SELECT p.*, v.store_name, c.name as category_name 
             FROM products p
             LEFT JOIN vendors v ON p.vendor_id = v.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = TRUE
             ORDER BY p.rating DESC, p.review_count DESC
             LIMIT ?`,
            [String(limit)]
        );

        const result = rows.map(p => ({
            ...p,
            features: safeParseJson(p.features),
        }));

        // Cache for 10 minutes
        await redis.set(cacheKey, result, 600);
        return result;
    }
}
