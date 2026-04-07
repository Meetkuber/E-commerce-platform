import pool from '../db/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class CartService {
    static async getOrCreateCart(userId: number): Promise<number> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM cart WHERE user_id = ?',
            [userId]
        );

        if (rows.length > 0) return rows[0].id;

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO cart (user_id) VALUES (?)',
            [userId]
        );

        return result.insertId;
    }

    static async getCart(userId: number) {
        const cartId = await this.getOrCreateCart(userId);

        const [items] = await pool.execute<RowDataPacket[]>(
            `SELECT ci.*, p.name, p.price, p.image, p.stock, p.slug, v.store_name
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             JOIN vendors v ON p.vendor_id = v.id
             WHERE ci.cart_id = ?`,
            [cartId]
        );

        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        return {
            id: cartId,
            items,
            itemCount: items.length,
            subtotal: parseFloat(subtotal.toFixed(2)),
        };
    }

    static async addItem(userId: number, productId: number, quantity: number = 1) {
        const cartId = await this.getOrCreateCart(userId);

        // Check product exists and has stock
        const [productRows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, stock, price FROM products WHERE id = ? AND is_active = TRUE',
            [productId]
        );

        if (productRows.length === 0) {
            throw Object.assign(new Error('Product not found or unavailable.'), { statusCode: 404 });
        }

        if (productRows[0].stock < quantity) {
            throw Object.assign(new Error('Insufficient stock.'), { statusCode: 400 });
        }

        // Check if already in cart
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [cartId, productId]
        );

        if (existing.length > 0) {
            const newQty = existing[0].quantity + quantity;
            if (newQty > productRows[0].stock) {
                throw Object.assign(new Error('Cannot add more than available stock.'), { statusCode: 400 });
            }
            await pool.execute(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [newQty, existing[0].id]
            );
        } else {
            await pool.execute(
                'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                [cartId, productId, quantity]
            );
        }

        return this.getCart(userId);
    }

    static async updateItem(userId: number, itemId: number, quantity: number) {
        const cartId = await this.getOrCreateCart(userId);

        if (quantity <= 0) {
            await pool.execute(
                'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
                [itemId, cartId]
            );
        } else {
            // Verify stock
            const [itemRows] = await pool.execute<RowDataPacket[]>(
                `SELECT ci.product_id, p.stock FROM cart_items ci 
                 JOIN products p ON ci.product_id = p.id 
                 WHERE ci.id = ? AND ci.cart_id = ?`,
                [itemId, cartId]
            );

            if (itemRows.length === 0) {
                throw Object.assign(new Error('Cart item not found.'), { statusCode: 404 });
            }

            if (quantity > itemRows[0].stock) {
                throw Object.assign(new Error('Cannot exceed available stock.'), { statusCode: 400 });
            }

            await pool.execute(
                'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
                [quantity, itemId, cartId]
            );
        }

        return this.getCart(userId);
    }

    static async removeItem(userId: number, itemId: number) {
        const cartId = await this.getOrCreateCart(userId);

        await pool.execute(
            'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
            [itemId, cartId]
        );

        return this.getCart(userId);
    }

    static async clearCart(userId: number) {
        const cartId = await this.getOrCreateCart(userId);
        await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        return { message: 'Cart cleared.' };
    }
}
