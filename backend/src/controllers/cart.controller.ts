import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CartService } from '../services/cart.service';

export class CartController {
    static async getCart(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }
            const cart = await CartService.getCart(req.user.id);
            res.json(cart);
        } catch (error) {
            next(error);
        }
    }

    static async addItem(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }
            const { productId, quantity } = req.body;

            if (!productId) {
                res.status(400).json({ error: 'Product ID is required.' });
                return;
            }

            const cart = await CartService.addItem(req.user.id, productId, quantity || 1);
            res.json(cart);
        } catch (error) {
            next(error);
        }
    }

    static async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }
            const { quantity } = req.body;
            const itemId = parseInt(req.params.itemId);

            const cart = await CartService.updateItem(req.user.id, itemId, quantity);
            res.json(cart);
        } catch (error) {
            next(error);
        }
    }

    static async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }
            const itemId = parseInt(req.params.itemId);

            const cart = await CartService.removeItem(req.user.id, itemId);
            res.json(cart);
        } catch (error) {
            next(error);
        }
    }

    static async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }
            const result = await CartService.clearCart(req.user.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
