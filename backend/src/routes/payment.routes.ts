import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create Razorpay order (before showing payment UI)
router.post('/create-order', authenticate, PaymentController.createOrder);

// Verify payment after Razorpay checkout completes
router.post('/verify', authenticate, PaymentController.verifyPayment);

export default router;
