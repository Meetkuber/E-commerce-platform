import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProductService } from '../services/product.service';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export class AdminController {
    /**
     * Get admin dashboard stats — total products, vendors, orders, revenue
     */
    static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // Total products
            const [productRows] = await pool.execute<RowDataPacket[]>(
                'SELECT COUNT(*) as total FROM products'
            );

            // Total vendors
            const [vendorRows] = await pool.execute<RowDataPacket[]>(
                'SELECT COUNT(*) as total FROM vendors'
            );

            // Total orders
            const [orderRows] = await pool.execute<RowDataPacket[]>(
                'SELECT COUNT(*) as total FROM orders'
            );

            // Total revenue
            const [revenueRows] = await pool.execute<RowDataPacket[]>(
                "SELECT COALESCE(SUM(total), 0) as total_revenue FROM orders WHERE payment_status = 'succeeded'"
            );

            // Total customers
            const [customerRows] = await pool.execute<RowDataPacket[]>(
                "SELECT COUNT(*) as total FROM users WHERE role = 'customer'"
            );

            // Recent orders
            const [recentOrders] = await pool.execute<RowDataPacket[]>(
                `SELECT o.id, o.total, o.status, o.payment_status, o.created_at, u.name as customer_name
                 FROM orders o
                 JOIN users u ON o.user_id = u.id
                 ORDER BY o.created_at DESC
                 LIMIT 10`
            );

            res.json({
                totalProducts: productRows[0].total,
                totalVendors: vendorRows[0].total,
                totalOrders: orderRows[0].total,
                totalRevenue: revenueRows[0].total_revenue,
                totalCustomers: customerRows[0].total,
                recentOrders,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get ALL products across all vendors (admin only)
     */
    static async getAllProducts(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const products = await ProductService.getAllAdmin();
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all vendors with their store info
     */
    static async getAllVendors(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const [rows] = await pool.execute<RowDataPacket[]>(
                `SELECT v.*, u.name as owner_name, u.email as owner_email,
                        (SELECT COUNT(*) FROM products WHERE vendor_id = v.id) as product_count,
                        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.vendor_id = v.id AND o.payment_status = 'succeeded') as total_revenue
                 FROM vendors v
                 JOIN users u ON v.user_id = u.id
                 ORDER BY v.created_at DESC`
            );
            res.json(rows);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all orders (admin view)
     */
    static async getAllOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const [rows] = await pool.execute<RowDataPacket[]>(
                `SELECT o.*, u.name as customer_name, u.email as customer_email
                 FROM orders o
                 JOIN users u ON o.user_id = u.id
                 ORDER BY o.created_at DESC
                 LIMIT 100`
            );
            res.json(rows);
        } catch (error) {
            next(error);
        }
    }
}
