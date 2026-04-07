import pool from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class OrderService {
    static async createFromCart(userId: number, shippingData: any) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get cart items
            const [cartRows] = await connection.execute<RowDataPacket[]>(
                'SELECT id FROM cart WHERE user_id = ?',
                [userId]
            );

            if (cartRows.length === 0) {
                throw Object.assign(new Error('Cart is empty.'), { statusCode: 400 });
            }

            const cartId = cartRows[0].id;

            const [items] = await connection.execute<RowDataPacket[]>(
                `SELECT ci.*, p.price, p.vendor_id, p.stock, p.name
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.cart_id = ?`,
                [cartId]
            );

            if (items.length === 0) {
                throw Object.assign(new Error('Cart is empty.'), { statusCode: 400 });
            }

            // Calculate total
            const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

            // Create order
            const [orderResult] = await connection.execute<ResultSetHeader>(
                `INSERT INTO orders (user_id, total, status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_phone)
                 VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    total,
                    shippingData.name || null,
                    shippingData.address || null,
                    shippingData.city || null,
                    shippingData.state || null,
                    shippingData.zip || null,
                    shippingData.phone || null,
                ]
            );

            const orderId = orderResult.insertId;

            // Insert order items and update stock
            for (const item of items) {
                if ((item as any).stock < (item as any).quantity) {
                    throw Object.assign(new Error(`Insufficient stock for ${(item as any).name}.`), { statusCode: 400 });
                }

                await connection.execute(
                    'INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, (item as any).vendor_id, item.quantity, (item as any).price]
                );

                await connection.execute(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Clear cart
            await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

            await connection.commit();

            return this.getById(orderId, userId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getById(orderId: number, userId: number) {
        const [orderRows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orderRows.length === 0) {
            throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
        }

        const [items] = await pool.execute<RowDataPacket[]>(
            `SELECT oi.*, p.name, p.image, p.slug, v.store_name
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN vendors v ON oi.vendor_id = v.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        return { ...orderRows[0], items };
    }

    static async getUserOrders(userId: number) {
        const [orders] = await pool.execute<RowDataPacket[]>(
            `SELECT o.*, COUNT(oi.id) as item_count 
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );
        return orders;
    }

    static async getVendorOrders(vendorId: number) {
        const [orders] = await pool.execute<RowDataPacket[]>(
            `SELECT DISTINCT o.*, u.name as customer_name, u.email as customer_email
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             JOIN users u ON o.user_id = u.id
             WHERE oi.vendor_id = ?
             ORDER BY o.created_at DESC`,
            [vendorId]
        );

        // For each order get vendor-specific items
        for (const order of orders) {
            const [items] = await pool.execute<RowDataPacket[]>(
                `SELECT oi.*, p.name, p.image 
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = ? AND oi.vendor_id = ?`,
                [order.id, vendorId]
            );
            (order as any).items = items;
        }

        return orders;
    }

    static async updateStatus(orderId: number, status: string, paymentIntentId?: string) {
        const updates: string[] = ['status = ?'];
        const params: any[] = [status];

        if (paymentIntentId) {
            updates.push('payment_intent_id = ?');
            params.push(paymentIntentId);
        }

        if (status === 'paid') {
            updates.push("payment_status = 'succeeded'");
        }

        params.push(orderId);

        await pool.execute(
            `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
    }
}
