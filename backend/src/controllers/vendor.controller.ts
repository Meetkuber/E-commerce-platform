import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VendorService } from '../services/vendor.service';
import { OrderService } from '../services/order.service';
import { ProductService } from '../services/product.service';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export class VendorController {
    static async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const [vendorRows] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM vendors WHERE user_id = ?',
                [req.user.id]
            );

            if (vendorRows.length === 0) {
                res.status(403).json({ error: 'Vendor profile not found.' });
                return;
            }

            const stats = await VendorService.getDashboardStats(vendorRows[0].id);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get only this vendor's own products — vendors cannot see other vendors' products
     */
    static async getMyProducts(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const [vendorRows] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM vendors WHERE user_id = ?',
                [req.user.id]
            );

            if (vendorRows.length === 0) {
                res.status(403).json({ error: 'Vendor profile not found.' });
                return;
            }

            const products = await ProductService.getByVendor(vendorRows[0].id);
            res.json(products);
        } catch (error) {
            next(error);
        }
    }

    static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const [vendorRows] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM vendors WHERE user_id = ?',
                [req.user.id]
            );

            if (vendorRows.length === 0) {
                res.status(403).json({ error: 'Vendor profile not found.' });
                return;
            }

            const orders = await OrderService.getVendorOrders(vendorRows[0].id);
            res.json(orders);
        } catch (error) {
            next(error);
        }
    }

    static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const [vendorRows] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM vendors WHERE user_id = ?',
                [req.user.id]
            );

            if (vendorRows.length === 0) {
                res.status(403).json({ error: 'Vendor profile not found.' });
                return;
            }

            await VendorService.updateProfile(vendorRows[0].id, req.body);
            res.json({ message: 'Profile updated successfully.' });
        } catch (error) {
            next(error);
        }
    }
}
