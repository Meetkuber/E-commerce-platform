import Razorpay from 'razorpay';
import crypto from 'crypto';
import { OrderService } from './order.service';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';
import { EmailService } from './email.service';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export class PaymentService {
    /**
     * Create a Razorpay order — called before showing payment checkout
     */
    static async createOrder(userId: number, couponCode?: string) {
        // Get cart total
        const [cartRows] = await pool.execute<RowDataPacket[]>(
            'SELECT id FROM cart WHERE user_id = ?',
            [userId]
        );

        if (cartRows.length === 0) {
            throw Object.assign(new Error('Cart is empty.'), { statusCode: 400 });
        }

        const [items] = await pool.execute<RowDataPacket[]>(
            `SELECT ci.quantity, p.price
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = ?`,
            [cartRows[0].id]
        );

        if (items.length === 0) {
            throw Object.assign(new Error('Cart is empty.'), { statusCode: 400 });
        }

        let total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        // Apply coupon discount if valid
        let discount = 0;
        if (couponCode) {
            const [userRows] = await pool.execute<RowDataPacket[]>(
                'SELECT coupon_code FROM users WHERE id = ?',
                [userId]
            );
            if (userRows[0]?.coupon_code === couponCode) {
                discount = total * 0.1; // 10% discount
                total -= discount;
            }
        }

        const amountInPaise = Math.round(total * 100); // Razorpay expects amount in paise

        const options = {
            amount: amountInPaise,
            currency: process.env.CURRENCY || 'INR',
            receipt: `order_${userId}_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                couponCode: couponCode || '',
                discount: discount.toString(),
            },
        };

        const keyId = process.env.RAZORPAY_KEY_ID || '';
        let order;
        let isMock = false;

        // If razorpay is not configured properly, use a mock order
        if (!keyId || keyId === 'rzp_test_your_key_id_here') {
            isMock = true;
            order = {
                id: `mock_order_${Date.now()}`,
                currency: process.env.CURRENCY || 'INR',
            };
        } else {
            order = await razorpay.orders.create(options);
        }

        return {
            orderId: order.id,
            amount: total,
            originalAmount: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
            discount,
            amountInPaise,
            currency: order.currency,
            keyId,
            isMock,
        };
    }

    /**
     * Verify Razorpay payment signature after user completes payment
     */
    static async verifyPayment(
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        userId: number,
        shippingData: any
    ) {
        if (!razorpayPaymentId.startsWith('mock_')) {
            const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

            // Verify signature
            const hmac = crypto.createHmac('sha256', keySecret);
            hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
            const generatedSignature = hmac.digest('hex');

            if (generatedSignature !== razorpaySignature) {
                throw Object.assign(new Error('Payment verification failed. Invalid signature.'), { statusCode: 400 });
            }
        }

        // Payment verified — create the order
        const order = await OrderService.createFromCart(userId, shippingData) as any;

        // Update order with payment info
        await OrderService.updateStatus(order.id, 'paid', razorpayPaymentId);

        // Send receipt email
        try {
            const [userRows] = await pool.execute<RowDataPacket[]>(
                'SELECT name, email FROM users WHERE id = ?',
                [userId]
            );
            const user = userRows[0] as any;

            const [orderRows] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM orders WHERE id = ?',
                [order.id]
            );
            const orderDetails = orderRows[0] as any;

            await EmailService.sendOrderReceipt(user.email, user.name, orderDetails);
        } catch (emailError) {
            console.error('Failed to send order receipt email:', emailError);
            // Don't fail payment if email fails
        }

        return {
            success: true,
            orderId: order.id,
            paymentId: razorpayPaymentId,
        };
    }
}
