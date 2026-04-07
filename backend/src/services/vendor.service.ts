import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export class VendorService {
    static async getDashboardStats(vendorId: number) {
        // Total revenue
        const [revenueRows] = await pool.execute<RowDataPacket[]>(
            `SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE oi.vendor_id = ? AND o.payment_status = 'succeeded'`,
            [vendorId]
        );

        // Total orders
        const [orderRows] = await pool.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT o.id) as total_orders
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE oi.vendor_id = ?`,
            [vendorId]
        );

        // Total products
        const [productRows] = await pool.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as total_products FROM products WHERE vendor_id = ?',
            [vendorId]
        );

        // Recent orders
        const [recentOrders] = await pool.execute<RowDataPacket[]>(
            `SELECT o.id, o.total, o.status, o.created_at, u.name as customer_name
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             JOIN users u ON o.user_id = u.id
             WHERE oi.vendor_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT 5`,
            [vendorId]
        );

        // Top products
        const [topProducts] = await pool.execute<RowDataPacket[]>(
            `SELECT p.id, p.name, p.price, p.image, p.rating, p.review_count,
                    COALESCE(SUM(oi.quantity), 0) as total_sold
             FROM products p
             LEFT JOIN order_items oi ON p.id = oi.product_id
             WHERE p.vendor_id = ?
             GROUP BY p.id
             ORDER BY total_sold DESC
             LIMIT 5`,
            [vendorId]
        );

        // Monthly revenue (last 6 months)
        const [monthlyRevenue] = await pool.execute<RowDataPacket[]>(
            `SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month,
                    COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE oi.vendor_id = ? AND o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY month
             ORDER BY month ASC`,
            [vendorId]
        );

        return {
            totalRevenue: revenueRows[0].total_revenue,
            totalOrders: orderRows[0].total_orders,
            totalProducts: productRows[0].total_products,
            recentOrders,
            topProducts,
            monthlyRevenue,
        };
    }

    static async updateProfile(vendorId: number, data: any) {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.store_name) { fields.push('store_name = ?'); values.push(data.store_name); }
        if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
        if (data.logo) { fields.push('logo = ?'); values.push(data.logo); }

        if (fields.length === 0) return;

        values.push(vendorId);
        await pool.execute(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, values);
    }
}
