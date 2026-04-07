import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OrderService } from '../services/order.service';

export class OrderController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const order = await OrderService.createFromCart(req.user.id, req.body);
            res.status(201).json(order);
        } catch (error) {
            next(error);
        }
    }

    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const orders = await OrderService.getUserOrders(req.user.id);
            res.json(orders);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const order = await OrderService.getById(parseInt(req.params.id), req.user.id);
            res.json(order);
        } catch (error) {
            next(error);
        }
    }
}
