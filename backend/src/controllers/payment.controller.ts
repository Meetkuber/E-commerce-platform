import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
    /**
     * Create a Razorpay order — returns orderId and key for frontend checkout
     */
    static async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const { couponCode } = req.body;
            const result = await PaymentService.createOrder(req.user.id, couponCode);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify Razorpay payment after user completes checkout
     */
    static async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) { res.status(401).json({ error: 'Not authenticated.' }); return; }

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                shipping
            } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                res.status(400).json({ error: 'Missing payment details.' });
                return;
            }

            const result = await PaymentService.verifyPayment(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                req.user.id,
                shipping || {}
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}
